const { validationResult } = require('express-validator');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

const avatarDirectory = path.join(__dirname, '..', 'uploads', 'avatars');

const getImageExtension = (buffer) => {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) return 'png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) return 'webp';
  return null;
};

const getStoredAvatarPath = (avatarUrl) => {
  const match = /^\/uploads\/avatars\/(avatar-[a-f0-9]{32}\.(?:jpg|png|webp))$/.exec(avatarUrl || '');
  return match ? path.join(avatarDirectory, match[1]) : null;
};

const removeStoredAvatar = async (avatarUrl) => {
  const storedPath = getStoredAvatarPath(avatarUrl);
  if (!storedPath) return;
  try {
    await fs.unlink(storedPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Failed to remove old avatar: ${error.message}`);
    }
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }

  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists' });
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    token: generateToken(user._id),
    user: user.toPublicJSON(),
  });
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  res.json({
    success: true,
    token: generateToken(user._id),
    user: user.toPublicJSON(),
  });
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON() });
});

// @desc    Update current user's profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, title } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 60) {
      return res.status(400).json({ success: false, message: 'Name must be between 1 and 60 characters' });
    }
    req.user.name = name.trim();
  }
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length > 80) {
      return res.status(400).json({ success: false, message: 'Title cannot exceed 80 characters' });
    }
    req.user.title = title.trim();
  }

  await req.user.save();

  res.json({ success: true, user: req.user.toPublicJSON() });
});

// @desc    Upload or replace the current user's profile photo
// @route   POST /api/auth/me/avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Choose an image to upload' });
  }

  const extension = getImageExtension(req.file.buffer);
  if (!extension) {
    return res.status(400).json({ success: false, message: 'The uploaded file is not a valid JPEG, PNG, or WebP image' });
  }

  await fs.mkdir(avatarDirectory, { recursive: true });
  const filename = `avatar-${crypto.randomBytes(16).toString('hex')}.${extension}`;
  const newAvatarPath = path.join(avatarDirectory, filename);
  await fs.writeFile(newAvatarPath, req.file.buffer, { flag: 'wx' });

  const previousAvatar = req.user.avatarUrl;
  req.user.avatarUrl = `/uploads/avatars/${filename}`;
  try {
    await req.user.save();
  } catch (error) {
    try {
      await fs.unlink(newAvatarPath);
    } catch (cleanupError) {
      console.error(`Failed to clean up an unreferenced avatar: ${cleanupError.message}`);
    }
    throw error;
  }

  await removeStoredAvatar(previousAvatar);
  res.json({ success: true, user: req.user.toPublicJSON() });
});

// @desc    Remove the current user's profile photo
// @route   DELETE /api/auth/me/avatar
// @access  Private
const deleteAvatar = asyncHandler(async (req, res) => {
  const previousAvatar = req.user.avatarUrl;
  req.user.avatarUrl = '';
  await req.user.save();
  await removeStoredAvatar(previousAvatar);
  res.json({ success: true, user: req.user.toPublicJSON() });
});

// @desc    Change current user's password
// @route   PUT /api/auth/me/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
});

// @desc    Delete the current account while preserving shared project history
// @route   DELETE /api/auth/me/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const { currentPassword, confirmation } = req.body;
  if (!currentPassword || confirmation !== 'DELETE') {
    return res.status(400).json({
      success: false,
      message: 'Enter your current password and type DELETE to confirm account removal',
    });
  }

  const session = await mongoose.startSession();
  let passwordMismatch = false;
  let accountMissing = false;
  let ownedProjectTitles = [];
  let avatarUrl = '';

  try {
    await session.withTransaction(async () => {
      const account = await User.findById(req.user._id).select('+password').session(session);
      if (!account) {
        accountMissing = true;
        return;
      }
      if (!(await account.matchPassword(currentPassword))) {
        passwordMismatch = true;
        return;
      }

      const ownedProjects = await Project.find({ owner: account._id })
        .select('title')
        .session(session)
        .lean();
      if (ownedProjects.length > 0) {
        ownedProjectTitles = ownedProjects.map((project) => project.title);
        return;
      }

      avatarUrl = account.avatarUrl;
      const actorPrefix = new RegExp(`^${account.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} `, 'i');
      const actorNotifications = await Notification.find({ message: actorPrefix }).session(session).lean();
      if (actorNotifications.length > 0) {
        await Notification.bulkWrite(
          actorNotifications.map((notification) => ({
            updateOne: {
              filter: { _id: notification._id },
              update: {
                $set: {
                  message: `Former member${notification.message.slice(account.name.length)}`,
                },
              },
            },
          })),
          { session }
        );
      }

      await Project.updateMany(
        { members: account._id },
        { $pull: { members: account._id } },
        { session }
      );
      await Task.updateMany(
        { assignee: account._id },
        { $set: { assignee: null } },
        { session }
      );
      await Task.updateMany(
        { createdBy: account._id },
        { $set: { createdBy: null } },
        { session }
      );
      await Comment.updateMany(
        { author: account._id },
        { $set: { author: null } },
        { session }
      );
      await Notification.deleteMany({ recipient: account._id }, { session });
      await User.deleteOne({ _id: account._id }, { session });
    });
  } finally {
    await session.endSession();
  }

  if (accountMissing) {
    return res.status(404).json({ success: false, message: 'Account no longer exists' });
  }
  if (passwordMismatch) {
    return res.status(401).json({ success: false, message: 'Your current password is incorrect' });
  }
  if (ownedProjectTitles.length > 0) {
    const projectList = ownedProjectTitles.slice(0, 3).map((title) => `"${title}"`).join(', ');
    const remainingCount = ownedProjectTitles.length - 3;
    const moreProjects = remainingCount > 0 ? ` and ${remainingCount} more` : '';
    return res.status(409).json({
      success: false,
      message: `Transfer ownership or delete these projects before deleting your account: ${projectList}${moreProjects}`,
      projects: ownedProjectTitles,
    });
  }

  await removeStoredAvatar(avatarUrl);
  res.json({ success: true, message: 'Account deleted successfully' });
});

// @desc    Search users by name/email (for adding project members)
// @route   GET /api/auth/search?q=
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ success: true, users: [] });

  const users = await User.find({
    $or: [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }],
  })
    .limit(10)
    .select('name email avatarColor avatarUrl');

  res.json({ success: true, users });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  deleteAccount,
  searchUsers,
};
