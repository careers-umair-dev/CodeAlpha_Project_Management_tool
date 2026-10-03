const Comment = require('../models/Comment');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const { assertProjectAccess } = require('./projectController');
const { notifyUser } = require('../utils/notify');

// @desc    Get all comments for a task
// @route   GET /api/comments/task/:taskId
// @access  Private
const getCommentsForTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId).populate('project');
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  if (!assertProjectAccess(task.project, req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not have access to this task' });
  }

  const comments = await Comment.find({ task: task._id })
    .populate('author', 'name email avatarColor avatarUrl')
    .sort({ createdAt: 1 });

  res.json({ success: true, comments });
});

// @desc    Add a comment to a task
// @route   POST /api/comments
// @access  Private
const createComment = asyncHandler(async (req, res) => {
  const { taskId, text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Comment text is required' });
  }
  if (!taskId) {
    return res.status(400).json({ success: false, message: 'taskId is required' });
  }

  const task = await Task.findById(taskId).populate('project');
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  if (!assertProjectAccess(task.project, req.user._id)) {
    return res.status(403).json({ success: false, message: 'You do not have access to this task' });
  }

  const comment = await Comment.create({ task: taskId, author: req.user._id, text: text.trim() });
  const populated = await comment.populate('author', 'name email avatarColor avatarUrl');

  const io = req.app.get('io');
  io.to(`project:${task.project._id}`).emit('comment:created', { taskId, comment: populated });

  // Notify everyone with access to the task (owner + members) except the author
  const recipientIds = new Set([
    task.project.owner.toString(),
    ...task.project.members.map((m) => m.toString()),
  ]);
  recipientIds.delete(req.user._id.toString());
  await Promise.all([...recipientIds].map((recipientId) =>
    notifyUser(io, recipientId, {
      type: 'comment_added',
      message: `${req.user.name} commented on "${task.title}"`,
      projectId: task.project._id,
      taskId: task._id,
    })
  ));

  res.status(201).json({ success: true, comment: populated });
});

// @desc    Delete a comment (author only)
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id).populate({
    path: 'task',
    populate: { path: 'project' },
  });
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

  if (!comment.author || comment.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You can only delete your own comments' });
  }

  const taskId = comment.task._id;
  const projectId = comment.task.project._id;
  const commentId = comment._id;
  await comment.deleteOne();

  const io = req.app.get('io');
  io.to(`project:${projectId}`).emit('comment:deleted', { taskId, commentId });

  res.json({ success: true, message: 'Comment deleted successfully' });
});

module.exports = { getCommentsForTask, createComment, deleteComment };
