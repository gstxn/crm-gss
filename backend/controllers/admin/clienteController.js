const Cliente = require('../../models/Cliente');
const { createAuditLog } = require('../../utils/admin/audit');

// Listar todos os clientes
exports.getAllClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.json(clientes);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ message: 'Erro ao buscar clientes' });
  }
};

// Obter cliente por ID
exports.getClienteById = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ message: 'Erro ao buscar cliente' });
  }
};

// Criar novo cliente
exports.createCliente = async (req, res) => {
  try {
    const novoCliente = new Cliente(req.body);
    const clienteSalvo = await novoCliente.save();
    
    // Registrar ação no log de auditoria
    await createAuditLog({
      userId: req.adminUser.id,
      action: 'create',
      resource: 'cliente',
      resourceId: clienteSalvo._id,
      details: `Cliente ${clienteSalvo.nome} criado`
    });
    
    res.status(201).json(clienteSalvo);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ message: 'Erro ao criar cliente' });
  }
};

// Atualizar cliente
exports.updateCliente = async (req, res) => {
  try {
    const clienteAtualizado = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!clienteAtualizado) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    // Registrar ação no log de auditoria
    await createAuditLog({
      userId: req.adminUser.id,
      action: 'update',
      resource: 'cliente',
      resourceId: clienteAtualizado._id,
      details: `Cliente ${clienteAtualizado.nome} atualizado`
    });
    
    res.json(clienteAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ message: 'Erro ao atualizar cliente' });
  }
};

// Excluir cliente
exports.deleteCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    await Cliente.findByIdAndDelete(req.params.id);
    
    // Registrar ação no log de auditoria
    await createAuditLog({
      userId: req.adminUser.id,
      action: 'delete',
      resource: 'cliente',
      resourceId: req.params.id,
      details: `Cliente ${cliente.nome} excluído`
    });
    
    res.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    res.status(500).json({ message: 'Erro ao excluir cliente' });
  }
};

// Obter estatísticas de clientes
exports.getClienteStats = async (req, res) => {
  try {
    const totalClientes = await Cliente.countDocuments();
    const clientesPorSegmento = await Cliente.aggregate([
      { $group: { _id: "$segmento", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      total: totalClientes,
      porSegmento: clientesPorSegmento
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de clientes:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas de clientes' });
  }
};