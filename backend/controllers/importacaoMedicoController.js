const Medico = require('../models/Medico');
const { v4: uuidv4 } = require('uuid');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Serviços auxiliares
const ImportacaoMedicoService = require('../services/importacaoMedicoService');
const PlanilhaMedicoService = require('../services/planilhaMedicoService');
const MapeamentoMedicoService = require('../services/mapeamentoMedicoService');
const UpsertMedicoService = require('../services/upsertMedicoService');

// Instanciar serviços (alguns já são instâncias exportadas)
const importacaoService = new ImportacaoMedicoService();
const planilhaService = PlanilhaMedicoService; // Já é uma instância
const mapeamentoService = MapeamentoMedicoService; // Já é uma instância
const upsertService = UpsertMedicoService; // Já é uma instância

// @desc    Importar médicos via planilha (CSV/XLSX)
// @route   POST /api/medicos/import
// @access  Private
const importarMedicos = async (req, res) => {
  const jobId = uuidv4();
  
  try {
    console.log(`[${jobId}] Iniciando importação de médicos`);
    
    // Verificar se arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    let { mapeamento, opcoes = {} } = req.body;
    
    // Parse do mapeamento se vier como string (FormData)
    if (typeof mapeamento === 'string') {
      try {
        mapeamento = JSON.parse(mapeamento);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Formato de mapeamento inválido'
        });
      }
    }
    
    if (!mapeamento) {
      return res.status(400).json({
        success: false,
        message: 'Mapeamento de colunas é obrigatório'
      });
    }

    // Parse do arquivo
    const resultadoPlanilha = await planilhaService.processarPlanilha(
      req.file.buffer, 
      req.file.originalname, 
      req.file.mimetype
    );
    console.log(`[${jobId}] ${resultadoPlanilha.totalLinhas} linhas detectadas`);

    if (resultadoPlanilha.totalLinhas === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma linha de dados encontrada no arquivo'
      });
    }

    // Mapear colunas usando o mapeamento fornecido
    const medicosRaw = [];
    for (const linha of resultadoPlanilha.linhas) {
      const medicoMapeado = {};
      Object.entries(mapeamento).forEach(([campoDestino, colunaOrigem]) => {
        medicoMapeado[campoDestino] = linha[colunaOrigem] || '';
      });
      medicosRaw.push(medicoMapeado);
    }
    console.log(`[${jobId}] Dados mapeados para ${medicosRaw.length} médicos`);

    // Normalizar e validar dados usando o serviço de mapeamento
    const resultadoMapeamento = await mapeamentoService.mapearENormalizar(medicosRaw, mapeamento);
    const { medicosValidos, erros } = resultadoMapeamento;

    console.log(`[${jobId}] ${medicosValidos.length} médicos válidos, ${erros.length} erros`);

    // Processar upsert em lotes usando o serviço de upsert
    const resultado = await upsertService.executarUpsert(medicosValidos, {
      jobId,
      fonte: 'importacao-manual'
    });

    // Gerar CSV de erros se houver
    let csvErrosUrl = null;
    if (erros.length > 0) {
      csvErrosUrl = await gerarRelatorioErros(erros, jobId);
    }

    const response = {
      success: true,
      jobId,
      criados: resultado.criados,
      atualizados: resultado.atualizados,
      ignorados: resultado.ignorados,
      erros: erros.length,
      detalhesErros: erros.slice(0, 10), // Primeiros 10 erros para preview
      csvErrosUrl,
      tempoProcessamento: resultado.tempoProcessamento,
      totalProcessado: medicosNormalizados.length
    };

    console.log(`[${jobId}] Importação concluída:`, {
      criados: resultado.criados,
      atualizados: resultado.atualizados,
      erros: erros.length
    });

    res.status(200).json(response);

  } catch (error) {
    console.error(`[${jobId}] Erro na importação:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro interno durante a importação',
      error: error.message,
      jobId
    });
  }
};

// @desc    Sincronizar médicos do Google Sheets
// @route   POST /api/medicos/sync-sheets
// @access  Private
const sincronizarGoogleSheets = async (req, res) => {
  const jobId = uuidv4();
  
  try {
    console.log(`[${jobId}] Iniciando sincronização com Google Sheets`);
    
    // Verificar variáveis de ambiente
    const { GSHEETS_SPREADSHEET_ID, GSHEETS_RANGE_MEDICOS, GSHEETS_SERVICE_ACCOUNT_JSON } = process.env;
    
    if (!GSHEETS_SPREADSHEET_ID || !GSHEETS_RANGE_MEDICOS || !GSHEETS_SERVICE_ACCOUNT_JSON) {
      return res.status(400).json({
        success: false,
        message: 'Configuração do Google Sheets incompleta. Verifique as variáveis de ambiente.'
      });
    }

    // Configurar autenticação
    let serviceAccountKey;
    try {
      // Tentar como JSON string primeiro
      serviceAccountKey = JSON.parse(GSHEETS_SERVICE_ACCOUNT_JSON);
    } catch {
      // Se falhar, tentar como caminho de arquivo
      if (fs.existsSync(GSHEETS_SERVICE_ACCOUNT_JSON)) {
        serviceAccountKey = JSON.parse(fs.readFileSync(GSHEETS_SERVICE_ACCOUNT_JSON, 'utf8'));
      } else {
        throw new Error('Não foi possível carregar as credenciais do Google Sheets');
      }
    }

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Ler dados da planilha
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GSHEETS_SPREADSHEET_ID,
      range: GSHEETS_RANGE_MEDICOS
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum dado encontrado no range especificado do Google Sheets'
      });
    }

    console.log(`[${jobId}] ${rows.length} linhas lidas do Google Sheets`);

    // Primeira linha como cabeçalho
    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Converter para formato de objeto
    const linhas = dataRows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    // Usar preset de mapeamento do Google Sheets
    const { usePreset } = req.body;
    let mapeamento;
    
    if (usePreset === 'googleSheets') {
      // Mapeamento padrão para Google Sheets
      mapeamento = {
        'Nome': 'nome',
        'Email': 'email',
        'Telefone': 'telefone',
        'CRM': 'crm',
        'UF_CRM': 'uf_crm',
        'RQE': 'rqe',
        'CPF': 'cpf',
        'CNPJ': 'cnpj',
        'Especialidade': 'especialidade_principal',
        'Subespecialidades': 'subespecialidades',
        'Cidade': 'cidade',
        'UF': 'uf',
        'Hospitais': 'hospitais_vinculo',
        'Disponibilidade': 'disponibilidade',
        'ValorHora': 'valor_hora',
        'Tags': 'tags',
        'Status': 'status'
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Preset de mapeamento não especificado ou inválido'
      });
    }

    // Mapear colunas
    const medicosRaw = mapColumns(linhas, mapeamento);
    console.log(`[${jobId}] Dados mapeados para ${medicosRaw.length} médicos`);

    // Normalizar e validar dados
    const medicosNormalizados = [];
    const erros = [];

    for (let i = 0; i < medicosRaw.length; i++) {
      try {
        const medicoNormalizado = normalizarDadosMedico(medicosRaw[i]);
        const validacao = validarMedico(medicoNormalizado);
        
        if (validacao.valido) {
          medicosNormalizados.push({
            ...medicoNormalizado,
            fonte: 'google-sheets'
          });
        } else {
          erros.push({
            linha: i + 2,
            motivo: validacao.erros.join('; '),
            dados: medicosRaw[i]
          });
        }
      } catch (error) {
        erros.push({
          linha: i + 2,
          motivo: `Erro de processamento: ${error.message}`,
          dados: medicosRaw[i]
        });
      }
    }

    console.log(`[${jobId}] ${medicosNormalizados.length} médicos válidos, ${erros.length} erros`);

    // Processar upsert em lotes
    const resultado = await upsertMedicos(medicosNormalizados, jobId);

    // Gerar CSV de erros se houver
    let csvErrosUrl = null;
    if (erros.length > 0) {
      csvErrosUrl = await gerarRelatorioErros(erros, jobId);
    }

    const responseData = {
      success: true,
      jobId,
      criados: resultado.criados,
      atualizados: resultado.atualizados,
      ignorados: resultado.ignorados,
      erros: erros.length,
      detalhesErros: erros.slice(0, 10),
      csvErrosUrl,
      tempoProcessamento: resultado.tempoProcessamento,
      totalProcessado: medicosNormalizados.length,
      fonte: 'Google Sheets'
    };

    console.log(`[${jobId}] Sincronização concluída:`, {
      criados: resultado.criados,
      atualizados: resultado.atualizados,
      erros: erros.length
    });

    res.status(200).json(responseData);

  } catch (error) {
    console.error(`[${jobId}] Erro na sincronização:`, error);
    
    let message = 'Erro interno durante a sincronização';
    if (error.message.includes('Unable to parse range')) {
      message = 'Range do Google Sheets inválido. Verifique GSHEETS_RANGE_MEDICOS.';
    } else if (error.message.includes('Requested entity was not found')) {
      message = 'Planilha não encontrada. Verifique GSHEETS_SPREADSHEET_ID.';
    } else if (error.message.includes('The caller does not have permission')) {
      message = 'Falha ao autenticar no Google Sheets. Verifique as credenciais.';
    }

    res.status(500).json({
      success: false,
      message,
      error: error.message,
      jobId
    });
  }
};

// @desc    Obter preview de planilha para mapeamento
// @route   POST /api/medicos/preview
// @access  Private
const previewPlanilha = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    const { opcoes = {} } = req.body;
    
    // Parse do arquivo
    const linhas = await parsePlanilha(req.file.buffer, req.file.mimetype, opcoes);
    
    if (linhas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma linha de dados encontrada no arquivo'
      });
    }

    // Retornar cabeçalhos e primeiras 10 linhas para preview
    const headers = Object.keys(linhas[0]);
    const preview = linhas.slice(0, 10);
    
    res.status(200).json({
      success: true,
      headers,
      preview,
      totalLinhas: linhas.length,
      sugestoesMapeamento: gerarSugestoesMapeamento(headers)
    });

  } catch (error) {
    console.error('Erro no preview:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar arquivo para preview',
      error: error.message
    });
  }
};

// Função auxiliar para gerar sugestões de mapeamento
const gerarSugestoesMapeamento = (headers) => {
  const mapeamentos = {
    nome: ['nome', 'name', 'medico', 'doctor'],
    email: ['email', 'e-mail', 'mail'],
    telefone: ['telefone', 'phone', 'tel', 'celular'],
    crm: ['crm', 'registro'],
    uf_crm: ['uf_crm', 'uf crm', 'estado_crm', 'uf do crm'],
    rqe: ['rqe', 'registro qualificacao'],
    cpf: ['cpf', 'documento'],
    cnpj: ['cnpj'],
    especialidade_principal: ['especialidade', 'especialidade_principal', 'specialty'],
    subespecialidades: ['subespecialidades', 'subspecialties'],
    cidade: ['cidade', 'city'],
    uf: ['uf', 'estado', 'state'],
    hospitais_vinculo: ['hospitais', 'hospitals', 'vinculos'],
    disponibilidade: ['disponibilidade', 'availability'],
    valor_hora: ['valor_hora', 'valor', 'price', 'preco'],
    tags: ['tags', 'etiquetas'],
    status: ['status', 'situacao']
  };

  const sugestoes = {};
  
  headers.forEach(header => {
    const headerLower = header.toLowerCase().trim();
    
    for (const [campo, palavrasChave] of Object.entries(mapeamentos)) {
      if (palavrasChave.some(palavra => headerLower.includes(palavra))) {
        sugestoes[header] = campo;
        break;
      }
    }
  });

  return sugestoes;
};

module.exports = {
  importarPlanilha: importarMedicos,
  sincronizarGoogleSheets,
  previewPlanilha,
  verificarStatusImportacao: async (req, res) => {
    res.status(501).json({ error: 'Método não implementado' });
  },
  downloadErros: async (req, res) => {
    res.status(501).json({ error: 'Método não implementado' });
  },
  obterSugestoesMapeamento: async (req, res) => {
    res.status(501).json({ error: 'Método não implementado' });
  },
  validarMapeamento: async (req, res) => {
    res.status(501).json({ error: 'Método não implementado' });
  },
  exportarMedicos: async (req, res) => {
    res.status(501).json({ error: 'Método não implementado' });
  },
  obterPresets: async (req, res) => {
    res.status(501).json({ error: 'Método não implementado' });
  },
  salvarPreset: async (req, res) => {
    res.status(501).json({ error: 'Método não implementado' });
  },
  deletarPreset: async (req, res) => {
    res.status(501).json({ error: 'Método não implementado' });
  }
};