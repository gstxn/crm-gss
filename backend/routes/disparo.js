const express = require('express');
const router = express.Router();
const MedicoDisparo = require('../models/MedicoDisparo');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { authenticateToken, authorizeDisparo } = require('../middleware/auth');

// Rate limiting para endpoints de disparo
const disparoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Aplicar rate limiting
router.use(disparoLimiter);

// GET /api/disparo/contatos - Endpoint para obter contatos para disparo
router.get('/contatos', async (req, res) => {
  try {
    const { 
      especialidade, 
      status = 'novo,fila',
      page = 1,
      limit = 100,
      formato = 'json'
    } = req.query;

    // Validar limite máximo
    const limitePagina = Math.min(parseInt(limit), 500);
    
    // Construir filtros
    const filtros = {
      permitido_envio: true,
      status_contato: { $in: status.split(',') }
    };

    // Filtro por especialidade
    if (especialidade) {
      const especialidades = Array.isArray(especialidade) ? especialidade : [especialidade];
      filtros.especialidades = { $in: especialidades };
    }

    // Paginação
    const skip = (parseInt(page) - 1) * limitePagina;

    // Buscar contatos
    const [contatos, total] = await Promise.all([
      MedicoDisparo.find(filtros)
        .select('telefone especialidades')
        .skip(skip)
        .limit(limitePagina)
        .lean(),
      MedicoDisparo.countDocuments(filtros)
    ]);

    // Resposta baseada no formato
    if (formato === 'csv') {
      const csv = contatos.map(c => 
        `${c.telefone},"${c.especialidades.join(';')}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=contatos-disparo.csv');
      return res.send(`telefone,especialidades\n${csv}`);
    }

    // Resposta JSON
    res.json({
      contatos,
      pagination: {
        page: parseInt(page),
        limit: limitePagina,
        total,
        pages: Math.ceil(total / limitePagina)
      },
      filtros_aplicados: {
        especialidade: especialidade || 'todas',
        status: status,
        permitido_envio: true
      }
    });

  } catch (error) {
    console.error('Erro no endpoint de disparo:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Não foi possível obter os contatos para disparo'
    });
  }
});

// GET /api/disparo/especialidades - Listar especialidades disponíveis
router.get('/especialidades', async (req, res) => {
  try {
    // Lista completa de especialidades médicas
    const todasEspecialidades = [
      { id: '1', nome: 'Alergia e Imunologia' },
      { id: '2', nome: 'Anestesiologia' },
      { id: '3', nome: 'Angiologia' },
      { id: '4', nome: 'Cardiologia' },
      { id: '5', nome: 'Cirurgia Cardiovascular' },
      { id: '6', nome: 'Cirurgia da Mão' },
      { id: '7', nome: 'Cirurgia de Cabeça e Pescoço' },
      { id: '8', nome: 'Cirurgia do Aparelho Digestivo' },
      { id: '9', nome: 'Cirurgia Geral' },
      { id: '10', nome: 'Cirurgia Oncológica' },
      { id: '11', nome: 'Cirurgia Pediátrica' },
      { id: '12', nome: 'Cirurgia Plástica' },
      { id: '13', nome: 'Cirurgia Torácica' },
      { id: '14', nome: 'Cirurgia Vascular' },
      { id: '15', nome: 'Clínica Médica' },
      { id: '16', nome: 'Coloproctologia' },
      { id: '17', nome: 'Dermatologia' },
      { id: '18', nome: 'Endocrinologia e Metabologia' },
      { id: '19', nome: 'Endoscopia' },
      { id: '20', nome: 'Gastroenterologia' },
      { id: '21', nome: 'Genética Médica' },
      { id: '22', nome: 'Geriatria' },
      { id: '23', nome: 'Ginecologia e Obstetrícia' },
      { id: '24', nome: 'Hematologia e Hemoterapia' },
      { id: '25', nome: 'Homeopatia' },
      { id: '26', nome: 'Infectologia' },
      { id: '27', nome: 'Medicina de Emergência' },
      { id: '28', nome: 'Medicina de Família e Comunidade' },
      { id: '29', nome: 'Medicina do Trabalho' },
      { id: '30', nome: 'Medicina Esportiva' },
      { id: '31', nome: 'Medicina Física e Reabilitação' },
      { id: '32', nome: 'Medicina Intensiva' },
      { id: '33', nome: 'Medicina Legal e Perícia Médica' },
      { id: '34', nome: 'Medicina Nuclear' },
      { id: '35', nome: 'Nefrologia' },
      { id: '36', nome: 'Neurocirurgia' },
      { id: '37', nome: 'Neurologia' },
      { id: '38', nome: 'Nutrologia' },
      { id: '39', nome: 'Oftalmologia' },
      { id: '40', nome: 'Oncologia Clínica' },
      { id: '41', nome: 'Ortopedia e Traumatologia' },
      { id: '42', nome: 'Otorrinolaringologia' },
      { id: '43', nome: 'Patologia' },
      { id: '44', nome: 'Patologia Clínica / Medicina Laboratorial' },
      { id: '45', nome: 'Pediatria' },
      { id: '46', nome: 'Pneumologia' },
      { id: '47', nome: 'Psiquiatria' },
      { id: '48', nome: 'Radiologia e Diagnóstico por Imagem' },
      { id: '49', nome: 'Radioterapia' },
      { id: '50', nome: 'Reumatologia' },
      { id: '51', nome: 'Urologia' }
    ];

    // Obter contagem de médicos por especialidade (opcional)
    const especialidadesComContagem = await MedicoDisparo.aggregate([
      { $match: { permitido_envio: true } },
      { $unwind: '$especialidades' },
      { $group: { 
        _id: '$especialidades', 
        count: { $sum: 1 }
      }}
    ]);

    // Mapear especialidades com contagem
    const especialidadesComInfo = todasEspecialidades.map(esp => {
      const contagem = especialidadesComContagem.find(c => c._id === esp.nome);
      return {
        especialidade: esp.nome,
        total_contatos: contagem ? contagem.count : 0
      };
    });

    res.json({
      especialidades: especialidadesComInfo,
      total_especialidades: todasEspecialidades.length
    });

  } catch (error) {
    console.error('Erro ao obter especialidades:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Não foi possível obter as especialidades'
    });
  }
});

// GET /api/disparo/stats - Estatísticas básicas para disparo
router.get('/stats', async (req, res) => {
  try {
    const stats = await MedicoDisparo.aggregate([
      {
        $group: {
          _id: null,
          total_contatos: { $sum: 1 },
          permitidos_envio: {
            $sum: { $cond: [{ $eq: ['$permitido_envio', true] }, 1, 0] }
          },
          novos: {
            $sum: { $cond: [{ $eq: ['$status_contato', 'novo'] }, 1, 0] }
          },
          em_fila: {
            $sum: { $cond: [{ $eq: ['$status_contato', 'fila'] }, 1, 0] }
          },
          enviados: {
            $sum: { $cond: [{ $eq: ['$status_contato', 'enviado'] }, 1, 0] }
          },
          opt_out: {
            $sum: { $cond: [{ $eq: ['$status_contato', 'opt_out'] }, 1, 0] }
          }
        }
      }
    ]);

    const resultado = stats[0] || {
      total_contatos: 0,
      permitidos_envio: 0,
      novos: 0,
      em_fila: 0,
      enviados: 0,
      opt_out: 0
    };

    // Calcular disponíveis para disparo
    resultado.disponiveis_disparo = resultado.novos + resultado.em_fila;
    
    delete resultado._id;

    res.json(resultado);

  } catch (error) {
    console.error('Erro ao obter estatísticas de disparo:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Não foi possível obter as estatísticas'
    });
  }
});

// POST /api/disparo/marcar-enviado - Marcar contatos como enviados (requer autenticação)
router.post('/marcar-enviado', authenticateToken, authorizeDisparo('write'), async (req, res) => {
  try {
    const { telefones } = req.body;

    if (!telefones || !Array.isArray(telefones) || telefones.length === 0) {
      return res.status(400).json({
        error: 'Lista de telefones é obrigatória'
      });
    }

    // Normalizar telefones
    const telefonesNormalizados = telefones.map(tel => tel.replace(/\D/g, ''));

    // Atualizar status dos contatos
    const resultado = await MedicoDisparo.updateMany(
      { 
        telefone: { $in: telefonesNormalizados },
        permitido_envio: true,
        status_contato: { $in: ['novo', 'fila'] }
      },
      {
        $set: {
          status_contato: 'enviado',
          ultima_interacao_em: new Date()
        },
        $inc: {
          total_envios: 1
        }
      }
    );

    res.json({
      message: 'Contatos marcados como enviados',
      contatos_atualizados: resultado.modifiedCount,
      total_solicitado: telefones.length
    });

  } catch (error) {
    console.error('Erro ao marcar como enviado:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Não foi possível marcar os contatos como enviados'
    });
  }
});

// POST /api/disparo/marcar-falha - Marcar contatos com falha no envio (requer autenticação)
router.post('/marcar-falha', authenticateToken, authorizeDisparo('write'), async (req, res) => {
  try {
    const { telefones, motivo } = req.body;

    if (!telefones || !Array.isArray(telefones) || telefones.length === 0) {
      return res.status(400).json({
        error: 'Lista de telefones é obrigatória'
      });
    }

    // Normalizar telefones
    const telefonesNormalizados = telefones.map(tel => tel.replace(/\D/g, ''));

    // Atualizar status dos contatos
    const updateData = {
      status_contato: 'falha',
      ultima_interacao_em: new Date()
    };

    if (motivo) {
      updateData.observacoes = motivo;
    }

    const resultado = await MedicoDisparo.updateMany(
      { 
        telefone: { $in: telefonesNormalizados },
        status_contato: { $in: ['novo', 'fila'] }
      },
      { $set: updateData }
    );

    res.json({
      message: 'Contatos marcados com falha',
      contatos_atualizados: resultado.modifiedCount,
      total_solicitado: telefones.length
    });

  } catch (error) {
    console.error('Erro ao marcar falha:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Não foi possível marcar os contatos com falha'
    });
  }
});

module.exports = router;