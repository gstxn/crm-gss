const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm-medicos')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Update existing users without role field
    const result = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'leitura' } }
    );
    
    console.log(`Updated ${result.modifiedCount} users with default role 'leitura'`);
    
    // Also update any users that might need admin access
    // You can manually change specific users to 'admin' or 'operador_disparo' as needed
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });