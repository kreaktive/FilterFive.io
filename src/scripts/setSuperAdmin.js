#!/usr/bin/env node

require('dotenv').config();
const { sequelize } = require('../config/database');
const { User } = require('../models');

console.log('\n=== Setting Super Admin Role ===\n');

const setSuperAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established.');

    // Update user ID 1 to super_admin role
    const [updatedCount] = await User.update(
      { role: 'super_admin' },
      { where: { id: 1 } }
    );

    if (updatedCount === 0) {
      console.error('✗ No user found with ID 1');
      console.log('  Current users in database:');

      const users = await User.findAll({
        attributes: ['id', 'email', 'businessName', 'role'],
        order: [['id', 'ASC']]
      });

      if (users.length === 0) {
        console.log('  No users found. Run the seeder first: npm run db:seed');
      } else {
        users.forEach(user => {
          console.log(`  - ID ${user.id}: ${user.email} (${user.businessName}) - Role: ${user.role}`);
        });
      }

      process.exit(1);
    }

    // Fetch updated user to confirm
    const user = await User.findByPk(1);

    console.log('\n✓ Super Admin role set successfully!\n');
    console.log('User Details:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Business: ${user.businessName}`);
    console.log(`  - Role: ${user.role}`);
    console.log('\nYou can now access the Super Admin panel at: /admin\n');

    process.exit(0);

  } catch (error) {
    console.error('\n✗ Failed to set super admin role:', error.message);
    process.exit(1);
  }
};

setSuperAdmin();
