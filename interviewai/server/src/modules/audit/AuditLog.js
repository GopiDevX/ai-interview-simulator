const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  institutionId: { type: String, index: true },
  actorId: { type: String, required: true, index: true },
  actorEmail: { type: String },
  actorRole: { type: String, required: true },
  action: { type: String, required: true, index: true }, // e.g. 'drive:create', 'student:verify', 'score:override'
  targetType: { type: String }, // 'drive', 'student', 'application', 'assignment', 'alumni'
  targetId: { type: String },
  ip: { type: String },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true }
})

const inMemoryAuditLogs = []

auditLogSchema.statics.record = async function ({
  institutionId,
  actorId,
  actorEmail,
  actorRole,
  action,
  targetType,
  targetId,
  ip,
  details = {}
}) {
  const logEntry = {
    institutionId: institutionId || 'default',
    actorId: actorId || 'system',
    actorEmail,
    actorRole: actorRole || 'system',
    action,
    targetType,
    targetId,
    ip,
    details,
    timestamp: new Date()
  }

  try {
    if (mongoose.connection.readyState === 1) {
      return await this.create(logEntry)
    }
  } catch (err) {
    console.warn('[AuditLog] MongoDB persist failed, buffering in memory:', err.message)
  }

  inMemoryAuditLogs.push(logEntry)
  if (inMemoryAuditLogs.length > 500) inMemoryAuditLogs.shift()
  return logEntry
}

module.exports = mongoose.model('AuditLog', auditLogSchema)
