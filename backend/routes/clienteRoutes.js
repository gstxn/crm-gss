const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Controladores (serão implementados posteriormente)
const {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  addHistoricoCliente
} = require('../controllers/clienteController');

// Rotas protegidas
router.route('/')
  .get(protect, getClientes)
  .post(protect, createCliente);

router.route('/:id')
  .get(protect, getClienteById)
  .put(protect, updateCliente)
  .delete(protect, deleteCliente);

router.route('/:id/historico')
  .post(protect, addHistoricoCliente);

module.exports = router;