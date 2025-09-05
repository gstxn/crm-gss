/**
 * Middleware para upload de arquivos
 */
const multer = require('multer');

// Configuração do armazenamento em memória
const storage = multer.memoryStorage();

// Filtro de arquivos para aceitar apenas CSV e XLSX
const fileFilter = (req, file, cb) => {
  const mimeTypesPermitidos = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/csv',
    'text/plain'
  ];
  
  if (mimeTypesPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo não suportado. Use CSV ou XLSX.'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});

// Middleware para upload de arquivo único
const uploadPlanilha = upload.single('arquivo');

// Middleware para tratamento de erros do multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Arquivo excede o tamanho máximo permitido (20MB)'
      });
    }
    return res.status(400).json({
      message: `Erro no upload: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      message: err.message
    });
  }
  next();
};

module.exports = {
  uploadPlanilha,
  handleUploadError
};