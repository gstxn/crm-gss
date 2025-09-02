const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getRecentActivities,
  getPendingTasks,
  getCompletedTasks
} = require('../controllers/dashboardController');

// Todas as rotas do dashboard são protegidas
router.get('/stats', protect, getDashboardStats);
router.get('/activities', protect, getRecentActivities);
router.get('/tasks', protect, getPendingTasks);
// rota para tarefas concluídas
router.get('/tasks/completed', protect, getCompletedTasks);

module.exports = router;