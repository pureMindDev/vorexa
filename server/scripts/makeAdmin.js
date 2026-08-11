// Run once to create your first admin account:
//   node scripts/makeAdmin.js your-email@example.com
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/makeAdmin.js <email>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { role: 'admin', status: 'active' },
    { new: true }
  );

  if (!user) {
    console.error(`No user found with email "${email}". Register that account first, then re-run this.`);
  } else {
    console.log(`✅ ${user.name} (${user.email}) is now an admin. Log in and visit /admin/dashboard.`);
  }

  await mongoose.disconnect();
};

run();
