const mongoose = require('mongoose');

const orgSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
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
orgSettingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para melhorar a performance de consultas
orgSettingSchema.index({ key: 1 });
orgSettingSchema.index({ category: 1 });
orgSettingSchema.index({ isPublic: 1 });

const OrgSetting = mongoose.model('OrgSetting', orgSettingSchema);

module.exports = OrgSetting;