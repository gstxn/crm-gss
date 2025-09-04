const mongoose = require('mongoose');

const kanbanCardSchema = new mongoose.Schema(
  {
    list: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KanbanList',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Título do cartão é obrigatório'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    position: {
      type: Number,
      required: true,
    },
    dueDate: Date,
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    archived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: 'crm_kanban_cards' }
);

module.exports = mongoose.model('KanbanCard', kanbanCardSchema);