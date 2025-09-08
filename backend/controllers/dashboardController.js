const Oportunidade = require('../models/Oportunidade');
const Medico = require('../models/Medico');
const Cliente = require('../models/Cliente');
const User = require('../models/User');
const Task = require('../models/Task');
const AuditLog = require('../models/admin/AuditLog');

// @desc    Obter estatísticas para o dashboard
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    // Obter contagens
    const oportunidadesCount = await Oportunidade.countDocuments();
    const medicosCount = await Medico.countDocuments();
    const clientesCount = await Cliente.countDocuments();
    
    // Obter oportunidades por status
    const oportunidadesPorStatus = await Oportunidade.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Obter médicos por especialidade
    const medicosPorEspecialidade = await Medico.aggregate([
      { $group: { _id: '$especialidade', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      stats: {
        oportunidades: oportunidadesCount,
        medicos: medicosCount,
        clientes: clientesCount
      },
      oportunidadesPorStatus,
      medicosPorEspecialidade
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obter atividades recentes
// @route   GET /api/dashboard/activities
// @access  Private
const getRecentActivities = async (req, res) => {
  try {
    const activities = [];

    // 1. Obter logs de auditoria recentes (todas as ações do sistema)
    const auditLogs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('user', 'nome email')
      .select('action entity entityId details timestamp user');

    auditLogs.forEach(log => {
      let title = '';
      let subtitle = '';
      
      switch(log.action) {
        case 'CREATE':
          title = `${log.entity} criado`;
          subtitle = `Por: ${log.user ? log.user.nome : 'Sistema'}`;
          break;
        case 'UPDATE':
          title = `${log.entity} atualizado`;
          subtitle = `Por: ${log.user ? log.user.nome : 'Sistema'}`;
          break;
        case 'DELETE':
          title = `${log.entity} removido`;
          subtitle = `Por: ${log.user ? log.user.nome : 'Sistema'}`;
          break;
        case 'LOGIN':
          title = 'Login realizado';
          subtitle = `Usuário: ${log.user ? log.user.nome : 'N/A'}`;
          break;
        default:
          title = `${log.action} - ${log.entity}`;
          subtitle = `Por: ${log.user ? log.user.nome : 'Sistema'}`;
      }

      activities.push({
        id: log._id,
        type: 'audit',
        title,
        subtitle,
        time: log.timestamp,
        action: log.action,
        entity: log.entity
      });
    });

    // 2. Obter tarefas recentes
    const recentTasks = await Task.find()
      .sort({ criadoEm: -1 })
      .limit(5)
      .populate('criadoPor', 'nome')
      .select('titulo status criadoEm criadoPor');

    recentTasks.forEach(task => {
      activities.push({
        id: task._id,
        type: 'task',
        title: `Tarefa: ${task.titulo}`,
        subtitle: `Status: ${task.status === 'pending' ? 'Pendente' : 'Concluída'} - Por: ${task.criadoPor ? task.criadoPor.nome : 'N/A'}`,
        time: task.criadoEm
      });
    });

    // 3. Obter oportunidades recentes
    const recentOportunidades = await Oportunidade.find()
      .sort({ criadoEm: -1 })
      .limit(5)
      .select('titulo status cliente criadoEm atualizadoEm')
      .populate('cliente', 'nome');

    recentOportunidades.forEach(o => {
      activities.push({
        id: o._id,
        type: 'oportunidade',
        title: `Oportunidade: ${o.titulo}`,
        subtitle: `Cliente: ${o.cliente ? o.cliente.nome : 'N/A'} - Status: ${o.status}`,
        time: o.atualizadoEm || o.criadoEm
      });
    });

    // 4. Obter médicos recentes
    const recentMedicos = await Medico.find()
      .sort({ criadoEm: -1 })
      .limit(5)
      .select('nome especialidade criadoEm atualizadoEm');

    recentMedicos.forEach(m => {
      activities.push({
        id: m._id,
        type: 'medico',
        title: `Médico: ${m.nome}`,
        subtitle: `Especialidade: ${m.especialidade}`,
        time: m.atualizadoEm || m.criadoEm
      });
    });

    // 5. Obter clientes recentes
    const recentClientes = await Cliente.find()
      .sort({ criadoEm: -1 })
      .limit(5)
      .select('nome tipo criadoEm atualizadoEm');

    recentClientes.forEach(c => {
      activities.push({
        id: c._id,
        type: 'cliente',
        title: `Cliente: ${c.nome}`,
        subtitle: `Tipo: ${c.tipo}`,
        time: c.atualizadoEm || c.criadoEm
      });
    });

    // Ordenar todas as atividades por data (mais recentes primeiro) e limitar a 15
    const sortedActivities = activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 15);

    res.json(sortedActivities);
  } catch (error) {
    console.error('Erro ao buscar atividades recentes:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obter tarefas pendentes
// @route   GET /api/dashboard/tasks
// @access  Private
const getPendingTasks = async (req, res) => {
  try {
    // Obter oportunidades que precisam de atenção
    const pendingOportunidades = await Oportunidade.find({
      status: { $in: ['nova', 'em_andamento'] }
    })
      .sort({ criadoEm: 1 })
      .limit(5)
      .select('titulo status cliente dataLimite')
      .populate('cliente', 'nome');

    // Obter tarefas pendentes do novo módulo de tarefas
    const pendingTasks = await Task.find({ status: 'pending' })
      .sort({ dueDate: 1, criadoEm: 1 })
      .limit(5)
      .select('titulo dueDate');

    const tasks = [
      ...pendingOportunidades.map(o => ({
        id: o._id,
        title: `Acompanhar oportunidade: ${o.titulo}`,
        priority: o.status === 'nova' ? 'high' : 'medium',
        dueDate: o.dataLimite ? new Date(o.dataLimite).toISOString().split('T')[0] : 'N/A',
        type: 'oportunidade',
        relatedId: o._id
      })),
      ...pendingTasks.map(t => ({
        id: t._id,
        title: t.titulo,
        priority: 'low',
        dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : 'N/A',
        type: 'task',
        relatedId: t._id
      }))
    ];

    // Ordenar por data de vencimento mais próxima ou criação
    tasks.sort((a, b) => {
      const dateA = a.dueDate !== 'N/A' ? new Date(a.dueDate) : new Date();
      const dateB = b.dueDate !== 'N/A' ? new Date(b.dueDate) : new Date();
      return dateA - dateB;
    });

    res.json(tasks.slice(0, 5));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obter tarefas concluídas
// @route   GET /api/dashboard/tasks/completed
// @access  Private
const getCompletedTasks = async (req, res) => {
  try {
    // Oportunidades marcadas como concluídas
    const completedOportunidades = await Oportunidade.find({
      status: { $in: ['Preenchida', 'Concluída', 'concluida', 'concluída'] }
    })
      .sort({ atualizadoEm: -1 })
      .limit(20)
      .select('titulo atualizadoEm');

    // Tarefas marcadas como concluídas
    const completedTasks = await Task.find({ status: 'completed' })
      .sort({ atualizadoEm: -1, criadoEm: -1 })
      .limit(20)
      .select('titulo atualizadoEm');

    const tasks = [
      ...completedOportunidades.map(o => ({
        id: o._id,
        title: `Oportunidade concluída: ${o.titulo}`,
        finishedDate: o.atualizadoEm ? new Date(o.atualizadoEm).toISOString().split('T')[0] : 'N/A',
        type: 'oportunidade',
        relatedId: o._id
      })),
      ...completedTasks.map(t => ({
        id: t._id,
        title: t.titulo,
        finishedDate: t.atualizadoEm ? new Date(t.atualizadoEm).toISOString().split('T')[0] : 'N/A',
        type: 'task',
        relatedId: t._id
      }))
    ].sort((a, b) => new Date(b.finishedDate) - new Date(a.finishedDate));

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivities,
  getPendingTasks,
  getCompletedTasks
};