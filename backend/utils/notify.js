// Emits a lightweight real-time notification to a single user's personal
// socket room. Notifications are transient (not persisted to the DB) - this
// keeps the feature simple while still giving users live feedback for
// things that matter: assignments, comments, invites, deadlines.
const notifyUser = (io, userId, notification) => {
  if (!io || !userId) return;
  io.to(`user:${userId.toString()}`).emit('notification', {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...notification,
  });
};

module.exports = { notifyUser };
