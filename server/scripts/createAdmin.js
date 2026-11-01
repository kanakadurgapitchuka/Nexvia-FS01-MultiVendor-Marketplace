
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password || password.length < 12) {
      throw new Error(
        'Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) in server/.env'
      );
    }

    let user = await User.findOne({ email });

    if (user) {
      user.role = 'admin';
      user.vendorStatus = 'none';
      user.passwordHash = await bcrypt.hash(password, 12);
      await user.save();
    } else {
      user = await User.create({
        name: 'Marketplace Admin',
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: 'admin',
        vendorStatus: 'none'
      });
    }

    console.log(`Admin account ready: ${user.email}`);
  } catch (error) {
    console.error('Admin setup failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
