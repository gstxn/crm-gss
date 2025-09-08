const mongoose = require('mongoose');
const User = require('../models/User');
const AdminUser = require('../models/admin/AdminUser');
require('dotenv').config();

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_tese');
    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

// Listar todos os usuários de ambas as coleções
const listAllUsers = async () => {
  try {
    console.log('=== USUÁRIOS NORMAIS (User) ===');
    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('Nenhum usuário normal encontrado.');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user._id}`);
        console.log(`   Nome: ${user.nome}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   CPF: ${user.cpf}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Cargo: ${user.cargo}`);
        console.log('   ---');
      });
    }
    
    console.log('\n=== USUÁRIOS ADMIN (AdminUser) ===');
    const adminUsers = await AdminUser.find({});
    
    if (adminUsers.length === 0) {
      console.log('Nenhum usuário admin encontrado.');
    } else {
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user._id}`);
        console.log(`   Nome: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log('   ---');
      });
    }
    
    // Verificar todas as coleções no banco
    console.log('\n=== TODAS AS COLEÇÕES NO BANCO ===');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
  }
};

// Executar script
const main = async () => {
  await connectDB();
  await listAllUsers();
  process.exit(0);
};

main();