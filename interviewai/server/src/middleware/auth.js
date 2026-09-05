const jwt = require('jsonwebtoken')

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'interviewai_secret')
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ error: 'Token is invalid or expired' })
  }
}

const requireAdmin = async (req, res, next) => {
  try {
    const User = require('../models/mongo/User')
    const user = await User.findById(req.user.id)
    if (user && user.role === 'recruiter') {
      next()
    } else {
      res.status(403).json({ error: 'Admin access required' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify admin status' })
  }
}

module.exports = { authenticateToken, requireAdmin }
