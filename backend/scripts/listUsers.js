const mongoose = require('mongoose');
const User = require('../models/User');
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

// Listar todos os usuários
const listAllUsers = async () => {
  try {
    const users = await User.find({});
    
    console.log('=== TODOS OS USUÁRIOS NO BANCO ===');
    
    if (users.length === 0) {
      console.log('Nenhum usuário encontrado no banco de dados.');
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