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

// Verificar todas as coleções e seus conteúdos
const checkAllCollections = async () => {
  try {
    const db = mongoose.connection.db;
    
    console.log('=== TODAS AS COLEÇÕES E SEUS CONTEÚDOS ===');
    
    // Listar todas as coleções
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n📁 COLEÇÃO: ${collectionName}`);
      
      // Contar documentos
      const count = await db.collection(collectionName).countDocuments();
      console.log(`   Total de documentos: ${count}`);
      
      if (count > 0 && count <= 20) { // Mostrar apenas se tiver poucos documentos
        const docs = await db.collection(collectionName).find({}).limit(10).toArray();
        
        docs.forEach((doc, index) => {
          console.log(`   ${index + 1}. ID: ${doc._id}`);
          
          // Tentar identificar campos de nome e email
          const possibleNameFields = ['nome', 'name', 'title', 'titulo'];
          const possibleEmailFields = ['email', 'e-mail'];
          
          for (const field of possibleNameFields) {
            if (doc[field]) {
              console.log(`      Nome: ${doc[field]}`);
              break;
            }
          }
          
          for (const field of possibleEmailFields) {
            if (doc[field]) {
              console.log(`      Email: ${doc[field]}`);
              break;
            }
          }
          
          if (doc.role) console.log(`      Role: ${doc.role}`);
          if (doc.cargo) console.log(`      Cargo: ${doc.cargo}`);
          
          // Verificar se contém "George"
          const docString = JSON.stringify(doc).toLowerCase();
          if (docString.includes('george') || docString.includes('sobbianekge')) {
            console.log(`      ⚠️  CONTÉM REFERÊNCIA A GEORGE!`);
            console.log(`      Documento completo:`, JSON.stringify(doc, null, 4));
          }
        });
      } else if (count > 20) {
        console.log(`   (Muitos documentos - ${count}. Verificando apenas os primeiros 5...)`);
        const docs = await db.collection(collectionName).find({}).limit(5).toArray();
        
        docs.forEach((doc, index) => {
          const docString = JSON.stringify(doc).toLowerCase();
          if (docString.includes('george') || docString.includes('sobbianekge')) {
            console.log(`   ${index + 1}. ⚠️  ENCONTRADO GEORGE!`);
            console.log(`      Documento:`, JSON.stringify(doc, null, 4));
          }
        });
      }
    }
    
  } catch (error) {
    console.error('Erro ao verificar coleções:', error);
  }
};

// Executar script
const main = async () => {
  await connectDB();
  await checkAllCollections();
  process.exit(0);
};

main();