require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/savemymoney';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@savemymoney.com' });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.name);

      // Update password if needed
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin@123', salt);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('✅ Admin password updated to: admin@123');
    } else {
      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin@123', salt);

      const adminUser = new User({
        name: 'Administrator',
        email: 'admin@savemymoney.com',
        password: hashedPassword,
        date: new Date()
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log('');
      console.log('📧 Email: admin@savemymoney.com');
      console.log('🔑 Password: admin@123');
      console.log('');
      console.log('⚠️  IMPORTANTE: Altere esta senha após o primeiro login!');
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
