const Oportunidade = require('../../models/Oportunidade');
const Medico = require('../../models/Medico');
const Cliente = require('../../models/Cliente');
const { createAuditLog } = require('../../utils/admin/audit');

// Gerar relatório de oportunidades por status
exports.getOportunidadesPorStatus = async (req, res) => {
  try {
    const resultado = await Oportunidade.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, valor: { $sum: "$valor" } } },
      { $sort: { count: -1 } }
    ]);
    
    // Registrar ação no log de auditoria
    await createAuditLog({
      userId: req.adminUser.id,
      action: 'view',
      resource: 'relatorio',
      details: 'Relatório de oportunidades por status gerado'
    });
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao gerar relatório de oportunidades por status:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório' });
  }
};

// Gerar relatório de médicos por especialidade
exports.getMedicosPorEspecialidade = async (req, res) => {
  try {
    const resultado = await Medico.aggregate([
      { $group: { _id: "$especialidade", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Registrar ação no log de auditoria
    await createAuditLog({
      userId: req.adminUser.id,
      action: 'view',
      resource: 'relatorio',
      details: 'Relatório de médicos por especialidade gerado'
    });
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao gerar relatório de médicos por especialidade:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório' });
  }
};

// Gerar relatório de clientes por segmento
exports.getClientesPorSegmento = async (req, res) => {
  try {
    const resultado = await Cliente.aggregate([
      { $group: { _id: "$segmento", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Registrar ação no log de auditoria
    await createAuditLog({
      userId: req.adminUser.id,
      action: 'view',
      resource: 'relatorio',
      details: 'Relatório de clientes por segmento gerado'
    });
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao gerar relatório de clientes por segmento:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório' });
  }
};

// Gerar relatório de faturamento por período
exports.getFaturamentoPorPeriodo = async (req, res) => {
  try {
    const { periodo } = req.query;
    let matchStage = {};
    
    // Definir filtro de data com base no período solicitado
    const hoje = new Date();
    let dataInicio = new Date();
    
    switch (periodo) {
      case 'mensal':
        dataInicio.setMonth(hoje.getMonth() - 1);
        break;
      case 'trimestral':
        dataInicio.setMonth(hoje.getMonth() - 3);
        break;
      case 'semestral':
        dataInicio.setMonth(hoje.getMonth() - 6);
        break;
      case 'anual':
        dataInicio.setFullYear(hoje.getFullYear() - 1);
        break;
      default:
        dataInicio.setMonth(hoje.getMonth() - 1); // Padrão: mensal
    }
    
    matchStage = { 
      createdAt: { $gte: dataInicio, $lte: hoje },
      status: 'Concluído' // Considerar apenas oportunidades concluídas
    };
    
    const resultado = await Oportunidade.aggregate([
      { $match: matchStage },
      { $group: {
          _id: {
            ano: { $year: "$createdAt" },
            mes: { $month: "$createdAt" }
          },
          total: { $sum: "$valor" },
          quantidade: { $sum: 1 }
        }
      },
      { $sort: { "_id.ano": 1, "_id.mes": 1 } }
    ]);
    
    // Registrar ação no log de auditoria
    await createAuditLog({
      userId: req.adminUser.id,
      action: 'view',
      resource: 'relatorio',
      details: `Relatório de faturamento por período (${periodo}) gerado`
    });
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao gerar relatório de faturamento por período:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório' });
  }
};

// Gerar relatório de conversão de oportunidades
exports.getConversaoOportunidades = async (req, res) => {
  try {
    const totalOportunidades = await Oportunidade.countDocuments();
    const oportunidadesConcluidas = await Oportunidade.countDocuments({ status: 'Concluído' });
    const taxaConversao = totalOportunidades > 0 ? (oportunidadesConcluidas / totalOportunidades) * 100 : 0;
    
    const resultado = {
      total: totalOportunidades,
      concluidas: oportunidadesConcluidas,
      taxaConversao: taxaConversao.toFixed(2) + '%'
    };
    
    // Registrar ação no log de auditoria
    await createAuditLog({
      userId: req.adminUser.id,
      action: 'view',
      resource: 'relatorio',
      details: 'Relatório de conversão de oportunidades gerado'
    });
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao gerar relatório de conversão de oportunidades:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório' });
  }
};