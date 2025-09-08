const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Teste de importação para debug
async function testarImportacao() {
  try {
    console.log('=== TESTE DE IMPORTAÇÃO - DEBUG ===');
    
    // 1. Primeiro fazer login para obter token válido
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:5000/api/users/login', {
      username: 'admin@crm.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Token obtido:', token ? 'SIM' : 'NÃO');
    console.log('Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'N/A');
    
    // 2. Criar arquivo CSV de teste
    console.log('2. Criando arquivo CSV de teste...');
    const csvContent = `nome,telefone,especialidade,email\nDr. João Silva,11999999999,Cardiologia,joao@teste.com\nDra. Maria Santos,11888888888,Pediatria,maria@teste.com`;
    const testFilePath = path.join(__dirname, 'test-import-temp.csv');
    fs.writeFileSync(testFilePath, csvContent);
    console.log('Arquivo criado:', testFilePath);
    
    // 3. Preparar FormData
    console.log('3. Preparando FormData...');
    const formData = new FormData();
    formData.append('arquivo', fs.createReadStream(testFilePath));
    
    // 4. Fazer requisição de importação
    console.log('4. Enviando requisição de importação...');
    const importResponse = await axios.post(
      'http://localhost:5000/api/medicos-disparo/importar',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ SUCESSO!');
    console.log('Resposta:', importResponse.data);
    
    // Limpar arquivo temporário
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    console.log('❌ ERRO CAPTURADO:');
    console.log('Tipo do erro:', error.constructor.name);
    console.log('Status:', error.response?.status);
    console.log('Mensagem:', error.message);
    console.log('Code:', error.code);
    console.log('Headers da resposta:', error.response?.headers);
    if (error.response?.data) {
      console.log('Dados completos do erro:', error.response.data);
    }
    console.log('Stack trace:', error.stack);
    
    // Limpar arquivo temporário mesmo em caso de erro
    const testFilePath = path.join(__dirname, 'test-import-temp.csv');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

// Executar teste
testarImportacao();