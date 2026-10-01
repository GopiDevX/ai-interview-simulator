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

// In-memory user store as fallback when MongoDB is unavailable
const inMemoryUsers = new Map()

// Pre-seed a demo user for offline testing
const demoHash = bcrypt.hashSync('password123', 10)
inMemoryUsers.set('demo@example.com', {
  _id: 'demo-user-12345',
  id: 'demo-user-12345',
  name: 'Demo Candidate',
  email: 'demo@example.com',
  passwordHash: demoHash,
  tier: 'free',
  role: 'candidate',
  save: async function() { return this }
})

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
    role: 'candidate',
    createdAt: new Date(),
    save: async function() { inMemoryUsers.set(normEmail, this); return this }
  }
  inMemoryUsers.set(normEmail, user)
  return user
}

const generateTokens = (user) => {
  const userId = user._id ? user._id.toString() : user.id
  const payload = { id: userId, email: user.email, name: user.name }
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'interviewai_secret', { expiresIn: '7d' })
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'interviewai_refresh', { expiresIn: '30d' })
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

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'interviewai_refresh')
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
