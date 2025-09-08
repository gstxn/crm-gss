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

// Deletar usuários específicos
const deleteSpecificUsers = async () => {
  try {
    // Emails dos usuários a serem deletados
    const emailsToDelete = [
      'sobbianekge@gmail.com',
      'george.dandolini@gestaoservicosaude.com.br'
    ];

    console.log('Procurando usuários para deletar...');
    
    // Buscar usuários
    const usersToDelete = await User.find({ email: { $in: emailsToDelete } });
    
    if (usersToDelete.length === 0) {
      console.log('Nenhum usuário encontrado com os emails especificados.');
      return;
    }

    console.log(`Encontrados ${usersToDelete.length} usuários para deletar:`);
    usersToDelete.forEach(user => {
      console.log(`- ${user.nome} (${user.email}) - Role: ${user.role}`);
    });

    // Deletar usuários
    const deleteResult = await User.deleteMany({ email: { $in: emailsToDelete } });
    
    console.log(`\n✅ ${deleteResult.deletedCount} usuários deletados com sucesso!`);
    
    // Mostrar usuários restantes
    console.log('\n=== USUÁRIOS RESTANTES ===');
    const remainingUsers = await User.find({});
    
    if (remainingUsers.length === 0) {
      console.log('Nenhum usuário restante no banco de dados.');
    } else {
      remainingUsers.forEach(user => {
        console.log(`${user.nome} (${user.email}) - Role: ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('Erro ao deletar usuários:', error);
  }
};

// Executar script
const main = async () => {
  await connectDB();
  await deleteSpecificUsers();
  process.exit(0);
};

main();