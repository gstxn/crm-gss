const express = require('express');
const router = express.Router();
const medicoDisparoController = require('../controllers/medicoDisparoController');
const { authenticateToken, authorizeDisparo } = require('../middleware/auth');

// Rotas com diferentes níveis de autorização

// Rotas de leitura (leitura, operador_disparo, admin)
router.get('/', authenticateToken, authorizeDisparo('read'), medicoDisparoController.listar);
router.get('/estatisticas', authenticateToken, authorizeDisparo('read'), medicoDisparoController.obterEstatisticas);
router.get('/:id', authenticateToken, authorizeDisparo('read'), medicoDisparoController.obterPorId);

// Rotas de exportação (leitura, operador_disparo, admin)
router.get('/exportar', authenticateToken, authorizeDisparo('export'), medicoDisparoController.exportarParaDisparo);

// Rotas de escrita (operador_disparo, admin)
router.post('/', authenticateToken, authorizeDisparo('write'), medicoDisparoController.criar);
router.put('/:id', authenticateToken, authorizeDisparo('write'), medicoDisparoController.atualizar);
router.delete('/:id', authenticateToken, authorizeDisparo('write'), medicoDisparoController.excluir);

// Rotas para ações em massa (operador_disparo, admin)
router.post('/acao-massa', authenticateToken, authorizeDisparo('mass_action'), medicoDisparoController.acaoEmMassa);

// Rotas para importação (operador_disparo, admin)
router.post('/importar', authenticateToken, authorizeDisparo('import'), medicoDisparoController.uploadArquivo, medicoDisparoController.importarArquivo);
router.post('/sincronizar', authenticateToken, authorizeDisparo('import'), medicoDisparoController.sincronizarPlanilha);

module.exports = router;