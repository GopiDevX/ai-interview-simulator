/**
 * Secure Admin & Staff Seeder Script
 * Usage:
 *   node src/scripts/seedAdmin.js <email> <role> [institutionId] [password]
 * Example:
 *   node src/scripts/seedAdmin.js officer@campus.edu placement_officer inst-bits-pilani password123
 */

const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '../../.env') })

const User = require('../models/mongo/User')
const { connectMongo } = require('../config/db')

async function seedAdmin() {
  const email = process.argv[2] || process.env.SEED_ADMIN_EMAIL || 'admin@campus.edu'
  const role = process.argv[3] || process.env.SEED_ADMIN_ROLE || 'placement_officer'
  const institutionId = process.argv[4] || process.env.SEED_INSTITUTION_ID || 'inst-demo-campus'
  const password = process.argv[5] || process.env.SEED_ADMIN_PASSWORD || 'CampusAdmin@2026'

  console.log(`[SeedAdmin] Connecting to MongoDB...`)
  await connectMongo()

  const normEmail = email.toLowerCase().trim()
  let user = await User.findOne({ email: normEmail })

  const passwordHash = await bcrypt.hash(password, 12)

  if (user) {
    user.role = role
    user.institutionId = institutionId
    user.collegeId = institutionId
    user.passwordHash = passwordHash
    await user.save()
    console.log(`[SeedAdmin] Updated existing user ${normEmail} to role: ${role}, institution: ${institutionId}`)
  } else {
    user = await User.create({
      name: `${role.toUpperCase().replace('_', ' ')} Admin`,
      email: normEmail,
      passwordHash,
      role,
      institutionId,
      collegeId: institutionId,
      tier: 'pro'
    })
    console.log(`[SeedAdmin] Created new staff user ${normEmail} with role: ${role}, institution: ${institutionId}`)
  }

  console.log(`[SeedAdmin] Credentials: ${normEmail} | Password: ${password}`)
  await mongoose.disconnect()
  process.exit(0)
}

seedAdmin().catch(err => {
  console.error('[SeedAdmin] Seeding failed:', err)
  process.exit(1)
})
