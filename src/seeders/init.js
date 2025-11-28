require('dotenv').config();
const { sequelize } = require('../config/database');
const { User } = require('../models');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    await sequelize.authenticate();
    console.log('✓ Database connection established.');

    const existingTenants = await User.count({ where: { role: 'tenant' } });

    if (existingTenants > 0) {
      console.log(`✓ Found ${existingTenants} existing tenant(s). Skipping seed.`);
      process.exit(0);
    }

    console.log('No tenants found. Creating dummy tenant...');

    const dummyTenant = await User.create({
      email: 'mike@test.com',
      password: 'password123',
      businessName: "Mike's Mechanics",
      googleReviewLink: 'https://g.page/r/mikes-mechanics/review',
      facebookLink: 'https://facebook.com/mikesmechanics',
      subscriptionStatus: 'active',
      subscriptionPlan: '6-month',
      role: 'tenant',
      isActive: true
    });

    console.log(`✓ Dummy tenant created successfully!`);
    console.log(`  - ID: ${dummyTenant.id}`);
    console.log(`  - Business: ${dummyTenant.businessName}`);
    console.log(`  - Email: ${dummyTenant.email}`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Database seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
