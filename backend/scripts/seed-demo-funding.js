#!/usr/bin/env node
// Gives a participant an active NDIS plan so /funding/summary stops 404ing and
// the booking flow can run its budget check. Demo data only.
//
//   MONGODB_URI="..." node scripts/seed-demo-funding.js --email participant@example.com
require('dotenv').config();
const mongoose = require('mongoose');
const NdisPlan = require('../src/models/NdisPlan');
const User = require('../src/models/User');

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = (arg('--email') || process.env.PARTICIPANT_EMAIL || '').toLowerCase().trim();
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set.');
  if (!email) throw new Error('Missing --email.');

  await mongoose.connect(uri);

  const participant = await User.findOne({ email });
  if (!participant) throw new Error(`No user found for ${email}`);

  const planNumber = 'NDIS-DEMO-001';
  const now = new Date();
  const endDate = new Date(now);
  endDate.setFullYear(endDate.getFullYear() + 1);

  const fundingCategories = [
    { category: 'core', label: 'Core Supports', allocation: 12000, spentToDate: 2240 },
    { category: 'capacity', label: 'Capacity Building', allocation: 8000, spentToDate: 2600 },
    { category: 'capital', label: 'Capital Supports', allocation: 3000, spentToDate: 1200 },
  ];

  const existing = await NdisPlan.findOne({ participant: participant._id, planNumber });
  if (existing) {
    existing.status = 'active';
    existing.startDate = now;
    existing.endDate = endDate;
    existing.fundingCategories = fundingCategories;
    await existing.save();
    console.log(`Updated plan ${planNumber} for ${email}.`);
  } else {
    await NdisPlan.create({
      participant: participant._id,
      planNumber,
      startDate: now,
      endDate,
      status: 'active',
      fundingCategories,
    });
    console.log(`Created plan ${planNumber} for ${email}.`);
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(`Failed: ${err.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
