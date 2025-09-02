const express = require('express');
const { login, getMe, logout } = require('../../controllers/admin/authController');
const { requireAdmin } = require('../../middleware/admin/requireAdmin');

const router = express.Router();

// Rotas públicas
router.post('/login', login);

// Rotas protegidas
router.get('/me', requireAdmin(), getMe);
router.post('/logout', requireAdmin(), logout);

module.exports = router;