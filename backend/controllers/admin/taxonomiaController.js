const Taxonomia = require('../../models/Taxonomia');
const { logActivity } = require('../../utils/admin/audit');

// Obter todas as taxonomias
exports.getAllTaxonomias = async (req, res) => {
  try {
    const filtro = {};
    
    // Filtros opcionais
    if (req.query.tipo) filtro.tipo = req.query.tipo;
    if (req.query.ativo !== undefined) filtro.ativo = req.query.ativo === 'true';
    if (req.query.parent) filtro.parent = req.query.parent;
    
    const taxonomias = await Taxonomia.find(filtro)
      .sort({ tipo: 1, ordem: 1, nome: 1 })
      .populate('parent', 'nome tipo');
    
    await logActivity({
      user: req.adminUser,
      action: 'READ',
      entity: 'Taxonomia',
      details: 'Listou todas as taxonomias',
      req
    });
    
    res.status(200).json({
      success: true,
      count: taxonomias.length,
      data: taxonomias
    });
  } catch (error) {
    console.error('Erro ao buscar taxonomias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar taxonomias'
    });
  }
};

// Obter taxonomia por ID
exports.getTaxonomiaById = async (req, res) => {
  try {
    const taxonomia = await Taxonomia.findById(req.params.id)
      .populate('parent', 'nome tipo');
    
    if (!taxonomia) {
      return res.status(404).json({
        success: false,
        error: 'Taxonomia não encontrada'
      });
    }
    
    await logActivity({
      user: req.adminUser,
      action: 'READ',
      entity: 'Taxonomia',
      entityId: taxonomia._id,
      details: 'Visualizou detalhes da taxonomia',
      req
    });
    
    res.status(200).json({
      success: true,
      data: taxonomia
    });
  } catch (error) {
    console.error('Erro ao buscar taxonomia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar taxonomia'
    });
  }
};

// Criar nova taxonomia
exports.createTaxonomia = async (req, res) => {
  try {
    const { tipo, nome, descricao, ativo, ordem, parent } = req.body;
    
    // Validações básicas
    if (!tipo || !nome) {
      return res.status(400).json({
        success: false,
        error: 'Tipo e nome são obrigatórios'
      });
    }
    
    const taxonomia = await Taxonomia.create({
      tipo,
      nome,
      descricao,
      ativo: ativo !== undefined ? ativo : true,
      ordem: ordem || 0,
      parent
    });
    
    await createAuditLog(req, 'CREATE', 'Taxonomia', taxonomia._id, 'Criou nova taxonomia');
    
    res.status(201).json({
      success: true,
      data: taxonomia
    });
  } catch (error) {
    console.error('Erro ao criar taxonomia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar taxonomia'
    });
  }
};

// Atualizar taxonomia
exports.updateTaxonomia = async (req, res) => {
  try {
    const { tipo, nome, descricao, ativo, ordem, parent } = req.body;
    
    let taxonomia = await Taxonomia.findById(req.params.id);
    
    if (!taxonomia) {
      return res.status(404).json({
        success: false,
        error: 'Taxonomia não encontrada'
      });
    }
    
    // Atualiza os campos
    if (tipo !== undefined) taxonomia.tipo = tipo;
    if (nome !== undefined) taxonomia.nome = nome;
    if (descricao !== undefined) taxonomia.descricao = descricao;
    if (ativo !== undefined) taxonomia.ativo = ativo;
    if (ordem !== undefined) taxonomia.ordem = ordem;
    if (parent !== undefined) taxonomia.parent = parent;
    
    // Salva as alterações
    taxonomia = await taxonomia.save();
    
    await createAuditLog(req, 'UPDATE', 'Taxonomia', taxonomia._id, 'Atualizou taxonomia');
    
    res.status(200).json({
      success: true,
      data: taxonomia
    });
  } catch (error) {
    console.error('Erro ao atualizar taxonomia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar taxonomia'
    });
  }
};

// Excluir taxonomia
exports.deleteTaxonomia = async (req, res) => {
  try {
    const taxonomia = await Taxonomia.findById(req.params.id);
    
    if (!taxonomia) {
      return res.status(404).json({
        success: false,
        error: 'Taxonomia não encontrada'
      });
    }
    
    // Verifica se existem taxonomias filhas
    const temFilhos = await Taxonomia.exists({ parent: taxonomia._id });
    if (temFilhos) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir uma taxonomia que possui filhos'
      });
    }
    
    await taxonomia.remove();
    
    await createAuditLog(req, 'DELETE', 'Taxonomia', req.params.id, 'Excluiu taxonomia');
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Erro ao excluir taxonomia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao excluir taxonomia'
    });
  }
};

// Obter taxonomias por tipo
exports.getTaxonomiasByTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    
    const taxonomias = await Taxonomia.find({ tipo, ativo: true })
      .sort({ ordem: 1, nome: 1 })
      .populate('parent', 'nome');
    
    await createAuditLog(req, 'READ', 'Taxonomia', null, `Listou taxonomias do tipo ${tipo}`);
    
    res.status(200).json({
      success: true,
      count: taxonomias.length,
      data: taxonomias
    });
  } catch (error) {
    console.error('Erro ao buscar taxonomias por tipo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar taxonomias por tipo'
    });
  }
};