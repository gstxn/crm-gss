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
  estado: {
    type: String,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Estado é opcional
        return /^[A-Z]{2}$/.test(v);
      },
      message: 'Estado deve ter 2 letras maiúsculas (ex: SP, RJ)'
    }
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
  
  // Mapeamento automático flexível - busca por diferentes variações de nomes de colunas
  const chavesNome = Object.keys(dadosLinha).find(key => 
    /^(cliente|nome|name|doctor|medico|dr)$/i.test(key.trim())
  );
  if (chavesNome && dadosLinha[chavesNome]) {
    dados.nome = String(dadosLinha[chavesNome]).trim();
  }
  
  const chavesTelefone = Object.keys(dadosLinha).find(key => 
    /^(contato|telefone|phone|celular|whatsapp|tel|fone)$/i.test(key.trim())
  );
  if (chavesTelefone && dadosLinha[chavesTelefone]) {
    dados.telefone = String(dadosLinha[chavesTelefone]).trim();
  }
  
  // Especialidades - busca flexível
  const chavesEspecialidades = Object.keys(dadosLinha).find(key => 
    /^(tags|especialidades|especialidade|specialty|area|categoria)$/i.test(key.trim())
  );
  if (chavesEspecialidades && dadosLinha[chavesEspecialidades]) {
    const tagsString = String(dadosLinha[chavesEspecialidades]);
    dados.especialidades = tagsString ? tagsString.split(/[,;|]/).map(tag => tag.trim()).filter(tag => tag) : [];
  }
  
  // Canal - busca flexível
  const chavesCanal = Object.keys(dadosLinha).find(key => 
    /^(canal|channel|origem|source|plataforma)$/i.test(key.trim())
  );
  if (chavesCanal && dadosLinha[chavesCanal]) {
    dados.canal = String(dadosLinha[chavesCanal]).trim();
  }
  
  // Email - busca flexível
  const chavesEmail = Object.keys(dadosLinha).find(key => 
    /^(e-mail|email|mail|correio)$/i.test(key.trim())
  );
  if (chavesEmail && dadosLinha[chavesEmail]) {
    const emailValue = String(dadosLinha[chavesEmail]).trim();
    if (emailValue && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      dados.email = emailValue.toLowerCase();
    }
  }
  
  // Estado - busca flexível
  const chavesEstado = Object.keys(dadosLinha).find(key => 
    /^(estado|uf|state|regiao|region)$/i.test(key.trim())
  );
  if (chavesEstado && dadosLinha[chavesEstado]) {
    const estadoValue = String(dadosLinha[chavesEstado]).trim().toUpperCase();
    if (estadoValue.length === 2) {
      dados.estado = estadoValue;
    }
  }
  
  // Observações - busca flexível
  const chavesObservacoes = Object.keys(dadosLinha).find(key => 
    /^(observacoes|observacao|obs|notes|comentarios|descricao)$/i.test(key.trim())
  );
  if (chavesObservacoes && dadosLinha[chavesObservacoes]) {
    dados.observacoes = String(dadosLinha[chavesObservacoes]).trim();
  }
  
  return dados;
};

module.exports = mongoose.model('MedicoDisparo', medicoDisparoSchema);