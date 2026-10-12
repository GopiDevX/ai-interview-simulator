const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

/**
 * Roles supported:
 * student | faculty | alumni | placement_officer | recruiter | admin
 * (Legacy aliases: candidate -> student, tpo -> placement_officer, college_admin -> placement_officer)
 */
const normalizeRole = (role) => {
  if (!role) return 'student'
  const r = role.toLowerCase()
  if (r === 'candidate') return 'student'
  if (r === 'tpo' || r === 'college_admin') return 'placement_officer'
  return r
}

/**
 * Permissions Matrix
 */
const PERMISSIONS = {
  student: [
    'interview:conduct',
    'report:view_own',
    'drive:read',
    'drive:apply',
    'mentorship:request',
    'experience:submit',
    'copilot:use',
    'profile:edit_own',
    'resume:upload',
    'resume:read_own',
    'data:delete_own'
  ],
  faculty: [
    'assignment:create',
    'assignment:read',
    'student:verify',
    'analytics:read_batch',
    'score:override',
    'drive:read',
    'resume:read_institution'
  ],
  alumni: [
    'slot:publish',
    'mentorship:conduct',
    'scorecard:submit',
    'experience:submit',
    'referral:post',
    'drive:read',
    'copilot:use'
  ],
  placement_officer: [
    'drive:create',
    'drive:edit',
    'drive:manage',
    'drive:read',
    'application:stage_update',
    'analytics:read',
    'student:manage',
    'student:verify',
    'alumni:verify',
    'experience:submit',
    'experience:moderate',
    'roster:import',
    'assignment:read',
    'resume:read_institution',
    'audit:read'
  ],
  recruiter: [
    'drive:read_assigned',
    'application:review',
    'candidate:search',
    'resume:read_applicant'
  ],
  admin: [
    '*' // Full administrative access
  ]
}

const hasPermission = (userRole, action) => {
  const normRole = normalizeRole(userRole)
  const rolePerms = PERMISSIONS[normRole] || []
  if (rolePerms.includes('*')) return true
  if (rolePerms.includes(action)) return true
  return false
}

/**
 * Middleware: Verify JWT access token and populate req.user
 * Role and institutionId are retrieved directly from JWT to avoid synchronous Mongoose bottlenecks
 * and support resilient offline/in-memory mode.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  // Also support ?token= query parameter for authenticated file downloads (resumes/PDFs)
  const queryToken = req.query?.token
  const token = (authHeader && authHeader.split(' ')[1]) || queryToken

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    console.error('[AUTH] Critical: JWT_SECRET environment variable is missing!')
    return res.status(500).json({ error: 'Server authentication configuration error' })
  }

  try {
    const decoded = jwt.verify(token, jwtSecret)
    decoded.role = normalizeRole(decoded.role)
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ error: 'Token is invalid or expired' })
  }
}

/**
 * Middleware: Check if user has specific permission
 * @param {string} action - e.g. 'drive:create', 'student:verify'
 */
const permit = (action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (hasPermission(req.user.role, action)) {
      return next()
    }

    return res.status(403).json({
      error: `Forbidden: Role '${req.user.role}' lacks permission '${action}'`
    })
  }
}

/**
 * Middleware: Require one of the specified roles
 * @param  {...string} allowedRoles
 */
const requireRole = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map(r => normalizeRole(r))
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userRole = normalizeRole(req.user.role)
    if (userRole === 'admin' || normalizedAllowed.includes(userRole)) {
      return next()
    }

    return res.status(403).json({
      error: `Access restricted. Allowed roles: ${allowedRoles.join(', ')}`
    })
  }
}

// Backwards-compatible requireAdmin
const requireAdmin = requireRole('admin', 'placement_officer', 'recruiter')

module.exports = {
  authenticateToken,
  permit,
  requireRole,
  requireAdmin,
  normalizeRole,
  hasPermission,
  PERMISSIONS
}
