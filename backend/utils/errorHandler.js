/**
 * Classe personalizada para erros da aplicação
 */
class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Classe para erros de validação
 */
class ValidationError extends AppError {
  constructor(message, errors = [], code = 'VALIDATION_ERROR') {
    super(message, 400, code);
    this.errors = errors;
    this.type = 'validation';
  }
}

/**
 * Classe para erros de negócio
 */
class BusinessError extends AppError {
  constructor(message, code = 'BUSINESS_ERROR', details = null) {
    super(message, 422, code, details);
    this.type = 'business';
  }
}

/**
 * Classe para erros de recursos não encontrados
 */
class NotFoundError extends AppError {
  constructor(resource = 'Recurso', id = null) {
    const message = id ? `${resource} com ID '${id}' não encontrado` : `${resource} não encontrado`;
    super(message, 404, 'NOT_FOUND');
    this.type = 'not_found';
    this.resource = resource;
    this.resourceId = id;
  }
}

/**
 * Classe para erros de autorização
 */
class AuthorizationError extends AppError {
  constructor(message = 'Acesso negado', code = 'UNAUTHORIZED') {
    super(message, 403, code);
    this.type = 'authorization';
  }
}

/**
 * Classe para erros de autenticação
 */
class AuthenticationError extends AppError {
  constructor(message = 'Credenciais inválidas', code = 'UNAUTHENTICATED') {
    super(message, 401, code);
    this.type = 'authentication';
  }
}

/**
 * Classe para erros de rate limiting
 */
class RateLimitError extends AppError {
  constructor(message = 'Muitas tentativas. Tente novamente mais tarde.', retryAfter = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.type = 'rate_limit';
    this.retryAfter = retryAfter;
  }
}

/**
 * Classe para erros de integração externa
 */
class ExternalServiceError extends AppError {
  constructor(service, message = 'Erro no serviço externo', originalError = null) {
    super(message, 503, 'EXTERNAL_SERVICE_ERROR');
    this.type = 'external_service';
    this.service = service;
    this.originalError = originalError;
  }
}

/**
 * Utilitários para tratamento de erros
 */
class ErrorUtils {
  /**
   * Converte erro do Mongoose para AppError
   */
  static handleMongooseError(error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      return new ValidationError('Erro de validação do banco de dados', errors, 'MONGOOSE_VALIDATION_ERROR');
    }

    if (error.name === 'CastError') {
      return new ValidationError(`Valor inválido para o campo '${error.path}': ${error.value}`, [], 'MONGOOSE_CAST_ERROR');
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return new BusinessError(`Registro já existe com ${field}: ${value}`, 'DUPLICATE_KEY_ERROR', {
        field,
        value,
        index: error.index
      });
    }

    if (error.name === 'MongoNetworkError') {
      return new ExternalServiceError('MongoDB', 'Erro de conexão com o banco de dados', error);
    }

    return new AppError('Erro interno do banco de dados', 500, 'DATABASE_ERROR', {
      name: error.name,
      message: error.message
    });
  }

  /**
   * Converte erro de validação do Joi para AppError
   */
  static handleJoiError(error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    return new ValidationError('Erro de validação dos dados', errors, 'JOI_VALIDATION_ERROR');
  }

  /**
   * Converte erro de multer para AppError
   */
  static handleMulterError(error) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return new ValidationError('Arquivo muito grande', [], 'FILE_TOO_LARGE');
      case 'LIMIT_FILE_COUNT':
        return new ValidationError('Muitos arquivos enviados', [], 'TOO_MANY_FILES');
      case 'LIMIT_UNEXPECTED_FILE':
        return new ValidationError('Campo de arquivo inesperado', [], 'UNEXPECTED_FILE_FIELD');
      default:
        return new ValidationError('Erro no upload do arquivo', [], 'FILE_UPLOAD_ERROR');
    }
  }

  /**
   * Sanitiza erro para resposta da API
   */
  static sanitizeError(error, includeStack = false) {
    const sanitized = {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      type: error.type || 'unknown'
    };

    // Adicionar detalhes específicos baseados no tipo do erro
    if (error instanceof ValidationError && error.errors?.length > 0) {
      sanitized.details = { errors: error.errors };
    } else if (error.details) {
      sanitized.details = error.details;
    }

    // Adicionar informações específicas para alguns tipos de erro
    if (error instanceof NotFoundError) {
      sanitized.resource = error.resource;
      if (error.resourceId) {
        sanitized.resourceId = error.resourceId;
      }
    }

    if (error instanceof RateLimitError) {
      sanitized.retryAfter = error.retryAfter;
    }

    if (error instanceof ExternalServiceError) {
      sanitized.service = error.service;
    }

    // Incluir stack trace apenas em desenvolvimento
    if (includeStack && error.stack) {
      sanitized.stack = error.stack;
    }

    return sanitized;
  }

  /**
   * Determina se o erro deve ser logado
   */
  static shouldLogError(error) {
    // Não logar erros operacionais de baixa severidade
    if (error.isOperational) {
      return error.statusCode >= 500;
    }
    // Sempre logar erros não operacionais
    return true;
  }

  /**
   * Gera ID único para rastreamento de erros
   */
  static generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Formata erro para log
   */
  static formatErrorForLog(error, errorId, context = {}) {
    return {
      errorId,
      timestamp: new Date().toISOString(),
      message: error.message,
      code: error.code,
      type: error.type,
      statusCode: error.statusCode,
      stack: error.stack,
      context,
      isOperational: error.isOperational || false
    };
  }
}

/**
 * Middleware global para tratamento de erros
 */
const globalErrorHandler = (error, req, res, next) => {
  // Gerar ID único para o erro
  const errorId = ErrorUtils.generateErrorId();
  
  // Converter erros conhecidos para AppError
  let appError = error;
  
  if (error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) {
    appError = ErrorUtils.handleMongooseError(error);
  } else if (error.isJoi) {
    appError = ErrorUtils.handleJoiError(error);
  } else if (error.code && error.code.startsWith('LIMIT_')) {
    appError = ErrorUtils.handleMulterError(error);
  } else if (!error.isOperational) {
    // Erro não operacional - converter para erro genérico
    appError = new AppError(
      process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : error.message,
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }

  // Determinar se deve incluir stack trace
  const includeStack = process.env.NODE_ENV === 'development';
  
  // Logar erro se necessário
  if (ErrorUtils.shouldLogError(appError)) {
    const logData = ErrorUtils.formatErrorForLog(appError, errorId, {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
    console.error('Application Error:', JSON.stringify(logData, null, 2));
  }

  // Sanitizar e enviar resposta
  const sanitizedError = ErrorUtils.sanitizeError(appError, includeStack);
  sanitizedError.errorId = errorId;
  
  res.status(appError.statusCode || 500).json(sanitizedError);
};

/**
 * Middleware para capturar erros assíncronos
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para tratar rotas não encontradas
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError('Rota', req.originalUrl);
  next(error);
};

module.exports = {
  AppError,
  ValidationError,
  BusinessError,
  NotFoundError,
  AuthorizationError,
  AuthenticationError,
  RateLimitError,
  ExternalServiceError,
  ErrorUtils,
  globalErrorHandler,
  asyncHandler,
  notFoundHandler
};