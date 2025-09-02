const Medico = require('../../models/Medico');
const { createAuditLog } = require('../../utils/admin/audit');

// Listar todos os médicos
exports.getAllMedicos = async (req, res) => {
  try {
    const medicos = await Medico.find().populate('user', 'nome email');
    res.json(medicos);
  } catch (error) {
    console.error('Erro ao buscar médicos:', error);
    res.status(500).json({ message: 'Erro ao buscar médicos' });
  }
};

// Obter médico por ID
exports.getMedicoById = async (req, res) => {
  try {
    const medico = await Medico.findById(req.params.id).populate('user', 'nome email');
    if (!medico) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }
    res.json(medico);
  } catch (error) {
    console.error('Erro ao buscar médico:', error);
    res.status(500).json({ message: 'Erro ao buscar médico' });
  }
};

// Criar novo médico
exports.createMedico = async (req, res) => {
  try {
    const novoMedico = new Medico(req.body);
    const medicoSalvo = await novoMedico.save();
    
    // Registrar ação no log de auditoria
    await createAuditLog({
      userId: req.adminUser.id,
      action: 'create',
      resource: 'medico',
      resourceId: medicoSalvo._id,
      details: `Médico ${medicoSalvo.nome} criado`
    });
    
    res.status(201).json(medicoSalvo);
  } catch (error) {
    console.error('Erro ao criar médico:', error);
    res.status(500).json({ message: 'Erro ao criar médico' });
  }
};

// Atualizar médico
exports.updateMedico = async (req, res) => {
  try {
    const medicoAtualizado = await Medico.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!medicoAtualizado) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }
    
    // Registrar ação no log de auditoria
    await createAuditLog({
      userId: req.adminUser.id,
      action: 'update',
      resource: 'medico',
      resourceId: medicoAtualizado._id,
      details: `Médico ${medicoAtualizado.nome} atualizado`
    });
    
    res.json(medicoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar médico:', error);
    res.status(500).json({ message: 'Erro ao atualizar médico' });
  }
};

// Excluir médico
exports.deleteMedico = async (req, res) => {
  try {
    const medico = await Medico.findById(req.params.id);
    
    if (!medico) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }
    
    await Medico.findByIdAndDelete(req.params.id);
    
    // Registrar ação no log de auditoria
    await createAuditLog({
      userId: req.adminUser.id,
      action: 'delete',
      resource: 'medico',
      resourceId: req.params.id,
      details: `Médico ${medico.nome} excluído`
    });
    
    res.json({ message: 'Médico excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir médico:', error);
    res.status(500).json({ message: 'Erro ao excluir médico' });
  }
};

// Obter estatísticas de médicos
exports.getMedicoStats = async (req, res) => {
  try {
    const totalMedicos = await Medico.countDocuments();
    const medicosPorEspecialidade = await Medico.aggregate([
      { $group: { _id: "$especialidade", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      total: totalMedicos,
      porEspecialidade: medicosPorEspecialidade
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de médicos:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas de médicos' });
  }
};