// Generate password hash for manual MongoDB insertion
const bcrypt = require('bcrypt');

async function generateHash() {
  try {
    const password = 'admin@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ADMIN USER - MANUAL MONGODB INSERTION');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 Copy and paste this command into MongoDB:');
    console.log('');
    console.log('db.users.insertOne({');
    console.log('  name: "Administrator",');
    console.log(`  email: "admin@savemymoney.com",`);
    console.log(`  password: "${hashedPassword}",`);
    console.log('  date: new Date(),');
    console.log('  twoFactorEnabled: false,');
    console.log('  twoFactorSecret: null,');
    console.log('  backupCodes: [],');
    console.log('  lastLogin: null,');
    console.log('  failedLoginAttempts: 0,');
    console.log('  accountLockedUntil: null');
    console.log('})');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📧 Email: admin@savemymoney.com');
    console.log('🔑 Password: admin@123');
    console.log('');

    // Test the hash
    const isMatch = await bcrypt.compare('admin@123', hashedPassword);
    console.log('✅ Password hash verification:', isMatch ? 'PASSED' : 'FAILED');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateHash();
