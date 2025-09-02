const mongoose = require('mongoose');
const Mensagem = require('../models/Mensagem');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuração do multer para upload de anexos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/mensagens';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
}).single('anexo');

// @desc    Obter todas as mensagens do usuário (recebidas e enviadas)
// @route   GET /api/mensagens
// @access  Private
const getMensagens = async (req, res) => {
  try {
    const { tipo, pagina = 1, limite = 10, busca } = req.query;
    const skip = (pagina - 1) * limite;
    
    let query = {};
    
    // Filtrar por tipo (recebidas ou enviadas)
    if (tipo === 'recebidas') {
      query = { 
        'destinatarios.usuario': req.user.id,
        'destinatarios.excluido': { $ne: true }
      };
    } else if (tipo === 'enviadas') {
      query = { remetente: req.user.id };
    } else {
      // Se não especificar, retorna ambas
      query = {
        $or: [
          { remetente: req.user.id },
          { 
            'destinatarios.usuario': req.user.id,
            'destinatarios.excluido': { $ne: true }
          }
        ]
      };
    }
    
    // Adicionar filtro de busca se fornecido
    if (busca) {
      query.$or = [
        { assunto: { $regex: busca, $options: 'i' } },
        { conteudo: { $regex: busca, $options: 'i' } }
      ];
    }
    
    // Contar total de mensagens para paginação
    const total = await Mensagem.countDocuments(query);
    
    // Buscar mensagens com paginação
    const mensagens = await Mensagem.find(query)
      .sort({ criadoEm: -1 })
      .skip(skip)
      .limit(parseInt(limite))
      .populate('remetente', 'nome email')
      .populate('destinatarios.usuario', 'nome email');
    
    res.status(200).json({
      mensagens,
      paginacao: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        paginas: Math.ceil(total / limite)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ message: 'Erro ao buscar mensagens', error: error.message });
  }
};

// @desc    Obter mensagens não lidas do usuário
// @route   GET /api/mensagens/nao-lidas
// @access  Private
const getMensagensNaoLidas = async (req, res) => {
  try {
    const mensagensNaoLidas = await Mensagem.find({
      'destinatarios.usuario': req.user.id,
      'destinatarios.lido': false,
      'destinatarios.excluido': { $ne: true }
    })
    .sort({ criadoEm: -1 })
    .populate('remetente', 'nome email');
    
    res.status(200).json({
      mensagens: mensagensNaoLidas,
      total: mensagensNaoLidas.length
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens não lidas:', error);
    res.status(500).json({ message: 'Erro ao buscar mensagens não lidas', error: error.message });
  }
};

// @desc    Obter uma mensagem específica por ID
// @route   GET /api/mensagens/:id
// @access  Private
const getMensagemById = async (req, res) => {
  try {
    const mensagem = await Mensagem.findById(req.params.id)
      .populate('remetente', 'nome email')
      .populate('destinatarios.usuario', 'nome email');
    
    if (!mensagem) {
      return res.status(404).json({ message: 'Mensagem não encontrada' });
    }
    
    // Verificar se o usuário tem permissão para ver esta mensagem
    const isRemetente = mensagem.remetente._id.toString() === req.user.id;
    const isDestinatario = mensagem.destinatarios.some(
      dest => dest.usuario._id.toString() === req.user.id && !dest.excluido
    );
    
    if (!isRemetente && !isDestinatario) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    res.status(200).json(mensagem);
  } catch (error) {
    console.error('Erro ao buscar mensagem:', error);
    res.status(500).json({ message: 'Erro ao buscar mensagem', error: error.message });
  }
};

// @desc    Criar uma nova mensagem
// @route   POST /api/mensagens
// @access  Private
const createMensagem = async (req, res) => {
  try {
    const { assunto, conteudo, destinatarios, prioridade, relacionado } = req.body;
    
    // Verificar se os destinatários existem
    if (!destinatarios || !Array.isArray(destinatarios) || destinatarios.length === 0) {
      return res.status(400).json({ message: 'É necessário informar pelo menos um destinatário' });
    }
    
    // Verificar se todos os destinatários são válidos
    const destinatariosValidos = [];
    for (const destId of destinatarios) {
      const usuario = await User.findById(destId);
      if (usuario) {
        destinatariosValidos.push({
          usuario: destId,
          lido: false,
          excluido: false
        });
      }
    }
    
    if (destinatariosValidos.length === 0) {
      return res.status(400).json({ message: 'Nenhum destinatário válido informado' });
    }
    
    // Criar a mensagem
    const novaMensagem = new Mensagem({
      assunto,
      conteudo,
      remetente: req.user.id,
      destinatarios: destinatariosValidos,
      prioridade: prioridade || 'Normal',
      relacionado: relacionado || { tipo: 'Geral' }
    });
    
    await novaMensagem.save();
    
    // Retornar a mensagem criada com os dados populados
    const mensagemPopulada = await Mensagem.findById(novaMensagem._id)
      .populate('remetente', 'nome email')
      .populate('destinatarios.usuario', 'nome email');
    
    res.status(201).json(mensagemPopulada);
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    res.status(500).json({ message: 'Erro ao criar mensagem', error: error.message });
  }
};

// @desc    Marcar mensagem como lida
// @route   PUT /api/mensagens/:id/lida
// @access  Private
const marcarComoLida = async (req, res) => {
  try {
    const mensagem = await Mensagem.findById(req.params.id);
    
    if (!mensagem) {
      return res.status(404).json({ message: 'Mensagem não encontrada' });
    }
    
    // Encontrar o destinatário correspondente ao usuário atual
    const destinatarioIndex = mensagem.destinatarios.findIndex(
      dest => dest.usuario.toString() === req.user.id
    );
    
    if (destinatarioIndex === -1) {
      return res.status(403).json({ message: 'Você não é um destinatário desta mensagem' });
    }
    
    // Atualizar o status de leitura
    mensagem.destinatarios[destinatarioIndex].lido = true;
    mensagem.destinatarios[destinatarioIndex].dataLeitura = Date.now();
    
    await mensagem.save();
    
    res.status(200).json({ message: 'Mensagem marcada como lida' });
  } catch (error) {
    console.error('Erro ao marcar mensagem como lida:', error);
    res.status(500).json({ message: 'Erro ao marcar mensagem como lida', error: error.message });
  }
};

// @desc    Excluir mensagem (lógica para destinatários, real para remetente)
// @route   DELETE /api/mensagens/:id
// @access  Private
const deleteMensagem = async (req, res) => {
  try {
    const mensagem = await Mensagem.findById(req.params.id);
    
    if (!mensagem) {
      return res.status(404).json({ message: 'Mensagem não encontrada' });
    }
    
    const isRemetente = mensagem.remetente.toString() === req.user.id;
    const destinatarioIndex = mensagem.destinatarios.findIndex(
      dest => dest.usuario.toString() === req.user.id
    );
    
    // Se for o remetente e todos os destinatários já excluíram a mensagem, excluir permanentemente
    if (isRemetente) {
      const todosDestinatariosExcluiram = mensagem.destinatarios.every(dest => dest.excluido);
      
      if (todosDestinatariosExcluiram) {
        // Excluir anexos físicos se existirem
        if (mensagem.anexos && mensagem.anexos.length > 0) {
          for (const anexo of mensagem.anexos) {
            const anexoPath = path.join(__dirname, '..', anexo.caminho);
            if (fs.existsSync(anexoPath)) {
              fs.unlinkSync(anexoPath);
            }
          }
        }
        
        // Excluir a mensagem permanentemente
        await Mensagem.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: 'Mensagem excluída permanentemente' });
      }
    }
    
    // Se for destinatário, marcar como excluído para este usuário
    if (destinatarioIndex !== -1) {
      mensagem.destinatarios[destinatarioIndex].excluido = true;
      await mensagem.save();
      return res.status(200).json({ message: 'Mensagem excluída' });
    }
    
    // Se não for nem remetente nem destinatário
    return res.status(403).json({ message: 'Você não tem permissão para excluir esta mensagem' });
  } catch (error) {
    console.error('Erro ao excluir mensagem:', error);
    res.status(500).json({ message: 'Erro ao excluir mensagem', error: error.message });
  }
};

// @desc    Upload de anexo para uma mensagem
// @route   POST /api/mensagens/:id/anexo
// @access  Private
const uploadAnexo = async (req, res) => {
  try {
    const mensagem = await Mensagem.findById(req.params.id);
    
    if (!mensagem) {
      return res.status(404).json({ message: 'Mensagem não encontrada' });
    }
    
    // Verificar se o usuário é o remetente da mensagem
    if (mensagem.remetente.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Apenas o remetente pode adicionar anexos' });
    }
    
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Erro no upload: ${err.message}` });
      } else if (err) {
        return res.status(500).json({ message: `Erro no servidor: ${err.message}` });
      }
      
      // Se não houver arquivo
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }
      
      // Adicionar anexo à mensagem
      const anexo = {
        nome: req.file.originalname,
        tipo: req.file.mimetype,
        caminho: req.file.path,
        tamanho: req.file.size,
        dataUpload: Date.now()
      };
      
      mensagem.anexos.push(anexo);
      await mensagem.save();
      
      res.status(200).json({
        message: 'Anexo adicionado com sucesso',
        anexo
      });
    });
  } catch (error) {
    console.error('Erro ao adicionar anexo:', error);
    res.status(500).json({ message: 'Erro ao adicionar anexo', error: error.message });
  }
};

// @desc    Excluir anexo de uma mensagem
// @route   DELETE /api/mensagens/:id/anexo/:anexoId
// @access  Private
const deleteAnexo = async (req, res) => {
  try {
    const mensagem = await Mensagem.findById(req.params.id);
    
    if (!mensagem) {
      return res.status(404).json({ message: 'Mensagem não encontrada' });
    }
    
    // Verificar se o usuário é o remetente da mensagem
    if (mensagem.remetente.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Apenas o remetente pode excluir anexos' });
    }
    
    // Encontrar o anexo
    const anexo = mensagem.anexos.id(req.params.anexoId);
    
    if (!anexo) {
      return res.status(404).json({ message: 'Anexo não encontrado' });
    }
    
    // Excluir o arquivo físico
    const anexoPath = path.join(__dirname, '..', anexo.caminho);
    if (fs.existsSync(anexoPath)) {
      fs.unlinkSync(anexoPath);
    }
    
    // Remover o anexo da mensagem
    anexo.remove();
    await mensagem.save();
    
    res.status(200).json({ message: 'Anexo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir anexo:', error);
    res.status(500).json({ message: 'Erro ao excluir anexo', error: error.message });
  }
};

module.exports = {
  getMensagens,
  getMensagensNaoLidas,
  getMensagemById,
  createMensagem,
  marcarComoLida,
  deleteMensagem,
  uploadAnexo,
  deleteAnexo
};