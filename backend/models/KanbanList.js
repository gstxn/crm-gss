const mongoose = require('mongoose');

const kanbanListSchema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KanbanBoard',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Título da lista é obrigatório'],
      trim: true,
    },
    position: {
      type: Number,
      required: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: 'crm_kanban_lists' }
);

module.exports = mongoose.model('KanbanList', kanbanListSchema);