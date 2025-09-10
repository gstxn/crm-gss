# 📊 Integração Google Sheets - CRM Médicos

Este documento descreve a funcionalidade completa de integração com Google Sheets para importação e sincronização de dados de médicos no sistema CRM.

## 🎯 Visão Geral

A integração permite:
- **Importação manual** de planilhas do Google Sheets
- **Sincronização automática** com planilhas específicas
- **Validação robusta** de dados antes da importação
- **Mapeamento flexível** de colunas
- **Logs detalhados** de todas as operações
- **Tratamento de erros** com relatórios específicos

## 🏗️ Arquitetura

### Backend Components

```
backend/
├── controllers/
│   └── importacaoMedicoController.js    # Endpoints de importação
├── services/
│   ├── googleSheetsIntegrationService.js # Integração Google Sheets
│   ├── validacaoMedicoService.js        # Validações específicas
│   ├── mapeamentoMedicoService.js       # Mapeamento de dados
│   └── loggingService.js                # Sistema de logs
├── middleware/
│   └── validacaoMedicoMiddleware.js     # Middleware de validação
├── routes/
│   └── importacaoMedicoRoutes.js        # Rotas de importação
├── utils/
│   └── errorHandler.js                  # Tratamento de erros
└── config/
    ├── google-sheets-setup.md           # Guia de configuração
    └── .env.example                     # Template de variáveis
```

### Frontend Components

```
frontend/
├── components/
│   └── ImportacaoMedicoModal.js         # Modal de importação
├── pages/
│   └── Medicos.js                       # Página principal (modificada)
└── styles/
    └── Medicos.css                      # Estilos (modificados)
```

## 🚀 Configuração Inicial

### 1. Instalar Dependências

```bash
cd backend
npm install google-spreadsheet joi winston winston-daily-rotate-file
```

### 2. Configurar Google Cloud

Siga o guia detalhado em [`backend/config/google-sheets-setup.md`](./backend/config/google-sheets-setup.md)

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp backend/config/.env.example backend/.env

# Editar com suas configurações
nano backend/.env
```

**Configurações essenciais:**
```env
# Google Sheets (escolha uma opção)
GOOGLE_SERVICE_ACCOUNT_PATH=./config/service-account.json
# OU
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# Logs
LOG_LEVEL=info
LOG_DIR=./logs

# Limites
MAX_IMPORT_RECORDS=1000
BATCH_SIZE=100
```

## 📋 Como Usar

### 1. Preparar Planilha Google Sheets

#### Estrutura Recomendada:
| Nome | CRM | UF_CRM | CPF | Email | Telefone | Especialidade | Cidade | UF |
|------|-----|--------|-----|-------|----------|---------------|--------|----|
| Dr. João Silva | 12345 | SP | 123.456.789-00 | joao@email.com | (11) 99999-9999 | Cardiologia | São Paulo | SP |

#### Campos Opcionais:
| RQE | Subespecialidades | Hospitais |
|-----|-------------------|----------|
| 1001,1002 | Hemodinâmica,Arritmia | Hospital A,Clínica B |

### 2. Compartilhar Planilha

1. Abra a planilha no Google Sheets
2. Clique em "Compartilhar"
3. Adicione o email do Service Account
4. Defina permissão como "Viewer" ou "Editor"

### 3. Importar via Interface

#### Opção A: Importação Manual
1. Acesse a página "Médicos" no CRM
2. Clique no botão "📊 Importar Planilha"
3. Cole o ID da planilha Google Sheets
4. Selecione a aba desejada
5. Configure o mapeamento de colunas
6. Execute a importação

#### Opção B: Sincronização Automática
1. Clique no botão "🔄 Sincronizar Sheets"
2. Configure a planilha para sincronização
3. Defina frequência (manual/automática)
4. Ative a sincronização

## 🔧 API Endpoints

### Importação Manual
```http
POST /api/medicos/import
Content-Type: application/json

{
  "tipo": "google-sheets",
  "spreadsheetId": "1ABC...XYZ",
  "nomeAba": "Médicos",
  "mapeamento": {
    "nome": "A",
    "crm": "B",
    "uf_crm": "C",
    "cpf": "D",
    "email": "E"
  },
  "opcoes": {
    "validarAntes": true,
    "processarLotes": true,
    "tamanhoLote": 100
  }
}
```

### Sincronização Google Sheets
```http
POST /api/medicos/import/sync-sheets
Content-Type: application/json

{
  "spreadsheetId": "1ABC...XYZ",
  "nomeAba": "Médicos",
  "configuracao": {
    "automatica": true,
    "intervalo": "diario",
    "horario": "02:00"
  }
}
```

### Status da Importação
```http
GET /api/medicos/import/status/{importId}
```

### Download de Erros
```http
GET /api/medicos/import/download-errors/{importId}
```

## 🔍 Validações Implementadas

### Validações Obrigatórias
- **Nome**: Mínimo 2 caracteres, máximo 100
- **CRM**: Formato numérico, único por UF
- **UF CRM**: Código válido de estado brasileiro
- **CPF**: Formato e dígitos verificadores válidos
- **Email**: Formato válido e único no sistema

### Validações Opcionais
- **Telefone**: Formato brasileiro válido
- **CEP**: Formato brasileiro (quando informado)
- **RQE**: Números válidos (quando informado)
- **Especialidades**: Códigos válidos do CFM

### Regras de Negócio
- **Deduplicação**: CRM+UF > CPF > Email > Nome+Telefone
- **Upsert**: Atualiza registros existentes ou cria novos
- **Validação em lote**: Processa até 100 registros por vez
- **Rollback**: Desfaz importação em caso de erro crítico

## 📊 Monitoramento e Logs

### Tipos de Log
- **Import**: Operações de importação
- **Validation**: Validações de dados
- **External Service**: Chamadas para Google Sheets API
- **Audit**: Auditoria de alterações
- **Performance**: Métricas de performance
- **Security**: Eventos de segurança

### Localização dos Logs
```
logs/
├── combined.log              # Todos os logs
├── error.log                 # Apenas erros
├── import/
│   ├── import-2024-01-15.log # Logs de importação por data
│   └── import-2024-01-16.log
├── audit/
│   └── audit-2024-01-15.log  # Logs de auditoria
└── performance/
    └── perf-2024-01-15.log   # Logs de performance
```

### Consultar Logs
```bash
# Logs de importação do dia
tail -f logs/import/import-$(date +%Y-%m-%d).log

# Erros recentes
tail -f logs/error.log

# Logs de uma importação específica
grep "import-id-123" logs/combined.log
```

## 🚨 Tratamento de Erros

### Tipos de Erro

#### Erros de Conectividade
- **Causa**: Falha na conexão com Google Sheets API
- **Ação**: Retry automático com backoff exponencial
- **Log**: External Service

#### Erros de Validação
- **Causa**: Dados inválidos na planilha
- **Ação**: Relatório detalhado de erros
- **Log**: Validation

#### Erros de Negócio
- **Causa**: Violação de regras de negócio
- **Ação**: Rollback parcial ou total
- **Log**: Import + Audit

#### Erros de Sistema
- **Causa**: Falhas internas (DB, memória, etc.)
- **Ação**: Rollback completo
- **Log**: Error + Import

### Códigos de Erro

| Código | Descrição | Ação |
|--------|-----------|-------|
| SHEETS_001 | Planilha não encontrada | Verificar ID e permissões |
| SHEETS_002 | Aba não encontrada | Verificar nome da aba |
| SHEETS_003 | Quota excedida | Aguardar reset da quota |
| VALID_001 | CPF inválido | Corrigir CPF na planilha |
| VALID_002 | CRM duplicado | Verificar duplicatas |
| VALID_003 | Email inválido | Corrigir formato do email |
| BUSINESS_001 | Médico já existe | Decidir se atualiza ou ignora |
| SYSTEM_001 | Erro de banco de dados | Verificar conectividade |

## 🔧 Troubleshooting

### Problemas Comuns

#### "The caller does not have permission"
```bash
# Verificar se planilha foi compartilhada
# Verificar se Service Account tem acesso
# Testar com planilha pública primeiro
```

#### "Spreadsheet not found"
```bash
# Verificar ID da planilha
# Confirmar se planilha existe
# Testar conectividade
node -e "require('./services/googleSheetsIntegrationService').testarConectividade()"
```

#### "Quota exceeded"
```bash
# Verificar uso da quota no Google Cloud Console
# Implementar rate limiting
# Usar cache para reduzir requests
```

#### Importação lenta
```bash
# Reduzir tamanho do lote
# Verificar logs de performance
# Otimizar queries do banco
```

### Comandos de Diagnóstico

```bash
# Testar conectividade Google Sheets
node -e "require('./services/googleSheetsIntegrationService').testarConectividade().then(console.log)"

# Verificar logs de erro
tail -n 50 logs/error.log

# Status do sistema
node -e "console.log(process.memoryUsage())"

# Testar validação
node -e "require('./services/validacaoMedicoService').validarMedico({nome:'Teste'}).then(console.log)"
```

## 📈 Performance

### Otimizações Implementadas

- **Processamento em lotes**: Até 100 registros por vez
- **Validação assíncrona**: Não bloqueia interface
- **Cache de validações**: Evita revalidações desnecessárias
- **Conexão persistente**: Reutiliza conexões com Google Sheets
- **Índices de banco**: Otimiza consultas de deduplicação

### Métricas Monitoradas

- **Tempo de importação**: Por lote e total
- **Taxa de sucesso**: Registros processados vs. erros
- **Uso de memória**: Durante processamento
- **Requests para Google**: Quantidade e tempo de resposta
- **Performance do banco**: Tempo de queries

### Limites Recomendados

| Métrica | Desenvolvimento | Produção |
|---------|----------------|----------|
| Registros por importação | 500 | 1000 |
| Tamanho do lote | 50 | 100 |
| Timeout de importação | 5 min | 10 min |
| Requests por minuto | 100 | 300 |

## 🔐 Segurança

### Medidas Implementadas

- **Autenticação**: JWT obrigatório para todas as operações
- **Autorização**: Verificação de permissões por usuário
- **Validação de entrada**: Sanitização de todos os dados
- **Rate limiting**: Limite de requests por IP/usuário
- **Logs de auditoria**: Registro de todas as alterações
- **Criptografia**: Dados sensíveis criptografados

### Boas Práticas

- **Credenciais**: Nunca commitar no repositório
- **Rotação**: Rotacionar chaves periodicamente
- **Monitoramento**: Alertas para atividades suspeitas
- **Backup**: Backup antes de importações grandes
- **Teste**: Testar com dados de exemplo primeiro

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Testes específicos
npm test -- --grep "Google Sheets"

# Testes de integração
npm run test:integration

# Coverage
npm run test:coverage
```

### Testes Manuais

```bash
# Testar com planilha de exemplo
curl -X POST http://localhost:5000/api/medicos/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "tipo": "google-sheets",
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "nomeAba": "Class Data"
  }'
```

## 📚 Referências

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [google-spreadsheet npm package](https://www.npmjs.com/package/google-spreadsheet)
- [Winston Logging Library](https://github.com/winstonjs/winston)
- [Joi Validation Library](https://joi.dev/)
- [Express.js Documentation](https://expressjs.com/)

## 🤝 Contribuição

Para contribuir com melhorias:

1. **Fork** o repositório
2. **Crie** uma branch para sua feature
3. **Implemente** as mudanças com testes
4. **Documente** as alterações
5. **Submeta** um Pull Request

### Padrões de Código

- **ESLint**: Seguir configuração do projeto
- **Comentários**: Documentar funções complexas
- **Testes**: Cobertura mínima de 80%
- **Logs**: Usar níveis apropriados
- **Erros**: Tratamento consistente

---

**Desenvolvido com ❤️ para o CRM GSS**

*Para suporte técnico, consulte os logs ou entre em contato com a equipe de desenvolvimento.*