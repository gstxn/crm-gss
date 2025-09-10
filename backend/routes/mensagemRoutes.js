const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const mensagemController = require('../controllers/mensagemController');

// Rotas protegidas - requerem autenticação
router.use(protect);

// Rotas para mensagens
router.route('/')
  .get(mensagemController.getMensagens)
  .post(mensagemController.createMensagem);

router.route('/nao-lidas')
  .get(mensagemController.getMensagensNaoLidas);

router.route('/:id')
  .get(mensagemController.getMensagemById)
  .delete(mensagemController.deleteMensagem);

router.route('/:id/lida')
  .put(mensagemController.marcarComoLida);

router.route('/:id/anexo')
  .post(mensagemController.uploadAnexo);

router.route('/:id/anexo/:anexoId')
  .delete(mensagemController.deleteAnexo);

module.exports = router;