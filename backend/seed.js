require('dotenv').config();
const mongoose = require('mongoose');
const Medico = require('./models/Medico');
const Cliente = require('./models/Cliente');
const Oportunidade = require('./models/Oportunidade');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/crm';

const connect = () => mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function clearCollections() {
  await Promise.all([
    Medico.deleteMany({}),
    Cliente.deleteMany({}),
    Oportunidade.deleteMany({})
  ]);
}

async function insertData() {
  /* --------- Clientes --------- */
  const clientes = await Cliente.insertMany([
    {
      nome: 'Hospital Vida Nova',
      cnpj: '12.345.678/0001-00',
      tipo: 'Hospital',
      endereco: { cidade: 'São Paulo', estado: 'SP' }
    },
    {
      nome: 'Clínica Saúde Total',
      cnpj: '23.456.789/0001-11',
      tipo: 'Clínica',
      endereco: { cidade: 'Rio de Janeiro', estado: 'RJ' }
    }
  ]);

  /* --------- Médicos --------- */
  const medicos = await Medico.insertMany([
    {
      nome: 'Dr. João Silva',
      crm: '123456',
      especialidade: 'Cardiologia',
      email: 'joao.silva@exemplo.com',
      telefone: '(11) 99999-0000',
      cidade: 'São Paulo',
      estado: 'SP'
    },
    {
      nome: 'Dra. Maria Souza',
      crm: '654321',
      especialidade: 'Pediatria',
      email: 'maria.souza@exemplo.com',
      telefone: '(21) 98888-0000',
      cidade: 'Rio de Janeiro',
      estado: 'RJ'
    }
  ]);

  /* --------- Oportunidades --------- */
  await Oportunidade.insertMany([
    {
      titulo: 'Plantão Cardiologia',
      especialidade: 'Cardiologia',
      cliente: clientes[0]._id,
      local: { cidade: 'São Paulo', estado: 'SP' },
      dataInicio: new Date(),
      cargaHoraria: '12h',
      remuneracao: { valor: 1200, tipo: 'Plantão' },
      descricao: 'Cobertura de plantão noturno',
      status: 'Aberta',
      medicosIndicados: [{ medico: medicos[0]._id }]
    },
    {
      titulo: 'Consulta Pediatria',
      especialidade: 'Pediatria',
      cliente: clientes[1]._id,
      local: { cidade: 'Rio de Janeiro', estado: 'RJ' },
      dataInicio: new Date(),
      cargaHoraria: '6h',
      remuneracao: { valor: 600, tipo: 'Plantão' },
      status: 'Aberta',
      medicosIndicados: [{ medico: medicos[1]._id }]
    }
  ]);
}

(async () => {
  try {
    await connect();
    console.log('Mongo conectado');
    await clearCollections();
    await insertData();
    console.log('Seed concluído com sucesso!');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
})();