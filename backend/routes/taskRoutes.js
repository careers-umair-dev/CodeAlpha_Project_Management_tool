const express = require('express');
const { getMyTasks, searchTasks, getTasksForProject, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/mine', getMyTasks);
router.get('/search', searchTasks);
router.get('/project/:projectId', getTasksForProject);
router.route('/').post(createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

module.exports = router;
