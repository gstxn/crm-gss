const mongoose = require('mongoose');

const kanbanCommentSchema = new mongoose.Schema(
  {
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KanbanCard',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comentário não pode ser vazio'],
      trim: true,
    },
  },
  { timestamps: true, collection: 'crm_kanban_comments' }
);

module.exports = mongoose.model('KanbanComment', kanbanCommentSchema);