const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao banco de dados
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crm', {
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
const createUser = async () => {
  try {
    await connectDB();

    // Verificar se já existe um usuário admin
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log('Um usuário admin já existe:', adminExists.email);
    } else {
      // Criar o usuário admin inicial
      const adminUser = await User.create({
        nome: 'Administrador',
        email: 'admin@crm.com',
        cpf: '000.000.000-00',
        senha: 'admin123',
        cargo: 'Administrador',
        role: 'admin',
        telefone: '(11) 99999-9999'
      });

      console.log(`Usuário admin criado: ${adminUser.email}`);
      console.log('Credenciais: admin@crm.com / admin123');
    }

    // Verificar se existe usuário operador_disparo
    const operadorExists = await User.findOne({ role: 'operador_disparo' });

    if (operadorExists) {
      console.log('Um usuário operador_disparo já existe:', operadorExists.email);
    } else {
      // Criar usuário operador_disparo
      const operadorUser = await User.create({
        nome: 'Operador Disparo',
        email: 'operador@crm.com',
        cpf: '111.111.111-11',
        senha: 'operador123',
        cargo: 'Operador de Disparo',
        role: 'operador_disparo',
        telefone: '(11) 88888-8888'
      });

      console.log(`Usuário operador_disparo criado: ${operadorUser.email}`);
      console.log('Credenciais: operador@crm.com / operador123');
    }

    // Verificar se existe usuário leitura
    const leituraExists = await User.findOne({ role: 'leitura' });

    if (leituraExists) {
      console.log('Um usuário leitura já existe:', leituraExists.email);
    } else {
      // Criar usuário leitura
      const leituraUser = await User.create({
        nome: 'Usuário Leitura',
        email: 'leitura@crm.com',
        cpf: '222.222.222-22',
        senha: 'leitura123',
        cargo: 'Usuário de Leitura',
        role: 'leitura',
        telefone: '(11) 77777-7777'
      });

      console.log(`Usuário leitura criado: ${leituraUser.email}`);
      console.log('Credenciais: leitura@crm.com / leitura123');
    }

    console.log('\n=== RESUMO DOS USUÁRIOS ===');
    const users = await User.find({}, 'nome email role');
    users.forEach(user => {
      console.log(`${user.nome} (${user.email}) - Role: ${user.role}`);
    });

    process.exit(0);
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    process.exit(1);
  }
};

// Executar o script
createUser();