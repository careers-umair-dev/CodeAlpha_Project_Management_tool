const express = require('express');
const {
  getNotifications,
  markNotificationsRead,
  clearNotifications,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getNotifications);
router.patch('/read', markNotificationsRead);
router.delete('/', clearNotifications);

module.exports = router;
