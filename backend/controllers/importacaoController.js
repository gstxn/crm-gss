/**
 * Controlador para importação e sincronização de clientes
 */
const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Serviços
const { parsePlanilha } = require('../services/planilhaService');
const { gerarSugestoesMapeamento, mapColumns } = require('../services/mapeamentoService');
const { upsertClientes } = require('../services/clienteService');
const { lerPlanilhaGoogle } = require('../services/googleSheetsService');

// Armazenamento temporário para presets de mapeamento
// Em produção, isso deveria ser armazenado em banco de dados
const presetsMapeamento = {
  'googleSheets': {},
  'padraoCRM': {
    'Nome': 'nome',
    'Email': 'email',
    'Telefone': 'telefone',
    'Documento': 'documento',
    'Empresa': 'empresa',
    'Cargo': 'cargo',
    'Cidade': 'cidade',
    'UF': 'uf',
    'Tags': 'tags'
  }
};

// Armazenamento temporário para jobs de importação
// Em produção, isso deveria ser armazenado em banco de dados
const jobsImportacao = {};

/**
 * @desc    Importar clientes a partir de arquivo CSV/XLSX
 * @route   POST /api/clientes/import
 * @access  Private
 */
const importarClientes = asyncHandler(async (req, res) => {
  try {
    // Verificar se o recurso está habilitado
    if (process.env.FEATURE_CLIENTES_IMPORT_SYNC !== 'true') {
      return res.status(403).json({ 
        message: 'Recurso de importação não está habilitado' 
      });
    }
    
    // Verificar se o arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({ 
        message: 'Nenhum arquivo enviado' 
      });
    }
    
    // Verificar tamanho do arquivo (máx 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        message: 'Arquivo excede o tamanho máximo permitido (20MB)' 
      });
    }
    
    // Verificar tipo MIME
    const mimeTypesPermitidos = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/csv',
      'text/plain'
    ];
    
    if (!mimeTypesPermitidos.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        message: 'Formato de arquivo não suportado. Use CSV ou XLSX.' 
      });
    }
    
    // Ler o arquivo
    const buffer = req.file.buffer;
    
    // Processar planilha
    const { headers, rows } = await parsePlanilha(buffer);
    
    if (headers.length === 0 || rows.length === 0) {
      return res.status(400).json({ 
        message: 'Planilha vazia ou sem cabeçalhos' 
      });
    }
    
    // Gerar sugestões de mapeamento
    const sugestoesMapeamento = gerarSugestoesMapeamento(headers);
    
    // Se o mapeamento foi enviado, processar a importação
    if (req.body.mapeamento) {
      let mapeamento;
      
      try {
        mapeamento = JSON.parse(req.body.mapeamento);
      } catch (error) {
        return res.status(400).json({ 
          message: 'Formato de mapeamento inválido' 
        });
      }
      
      // Salvar preset se solicitado
      if (req.body.salvarPreset && req.body.nomePreset) {
        presetsMapeamento[req.body.nomePreset] = mapeamento;
      }
      
      // Mapear colunas
      const clientesMapeados = mapColumns(rows, mapeamento);
      
      // Gerar ID para o job
      const jobId = uuidv4();
      
      // Iniciar job de importação
      jobsImportacao[jobId] = {
        status: 'em_andamento',
        total: clientesMapeados.length,
        processados: 0,
        criados: 0,
        atualizados: 0,
        ignorados: 0,
        erros: [],
        inicio: new Date()
      };
      
      // Processar upsert em background
      setImmediate(async () => {
        try {
          const resultado = await upsertClientes(clientesMapeados, {
            userId: req.user.id,
            fonte: 'importacao-manual',
            batchSize: 500
          });
          
          // Atualizar status do job
          jobsImportacao[jobId] = {
            ...jobsImportacao[jobId],
            status: 'concluido',
            criados: resultado.criados,
            atualizados: resultado.atualizados,
            ignorados: resultado.ignorados,
            erros: resultado.erros,
            fim: new Date()
          };
          
          // Gerar CSV de erros se houver
          if (resultado.erros.length > 0) {
            const csvErros = gerarCsvErros(resultado.erros);
            const dirTemp = path.join(__dirname, '../temp');
            
            // Criar diretório se não existir
            if (!fs.existsSync(dirTemp)) {
              fs.mkdirSync(dirTemp, { recursive: true });
            }
            
            const arquivoErros = path.join(dirTemp, `erros_${jobId}.csv`);
            fs.writeFileSync(arquivoErros, csvErros);
            
            jobsImportacao[jobId].arquivoErros = arquivoErros;
          }
        } catch (error) {
          console.error('Erro ao processar importação:', error);
          jobsImportacao[jobId].status = 'erro';
          jobsImportacao[jobId].mensagemErro = error.message;
        }
      });
      
      return res.status(202).json({
        message: 'Importação iniciada',
        jobId,
        previewLinhas: Math.min(10, clientesMapeados.length),
        totalLinhas: clientesMapeados.length
      });
    }
    
    // Se não há mapeamento, retornar cabeçalhos e sugestões
    return res.status(200).json({
      headers,
      sugestoesMapeamento,
      presets: Object.keys(presetsMapeamento),
      previewLinhas: rows.slice(0, 10)
    });
  } catch (error) {
    console.error('Erro ao importar clientes:', error);
    res.status(500).json({ 
      message: 'Erro ao processar importação', 
      error: error.message 
    });
  }
});

/**
 * @desc    Sincronizar clientes a partir do Google Sheets
 * @route   POST /api/clientes/sync-sheets
 * @access  Private
 */
const sincronizarGoogleSheets = asyncHandler(async (req, res) => {
  try {
    // Verificar se o recurso está habilitado
    if (process.env.FEATURE_CLIENTES_IMPORT_SYNC !== 'true') {
      return res.status(403).json({ 
        message: 'Recurso de sincronização não está habilitado' 
      });
    }
    
    // Verificar variáveis de ambiente necessárias
    if (!process.env.GSHEETS_SPREADSHEET_ID || !process.env.GSHEETS_RANGE_CLIENTES) {
      return res.status(500).json({ 
        message: 'Configuração do Google Sheets incompleta' 
      });
    }
    
    // Ler dados da planilha
    const { headers, rows } = await lerPlanilhaGoogle();
    
    if (headers.length === 0) {
      return res.status(400).json({ 
        message: 'Planilha vazia ou sem cabeçalhos' 
      });
    }
    
    let mapeamento;
    
    // Usar preset salvo se disponível
    if (req.body.usePreset && presetsMapeamento[req.body.usePreset]) {
      mapeamento = presetsMapeamento[req.body.usePreset];
    } else {
      // Gerar sugestões de mapeamento
      mapeamento = gerarSugestoesMapeamento(headers);
      
      // Salvar como preset do Google Sheets
      presetsMapeamento['googleSheets'] = mapeamento;
    }
    
    // Mapear colunas
    const clientesMapeados = mapColumns(rows, mapeamento);
    
    // Gerar ID para o job
    const jobId = uuidv4();
    
    // Iniciar job de sincronização
    jobsImportacao[jobId] = {
      status: 'em_andamento',
      total: clientesMapeados.length,
      processados: 0,
      criados: 0,
      atualizados: 0,
      ignorados: 0,
      erros: [],
      inicio: new Date()
    };
    
    // Processar upsert em background
    setImmediate(async () => {
      try {
        const resultado = await upsertClientes(clientesMapeados, {
          userId: req.user.id,
          fonte: 'google-sheets',
          batchSize: 500
        });
        
        // Atualizar status do job
        jobsImportacao[jobId] = {
          ...jobsImportacao[jobId],
          status: 'concluido',
          criados: resultado.criados,
          atualizados: resultado.atualizados,
          ignorados: resultado.ignorados,
          erros: resultado.erros,
          fim: new Date()
        };
        
        // Gerar CSV de erros se houver
        if (resultado.erros.length > 0) {
          const csvErros = gerarCsvErros(resultado.erros);
          const dirTemp = path.join(__dirname, '../temp');
          
          // Criar diretório se não existir
          if (!fs.existsSync(dirTemp)) {
            fs.mkdirSync(dirTemp, { recursive: true });
          }
          
          const arquivoErros = path.join(dirTemp, `erros_${jobId}.csv`);
          fs.writeFileSync(arquivoErros, csvErros);
          
          jobsImportacao[jobId].arquivoErros = arquivoErros;
        }
      } catch (error) {
        console.error('Erro ao processar sincronização:', error);
        jobsImportacao[jobId].status = 'erro';
        jobsImportacao[jobId].mensagemErro = error.message;
      }
    });
    
    return res.status(202).json({
      message: 'Sincronização iniciada',
      jobId,
      totalLinhas: clientesMapeados.length
    });
  } catch (error) {
    console.error('Erro ao sincronizar com Google Sheets:', error);
    res.status(500).json({ 
      message: 'Erro ao sincronizar com Google Sheets', 
      error: error.message 
    });
  }
});

/**
 * @desc    Verificar status de um job de importação/sincronização
 * @route   GET /api/clientes/import/status/:jobId
 * @access  Private
 */
const verificarStatusImportacao = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  
  if (!jobsImportacao[jobId]) {
    return res.status(404).json({ 
      message: 'Job não encontrado' 
    });
  }
  
  const job = jobsImportacao[jobId];
  
  // Se o job foi concluído e tem arquivo de erros, disponibilizar para download
  if (job.status === 'concluido' && job.arquivoErros) {
    job.urlErros = `/api/clientes/import/erros/${jobId}`;
  }
  
  res.status(200).json(job);
});

/**
 * @desc    Download do arquivo CSV de erros
 * @route   GET /api/clientes/import/erros/:jobId
 * @access  Private
 */
const downloadErrosImportacao = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  
  if (!jobsImportacao[jobId] || !jobsImportacao[jobId].arquivoErros) {
    return res.status(404).json({ 
      message: 'Arquivo de erros não encontrado' 
    });
  }
  
  const arquivoErros = jobsImportacao[jobId].arquivoErros;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=erros_importacao_${jobId}.csv`);
  
  const fileStream = fs.createReadStream(arquivoErros);
  fileStream.pipe(res);
});

/**
 * @desc    Exportar clientes para CSV
 * @route   GET /api/clientes/export
 * @access  Private
 */
const exportarClientes = asyncHandler(async (req, res) => {
  // Implementação futura (nice-to-have)
  res.status(501).json({ message: 'Funcionalidade não implementada' });
});

/**
 * Gera um CSV com os erros de importação
 * @param {Array} erros - Array de erros
 * @returns {string} - Conteúdo do CSV
 */
const gerarCsvErros = (erros) => {
  if (!erros || erros.length === 0) return '';
  
  // Cabeçalhos
  let csv = 'Linha,Motivo,Dados\n';
  
  // Linhas
  erros.forEach(erro => {
    const linha = erro.linha;
    const motivo = erro.motivo.replace(/"/g, '""'); // Escapar aspas
    const dados = JSON.stringify(erro.dados).replace(/"/g, '""');
    
    csv += `${linha},"${motivo}","${dados}"\n`;
  });
  
  return csv;
};

module.exports = {
  importarClientes,
  sincronizarGoogleSheets,
  verificarStatusImportacao,
  downloadErrosImportacao,
  exportarClientes
};