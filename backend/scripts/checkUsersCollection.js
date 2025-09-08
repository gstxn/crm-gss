const mongoose = require('mongoose');
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

// Verificar coleção users diretamente
const checkUsersCollection = async () => {
  try {
    const db = mongoose.connection.db;
    
    console.log('=== VERIFICANDO COLEÇÃO USERS DIRETAMENTE ===');
    
    // Contar documentos na coleção users
    const userCount = await db.collection('users').countDocuments();
    console.log(`Total de documentos na coleção 'users': ${userCount}`);
    
    if (userCount > 0) {
      console.log('\n=== DOCUMENTOS NA COLEÇÃO USERS ===');
      const users = await db.collection('users').find({}).toArray();
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user._id}`);
        console.log(`   Nome: ${user.nome || user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   CPF: ${user.cpf}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Cargo: ${user.cargo}`);
        console.log(`   Documento completo:`, JSON.stringify(user, null, 2));
        console.log('   ---');
      });
      
      // Identificar usuários George para deletar
      const georgeUsers = users.filter(user => 
        user.nome && (user.nome.includes('George') || user.email.includes('george') || user.email.includes('sobbianekge'))
      );
      
      if (georgeUsers.length > 0) {
        console.log('\n=== USUÁRIOS GEORGE ENCONTRADOS ===');
        georgeUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.nome} (${user.email}) - ID: ${user._id}`);
        });
        
        // Deletar usuários George
        console.log('\n=== DELETANDO USUÁRIOS GEORGE ===');
        const deleteResult = await db.collection('users').deleteMany({
          $or: [
            { nome: { $regex: /George/i } },
            { email: { $regex: /george/i } },
            { email: { $regex: /sobbianekge/i } }
          ]
        });
        
        console.log(`✅ ${deleteResult.deletedCount} usuários deletados com sucesso!`);
        
        // Mostrar usuários restantes
        console.log('\n=== USUÁRIOS RESTANTES ===');
        const remainingUsers = await db.collection('users').find({}).toArray();
        
        if (remainingUsers.length === 0) {
          console.log('Nenhum usuário restante.');
        } else {
          remainingUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.nome || user.name} (${user.email}) - Role: ${user.role}`);
          });
        }
      } else {
        console.log('\nNenhum usuário George encontrado.');
      }
    }
    
  } catch (error) {
    console.error('Erro ao verificar coleção users:', error);
  }
};

// Executar script
const main = async () => {
  await connectDB();
  await checkUsersCollection();
  process.exit(0);
};

main();