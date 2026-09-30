const express = require('express');
const { getCommentsForTask, createComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/task/:taskId', getCommentsForTask);
router.post('/', createComment);
router.delete('/:id', deleteComment);

module.exports = router;
