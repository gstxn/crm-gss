const Task = require('../models/Task');
const asyncHandler = require('express-async-handler');

// @desc    Criar nova tarefa
// @route   POST /api/tasks
// @access  Privado
exports.createTask = asyncHandler(async (req, res) => {
  const { titulo, descricao, dueDate } = req.body;

  if (!titulo) {
    return res.status(400).json({ message: 'Título é obrigatório' });
  }

  const task = await Task.create({
    titulo,
    descricao: descricao || '',
    dueDate: dueDate || null,
    criadoPor: req.user ? req.user._id : null
  });

  res.status(201).json(task);
});

// @desc    Listar tarefas pendentes
// @route   GET /api/tasks/pending
// @access  Privado
exports.getPendingTasks = asyncHandler(async (_req, res) => {
  const tasks = await Task.find({ status: 'pending' }).sort({ dueDate: 1, criadoEm: -1 });
  res.json(tasks);
});

// @desc    Atualizar tarefa (titulo, descricao, status, dueDate)
// @route   PUT /api/tasks/:id
// @access  Privado
exports.updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const task = await Task.findById(id);
  if (!task) {
    return res.status(404).json({ message: 'Tarefa não encontrada' });
  }

  Object.assign(task, updates, {
    atualizadoEm: Date.now(),
    atualizadoPor: req.user ? req.user._id : null
  });

  await task.save();
  res.json(task);
});