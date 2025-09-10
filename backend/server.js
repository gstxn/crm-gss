const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config();

// Importar serviços
const loggingService = require('./services/loggingService');
const GoogleSheetsService = require('./services/googleSheetsIntegrationService');

// Inicializar logging
const logger = loggingService;

// Flag para habilitar ou desabilitar rotas administrativas (por padrão habilitado)
const ADMIN_ENABLED = process.env.ADMIN_ENABLED !== 'false';
// Flag para habilitar ou desabilitar o módulo Kanban (por padrão habilitado)
const KANBAN_ENABLED = process.env.KANBAN_ENABLED !== 'false';

// Conectar ao banco de dados
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Inicializar Google Sheets Service (teste de conectividade)
if (process.env.GOOGLE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  const googleSheetsService = new GoogleSheetsService();
  googleSheetsService.testarConectividade()
    .then(resultado => {
      if (resultado.sucesso) {
        logger.info('Google Sheets Integration: Conectividade testada com sucesso');
      } else {
        logger.warn('Google Sheets Integration: Falha no teste de conectividade', resultado.erro);
      }
    })
    .catch(err => {
      logger.error('Google Sheets Integration: Erro ao testar conectividade', err);
    });
} else {
  logger.info('Google Sheets Integration: Credenciais não configuradas - funcionalidade desabilitada');
}

// Inicializar o app Express
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Middleware de logging para requests HTTP
app.use(loggingService.httpLogger());

// Pasta para uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/medicos/import', require('./routes/importacaoMedicoRoutes')); // Rotas para importação e sincronização de médicos
app.use('/api/medicos', require('./routes/medicoRoutes'));
app.use('/api/medicos-disparo', require('./routes/medicoDisparoRoutes')); // Rotas para módulo de disparo
app.use('/api/disparo', require('./routes/medicoDisparoRoutes')); // Alias para API externa de disparo
app.use('/api/clientes', require('./routes/clienteRoutes'));
app.use('/api/clientes', require('./routes/importacaoRoutes')); // Rotas para importação e sincronização de clientes
app.use('/api/oportunidades', require('./routes/oportunidadeRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/mensagens', require('./routes/mensagemRoutes'));
app.use('/api', require('./routes/utilsRoutes')); // Rotas para especialidades, estados e cidades

// Kanban routes (v1) com middleware de feature flag
const kanbanFlagMiddleware = require('./middleware/kanbanFlagMiddleware');
app.use('/api/kanban/v1', kanbanFlagMiddleware, require('./routes/kanbanRoutes'));

// Rotas administrativas
if (ADMIN_ENABLED) {
  app.use('/api/admin/auth', require('./routes/admin/authRoutes'));
  app.use('/api/admin/users', require('./routes/admin/userRoutes'));
  app.use('/api/admin/taxonomias', require('./routes/admin/taxonomiaRoutes'));
  app.use('/api/admin/configuracoes', require('./routes/admin/configuracaoRoutes'));
  app.use('/api/admin/logs', require('./routes/admin/auditLogRoutes'));
  app.use('/api/admin/notificacoes', require('./routes/admin/notificationRoutes'));
  app.use('/api/admin/relatorios', require('./routes/admin/relatorioRoutes'));
}

// Rota básica para teste
app.get('/', (req, res) => {
  res.send('API está funcionando!');
});

// Importar handlers de erro
const { globalErrorHandler, notFoundHandler } = require('./utils/errorHandler');

// Middleware para rotas não encontradas
app.use(notFoundHandler);

// Middleware global de tratamento de erros
app.use(globalErrorHandler);

// Definir porta e iniciar o servidor
const PORT = process.env.PORT || 5000;

// Inicia servidor apenas quando este arquivo é executado diretamente (evita conflito em testes)
if (require.main === module && process.env.NODE_ENV !== 'production') {
  // Iniciar servidor - MongoDB conectado
  const server = app.listen(PORT, () => {
    logger.info(`Servidor iniciado na porta ${PORT}`);
    console.log(`Servidor rodando em modo ${process.env.NODE_ENV} na porta ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM recebido. Iniciando graceful shutdown...');
    server.close(() => {
      logger.info('Servidor HTTP fechado.');
      mongoose.connection.close(false, () => {
        logger.info('Conexão MongoDB fechada.');
        process.exit(0);
      });
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT recebido. Iniciando graceful shutdown...');
    server.close(() => {
      logger.info('Servidor HTTP fechado.');
      mongoose.connection.close(false, () => {
        logger.info('Conexão MongoDB fechada.');
        process.exit(0);
      });
    });
  });
}

// Exportar o app para Vercel
module.exports = app;