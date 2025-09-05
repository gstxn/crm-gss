/**
 * Serviço para processamento de planilhas (CSV/XLSX)
 */
const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const { Readable } = require('stream');

/**
 * Detecta o tipo de arquivo (CSV ou XLSX) com base no buffer
 * @param {Buffer} buffer - Buffer do arquivo
 * @returns {string} - Tipo do arquivo ('csv' ou 'xlsx')
 */
const detectFileType = (buffer) => {
  // Verificar assinatura de arquivo XLSX
  const xlsxSignature = buffer.toString('hex', 0, 4);
  if (xlsxSignature === '504b0304') {
    return 'xlsx';
  }
  
  // Assumir CSV para outros casos
  return 'csv';
};

/**
 * Detecta o delimitador de um arquivo CSV
 * @param {string} csvContent - Conteúdo do CSV
 * @returns {string} - Delimitador detectado (';' ou ',')
 */
const detectCsvDelimiter = (csvContent) => {
  const firstLine = csvContent.split('\n')[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  
  return semicolonCount > commaCount ? ';' : ',';
};

/**
 * Processa um arquivo CSV
 * @param {Buffer} buffer - Buffer do arquivo CSV
 * @returns {Promise<Array>} - Array com os dados do CSV
 */
const processarCsv = async (buffer) => {
  const csvContent = buffer.toString('utf-8');
  const delimiter = detectCsvDelimiter(csvContent);
  
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from([csvContent]);
    
    stream
      .pipe(csv({ separator: delimiter }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

/**
 * Processa um arquivo XLSX
 * @param {Buffer} buffer - Buffer do arquivo XLSX
 * @returns {Array} - Array com os dados do XLSX
 */
const processarXlsx = (buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  return xlsx.utils.sheet_to_json(worksheet, { header: 1 });
};

/**
 * Processa um arquivo de planilha (CSV ou XLSX)
 * @param {Buffer} buffer - Buffer do arquivo
 * @returns {Promise<{headers: Array, rows: Array}>} - Cabeçalhos e linhas da planilha
 */
const parsePlanilha = async (buffer) => {
  try {
    const fileType = detectFileType(buffer);
    let data;
    
    if (fileType === 'csv') {
      data = await processarCsv(buffer);
      
      // Para CSV, os cabeçalhos já estão incluídos como chaves nos objetos
      if (data.length === 0) {
        return { headers: [], rows: [] };
      }
      
      const headers = Object.keys(data[0]);
      return { headers, rows: data };
    } else {
      // XLSX
      const rawData = processarXlsx(buffer);
      
      if (rawData.length === 0) {
        return { headers: [], rows: [] };
      }
      
      const headers = rawData[0];
      const rows = [];
      
      // Converter linhas em objetos com cabeçalhos como chaves
      for (let i = 1; i < rawData.length; i++) {
        const row = {};
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = rawData[i][j];
        }
        rows.push(row);
      }
      
      return { headers, rows };
    }
  } catch (error) {
    console.error('Erro ao processar planilha:', error);
    throw new Error(`Erro ao processar planilha: ${error.message}`);
  }
};

module.exports = {
  parsePlanilha,
  detectFileType
};