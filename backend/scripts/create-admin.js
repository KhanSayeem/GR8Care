#!/usr/bin/env node
// Creates (or promotes) an admin account. Admins cannot self-register - see the
// SELF_SERVICE_ROLES note in src/controllers/authController.js - so this is the
// supported way to make one.
//
//   MONGODB_URI="..." node scripts/create-admin.js --email a@b.com --password 'secret123' --name "Admin Name"
//
// Pass the password via the environment (ADMIN_PASSWORD) instead of --password
// if you would rather keep it out of your shell history.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = (arg('--email') || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = arg('--password') || process.env.ADMIN_PASSWORD;
  const fullName = arg('--name') || process.env.ADMIN_NAME || 'GR8Care Admin';
  const uri = process.env.MONGODB_URI;

  if (!uri) throw new Error('MONGODB_URI is not set.');
  if (!email) throw new Error('Missing --email (or ADMIN_EMAIL).');
  if (!password) throw new Error('Missing --password (or ADMIN_PASSWORD).');
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');

  await mongoose.connect(uri);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    existing.password = password;
    await existing.save();
    console.log(`Updated existing account ${email} to role "admin" and reset its password.`);
  } else {
    await User.create({ fullName, email, password, role: 'admin', language: 'en' });
    console.log(`Created admin account ${email}.`);
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(`Failed: ${err.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
