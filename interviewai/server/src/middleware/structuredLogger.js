const { v4: uuid } = require('uuid')

/**
 * Structured JSON Logger Middleware
 * Emits clean machine-parseable log lines for distributed observability
 */
const structuredLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuid().slice(0, 8)
  res.setHeader('x-request-id', requestId)

  const startTime = process.hrtime()

  res.on('finish', () => {
    const diff = process.hrtime(startTime)
    const durationMs = Math.round((diff[0] * 1e3 + diff[1] * 1e-6) * 100) / 100

    // Only log if not health check in quiet mode
    if (req.path === '/health' && res.statusCode === 200) return

    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      userRole: req.user?.role || 'anonymous',
      userId: req.user?.id || null,
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
    }

    if (res.statusCode >= 500) {
      console.error(JSON.stringify({ ...logEntry, level: 'error' }))
    } else if (res.statusCode >= 400) {
      console.warn(JSON.stringify({ ...logEntry, level: 'warn' }))
    } else {
      console.log(JSON.stringify({ ...logEntry, level: 'info' }))
    }
  })

  next()
}

module.exports = { structuredLogger }
