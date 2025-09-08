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
    const especialidades = await MedicoDisparo.aggregate([
      { $match: { permitido_envio: true } },
      { $unwind: '$especialidades' },
      { $group: { 
        _id: '$especialidades', 
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $project: {
        especialidade: '$_id',
        total_contatos: '$count',
        _id: 0
      }}
    ]);

    res.json({
      especialidades,
      total_especialidades: especialidades.length
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