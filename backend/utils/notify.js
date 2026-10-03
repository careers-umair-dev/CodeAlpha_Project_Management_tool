const Notification = require('../models/Notification');

const notifyUser = async (io, userId, notification) => {
  if (!userId) return;

  let payload;
  try {
    const saved = await Notification.create({
      recipient: userId,
      type: notification.type,
      message: notification.message,
      projectId: notification.projectId || null,
      taskId: notification.taskId || null,
    });
    payload = saved.toObject();
  } catch (error) {
    console.error(`Failed to persist notification for ${userId}: ${error.message}`);
    payload = {
      _id: `transient-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...notification,
      createdAt: new Date().toISOString(),
      read: false,
    };
  }

  if (io) io.to(`user:${userId.toString()}`).emit('notification', payload);
};

module.exports = { notifyUser };
