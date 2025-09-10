const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createTask,
  getPendingTasks,
  updateTask
} = require('../controllers/taskController');

// Todas as rotas de tarefas são protegidas
router.post('/', protect, createTask);
router.get('/pending', protect, getPendingTasks);
router.put('/:id', protect, updateTask);

module.exports = router;