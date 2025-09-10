const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

class LoggingService {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
    this.logger = this.createLogger();
  }

  /**
   * Garante que o diretório de logs existe
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Cria e configura o logger Winston
   */
  createLogger() {
    const logFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.json(),
      format.prettyPrint()
    );

    const consoleFormat = format.combine(
      format.colorize(),
      format.timestamp({ format: 'HH:mm:ss' }),
      format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta, null, 2)}`;
        }
        return log;
      })
    );

    return createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { service: 'crm-medicos' },
      transports: [
        // Console transport para desenvolvimento
        new transports.Console({
          format: consoleFormat,
          level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
        }),

        // Arquivo para todos os logs
        new DailyRotateFile({
          filename: path.join(this.logDir, 'application-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info'
        }),

        // Arquivo específico para erros
        new DailyRotateFile({
          filename: path.join(this.logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error'
        }),

        // Arquivo específico para importações
        new DailyRotateFile({
          filename: path.join(this.logDir, 'import-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '50m',
          maxFiles: '30d',
          level: 'info',
          format: format.combine(
            format.timestamp(),
            format.json(),
            format((info) => {
              return info.category === 'import' ? info : false;
            })()
          )
        })
      ],

      // Tratamento de exceções não capturadas
      exceptionHandlers: [
        new transports.File({ 
          filename: path.join(this.logDir, 'exceptions.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ],

      // Tratamento de rejeições de Promise não capturadas
      rejectionHandlers: [
        new transports.File({ 
          filename: path.join(this.logDir, 'rejections.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });
  }

  /**
   * Log de informação geral
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * Log de aviso
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * Log de erro
   */
  error(message, error = null, meta = {}) {
    const logData = { ...meta };
    
    if (error) {
      logData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      };
    }

    this.logger.error(message, logData);
  }

  /**
   * Log de debug
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * Log específico para importações
   */
  logImport(action, details = {}) {
    this.logger.info(`Import: ${action}`, {
      category: 'import',
      action,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log de auditoria para ações de usuário
   */
  logAudit(userId, action, resource, details = {}) {
    this.logger.info(`Audit: ${action}`, {
      category: 'audit',
      userId,
      action,
      resource,
      timestamp: new Date().toISOString(),
      ip: details.ip,
      userAgent: details.userAgent,
      ...details
    });
  }

  /**
   * Log de performance
   */
  logPerformance(operation, duration, details = {}) {
    this.logger.info(`Performance: ${operation}`, {
      category: 'performance',
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log de validação
   */
  logValidation(type, result, details = {}) {
    const level = result.valido ? 'info' : 'warn';
    this.logger[level](`Validation: ${type}`, {
      category: 'validation',
      type,
      valido: result.valido,
      erros: result.erros?.length || 0,
      avisos: result.avisos?.length || 0,
      score: result.score,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log de integração externa
   */
  logExternalService(service, action, success, details = {}) {
    const level = success ? 'info' : 'error';
    this.logger[level](`External Service: ${service}`, {
      category: 'external_service',
      service,
      action,
      success,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log de segurança
   */
  logSecurity(event, severity, details = {}) {
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    this.logger[level](`Security: ${event}`, {
      category: 'security',
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Cria um logger filho com contexto específico
   */
  child(defaultMeta) {
    return {
      info: (message, meta = {}) => this.info(message, { ...defaultMeta, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...defaultMeta, ...meta }),
      error: (message, error = null, meta = {}) => this.error(message, error, { ...defaultMeta, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { ...defaultMeta, ...meta })
    };
  }

  /**
   * Middleware para logging de requisições HTTP
   */
  httpLogger() {
    return (req, res, next) => {
      const start = Date.now();
      const originalSend = res.send;
      const logger = this;

      res.send = function(data) {
        const duration = Date.now() - start;
        const logData = {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id,
          contentLength: res.get('Content-Length')
        };

        if (res.statusCode >= 400) {
          logger.error(`HTTP ${res.statusCode}: ${req.method} ${req.url}`, null, logData);
        } else {
          logger.info(`HTTP ${res.statusCode}: ${req.method} ${req.url}`, logData);
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Middleware para capturar erros não tratados
   */
  setupUncaughtExceptionHandlers() {
    process.on('uncaughtException', (error) => {
      this.error('Uncaught Exception', error, {
        category: 'system',
        fatal: true
      });
      
      // Dar tempo para o log ser escrito antes de sair
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.error('Unhandled Rejection', reason, {
        category: 'system',
        promise: promise.toString()
      });
    });
  }

  /**
   * Gera relatório de logs
   */
  async generateReport(startDate, endDate, categories = []) {
    // Esta é uma implementação básica
    // Em produção, você poderia usar ferramentas como ELK Stack
    const report = {
      period: { start: startDate, end: endDate },
      categories,
      summary: {
        totalLogs: 0,
        errorCount: 0,
        warnCount: 0,
        infoCount: 0
      },
      topErrors: [],
      performanceMetrics: {},
      securityEvents: []
    };

    // Implementação seria feita lendo os arquivos de log
    // e processando os dados conforme necessário
    
    return report;
  }

  /**
   * Limpa logs antigos
   */
  cleanupOldLogs(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const files = fs.readdirSync(this.logDir);
      
      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.info(`Removed old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('Error cleaning up old logs', error);
    }
  }
}

// Singleton instance
const loggingService = new LoggingService();

// Setup uncaught exception handlers
loggingService.setupUncaughtExceptionHandlers();

module.exports = loggingService;