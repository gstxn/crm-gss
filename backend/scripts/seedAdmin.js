const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AdminUser = require('../models/admin/AdminUser');

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao banco de dados
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    process.exit(1);
  }
};

// Criar usuário admin inicial
const seedAdmin = async () => {
  try {
    await connectDB();

    // Verificar se já existe um SUPERADMIN
    const adminExists = await AdminUser.findOne({ role: 'SUPERADMIN' });

    if (adminExists) {
      console.log('Um usuário SUPERADMIN já existe. Pulando criação.');
      process.exit(0);
    }

    // Criar o usuário SUPERADMIN inicial
    const adminUser = await AdminUser.create({
      name: process.env.ADMIN_NAME || 'Admin Principal',
      email: process.env.ADMIN_EMAIL || 'admin@exemplo.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'SUPERADMIN',
      status: 'ativo'
    });

    console.log(`Usuário SUPERADMIN criado: ${adminUser.email}`);
    console.log('Você pode fazer login em /admin/login com estas credenciais.');

    process.exit(0);
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    process.exit(1);
  }
};

// Executar o seed
seedAdmin();