const express = require('express');
const router = express.Router();
const clienteController = require('../../controllers/admin/clienteController');
const requireAdmin = require('../../middleware/admin/requireAdmin');

// Todas as rotas aqui já estão protegidas pelo middleware requireAdmin no arquivo server.js
// Aplicar middleware requireAdmin com permissão específica para operações sensíveis

// Rotas para clientes
router.get('/', clienteController.getAllClientes);
router.get('/stats', clienteController.getClienteStats);
router.get('/:id', clienteController.getClienteById);
router.post('/', requireAdmin('manage_clientes'), clienteController.createCliente);
router.put('/:id', requireAdmin('manage_clientes'), clienteController.updateCliente);
router.delete('/:id', requireAdmin('manage_clientes'), clienteController.deleteCliente);

module.exports = router;