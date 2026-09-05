const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const User = require('../models/mongo/User')

const generateTokens = (user) => {
  const payload = { id: user._id.toString(), email: user.email, name: user.name }
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'interviewai_secret', { expiresIn: '7d' })
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'interviewai_refresh', { expiresIn: '30d' })
  return { accessToken, refreshToken }
}

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, passwordHash })

    const { accessToken, refreshToken } = generateTokens(user)
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email },
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

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const { accessToken, refreshToken } = generateTokens(user)
    res.json({
      user: { id: user._id, name: user.name, email: user.email },
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
    const user = await User.findById(decoded.id)
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
    const user = await User.findById(req.user.id).select('-passwordHash')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' })
  }
}

// POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
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
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
      accessToken,
      refreshToken
    })
  } catch (err) {
    console.error('Google auth error:', err)
    res.status(401).json({ error: 'Google authentication failed' })
  }
}

module.exports = { register, login, refresh, getMe, googleAuth }
