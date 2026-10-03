const mongoose = require('mongoose');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const { assertProjectAccess } = require('./projectController');
const { notifyUser } = require('../utils/notify');

const populateTask = (query) =>
  query
    .populate('assignee', 'name email avatarColor avatarUrl')
    .populate('createdBy', 'name email avatarColor avatarUrl')
    .populate('blockedBy', 'title status project');

const TASK_STATUSES = ['To Do', 'In Progress', 'Review', 'Completed'];
const TASK_PRIORITIES = ['Low', 'Medium', 'High'];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseDateOnly = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10) === value ? date : null;
};

// @desc    Get tasks assigned to the logged-in user with optional filters
// @route   GET /api/tasks/mine
// @access  Private
const getMyTasks = asyncHandler(async (req, res) => {
  const { q, status, priority, projectId, from, to } = req.query;

  if (q !== undefined && typeof q !== 'string') {
    return res.status(400).json({ success: false, message: 'Search must be a single text value' });
  }
  if (q && q.length > 100) {
    return res.status(400).json({ success: false, message: 'Search cannot exceed 100 characters' });
  }
  if (status && !TASK_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid task status' });
  }
  if (priority && !TASK_PRIORITIES.includes(priority)) {
    return res.status(400).json({ success: false, message: 'Invalid task priority' });
  }
  if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ success: false, message: 'Invalid project ID' });
  }
  if (
    (from !== undefined && (typeof from !== 'string' || !parseDateOnly(from))) ||
    (to !== undefined && (typeof to !== 'string' || !parseDateOnly(to)))
  ) {
    return res.status(400).json({ success: false, message: 'Dates must use YYYY-MM-DD format' });
  }
  if (from && to && from > to) {
    return res.status(400).json({ success: false, message: 'Start date must be before or equal to end date' });
  }

  const projects = await Project.find({
    $or: [{ owner: req.user._id }, { members: req.user._id }],
  }).select('_id');
  const projectIds = projects.map((project) => project._id);

  if (projectId && !projectIds.some((id) => id.toString() === projectId)) {
    return res.json({ success: true, tasks: [] });
  }
  if (projectIds.length === 0) {
    return res.json({ success: true, tasks: [] });
  }

  const filter = {
    assignee: req.user._id,
    project: projectId || { $in: projectIds },
  };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (q && q.trim()) filter.title = { $regex: escapeRegex(q.trim()), $options: 'i' };

  if (from || to) {
    filter.dueDate = {};
    if (from) filter.dueDate.$gte = parseDateOnly(from);
    if (to) {
      const endExclusive = parseDateOnly(to);
      endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
      filter.dueDate.$lt = endExclusive;
    }
  }

  const tasks = await populateTask(
    Task.find(filter).populate('project', 'title color')
  ).sort({ dueDate: 1, updatedAt: -1 });

  res.json({ success: true, tasks });
});

const searchTasks = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (q !== undefined && typeof q !== 'string') {
    return res.status(400).json({ success: false, message: 'Search must be a single text value' });
  }
  if (q && q.length > 100) {
    return res.status(400).json({ success: false, message: 'Search cannot exceed 100 characters' });
  }
  const searchTerm = q?.trim();
  if (!searchTerm || searchTerm.length < 2) {
    return res.json({ success: true, tasks: [] });
  }

  const projects = await Project.find({
    $or: [{ owner: req.user._id }, { members: req.user._id }],
  }).select('_id');
  const projectIds = projects.map((project) => project._id);
  if (projectIds.length === 0) return res.json({ success: true, tasks: [] });

  const pattern = new RegExp(escapeRegex(searchTerm), 'i');
  const tasks = await populateTask(
    Task.find({
      project: { $in: projectIds },
      $or: [{ title: pattern }, { description: pattern }],
    })
      .populate('project', 'title color')
      .sort({ updatedAt: -1 })
      .limit(10)
  );
  res.json({ success: true, tasks });
});

const isProjectUser = (project, userId) =>
  project.owner.toString() === userId.toString() ||
  project.members.some((member) => member.toString() === userId.toString());

const isValidChecklist = (checklist) =>
  Array.isArray(checklist) &&
  checklist.length <= 50 &&
  checklist.every((item) => item && typeof item.text === 'string' && item.text.trim() && item.text.length <= 180);

const normalizeChecklist = (checklist) =>
  checklist.map((item) => ({
    ...(item._id && mongoose.Types.ObjectId.isValid(item._id) ? { _id: item._id } : {}),
    text: item.text.trim(),
    completed: item.completed === true,
  }));

const validateBlockedBy = async (blockedBy, projectId, taskId = null) => {
  if (!Array.isArray(blockedBy)) {
    return { error: 'Task dependencies must be a list' };
  }

  const dependencyIds = blockedBy.map((dependency) => String(dependency));
  if (dependencyIds.some((dependencyId) => !mongoose.Types.ObjectId.isValid(dependencyId))) {
    return { error: 'Task dependencies must contain valid task IDs' };
  }
  if (new Set(dependencyIds).size !== dependencyIds.length) {
    return { error: 'A task cannot have duplicate dependencies' };
  }
  if (taskId && dependencyIds.includes(taskId.toString())) {
    return { error: 'A task cannot depend on itself' };
  }

  const blockers = await Task.find({
    _id: { $in: dependencyIds },
    project: projectId,
  }).select('_id status');
  if (blockers.length !== dependencyIds.length) {
    return { error: 'Dependencies must be tasks in the same project' };
  }

  if (taskId && dependencyIds.length > 0) {
    const visited = new Set();
    let frontier = dependencyIds;
    const currentTaskId = taskId.toString();

    while (frontier.length > 0) {
      if (frontier.includes(currentTaskId)) {
        return { error: 'This dependency would create a task cycle' };
      }

      const nextIds = frontier.filter((dependencyId) => !visited.has(dependencyId));
      if (nextIds.length === 0) break;
      nextIds.forEach((dependencyId) => visited.add(dependencyId));

      const dependencies = await Task.find({
        _id: { $in: nextIds },
        project: projectId,
      }).select('blockedBy');
      frontier = dependencies.flatMap((dependency) => dependency.blockedBy.map((id) => id.toString()));
    }
  }

  return { blockers };
};

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getTasksForProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  if (!assertProjectAccess(project, req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not have access to this project' });
  }

  const tasks = await populateTask(Task.find({ project: project._id })).sort({ order: 1, createdAt: -1 });
  res.json({ success: true, tasks });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = asyncHandler(async (req, res) => {
  const task = await populateTask(Task.findById(req.params.id)).populate('project', 'title owner members');
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  if (!assertProjectAccess(task.project, req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not have access to this task' });
  }

  res.json({ success: true, task });
});

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { title, description, projectId, assignee, priority, status, dueDate, checklist = [], blockedBy = [] } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Task title is required' });
  }
  if (!projectId) {
    return res.status(400).json({ success: false, message: 'projectId is required' });
  }
  if (!isValidChecklist(checklist)) {
    return res.status(400).json({ success: false, message: 'Checklist must contain up to 50 items with text between 1 and 180 characters' });
  }

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  if (!assertProjectAccess(project, req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not have access to this project' });
  }
  if (assignee && !isProjectUser(project, assignee)) {
    return res.status(400).json({ success: false, message: 'Assignee must be a member of this project' });
  }

  const dependencyResult = await validateBlockedBy(blockedBy, projectId);
  if (dependencyResult.error) {
    return res.status(400).json({ success: false, message: dependencyResult.error });
  }
  if ((status || 'To Do') === 'Completed' && dependencyResult.blockers.some((blocker) => blocker.status !== 'Completed')) {
    return res.status(400).json({ success: false, message: 'Complete blocking tasks before completing this task' });
  }

  const taskCount = await Task.countDocuments({ project: projectId, status: status || 'To Do' });

  const task = await Task.create({
    title: title.trim(),
    description: description || '',
    project: projectId,
    assignee: assignee || null,
    priority: priority || 'Medium',
    status: status || 'To Do',
    dueDate: dueDate || null,
    checklist: normalizeChecklist(checklist),
    blockedBy: dependencyResult.blockers.map((blocker) => blocker._id),
    createdBy: req.user._id,
    order: taskCount,
  });

  const populated = await populateTask(Task.findById(task._id));

  const io = req.app.get('io');
  io.to(`project:${projectId}`).emit('task:created', populated);

  if (populated.assignee && populated.assignee._id.toString() !== req.user._id.toString()) {
    await notifyUser(io, populated.assignee._id, {
      type: 'task_assigned',
      message: `${req.user.name} assigned you "${populated.title}"`,
      projectId,
      taskId: populated._id,
    });
  }

  res.status(201).json({ success: true, task: populated });
});

// @desc    Update a task (title, description, priority, dueDate, assignee, status/order for drag-drop)
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  if (!assertProjectAccess(task.project, req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not have access to this task' });
  }

  const previousAssignee = task.assignee ? task.assignee.toString() : null;
  const previousStatus = task.status;
  const previousCreatedBy = task.createdBy.toString();

  const { title, description, assignee, priority, status, dueDate, order, checklist, blockedBy } = req.body;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (assignee && !isProjectUser(task.project, assignee)) {
    return res.status(400).json({ success: false, message: 'Assignee must be a member of this project' });
  }
  if (assignee !== undefined) task.assignee = assignee || null;
  if (priority !== undefined) task.priority = priority;
  if (status !== undefined) task.status = status;
  if (dueDate !== undefined) task.dueDate = dueDate || null;
  if (order !== undefined) task.order = order;
  if (checklist !== undefined) {
    if (!isValidChecklist(checklist)) {
      return res.status(400).json({ success: false, message: 'Checklist must contain up to 50 items with text between 1 and 180 characters' });
    }
    task.checklist = normalizeChecklist(checklist);
  }
  let blockers;
  if (blockedBy !== undefined) {
    const dependencyResult = await validateBlockedBy(blockedBy, task.project._id, task._id);
    if (dependencyResult.error) {
      return res.status(400).json({ success: false, message: dependencyResult.error });
    }
    blockers = dependencyResult.blockers;
    task.blockedBy = blockers.map((blocker) => blocker._id);
  }

  const nextStatus = status === undefined ? task.status : status;
  if (nextStatus === 'Completed') {
    blockers = blockers || await Task.find({ _id: { $in: task.blockedBy } }).select('_id status');
    if (blockers.some((blocker) => blocker.status !== 'Completed')) {
      return res.status(400).json({ success: false, message: 'Complete blocking tasks before completing this task' });
    }
  }
  if (previousStatus === 'Completed' && nextStatus !== 'Completed') {
    const completedDependent = await Task.exists({
      project: task.project._id,
      blockedBy: task._id,
      status: 'Completed',
    });
    if (completedDependent) {
      return res.status(400).json({ success: false, message: 'Reopen dependent tasks before reopening this task' });
    }
  }

  await task.save();
  const populated = await populateTask(Task.findById(task._id));

  const io = req.app.get('io');
  io.to(`project:${task.project._id}`).emit('task:updated', populated);
  if (status !== undefined && status !== previousStatus) {
    const dependentTasks = await populateTask(
      Task.find({ project: task.project._id, blockedBy: task._id })
    );
    dependentTasks.forEach((dependentTask) => {
      io.to(`project:${task.project._id}`).emit('task:updated', dependentTask);
    });
  }

  const newAssignee = populated.assignee ? populated.assignee._id.toString() : null;
  if (newAssignee && newAssignee !== previousAssignee && newAssignee !== req.user._id.toString()) {
    await notifyUser(io, newAssignee, {
      type: 'task_assigned',
      message: `${req.user.name} assigned you "${populated.title}"`,
      projectId: task.project._id,
      taskId: populated._id,
    });
  }

  if (
    status !== undefined &&
    status === 'Completed' &&
    previousStatus !== 'Completed' &&
    previousCreatedBy !== req.user._id.toString()
  ) {
    await notifyUser(io, previousCreatedBy, {
      type: 'task_completed',
      message: `${req.user.name} completed "${populated.title}"`,
      projectId: task.project._id,
      taskId: populated._id,
    });
  }

  res.json({ success: true, task: populated });
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  if (!assertProjectAccess(task.project, req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not have access to this task' });
  }

  await Comment.deleteMany({ task: task._id });
  const projectId = task.project._id;
  const taskId = task._id;
  const dependentTaskIds = await Task.distinct('_id', { project: projectId, blockedBy: taskId });
  await Task.updateMany(
    { project: projectId, blockedBy: taskId },
    { $pull: { blockedBy: taskId } }
  );
  await task.deleteOne();

  const io = req.app.get('io');
  if (dependentTaskIds.length > 0) {
    const dependentTasks = await populateTask(Task.find({ _id: { $in: dependentTaskIds } }));
    dependentTasks.forEach((dependentTask) => {
      io.to(`project:${projectId}`).emit('task:updated', dependentTask);
    });
  }
  io.to(`project:${projectId}`).emit('task:deleted', { taskId, projectId });

  res.json({ success: true, message: 'Task deleted successfully' });
});

module.exports = { getMyTasks, searchTasks, getTasksForProject, getTask, createTask, updateTask, deleteTask };
