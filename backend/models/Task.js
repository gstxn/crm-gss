const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true
  },
  descricao: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  dueDate: Date,
  criadoEm: {
    type: Date,
    default: Date.now
  },
  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  atualizadoEm: Date,
  atualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;