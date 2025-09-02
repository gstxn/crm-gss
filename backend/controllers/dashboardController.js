const Oportunidade = require('../models/Oportunidade');
const Medico = require('../models/Medico');
const Cliente = require('../models/Cliente');
const User = require('../models/User');
const Task = require('../models/Task');

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
    // Obter oportunidades recentes
    const recentOportunidades = await Oportunidade.find()
      .sort({ criadoEm: -1 })
      .limit(3)
      .select('titulo status cliente criadoEm')
      .populate('cliente', 'nome');

    // Obter médicos recentes
    const recentMedicos = await Medico.find()
      .sort({ criadoEm: -1 })
      .limit(3)
      .select('nome especialidade criadoEm');

    // Obter clientes recentes
    const recentClientes = await Cliente.find()
      .sort({ criadoEm: -1 })
      .limit(3)
      .select('nome tipo criadoEm');

    // Combinar e ordenar por data
    const activities = [
      ...recentOportunidades.map(o => ({
        id: o._id,
        type: 'oportunidade',
        title: o.titulo,
        subtitle: `Cliente: ${o.cliente ? o.cliente.nome : 'N/A'}`,
        time: o.criadoEm
      })),
      ...recentMedicos.map(m => ({
        id: m._id,
        type: 'medico',
        title: m.nome,
        subtitle: `Especialidade: ${m.especialidade}`,
        time: m.criadoEm
      })),
      ...recentClientes.map(c => ({
        id: c._id,
        type: 'cliente',
        title: c.nome,
        subtitle: `Tipo: ${c.tipo}`,
        time: c.criadoEm
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

    res.json(activities);
  } catch (error) {
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