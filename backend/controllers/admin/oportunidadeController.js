const Oportunidade = require('../../models/Oportunidade');
const { createAuditLog } = require('../../utils/admin/audit');

// Listar todas as oportunidades
exports.getAllOportunidades = async (req, res) => {
  try {
    const oportunidades = await Oportunidade.find()
      .populate('cliente', 'nome')
      .populate('medicos', 'nome especialidade');
    res.json(oportunidades);
  } catch (error) {
    console.error('Erro ao buscar oportunidades:', error);
    res.status(500).json({ message: 'Erro ao buscar oportunidades' });
  }
};

// Obter oportunidade por ID
exports.getOportunidadeById = async (req, res) => {
  try {
    const oportunidade = await Oportunidade.findById(req.params.id)
      .populate('cliente', 'nome')
      .populate('medicos', 'nome especialidade');
    
    if (!oportunidade) {
      return res.status(404).json({ message: 'Oportunidade não encontrada' });
    }
    
    res.json(oportunidade);
  } catch (error) {
    console.error('Erro ao buscar oportunidade:', error);
    res.status(500).json({ message: 'Erro ao buscar oportunidade' });
  }
};

// Criar nova oportunidade
exports.createOportunidade = async (req, res) => {
  try {
    const novaOportunidade = new Oportunidade(req.body);
    const oportunidadeSalva = await novaOportunidade.save();
    
    // Registrar ação no log de auditoria
    await createAuditLog({
      userId: req.adminUser.id,
      action: 'create',
      resource: 'oportunidade',
      resourceId: oportunidadeSalva._id,
      details: `Oportunidade ${oportunidadeSalva.titulo} criada`
    });
    
    res.status(201).json(oportunidadeSalva);
  } catch (error) {
    console.error('Erro ao criar oportunidade:', error);
    res.status(500).json({ message: 'Erro ao criar oportunidade' });
  }
};

// Atualizar oportunidade
exports.updateOportunidade = async (req, res) => {
  try {
    const oportunidadeAtualizada = await Oportunidade.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!oportunidadeAtualizada) {
      return res.status(404).json({ message: 'Oportunidade não encontrada' });
    }
    
    // Registrar ação no log de auditoria
    await createAuditLog({
      userId: req.adminUser.id,
      action: 'update',
      resource: 'oportunidade',
      resourceId: oportunidadeAtualizada._id,
      details: `Oportunidade ${oportunidadeAtualizada.titulo} atualizada`
    });
    
    res.json(oportunidadeAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar oportunidade:', error);
    res.status(500).json({ message: 'Erro ao atualizar oportunidade' });
  }
};

// Excluir oportunidade
exports.deleteOportunidade = async (req, res) => {
  try {
    const oportunidade = await Oportunidade.findById(req.params.id);
    
    if (!oportunidade) {
      return res.status(404).json({ message: 'Oportunidade não encontrada' });
    }
    
    await Oportunidade.findByIdAndDelete(req.params.id);
    
    // Registrar ação no log de auditoria
    await createAuditLog({
      userId: req.adminUser.id,
      action: 'delete',
      resource: 'oportunidade',
      resourceId: req.params.id,
      details: `Oportunidade ${oportunidade.titulo} excluída`
    });
    
    res.json({ message: 'Oportunidade excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir oportunidade:', error);
    res.status(500).json({ message: 'Erro ao excluir oportunidade' });
  }
};

// Obter estatísticas de oportunidades
exports.getOportunidadeStats = async (req, res) => {
  try {
    const totalOportunidades = await Oportunidade.countDocuments();
    const oportunidadesPorStatus = await Oportunidade.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const valorTotalOportunidades = await Oportunidade.aggregate([
      { $group: { _id: null, total: { $sum: "$valor" } } }
    ]);
    
    res.json({
      total: totalOportunidades,
      porStatus: oportunidadesPorStatus,
      valorTotal: valorTotalOportunidades.length > 0 ? valorTotalOportunidades[0].total : 0
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de oportunidades:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas de oportunidades' });
  }
};