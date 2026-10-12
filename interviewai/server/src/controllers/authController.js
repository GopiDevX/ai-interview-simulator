const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { v4: uuid } = require('uuid')
let OAuth2Client
try {
  OAuth2Client = require('google-auth-library').OAuth2Client
} catch {
  OAuth2Client = null
}
const User = require('../models/mongo/User')

const fs = require('fs')
const path = require('path')

// In-memory user store with persistent file backing for resilient offline mode
const inMemoryUsers = new Map()
const USERS_FILE = path.join(__dirname, '../data/persisted_users.json')

function loadPersistedUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))
      for (const u of data) {
        u.save = async function() { return this }
        inMemoryUsers.set(u.email.toLowerCase(), u)
      }
    }
  } catch (err) {
    console.error('Error loading persisted users:', err.message)
  }
}

function savePersistedUsers() {
  try {
    const dir = path.dirname(USERS_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const list = Array.from(inMemoryUsers.values()).map(u => ({
      _id: u._id,
      id: u.id,
      name: u.name,
      email: u.email,
      passwordHash: u.passwordHash,
      tier: u.tier,
      role: u.role,
      institutionId: u.institutionId
    }))
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf8')
  } catch (err) {
    console.error('Error persisting users:', err.message)
  }
}

// Pre-seed demo users for offline testing
const demoHash = bcrypt.hashSync('password123', 10)
const campusHash = bcrypt.hashSync('CampusUser@2026', 10)

inMemoryUsers.set('demo@example.com', {
  _id: 'demo-user-12345',
  id: 'demo-user-12345',
  name: 'Demo Candidate',
  email: 'demo@example.com',
  passwordHash: demoHash,
  tier: 'free',
  role: 'student',
  institutionId: 'inst-demo-campus',
  save: async function() { return this }
})

inMemoryUsers.set('student1@campus.edu', {
  _id: 'stu-demo-01',
  id: 'stu-demo-01',
  name: 'Aarav Patel',
  email: 'student1@campus.edu',
  passwordHash: campusHash,
  tier: 'pro',
  role: 'student',
  institutionId: 'inst-demo-campus',
  save: async function() { return this }
})

inMemoryUsers.set('alumni.google@campus.edu', {
  _id: 'alm-google-1',
  id: 'alm-google-1',
  name: 'Ananya Sharma',
  email: 'alumni.google@campus.edu',
  passwordHash: campusHash,
  tier: 'enterprise',
  role: 'alumni',
  institutionId: 'inst-demo-campus',
  save: async function() { return this }
})

inMemoryUsers.set('recruiter@example.com', {
  _id: 'rec-demo-01',
  id: 'rec-demo-01',
  name: 'Sarah Recruiter',
  email: 'recruiter@example.com',
  passwordHash: demoHash,
  tier: 'enterprise',
  role: 'recruiter',
  institutionId: 'inst-demo-campus',
  save: async function() { return this }
})

inMemoryUsers.set('admin@campus.edu', {
  _id: 'adm-demo-01',
  id: 'adm-demo-01',
  name: 'Dr. Placement Officer',
  email: 'admin@campus.edu',
  passwordHash: campusHash,
  tier: 'enterprise',
  role: 'placement_officer',
  institutionId: 'inst-demo-campus',
  save: async function() { return this }
})

loadPersistedUsers()

const isMongoAvailable = () => mongoose.connection.readyState === 1

const findUserByEmail = async (email) => {
  const normEmail = (email || '').toLowerCase()
  if (isMongoAvailable()) {
    try {
      const user = await User.findOne({ email: normEmail }).maxTimeMS(2000)
      if (user) return user
    } catch {
      // Fall through to in-memory store
    }
  }
  return inMemoryUsers.get(normEmail) || null
}

const findUserById = async (id) => {
  if (isMongoAvailable()) {
    try {
      const user = await User.findById(id).select('-passwordHash').maxTimeMS(2000)
      if (user) return user
    } catch {
      // Fall through
    }
  }
  for (const u of inMemoryUsers.values()) {
    if (u._id === id || u.id === id) return u
  }
  return null
}

const createUser = async ({ name, email, passwordHash, authProvider = 'local', googleId = null, avatar = null }) => {
  const normEmail = (email || '').toLowerCase()
  if (isMongoAvailable()) {
    try {
      return await User.create({ name, email: normEmail, passwordHash, authProvider, googleId, avatar })
    } catch {
      // Fall through to in-memory store
    }
  }
  const id = uuid()
  const user = {
    _id: id,
    id,
    name,
    email: normEmail,
    passwordHash,
    authProvider,
    googleId,
    avatar,
    tier: 'free',
    role: normEmail.includes('alumni') ? 'alumni' : (normEmail.includes('recruiter') ? 'recruiter' : 'student'),
    institutionId: 'inst-demo-campus',
    createdAt: new Date(),
    save: async function() { inMemoryUsers.set(normEmail, this); savePersistedUsers(); return this }
  }
  inMemoryUsers.set(normEmail, user)
  savePersistedUsers()
  return user
}

const generateTokens = (user) => {
  const userId = user._id ? user._id.toString() : user.id
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing!')
  }
  const payload = {
    id: userId,
    email: user.email,
    name: user.name,
    role: user.role || 'student',
    institutionId: user.institutionId || user.collegeId || null
  }
  const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '7d' })
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || jwtSecret, { expiresIn: '30d' })
  return { accessToken, refreshToken }
}

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await createUser({ name, email, passwordHash })

    const { accessToken, refreshToken } = generateTokens(user)
    const userId = user._id ? user._id.toString() : user.id
    res.status(201).json({
      user: { id: userId, name: user.name, email: user.email, tier: user.tier || 'free', role: user.role || 'candidate' },
      accessToken,
      refreshToken
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Registration failed' })
  }
}

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const { accessToken, refreshToken } = generateTokens(user)
    const userId = user._id ? user._id.toString() : user.id
    res.json({
      user: { id: userId, name: user.name, email: user.email, tier: user.tier || 'free', role: user.role || 'candidate' },
      accessToken,
      refreshToken
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
}

// POST /api/auth/refresh
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body

    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    if (!refreshSecret) return res.status(500).json({ error: 'Server authentication configuration error' })
    const decoded = jwt.verify(refreshToken, refreshSecret)
    const user = await findUserById(decoded.id)
    if (!user) return res.status(401).json({ error: 'User not found' })

    const tokens = generateTokens(user)
    res.json(tokens)
  } catch (err) {
    res.status(403).json({ error: 'Invalid refresh token' })
  }
}

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await findUserById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const userId = user._id ? user._id.toString() : user.id
    res.json({ user: { id: userId, name: user.name, email: user.email, avatar: user.avatar, tier: user.tier || 'free', role: user.role || 'candidate' } })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' })
  }
}

// POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
    if (!OAuth2Client) {
      return res.status(503).json({ error: 'Google Auth library not available. Please install google-auth-library.' })
    }
    const { credential } = req.body
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
    
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    const { email, name, sub: googleId, picture } = payload

    let user = await User.findOne({ email: email.toLowerCase() })
    if (user) {
      if (user.authProvider !== 'google') {
        user.authProvider = 'google'
        user.googleId = googleId
        if (!user.avatar) user.avatar = picture
        await user.save()
      }
    } else {
      user = await User.create({
        name,
        email,
        authProvider: 'google',
        googleId,
        avatar: picture
      })
    }

    const { accessToken, refreshToken } = generateTokens(user)
    res.json({
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, tier: user.tier, role: user.role },
      accessToken,
      refreshToken
    })
  } catch (err) {
    console.error('Google auth error:', err)
    res.status(401).json({ error: 'Google authentication failed' })
  }
}

module.exports = { register, login, refresh, getMe, googleAuth }
