const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config();

// Flag para habilitar ou desabilitar rotas administrativas (por padrão habilitado)
const ADMIN_ENABLED = process.env.ADMIN_ENABLED !== 'false';
// Flag para habilitar ou desabilitar o módulo Kanban (por padrão habilitado)
const KANBAN_ENABLED = process.env.KANBAN_ENABLED !== 'false';

// Conectar ao banco de dados
connectDB();

// Inicializar o app Express
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Pasta para uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/medicos', require('./routes/medicoRoutes'));
app.use('/api/clientes', require('./routes/clienteRoutes'));
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

// Tratamento de erros para rotas não encontradas
app.use((req, res, next) => {
  const error = new Error(`Não encontrado - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Definir porta e iniciar o servidor
const PORT = process.env.PORT || 5000;

// Para compatibilidade com Vercel, verificamos se estamos em produção
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em modo ${process.env.NODE_ENV} na porta ${PORT}`);
  });
}

// Exportar o app para Vercel
module.exports = app;