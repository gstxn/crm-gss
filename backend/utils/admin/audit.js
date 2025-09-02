const AuditLog = require('../../models/admin/AuditLog');

/**
 * Registra uma ação de auditoria no sistema
 * @param {Object} options - Opções para o registro de auditoria
 * @param {Object} options.user - Usuário administrativo que realizou a ação
 * @param {string} options.action - Tipo de ação (CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, OTHER)
 * @param {string} options.entity - Entidade afetada (ex: 'AdminUser', 'Cliente', etc)
 * @param {string} options.entityId - ID da entidade afetada (opcional)
 * @param {Object} options.details - Detalhes adicionais da operação
 * @param {Object} options.req - Objeto de requisição Express (opcional)
 * @returns {Promise<Object>} - O registro de auditoria criado
 */
const logActivity = async (options) => {
  try {
    const { user, action, entity, entityId, details = {}, req } = options;

    if (!user || !user._id) {
      console.error('Usuário não fornecido para registro de auditoria');
      return null;
    }

    const auditData = {
      user: user._id,
      action,
      entity,
      details
    };

    if (entityId) {
      auditData.entityId = entityId;
    }

    // Capturar informações do request se disponível
    if (req) {
      auditData.ipAddress = req.ip || 
                           req.headers['x-forwarded-for'] || 
                           req.connection.remoteAddress;
      auditData.userAgent = req.headers['user-agent'];
    }

    const auditLog = new AuditLog(auditData);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
    // Não lançamos o erro para não interromper o fluxo principal
    return null;
  }
};

/**
 * Registra uma operação CRUD
 */
const audit = {
  /**
   * Registra uma operação de criação
   */
  create: async (user, entity, entityId, details = {}, req = null) => {
    return await logActivity({
      user,
      action: 'CREATE',
      entity,
      entityId,
      details,
      req
    });
  },

  /**
   * Registra uma operação de leitura
   */
  read: async (user, entity, entityId, details = {}, req = null) => {
    return await logActivity({
      user,
      action: 'READ',
      entity,
      entityId,
      details,
      req
    });
  },

  /**
   * Registra uma operação de atualização
   */
  update: async (user, entity, entityId, details = {}, req = null) => {
    return await logActivity({
      user,
      action: 'UPDATE',
      entity,
      entityId,
      details,
      req
    });
  },

  /**
   * Registra uma operação de exclusão
   */
  delete: async (user, entity, entityId, details = {}, req = null) => {
    return await logActivity({
      user,
      action: 'DELETE',
      entity,
      entityId,
      details,
      req
    });
  },

  /**
   * Registra um login
   */
  login: async (user, details = {}, req = null) => {
    return await logActivity({
      user,
      action: 'LOGIN',
      entity: 'AdminUser',
      entityId: user._id,
      details,
      req
    });
  },

  /**
   * Registra um logout
   */
  logout: async (user, details = {}, req = null) => {
    return await logActivity({
      user,
      action: 'LOGOUT',
      entity: 'AdminUser',
      entityId: user._id,
      details,
      req
    });
  },

  /**
   * Registra uma ação personalizada
   */
  custom: async (user, entity, action, entityId = null, details = {}, req = null) => {
    return await logActivity({
      user,
      action: action || 'OTHER',
      entity,
      entityId,
      details,
      req
    });
  }
};

module.exports = audit;