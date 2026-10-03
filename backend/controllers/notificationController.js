const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

const NOTIFICATION_LIMIT = 30;

const getNotifications = asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(NOTIFICATION_LIMIT),
    Notification.countDocuments({ recipient: req.user._id, read: false }),
  ]);

  res.json({ success: true, notifications, unreadCount });
});

const markNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { $set: { read: true } }
  );
  res.json({ success: true });
});

const clearNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ recipient: req.user._id });
  res.json({ success: true });
});

module.exports = { getNotifications, markNotificationsRead, clearNotifications };
