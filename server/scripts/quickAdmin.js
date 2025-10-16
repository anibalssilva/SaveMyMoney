// Quick script to create admin user
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/savemymoney';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected!');

    // Define User model inline
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      date: { type: Date, default: Date.now },
      twoFactorEnabled: { type: Boolean, default: false },
      twoFactorSecret: { type: String, default: null },
      backupCodes: { type: Array, default: [] },
      lastLogin: { type: Date, default: null },
      failedLoginAttempts: { type: Number, default: 0 },
      accountLockedUntil: { type: Date, default: null }
    });

    const User = mongoose.models.user || mongoose.model('user', UserSchema);

    // Delete existing admin if exists
    await User.deleteOne({ email: 'admin@savemymoney.com' });
    console.log('🗑️  Removed old admin (if existed)');

    // Create hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin@123', salt);
    console.log('🔒 Password hashed');

    // Create admin
    const admin = new User({
      name: 'Administrator',
      email: 'admin@savemymoney.com',
      password: hashedPassword,
      date: new Date()
    });

    await admin.save();
    console.log('');
    console.log('✅ ========================================');
    console.log('✅ Admin user created successfully!');
    console.log('✅ ========================================');
    console.log('');
    console.log('📧 Email: admin@savemymoney.com');
    console.log('🔑 Password: admin@123');
    console.log('');
    console.log('🔗 Login at: http://localhost:5173/login');
    console.log('');

    // Test the password
    const isMatch = await bcrypt.compare('admin@123', hashedPassword);
    console.log('🧪 Password test:', isMatch ? '✅ PASSED' : '❌ FAILED');
    console.log('');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdmin();
