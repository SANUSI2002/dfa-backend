import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from './src/models/Admin.js';

dotenv.config();

const superAdmin = {
  name: 'Elliot Eniola',
  email: 'admin@dfatv.com',       // ← your login email
  password: 'Admin@12345',        // ← your login password
  role: 'Super Admin',
  permissions: {},
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await Admin.findOne({ email: superAdmin.email });
    if (existing) {
      console.log('⚠️  Super Admin already exists:', existing.email);
      process.exit(0);
    }

    const admin = await Admin.create(superAdmin);
    console.log('🎉 Super Admin created!');
    console.log('   Email   :', admin.email);
    console.log('   Password: Admin@12345');
    console.log('   Role    :', admin.role);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();