const MedicoDisparo = require('../models/MedicoDisparo');
const MedicoDisparoService = require('../services/medicoDisparoService');
const { createAuditLog } = require('../utils/admin/audit');
const multer = require('multer');
const { validationResult } = require('express-validator');

class MedicoDisparoController {
  
  /**
   * Listar médicos de disparo com filtros e paginação
   */
  static async listar(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        especialidades,
        status_contato,
        permitido_envio,
        tem_email,
        busca
      } = req.query;
      
      // Construir query
      const query = {};
      
      if (especialidades) {
        const especialidadesArray = Array.isArray(especialidades) 
          ? especialidades 
          : especialidades.split(',');
        query.especialidades = { $in: especialidadesArray };
      }
      
      if (status_contato) {
        query.status_contato = status_contato;
      }
      
      if (permitido_envio !== undefined) {
        query.permitido_envio = permitido_envio === 'true';
      }
      
      if (tem_email !== undefined) {
        if (tem_email === 'true') {
          query.email = { $exists: true, $ne: null, $ne: '' };
        } else {
          query.$or = [
            { email: { $exists: false } },
            { email: null },
            { email: '' }
          ];
        }
      }
      
      if (busca) {
        query.$or = [
          { nome: { $regex: busca, $options: 'i' } },
          { telefone: { $regex: busca } },
          { email: { $regex: busca, $options: 'i' } }
        ];
      }
      
      // Configurar paginação
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Executar consulta
      const [medicos, total] = await Promise.all([
        MedicoDisparo.find(query)
          .populate('criado_por', 'nome email')
          .populate('atualizado_por', 'nome email')
          .sort({ createdAt: -1 })
          .limit(parseInt(limit))
          .skip(skip)
          .lean(),
        MedicoDisparo.countDocuments(query)
      ]);
      
      res.json({
        success: true,
        data: medicos,
        paginacao: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
      
    } catch (error) {
      console.error('Erro ao listar médicos de disparo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Obter médico de disparo por ID
   */
  static async obterPorId(req, res) {
    try {
      const { id } = req.params;
      
      const medico = await MedicoDisparo.findById(id)
        .populate('criado_por', 'nome email')
        .populate('atualizado_por', 'nome email');
      
      if (!medico) {
        return res.status(404).json({
          success: false,
          message: 'Médico não encontrado'
        });
      }
      
      res.json({
        success: true,
        data: medico
      });
      
    } catch (error) {
      console.error('Erro ao obter médico de disparo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Criar novo médico de disparo
   */
  static async criar(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }
      
      const dadosMedico = {
        ...req.body,
        criado_por: req.user.id,
        atualizado_por: req.user.id,
        origem_registro: 'manual'
      };
      
      // Processar especialidades se for string
      if (dadosMedico.especialidades && typeof dadosMedico.especialidades === 'string') {
        dadosMedico.especialidades = MedicoDisparoService.parseEspecialidades(dadosMedico.especialidades);
      }
      
      const novoMedico = new MedicoDisparo(dadosMedico);
      const medicoSalvo = await novoMedico.save();
      
      // Registrar na auditoria
      await createAuditLog({
        user: req.user,
        action: 'CREATE',
        entity: 'MedicoDisparo',
        entityId: medicoSalvo._id,
        details: { nome: medicoSalvo.nome, telefone: medicoSalvo.telefone },
        req
      });

      res.status(201).json({
        success: true,
        message: 'Médico criado com sucesso',
        data: medico
      });
      
    } catch (error) {
      console.error('Erro ao criar médico de disparo:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Telefone já cadastrado'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Atualizar médico de disparo
   */
  static async atualizar(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }
      
      const dadosAtualizacao = {
        ...req.body,
        atualizado_por: req.user.id
      };
      
      // Processar especialidades se for string
      if (dadosAtualizacao.especialidades && typeof dadosAtualizacao.especialidades === 'string') {
        dadosAtualizacao.especialidades = MedicoDisparoService.parseEspecialidades(dadosAtualizacao.especialidades);
      }
      
      const medicoAtualizado = await MedicoDisparo.findByIdAndUpdate(
        id,
        dadosAtualizacao,
        { new: true, runValidators: true }
      ).populate('criado_por atualizado_por', 'nome email');
      
      if (!medicoAtualizado) {
        return res.status(404).json({
          success: false,
          message: 'Médico não encontrado'
        });
      }
      
      // Registrar na auditoria
      await createAuditLog({
        user: req.user,
        action: 'UPDATE',
        entity: 'MedicoDisparo',
        entityId: medico._id,
        details: { nome: medico.nome, telefone: medico.telefone },
        req
      });

      res.json({
        success: true,
        message: 'Médico atualizado com sucesso',
        data: medico
      });
      
    } catch (error) {
      console.error('Erro ao atualizar médico de disparo:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Telefone já cadastrado por outro médico'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Excluir médico de disparo
   */
  static async excluir(req, res) {
    try {
      const { id } = req.params;
      
      const medicoExcluido = await MedicoDisparo.findByIdAndDelete(id);
      
      if (!medicoExcluido) {
        return res.status(404).json({
          success: false,
          message: 'Médico não encontrado'
        });
      }
      
      // Registrar na auditoria
      await createAuditLog({
        user: req.user,
        action: 'DELETE',
        entity: 'MedicoDisparo',
        entityId: req.params.id,
        details: { nome: medico.nome, telefone: medico.telefone },
        req
      });

      res.json({
        success: true,
        message: 'Médico excluído com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao excluir médico de disparo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Preview de importação - extrair cabeçalhos e primeiras linhas
   */
  static async previewImportacao(req, res) {
    try {
      console.log('Arquivo recebido:', req.file); // Debug
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Arquivo não fornecido'
        });
      }

      const preview = await MedicoDisparoService.obterPreviewImportacao(
        req.file.buffer,
        req.file.originalname
      );

      res.json({
        success: true,
        headers: preview.headers,
        preview: preview.data
      });

    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar arquivo para preview',
        error: error.message
      });
    }
  }

  /**
   * Importar médicos de arquivo XLSX/CSV com mapeamento
   */
  static async importarArquivoComMapeamento(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Arquivo não fornecido'
        });
      }

      const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;
      
      if (!mapping) {
        return res.status(400).json({
          success: false,
          message: 'Mapeamento de colunas não fornecido'
        });
      }

      const resultado = await MedicoDisparoService.processarArquivoImportacaoComMapeamento(
        req.file.buffer,
        req.file.originalname,
        mapping,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Importação concluída',
        processados: resultado.processados,
        novos: resultado.novos,
        atualizados: resultado.atualizados,
        erros: resultado.erros,
        detalhes: resultado.detalhes
      });

    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar arquivo',
        error: error.message
      });
    }
  }

  /**
   * Importar médicos de arquivo XLSX/CSV (método legado)
   */
  static async importarArquivo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Arquivo não fornecido'
        });
      }
      
      const resultado = await MedicoDisparoService.processarArquivoImportacao(
        req.file.buffer,
        req.file.originalname,
        req.user.id
      );
      
      // Registrar na auditoria
      await createAuditLog({
        user: req.user,
        action: 'IMPORT',
        entity: 'MedicoDisparo',
        details: { 
          arquivo: req.file.originalname,
          processados: resultado.processados,
          novos: resultado.novos,
          atualizados: resultado.atualizados,
          erros: resultado.erros
        },
        req
      });

      res.json({
        success: true,
        message: 'Importação concluída',
        data: resultado
      });
      
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar arquivo',
        error: error.message
      });
    }
  }
  
  /**
   * Sincronizar com Google Sheets
   */
  static async sincronizarGoogleSheets(req, res) {
    try {
      const { spreadsheetId, range } = req.body;
      
      if (!spreadsheetId || !range) {
        return res.status(400).json({
          success: false,
          message: 'ID da planilha e range são obrigatórios'
        });
      }
      
      const resultado = await MedicoDisparoService.sincronizarGoogleSheets(
        spreadsheetId,
        range,
        req.user.id
      );
      
      res.json({
        success: true,
        message: 'Sincronização concluída',
        data: resultado
      });
      
    } catch (error) {
      console.error('Erro ao sincronizar Google Sheets:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao sincronizar planilha',
        error: error.message
      });
    }
  }
  
  /**
   * Obter contatos para disparo (API externa)
   */
  static async obterContatosDisparo(req, res) {
    try {
      const {
        especialidade,
        especialidades,
        status = 'novo,fila',
        page = 1,
        limit = 100
      } = req.query;
      
      const filtros = {};
      
      if (especialidade) {
        filtros.especialidade = especialidade;
      }
      
      if (especialidades) {
        filtros.especialidades = Array.isArray(especialidades) 
          ? especialidades 
          : especialidades.split(',');
      }
      
      if (status) {
        filtros.status = Array.isArray(status) 
          ? status 
          : status.split(',');
      }
      
      const paginacao = { page, limit };
      
      const resultado = await MedicoDisparoService.obterContatosDisparo(filtros, paginacao);
      
      res.json({
        success: true,
        data: resultado.contatos,
        paginacao: resultado.paginacao
      });
      
    } catch (error) {
      console.error('Erro ao obter contatos para disparo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Exportar contatos para disparo (CSV)
   */
  static async exportarDisparo(req, res) {
    try {
      const {
        especialidades,
        status_contato,
        formato = 'csv'
      } = req.query;
      
      const query = {
        permitido_envio: true,
        status_contato: { $in: ['novo', 'fila'] }
      };
      
      if (especialidades) {
        const especialidadesArray = Array.isArray(especialidades) 
          ? especialidades 
          : especialidades.split(',');
        query.especialidades = { $in: especialidadesArray };
      }
      
      if (status_contato) {
        query.status_contato = status_contato;
      }
      
      const contatos = await MedicoDisparo.find(query)
        .select('telefone especialidades')
        .lean();
      
      if (formato === 'json') {
        res.json({
          success: true,
          data: contatos
        });
      } else {
        // Formato CSV
        let csv = 'telefone,especialidades\n';
        contatos.forEach(contato => {
          const especialidadesStr = contato.especialidades ? contato.especialidades.join(';') : '';
          csv += `${contato.telefone},"${especialidadesStr}"\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=contatos_disparo.csv');
        res.send(csv);
      }
      
    } catch (error) {
      console.error('Erro ao exportar contatos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Executar ações em massa
   */
  static async acoesMassa(req, res) {
    try {
      const { ids, acao } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'IDs são obrigatórios'
        });
      }
      
      if (!acao) {
        return res.status(400).json({
          success: false,
          message: 'Ação é obrigatória'
        });
      }
      
      const resultado = await MedicoDisparoService.executarAcaoMassa(
        ids,
        acao,
        req.user.id
      );
      
      // Registrar na auditoria
      await createAuditLog({
        user: req.user,
        action: 'BULK_ACTION',
        entity: 'MedicoDisparo',
        details: { 
          acao: req.body.acao,
          ids_afetados: req.body.ids,
          processados: resultado.processados
        },
        req
      });

      res.json({
        success: true,
        message: 'Ações executadas com sucesso',
        data: resultado
      });
      
    } catch (error) {
      console.error('Erro ao executar ação em massa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Obter estatísticas dos médicos de disparo
   */
  static async obterEstatisticas(req, res) {
    try {
      const [stats] = await MedicoDisparo.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            permitidos: {
              $sum: {
                $cond: [{ $eq: ['$permitido_envio', true] }, 1, 0]
              }
            },
            novos: {
              $sum: {
                $cond: [{ $eq: ['$status_contato', 'novo'] }, 1, 0]
              }
            },
            fila: {
              $sum: {
                $cond: [{ $eq: ['$status_contato', 'fila'] }, 1, 0]
              }
            },
            enviados: {
              $sum: {
                $cond: [{ $eq: ['$status_contato', 'enviado'] }, 1, 0]
              }
            },
            opt_out: {
              $sum: {
                $cond: [{ $eq: ['$status_contato', 'opt_out'] }, 1, 0]
              }
            },
            com_email: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$email', null] },
                      { $ne: ['$email', ''] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);
      
      const estatisticas = stats || {
        total: 0,
        permitidos: 0,
        novos: 0,
        fila: 0,
        enviados: 0,
        opt_out: 0,
        com_email: 0
      };
      
      res.json({
        success: true,
        data: estatisticas
      });
      
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Obter especialidades únicas
   */
  static async obterEspecialidades(req, res) {
    try {
      const especialidades = await MedicoDisparo.distinct('especialidades');
      
      res.json({
        success: true,
        data: especialidades.filter(esp => esp && esp.trim().length > 0).sort()
      });
      
    } catch (error) {
      console.error('Erro ao obter especialidades:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = MedicoDisparoController;