const AuditLog = require('../../models/admin/AuditLog');

// Obter todos os logs de auditoria
exports.getAllLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    
    const filtro = {};
    
    // Filtros opcionais
    if (req.query.action) filtro.action = req.query.action;
    if (req.query.entity) filtro.entity = req.query.entity;
    if (req.query.user) filtro.user = req.query.user;
    if (req.query.startDate && req.query.endDate) {
      filtro.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    const logs = await AuditLog.find(filtro)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'nome email');
    
    const total = await AuditLog.countDocuments(filtro);
    
    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: logs
    });
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar logs de auditoria'
    });
  }
};

// Obter log de auditoria por ID
exports.getLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('user', 'nome email');
    
    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Log de auditoria não encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Erro ao buscar log de auditoria:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar log de auditoria'
    });
  }
};

// Obter logs por usuário
exports.getLogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    
    const logs = await AuditLog.find({ user: userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await AuditLog.countDocuments({ user: userId });
    
    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: logs
    });
  } catch (error) {
    console.error('Erro ao buscar logs por usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar logs por usuário'
    });
  }
};

// Obter logs por entidade
exports.getLogsByEntity = async (req, res) => {
  try {
    const { entity, entityId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    
    const filtro = { entity };
    if (entityId) filtro.entityId = entityId;
    
    const logs = await AuditLog.find(filtro)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'nome email');
    
    const total = await AuditLog.countDocuments(filtro);
    
    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: logs
    });
  } catch (error) {
    console.error('Erro ao buscar logs por entidade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar logs por entidade'
    });
  }
};

// Obter estatísticas de logs
exports.getLogsStats = async (req, res) => {
  try {
    // Estatísticas por tipo de ação
    const actionStats = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Estatísticas por entidade
    const entityStats = await AuditLog.aggregate([
      { $group: { _id: '$entity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Estatísticas por usuário (top 10)
    const userStats = await AuditLog.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Estatísticas por dia (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyStats = await AuditLog.aggregate([
      { 
        $match: { 
          timestamp: { $gte: thirtyDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        actionStats,
        entityStats,
        userStats,
        dailyStats
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de logs:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas de logs'
    });
  }
};