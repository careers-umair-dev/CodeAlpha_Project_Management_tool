const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { notifyUser } = require('../utils/notify');

// Helper: checks the requesting user is the owner or a member of the project
const assertProjectAccess = (project, userId) => {
  const uid = userId.toString();
  const isOwner = project.owner._id ? project.owner._id.toString() === uid : project.owner.toString() === uid;
  const isMember = project.members.some((m) => (m._id ? m._id.toString() : m.toString()) === uid);
  return isOwner || isMember;
};

// @desc    Get all projects for the logged in user (owned or member of)
// @route   GET /api/projects
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    $or: [{ owner: req.user._id }, { members: req.user._id }],
  })
    .populate('owner', 'name email avatarColor')
    .populate('members', 'name email avatarColor')
    .sort({ updatedAt: -1 });

  // Attach task stats per project
  const projectIds = projects.map((p) => p._id);
  const taskCounts = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: { project: '$project', status: '$status' }, count: { $sum: 1 } } },
  ]);

  const statsByProject = {};
  taskCounts.forEach(({ _id, count }) => {
    const pid = _id.project.toString();
    if (!statsByProject[pid]) statsByProject[pid] = { total: 0, completed: 0 };
    statsByProject[pid].total += count;
    if (_id.status === 'Completed') statsByProject[pid].completed += count;
  });

  const result = projects.map((p) => {
    const stats = statsByProject[p._id.toString()] || { total: 0, completed: 0 };
    return {
      ...p.toObject(),
      taskStats: {
        total: stats.total,
        completed: stats.completed,
        progress: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      },
    };
  });

  res.json({ success: true, projects: result });
});

// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email avatarColor')
    .populate('members', 'name email avatarColor');

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  if (!assertProjectAccess(project, req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not have access to this project' });
  }

  res.json({ success: true, project });
});

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = asyncHandler(async (req, res) => {
  const { title, description, deadline, memberEmails } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Project title is required' });
  }

  let memberIds = [];
  if (Array.isArray(memberEmails) && memberEmails.length > 0) {
    const users = await User.find({ email: { $in: memberEmails.map((e) => e.toLowerCase()) } });
    memberIds = users.map((u) => u._id);
  }

  const project = await Project.create({
    title: title.trim(),
    description: description || '',
    deadline: deadline || null,
    owner: req.user._id,
    members: memberIds,
  });

  const populated = await project.populate([
    { path: 'owner', select: 'name email avatarColor' },
    { path: 'members', select: 'name email avatarColor' },
  ]);

  res.status(201).json({ success: true, project: populated });
});

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (owner only)
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }
  if (project.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the project owner can edit this project' });
  }

  const { title, description, deadline, color } = req.body;
  if (title !== undefined) project.title = title;
  if (description !== undefined) project.description = description;
  if (deadline !== undefined) project.deadline = deadline;
  if (color !== undefined) project.color = color;

  await project.save();
  const populated = await project.populate([
    { path: 'owner', select: 'name email avatarColor' },
    { path: 'members', select: 'name email avatarColor' },
  ]);

  res.json({ success: true, project: populated });
});

// @desc    Delete a project (and its tasks/comments)
// @route   DELETE /api/projects/:id
// @access  Private (owner only)
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }
  if (project.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the project owner can delete this project' });
  }

  const Comment = require('../models/Comment');
  const tasks = await Task.find({ project: project._id }).select('_id');
  await Comment.deleteMany({ task: { $in: tasks.map((t) => t._id) } });
  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  res.json({ success: true, message: 'Project deleted successfully' });
});

// @desc    Add a member to a project by email
// @route   POST /api/projects/:id/members
// @access  Private (owner only)
const addMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }
  if (project.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the project owner can add members' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ success: false, message: 'No user found with that email' });
  }

  if (
    project.owner.toString() === user._id.toString() ||
    project.members.some((m) => m.toString() === user._id.toString())
  ) {
    return res.status(400).json({ success: false, message: 'User is already part of this project' });
  }

  project.members.push(user._id);
  await project.save();

  const populated = await project.populate([
    { path: 'owner', select: 'name email avatarColor' },
    { path: 'members', select: 'name email avatarColor' },
  ]);

  const io = req.app.get('io');
  notifyUser(io, user._id, {
    type: 'project_member_added',
    message: `${req.user.name} added you to "${project.title}"`,
    projectId: project._id,
  });

  res.json({ success: true, project: populated });
});

// @desc    Remove a member from a project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (owner only)
const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }
  if (project.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the project owner can remove members' });
  }

  project.members = project.members.filter((m) => m.toString() !== req.params.userId);
  await project.save();

  // Unassign any tasks that were assigned to the removed member
  await Task.updateMany(
    { project: project._id, assignee: req.params.userId },
    { $set: { assignee: null } }
  );

  const populated = await project.populate([
    { path: 'owner', select: 'name email avatarColor' },
    { path: 'members', select: 'name email avatarColor' },
  ]);

  res.json({ success: true, project: populated });
});

// @desc    Get aggregated dashboard stats for the logged in user
// @route   GET /api/projects/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    $or: [{ owner: req.user._id }, { members: req.user._id }],
  }).select('_id title color updatedAt');

  const projectIds = projects.map((p) => p._id);

  const tasks = await Task.find({ project: { $in: projectIds } })
    .populate('project', 'title color')
    .populate('assignee', 'name avatarColor')
    .sort({ updatedAt: -1 });

  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const STATUS_ORDER = ['To Do', 'In Progress', 'Review', 'Completed'];
  const PRIORITY_ORDER = ['Low', 'Medium', 'High'];
  const statusBreakdown = STATUS_ORDER.map((status) => ({
    status,
    count: tasks.filter((t) => t.status === status).length,
  }));
  const priorityBreakdown = PRIORITY_ORDER.map((priority) => ({
    priority,
    count: tasks.filter((t) => t.priority === priority).length,
  }));

  const now = new Date();
  const overdueTasks = tasks.filter((t) => t.dueDate && t.status !== 'Completed' && new Date(t.dueDate) < now);
  const upcomingTasks = tasks.filter(
    (t) =>
      t.dueDate &&
      t.status !== 'Completed' &&
      new Date(t.dueDate) >= now &&
      new Date(t.dueDate) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  );

  const myTasks = tasks.filter((t) => t.assignee && t.assignee._id.toString() === req.user._id.toString());

  res.json({
    success: true,
    stats: {
      totalProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueCount: overdueTasks.length,
      completionRate,
    },
    statusBreakdown,
    priorityBreakdown,
    recentProjects: [...projects].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5),
    recentTasks: tasks.slice(0, 8),
    overdueTasks: overdueTasks.slice(0, 8),
    upcomingTasks: upcomingTasks.slice(0, 8),
    myTasks: myTasks.slice(0, 8),
  });
});

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getDashboardStats,
  assertProjectAccess,
};
