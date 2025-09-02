const Notificacao = require('../../models/Notificacao');

// Obter todas as notificações (com paginação e filtros opcionais)
exports.getAllNotificacoes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      lida,
      destinatario
    } = req.query;

    const filtro = {};
    if (typeof lida !== 'undefined') filtro.lida = lida === 'true';
    if (destinatario) filtro.destinatario = destinatario;

    const notificacoes = await Notificacao.find(filtro)
      .sort({ criadoEm: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notificacao.countDocuments(filtro);

    res.json({ total, page: parseInt(page), limit: parseInt(limit), notificacoes });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ message: 'Erro ao buscar notificações' });
  }
};

// Obter notificações não lidas para o usuário logado
exports.getUnreadNotificacoes = async (req, res) => {
  try {
    const adminUserId = req.adminUser ? req.adminUser._id : null;
    const filtro = { destinatario: adminUserId, lida: false };
    const notificacoes = await Notificacao.find(filtro).sort({ criadoEm: -1 });
    res.json(notificacoes);
  } catch (error) {
    console.error('Erro ao buscar notificações não lidas:', error);
    res.status(500).json({ message: 'Erro ao buscar notificações não lidas' });
  }
};

// Obter uma notificação por ID
exports.getNotificacaoById = async (req, res) => {
  try {
    const notificacao = await Notificacao.findById(req.params.id);
    if (!notificacao) return res.status(404).json({ message: 'Notificação não encontrada' });
    res.json(notificacao);
  } catch (error) {
    console.error('Erro ao buscar notificação:', error);
    res.status(500).json({ message: 'Erro ao buscar notificação' });
  }
};

// Criar uma nova notificação
exports.createNotificacao = async (req, res) => {
  try {
    const nova = await Notificacao.create(req.body);
    res.status(201).json(nova);
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    res.status(500).json({ message: 'Erro ao criar notificação' });
  }
};

// Atualizar notificação
exports.updateNotificacao = async (req, res) => {
  try {
    const atualizada = await Notificacao.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!atualizada) return res.status(404).json({ message: 'Notificação não encontrada' });
    res.json(atualizada);
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    res.status(500).json({ message: 'Erro ao atualizar notificação' });
  }
};

// Marcar como lida
exports.markAsRead = async (req, res) => {
  try {
    const notif = await Notificacao.findByIdAndUpdate(
      req.params.id,
      { lida: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notificação não encontrada' });
    res.json(notif);
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ message: 'Erro ao marcar notificação como lida' });
  }
};

// Excluir notificação
exports.deleteNotificacao = async (req, res) => {
  try {
    const removida = await Notificacao.findByIdAndDelete(req.params.id);
    if (!removida) return res.status(404).json({ message: 'Notificação não encontrada' });
    res.json({ message: 'Notificação excluída' });
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    res.status(500).json({ message: 'Erro ao excluir notificação' });
  }
};