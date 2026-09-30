const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const { assertProjectAccess } = require('./projectController');
const { notifyUser } = require('../utils/notify');

const populateTask = (query) =>
  query.populate('assignee', 'name email avatarColor').populate('createdBy', 'name email avatarColor');

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
  const { title, description, projectId, assignee, priority, status, dueDate } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Task title is required' });
  }
  if (!projectId) {
    return res.status(400).json({ success: false, message: 'projectId is required' });
  }

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  if (!assertProjectAccess(project, req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not have access to this project' });
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
    createdBy: req.user._id,
    order: taskCount,
  });

  const populated = await populateTask(Task.findById(task._id));

  const io = req.app.get('io');
  io.to(`project:${projectId}`).emit('task:created', populated);

  if (populated.assignee && populated.assignee._id.toString() !== req.user._id.toString()) {
    notifyUser(io, populated.assignee._id, {
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

  const { title, description, assignee, priority, status, dueDate, order } = req.body;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (assignee !== undefined) task.assignee = assignee || null;
  if (priority !== undefined) task.priority = priority;
  if (status !== undefined) task.status = status;
  if (dueDate !== undefined) task.dueDate = dueDate || null;
  if (order !== undefined) task.order = order;

  await task.save();
  const populated = await populateTask(Task.findById(task._id));

  const io = req.app.get('io');
  io.to(`project:${task.project._id}`).emit('task:updated', populated);

  const newAssignee = populated.assignee ? populated.assignee._id.toString() : null;
  if (newAssignee && newAssignee !== previousAssignee && newAssignee !== req.user._id.toString()) {
    notifyUser(io, newAssignee, {
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
    notifyUser(io, previousCreatedBy, {
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
  await task.deleteOne();

  const io = req.app.get('io');
  io.to(`project:${projectId}`).emit('task:deleted', { taskId, projectId });

  res.json({ success: true, message: 'Task deleted successfully' });
});

module.exports = { getTasksForProject, getTask, createTask, updateTask, deleteTask };
