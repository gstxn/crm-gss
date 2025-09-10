# Configuração do Google Sheets Integration

Este documento descreve como configurar a integração com Google Sheets para importação de dados de médicos.

## Pré-requisitos

1. Conta do Google Cloud Platform (GCP)
2. Projeto no GCP com APIs habilitadas
3. Service Account configurado
4. Planilhas do Google Sheets com dados de médicos

## Passo 1: Configurar Projeto no Google Cloud

### 1.1 Criar/Selecionar Projeto
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o Project ID

### 1.2 Habilitar APIs
Habilite as seguintes APIs no seu projeto:
- Google Sheets API
- Google Drive API

```bash
# Via gcloud CLI
gcloud services enable sheets.googleapis.com
gcloud services enable drive.googleapis.com
```

Ou via Console:
1. Vá para "APIs & Services" > "Library"
2. Procure e habilite "Google Sheets API"
3. Procure e habilite "Google Drive API"

## Passo 2: Criar Service Account

### 2.1 Criar Service Account
1. Vá para "IAM & Admin" > "Service Accounts"
2. Clique em "Create Service Account"
3. Preencha:
   - **Name**: `crm-medicos-sheets-integration`
   - **Description**: `Service Account para integração CRM com Google Sheets`
4. Clique em "Create and Continue"

### 2.2 Configurar Permissões
Não são necessárias permissões especiais do projeto para este caso de uso.

### 2.3 Gerar Chave
1. Na lista de Service Accounts, clique no email da conta criada
2. Vá para a aba "Keys"
3. Clique em "Add Key" > "Create new key"
4. Selecione "JSON" e clique em "Create"
5. Salve o arquivo JSON baixado em local seguro

## Passo 3: Configurar Variáveis de Ambiente

### Opção 1: Arquivo de Credenciais
```bash
# .env
GOOGLE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json
```

### Opção 2: JSON Completo
```bash
# .env
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"..."}'
```

### Opção 3: Variáveis Individuais
```bash
# .env
GOOGLE_PROJECT_ID=seu-project-id
GOOGLE_CLIENT_EMAIL=crm-medicos-sheets@seu-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Passo 4: Configurar Planilhas

### 4.1 Compartilhar Planilha
1. Abra a planilha do Google Sheets
2. Clique em "Compartilhar"
3. Adicione o email do Service Account (ex: `crm-medicos-sheets@seu-project.iam.gserviceaccount.com`)
4. Defina permissão como "Viewer" ou "Editor" conforme necessário

### 4.2 Estrutura Recomendada da Planilha

#### Cabeçalhos Sugeridos (Linha 1):
```
Nome | CRM | UF_CRM | CPF | Email | Telefone | Especialidade | Cidade | UF | RQE | Subespecialidades | Hospitais
```

#### Exemplo de Dados:
```
Dr. João Silva | 12345 | SP | 123.456.789-00 | joao@email.com | (11) 99999-9999 | Cardiologia | São Paulo | SP | 1001,1002 | Hemodinâmica,Arritmia | Hospital A,Clínica B
```

### 4.3 Boas Práticas
- Use a primeira linha para cabeçalhos
- Mantenha dados consistentes (formato de telefone, CPF, etc.)
- Para campos múltiplos (RQE, Subespecialidades), use vírgula como separador
- Evite células mescladas
- Remova linhas vazias entre dados

## Passo 5: Testar Integração

### 5.1 Teste de Conectividade
```javascript
const GoogleSheetsService = require('./services/googleSheetsIntegrationService');
const service = new GoogleSheetsService();

// Testar conectividade
const resultado = await service.testarConectividade();
console.log(resultado);
```

### 5.2 Teste de Leitura
```javascript
// Ler dados de uma planilha
const spreadsheetId = 'ID_DA_SUA_PLANILHA';
const dados = await service.lerDadosAba(spreadsheetId, 'Médicos');
console.log(dados);
```

## Passo 6: Configuração de Produção

### 6.1 Segurança
- **NUNCA** commite arquivos de credenciais no repositório
- Use variáveis de ambiente ou serviços de secrets
- Rotacione chaves periodicamente
- Monitore uso das APIs

### 6.2 Monitoramento
- Configure alertas para falhas de API
- Monitore quotas e limites
- Implemente logs detalhados

### 6.3 Backup
- Mantenha backup das configurações
- Documente todas as planilhas integradas
- Teste recuperação de desastres

## Limites e Quotas

### Google Sheets API
- **Requests por minuto por usuário**: 300
- **Requests por 100 segundos por usuário**: 300
- **Requests por dia**: 50,000,000

### Boas Práticas para Limites
- Implemente retry com backoff exponencial
- Use batch requests quando possível
- Cache dados quando apropriado
- Monitore uso de quota

## Troubleshooting

### Erro: "The caller does not have permission"
- Verifique se a planilha foi compartilhada com o Service Account
- Confirme se as APIs estão habilitadas
- Verifique se as credenciais estão corretas

### Erro: "Spreadsheet not found"
- Verifique se o ID da planilha está correto
- Confirme se a planilha existe e está acessível
- Teste com uma planilha pública primeiro

### Erro: "Invalid credentials"
- Verifique se o arquivo JSON está correto
- Confirme se as variáveis de ambiente estão definidas
- Teste a autenticação isoladamente

### Erro: "Quota exceeded"
- Implemente rate limiting
- Use cache para reduzir requests
- Considere usar batch operations

## Exemplo de Uso Completo

```javascript
const GoogleSheetsService = require('./services/googleSheetsIntegrationService');

async function exemploCompleto() {
  const service = new GoogleSheetsService();
  
  try {
    // 1. Testar conectividade
    const conectividade = await service.testarConectividade();
    if (!conectividade.sucesso) {
      throw new Error('Falha na conectividade');
    }
    
    // 2. Obter informações da planilha
    const spreadsheetId = 'SEU_SPREADSHEET_ID';
    const info = await service.obterInfoPlanilha(spreadsheetId);
    console.log('Planilha:', info.title);
    
    // 3. Listar abas
    const abas = await service.listarAbas(spreadsheetId);
    console.log('Abas disponíveis:', abas.map(a => a.title));
    
    // 4. Sincronizar médicos
    const resultado = await service.sincronizarMedicos(spreadsheetId, {
      nomeAba: 'Médicos',
      validarAntes: true,
      processarLotes: true
    });
    
    console.log('Sincronização concluída:', resultado);
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

exemploCompleto();
```

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs da aplicação
2. Consulte a documentação oficial do Google Sheets API
3. Teste com dados de exemplo primeiro
4. Entre em contato com a equipe de desenvolvimento

## Referências

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Cloud Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [google-spreadsheet npm package](https://www.npmjs.com/package/google-spreadsheet)