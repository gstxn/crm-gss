const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm-medicos')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all users and show their current roles
    const users = await User.find({}, 'nome email role cargo');
    console.log('Current users:');
    users.forEach(user => {
      console.log(`- ${user.nome} (${user.email}) - Role: ${user.role || 'undefined'} - Cargo: ${user.cargo}`);
    });
    
    // Update the first user to be admin (you can modify this logic as needed)
    if (users.length > 0) {
      const firstUser = users[0];
      await User.findByIdAndUpdate(firstUser._id, { role: 'admin' });
      console.log(`\nUpdated user ${firstUser.nome} to admin role`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });