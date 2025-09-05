/**
 * Serviço para integração com Google Sheets
 */
const { google } = require('googleapis');

/**
 * Configura a autenticação com o Google Sheets usando Service Account
 * @returns {Object} - Cliente autenticado do Google Sheets
 */
const getGoogleSheetsClient = () => {
  try {
    // Verificar se as variáveis de ambiente necessárias estão definidas
    const serviceAccountJson = process.env.GSHEETS_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountJson) {
      throw new Error('Variável de ambiente GSHEETS_SERVICE_ACCOUNT_JSON não definida');
    }
    
    let credentials;
    
    try {
      // Tentar interpretar como JSON direto
      credentials = JSON.parse(serviceAccountJson);
    } catch (e) {
      // Se falhar, assumir que é um caminho para o arquivo
      const fs = require('fs');
      const path = require('path');
      const filePath = path.resolve(serviceAccountJson);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo de credenciais não encontrado: ${filePath}`);
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      credentials = JSON.parse(fileContent);
    }
    
    // Criar cliente JWT com as credenciais
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );
    
    // Criar cliente do Sheets
    const sheets = google.sheets({ version: 'v4', auth });
    
    return sheets;
  } catch (error) {
    console.error('Erro ao configurar cliente do Google Sheets:', error);
    throw new Error(`Falha ao autenticar no Google Sheets: ${error.message}`);
  }
};

/**
 * Lê dados de uma planilha do Google Sheets
 * @returns {Promise<Array>} - Dados da planilha
 */
const lerPlanilhaGoogle = async () => {
  try {
    // Verificar se as variáveis de ambiente necessárias estão definidas
    const spreadsheetId = process.env.GSHEETS_SPREADSHEET_ID;
    const range = process.env.GSHEETS_RANGE_CLIENTES;
    
    if (!spreadsheetId || !range) {
      throw new Error('Variáveis de ambiente GSHEETS_SPREADSHEET_ID ou GSHEETS_RANGE_CLIENTES não definidas');
    }
    
    // Obter cliente autenticado
    const sheets = getGoogleSheetsClient();
    
    // Ler dados da planilha
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    
    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return { headers: [], rows: [] };
    }
    
    // Extrair cabeçalhos (primeira linha)
    const headers = rows[0];
    
    // Converter linhas em objetos
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const obj = {};
      
      // Mapear valores para cabeçalhos
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = row[j] || '';
      }
      
      data.push(obj);
    }
    
    return { headers, rows: data };
  } catch (error) {
    console.error('Erro ao ler planilha do Google Sheets:', error);
    throw new Error(`Falha ao ler planilha do Google Sheets: ${error.message}`);
  }
};

module.exports = {
  lerPlanilhaGoogle
};