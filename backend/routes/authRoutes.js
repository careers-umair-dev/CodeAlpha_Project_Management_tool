const express = require('express');
const { body } = require('express-validator');
const {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  uploadAvatar: uploadAvatarController,
  deleteAvatar,
  changePassword,
  deleteAccount,
  searchUsers,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const uploadAvatar = require('../middleware/avatarUpload');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  registerUser
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  loginUser
);

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.post('/me/avatar', protect, uploadAvatar, uploadAvatarController);
router.delete('/me/avatar', protect, deleteAvatar);
router.put('/me/password', protect, changePassword);
router.delete('/me/account', protect, deleteAccount);
router.get('/search', protect, searchUsers);

module.exports = router;
