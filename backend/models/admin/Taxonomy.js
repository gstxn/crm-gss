const mongoose = require('mongoose');

const taxonomySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Taxonomy',
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Object,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Atualizar o campo updatedAt antes de salvar
taxonomySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para melhorar a performance de consultas
taxonomySchema.index({ slug: 1 });
taxonomySchema.index({ type: 1 });
taxonomySchema.index({ parent: 1 });
taxonomySchema.index({ isActive: 1 });

const Taxonomy = mongoose.model('Taxonomy', taxonomySchema);

module.exports = Taxonomy;