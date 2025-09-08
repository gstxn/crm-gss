# Módulo Médicos (Disparo)

Este módulo foi criado para gerenciar contatos mínimos para envio em massa, separado do módulo oficial de médicos, sem obrigar campos como CRM/UF.

## Estrutura de Dados

### Tabela: medicos_disparo

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| nome | String | Não | Nome do médico (mapeado de Cliente) |
| telefone | String | Sim | Telefone único normalizado (10-13 dígitos) |
| especialidades | Array | Não | Lista de especialidades (mapeado de Tags) |
| canal | String | Não | Canal de origem (mapeado de Canal) |
| email | String | Não | Email validado (mapeado de E-mail) |
| estado | String | Não | Estado (UF) do médico - 2 letras maiúsculas (mapeado de Estado/UF) |
| origem_registro | Enum | Sim | xlsx_upload, google_sheets_sync, manual |
| permitido_envio | Boolean | Sim | Default: true |
| status_contato | Enum | Sim | novo, fila, enviado, falha, opt_out |
| ultima_interacao_em | Date | Não | Data da última interação |
| total_envios | Number | Sim | Default: 0 |
| observacoes | Text | Não | Observações gerais |

### Índices
- Índice único em `telefone`
- Índice composto em `status_contato` e `permitido_envio`
- Índice em `especialidades`

## Endpoints da API

### Rotas Principais (/api/medicos-disparo)

#### Leitura (Roles: admin, operador_disparo, leitura)
- `GET /` - Listar médicos com filtros
- `GET /estatisticas` - Obter estatísticas
- `GET /:id` - Obter médico por ID
- `GET /exportar` - Exportar para disparo (CSV/JSON)

#### Escrita (Roles: admin, operador_disparo)
- `POST /` - Criar médico
- `PUT /:id` - Atualizar médico
- `DELETE /:id` - Excluir médico

#### Ações em Massa (Roles: admin, operador_disparo)
- `POST /acao-massa` - Executar ações em massa
  - Adicionar à fila
  - Marcar como enviado
  - Marcar opt-out
  - Excluir selecionados

#### Importação (Roles: admin, operador_disparo)
- `POST /importar` - Upload e importação de arquivo XLSX/CSV
- `POST /sincronizar` - Sincronizar planilha

### Rotas de Disparo (/api/disparo)

#### Públicas (com rate limiting)
- `GET /contatos` - Obter contatos para disparo
- `GET /especialidades` - Listar especialidades disponíveis
- `GET /estatisticas` - Estatísticas públicas

#### Autenticadas (Roles: admin, operador_disparo)
- `POST /marcar-enviado` - Marcar contatos como enviados
- `POST /marcar-falha` - Marcar contatos com falha

## Funcionalidades da Interface

### Página Principal
- Lista de médicos com colunas: nome, telefone, especialidades, status_contato, ultima_interacao_em, total_envios
- Filtros rápidos:
  - Por especialidades (multiseleção)
  - Por status_contato
  - Por presença de email
- Paginação e busca

### Ações Disponíveis
- **Ações em Massa**: Adicionar à Fila, Marcar como Enviado, Marcar Opt-out, Excluir selecionados
- **Exportar para Disparo**: Gera arquivo com telefone e especialidades
- **Sincronizar Planilha**: Reimporta dados da última fonte
- **Upload Manual**: Importação de arquivos XLSX/CSV

## Mapeamento de Importação

### Cabeçalhos Aceitos
| Cabeçalho na Planilha | Campo no Sistema |
|----------------------|------------------|
| Cliente | nome |
| Contato | telefone |
| Tags | especialidades |
| Canal | canal |
| E-mail | email |
| Estado/UF | estado |

### Regras de Processamento
1. **Normalização de Telefone**: Remove espaços, máscaras, mantém apenas dígitos
2. **Validação**: 10-13 dígitos, aceita formato BR com DDI/DDD
3. **Especialidades**: Split por vírgula (,) ou ponto e vírgula (;)
4. **Deduplicação**: Merge por telefone, preserva especialidades existentes
5. **Email**: Validação de formato

## Regras de Negócio

### Para Disparo
- Só permite envio quando `permitido_envio=true` e `status_contato ∈ {novo, fila}`
- Ao marcar "Enviado": `status_contato=enviado`, `ultima_interacao_em=now()`, `total_envios += 1`
- "Opt-out": `permitido_envio=false`, `status_contato=opt_out`

### Permissões
- **operador_disparo**: Pode importar, sincronizar, editar permitido_envio, ações em massa
- **leitura**: Apenas visualizar e exportar
- **admin**: Acesso total

## Segurança

### Rate Limiting
- Endpoints públicos: 100 requests/15min por IP
- Endpoints de atualização: 50 requests/15min por IP

### CORS
- Configurado para permitir acesso de domínios autorizados
- Headers apropriados para APIs REST

### Validação
- Validação de telefone com regex
- Validação de email com regex
- Sanitização de dados de entrada
- Prevenção de injeção NoSQL

## Auditoria

### Logs de Importação
- Quem importou
- Quando foi importado
- Fonte dos dados
- Resumo do job (inseridos, atualizados, ignorados)

### Logs de Ações
- Ações em massa executadas
- Alterações de status
- Exportações realizadas

## Exemplos de Uso

### Importação via CSV
```csv
Cliente,Contato,Tags,Canal,E-mail,Código
Dr. João Silva,11999887766,"Cardiologia,Clínica Geral",WhatsApp,joao@email.com,MED001
Dra. Maria Santos,21988776655,Pediatria,Telefone,maria@email.com,MED002
```

### Consulta de Contatos para Disparo
```bash
GET /api/disparo/contatos?especialidade=Cardiologia&status=novo&formato=json
```

### Resposta
```json
{
  "success": true,
  "total": 150,
  "pagina": 1,
  "por_pagina": 50,
  "contatos": [
    {
      "telefone": "5511999887766",
      "especialidades": ["Cardiologia", "Clínica Geral"]
    }
  ]
}
```

## Testes

### Casos de Teste Implementados
1. Importação com dados mínimos (apenas Contato e Tags)
2. Deduplicação por telefone e merge de especialidades
3. Exportação retorna apenas campos necessários
4. Validação de telefone e email
5. Ações em massa
6. Permissões por role

## Instalação e Configuração

1. O modelo será criado automaticamente no MongoDB
2. Certifique-se de que as variáveis de ambiente estão configuradas
3. Execute as migrações se necessário
4. Configure as permissões de usuário apropriadas

## Monitoramento

### Métricas Importantes
- Total de contatos ativos
- Taxa de sucesso de envios
- Contatos em opt-out
- Volume de importações
- Erros de validação

### Alertas
- Alto volume de falhas de envio
- Muitos contatos em opt-out
- Erros de importação recorrentes
- Rate limiting atingido frequentemente