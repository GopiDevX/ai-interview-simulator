const AuditLog = require('./AuditLog')

/**
 * Express middleware to automatically record audit logs for mutating requests
 */
const auditAction = (actionName, targetTypeExtractor = () => null, targetIdExtractor = (req) => req.params.id || null) => {
  return async (req, res, next) => {
    // Intercept response finish
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
        try {
          await AuditLog.record({
            institutionId: req.user.institutionId || req.body?.institutionId || 'default',
            actorId: req.user.id,
            actorEmail: req.user.email,
            actorRole: req.user.role,
            action: actionName,
            targetType: typeof targetTypeExtractor === 'function' ? targetTypeExtractor(req) : targetTypeExtractor,
            targetId: typeof targetIdExtractor === 'function' ? targetIdExtractor(req) : targetIdExtractor,
            ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            details: {
              method: req.method,
              path: req.originalUrl,
              bodySummary: sanitizeAuditBody(req.body)
            }
          })
        } catch (err) {
          console.warn('[AuditMiddleware] Failed to record audit log:', err.message)
        }
      }
    })
    next()
  }
}

function sanitizeAuditBody(body) {
  if (!body || typeof body !== 'object') return {}
  const sanitized = { ...body }
  // Never log passwords or secrets
  delete sanitized.password
  delete sanitized.passwordHash
  delete sanitized.token
  return sanitized
}

module.exports = { auditAction }
