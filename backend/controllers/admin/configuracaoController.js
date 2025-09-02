const Configuracao = require('../../models/Configuracao');
const { logActivity } = require('../../utils/admin/audit');

// Obter todas as configurações
exports.getAllConfiguracoes = async (req, res) => {
  try {
    const filtro = {};
    
    // Filtros opcionais
    if (req.query.categoria) filtro.categoria = req.query.categoria;
    if (req.query.publico !== undefined) filtro.publico = req.query.publico === 'true';
    
    const configuracoes = await Configuracao.find(filtro)
      .sort({ categoria: 1, chave: 1 });
    
    await logActivity({
      user: req.adminUser,
      action: 'READ',
      entity: 'Configuracao',
      details: 'Listou todas as configurações',
      req
    });
    
    res.status(200).json({
      success: true,
      count: configuracoes.length,
      data: configuracoes
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar configurações'
    });
  }
};

// Obter configuração por ID
exports.getConfiguracaoById = async (req, res) => {
  try {
    const configuracao = await Configuracao.findById(req.params.id);
    
    if (!configuracao) {
      return res.status(404).json({
        success: false,
        error: 'Configuração não encontrada'
      });
    }
    
    await logActivity({
      user: req.adminUser,
      action: 'READ',
      entity: 'Configuracao',
      entityId: configuracao._id,
      details: 'Visualizou detalhes da configuração',
      req
    });
    
    res.status(200).json({
      success: true,
      data: configuracao
    });
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar configuração'
    });
  }
};

// Obter configuração por chave
exports.getConfiguracaoByChave = async (req, res) => {
  try {
    const { chave } = req.params;
    
    const configuracao = await Configuracao.findOne({ chave });
    
    if (!configuracao) {
      return res.status(404).json({
        success: false,
        error: 'Configuração não encontrada'
      });
    }
    
    await createAuditLog(req, 'READ', 'Configuracao', configuracao._id, `Visualizou configuração pela chave: ${chave}`);
    
    res.status(200).json({
      success: true,
      data: configuracao
    });
  } catch (error) {
    console.error('Erro ao buscar configuração por chave:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar configuração por chave'
    });
  }
};

// Criar nova configuração
exports.createConfiguracao = async (req, res) => {
  try {
    const { chave, valor, tipo, descricao, categoria, publico } = req.body;
    
    // Validações básicas
    if (!chave || valor === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Chave e valor são obrigatórios'
      });
    }
    
    // Verifica se já existe uma configuração com a mesma chave
    const existente = await Configuracao.findOne({ chave });
    if (existente) {
      return res.status(400).json({
        success: false,
        error: 'Já existe uma configuração com esta chave'
      });
    }
    
    const configuracao = await Configuracao.create({
      chave,
      valor,
      tipo: tipo || 'string',
      descricao,
      categoria: categoria || 'geral',
      publico: publico !== undefined ? publico : false
    });
    
    await createAuditLog(req, 'CREATE', 'Configuracao', configuracao._id, 'Criou nova configuração');
    
    res.status(201).json({
      success: true,
      data: configuracao
    });
  } catch (error) {
    console.error('Erro ao criar configuração:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar configuração'
    });
  }
};

// Atualizar configuração
exports.updateConfiguracao = async (req, res) => {
  try {
    const { valor, tipo, descricao, categoria, publico } = req.body;
    
    let configuracao = await Configuracao.findById(req.params.id);
    
    if (!configuracao) {
      return res.status(404).json({
        success: false,
        error: 'Configuração não encontrada'
      });
    }
    
    // Atualiza os campos
    if (valor !== undefined) configuracao.valor = valor;
    if (tipo !== undefined) configuracao.tipo = tipo;
    if (descricao !== undefined) configuracao.descricao = descricao;
    if (categoria !== undefined) configuracao.categoria = categoria;
    if (publico !== undefined) configuracao.publico = publico;
    
    // Salva as alterações
    configuracao = await configuracao.save();
    
    await createAuditLog(req, 'UPDATE', 'Configuracao', configuracao._id, 'Atualizou configuração');
    
    res.status(200).json({
      success: true,
      data: configuracao
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar configuração'
    });
  }
};

// Excluir configuração
exports.deleteConfiguracao = async (req, res) => {
  try {
    const configuracao = await Configuracao.findById(req.params.id);
    
    if (!configuracao) {
      return res.status(404).json({
        success: false,
        error: 'Configuração não encontrada'
      });
    }
    
    await configuracao.remove();
    
    await createAuditLog(req, 'DELETE', 'Configuracao', req.params.id, 'Excluiu configuração');
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Erro ao excluir configuração:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao excluir configuração'
    });
  }
};

// Obter configurações públicas
exports.getPublicConfiguracoes = async (req, res) => {
  try {
    const configuracoes = await Configuracao.find({ publico: true })
      .select('chave valor tipo categoria');
    
    // Formata as configurações como um objeto chave-valor
    const configObj = {};
    configuracoes.forEach(config => {
      configObj[config.chave] = config.valor;
    });
    
    res.status(200).json({
      success: true,
      data: configObj
    });
  } catch (error) {
    console.error('Erro ao buscar configurações públicas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar configurações públicas'
    });
  }
};