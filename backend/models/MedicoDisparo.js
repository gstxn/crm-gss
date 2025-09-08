const mongoose = require('mongoose');

const medicoDisparoSchema = new mongoose.Schema({
  nome: {
    type: String,
    trim: true
  },
  telefone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Validar 10-13 dígitos após normalização
        const normalized = v.replace(/\D/g, '');
        return normalized.length >= 10 && normalized.length <= 13;
      },
      message: 'Telefone deve ter entre 10 e 13 dígitos'
    }
  },
  especialidades: [{
    type: String,
    trim: true
  }],
  canal: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Email é opcional
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Email deve ter formato válido'
    }
  },
  codigo_origem: {
    type: String,
    trim: true
  },
  origem_registro: {
    type: String,
    enum: ['xlsx_upload', 'google_sheets_sync', 'manual'],
    default: 'xlsx_upload'
  },
  // Campos operacionais para campanha
  permitido_envio: {
    type: Boolean,
    default: true
  },
  status_contato: {
    type: String,
    enum: ['novo', 'fila', 'enviado', 'falha', 'opt_out'],
    default: 'novo'
  },
  ultima_interacao_em: {
    type: Date
  },
  total_envios: {
    type: Number,
    default: 0
  },
  observacoes: {
    type: String
  },
  // Campos de auditoria
  criado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  atualizado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices
medicoDisparoSchema.index({ telefone: 1 }, { unique: true });
medicoDisparoSchema.index({ especialidades: 1 });
medicoDisparoSchema.index({ status_contato: 1 });
medicoDisparoSchema.index({ permitido_envio: 1 });
medicoDisparoSchema.index({ origem_registro: 1 });

// Middleware para normalizar telefone antes de salvar
medicoDisparoSchema.pre('save', function(next) {
  if (this.telefone) {
    // Normalizar: manter apenas dígitos
    this.telefone = this.telefone.replace(/\D/g, '');
  }
  next();
});

// Método estático para upsert com merge
medicoDisparoSchema.statics.upsertPorTelefone = async function(dadosContato, userId) {
  const telefoneNormalizado = dadosContato.telefone.replace(/\D/g, '');
  
  const contatoExistente = await this.findOne({ telefone: telefoneNormalizado });
  
  if (contatoExistente) {
    // Merge de especialidades (unir listas, remover duplicatas)
    const especialidadesExistentes = contatoExistente.especialidades || [];
    const novasEspecialidades = dadosContato.especialidades || [];
    const especialidadesUnidas = [...new Set([...especialidadesExistentes, ...novasEspecialidades])];
    
    // Manter nome não vazio (priorizar existente se não vazio)
    const nomeAtualizado = contatoExistente.nome || dadosContato.nome;
    
    const dadosAtualizados = {
      ...dadosContato,
      telefone: telefoneNormalizado,
      especialidades: especialidadesUnidas,
      nome: nomeAtualizado,
      atualizado_por: userId
    };
    
    return await this.findOneAndUpdate(
      { telefone: telefoneNormalizado },
      dadosAtualizados,
      { new: true, runValidators: true }
    );
  } else {
    // Criar novo contato
    return await this.create({
      ...dadosContato,
      telefone: telefoneNormalizado,
      criado_por: userId
    });
  }
};

// Método para processar dados de importação
medicoDisparoSchema.statics.processarDadosImportacao = function(dadosLinha) {
  const dados = {};
  
  // Mapeamento automático
  if (dadosLinha.Cliente || dadosLinha.cliente || dadosLinha.Nome || dadosLinha.nome) {
    dados.nome = dadosLinha.Cliente || dadosLinha.cliente || dadosLinha.Nome || dadosLinha.nome;
  }
  
  if (dadosLinha.Contato || dadosLinha.contato || dadosLinha.Telefone || dadosLinha.telefone) {
    dados.telefone = dadosLinha.Contato || dadosLinha.contato || dadosLinha.Telefone || dadosLinha.telefone;
  }
  
  if (dadosLinha.Tags || dadosLinha.tags || dadosLinha.Especialidades || dadosLinha.especialidades) {
    const tagsString = dadosLinha.Tags || dadosLinha.tags || dadosLinha.Especialidades || dadosLinha.especialidades;
    dados.especialidades = tagsString ? tagsString.split(/[,;]/).map(tag => tag.trim()).filter(tag => tag) : [];
  }
  
  if (dadosLinha.Canal || dadosLinha.canal) {
    dados.canal = dadosLinha.Canal || dadosLinha.canal;
  }
  
  if (dadosLinha['E-mail'] || dadosLinha.email || dadosLinha.Email) {
    dados.email = dadosLinha['E-mail'] || dadosLinha.email || dadosLinha.Email;
  }
  
  if (dadosLinha.Código || dadosLinha.codigo || dadosLinha.Codigo) {
    dados.codigo_origem = dadosLinha.Código || dadosLinha.codigo || dadosLinha.Codigo;
  }
  
  return dados;
};

module.exports = mongoose.model('MedicoDisparo', medicoDisparoSchema);