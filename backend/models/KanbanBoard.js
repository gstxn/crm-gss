const mongoose = require('mongoose');

const kanbanBoardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Título do quadro é obrigatório'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
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
  { timestamps: true, collection: 'crm_kanban_boards' }
);

module.exports = mongoose.model('KanbanBoard', kanbanBoardSchema);