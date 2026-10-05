const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedDatabase = async () => {
  try {
    // Only ensure 1 Admin account exists
    const adminExists = await User.findOne({ email: 'admin@localmate.com' });
    if (!adminExists) {
      await User.create({
        email: 'admin@localmate.com',
        password: bcrypt.hashSync('admin123', 10),
        fullName: 'LocalMate Administrator',
        phone: '0900000001',
        roles: ['ROLE_ADMIN'],
        status: 'ACTIVE',
        gender: 'Nam',
        location: 'Hà Nội, Việt Nam',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      });
      console.log('[Seeder] Preserved sole admin account: admin@localmate.com / admin123');
    }
  } catch (err) {
    console.error('[Seeder] Error checking admin:', err.message);
  }
};

module.exports = seedDatabase;
