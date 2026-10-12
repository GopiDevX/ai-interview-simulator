/**
 * Distributed Matchmaking Service
 * Handles peer interview matchmaking across instances.
 * Connects to Redis when REDIS_URL is configured, and gracefully
 * falls back to an in-memory queue with an identical interface for local testing.
 */

let redisClient = null

if (process.env.REDIS_URL) {
  try {
    const Redis = require('ioredis')
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false
    })
    redisClient.on('connect', () => console.log('✅ [Matchmaking] Connected to Redis'))
    redisClient.on('error', (err) => {
      console.warn('⚠️ [Matchmaking] Redis connection warning, using memory fallback:', err.message)
    })
  } catch {
    redisClient = null
  }
}

// In-memory fallback queue
const memoryWaitingUsers = []

class MatchmakingService {
  /**
   * Add a user to the matchmaking pool or find a waiting partner
   * @param {Object} user - { socketId, userId, name }
   * @returns {Promise<{ match: Object|null, waiting: boolean }>}
   */
  async findOrEnqueue(user) {
    if (redisClient && redisClient.status === 'ready') {
      try {
        const queueKey = 'interviewai:matchmaking:queue'
        
        // Pop any waiting user
        const waitingRaw = await redisClient.lpop(queueKey)
        if (waitingRaw) {
          const partner = JSON.parse(waitingRaw)
          // Avoid self-match
          if (partner.socketId === user.socketId || partner.userId === user.userId) {
            await redisClient.rpush(queueKey, waitingRaw)
            return { match: null, waiting: true }
          }
          return { match: partner, waiting: false }
        }

        // Push current user to queue
        await redisClient.rpush(queueKey, JSON.stringify(user))
        return { match: null, waiting: true }
      } catch (err) {
        console.warn('[Matchmaking] Redis op failed, falling back to in-memory:', err.message)
      }
    }

    // In-memory fallback
    if (memoryWaitingUsers.length > 0) {
      const partnerIdx = memoryWaitingUsers.findIndex(u => u.socketId !== user.socketId && u.userId !== user.userId)
      if (partnerIdx !== -1) {
        const [partner] = memoryWaitingUsers.splice(partnerIdx, 1)
        return { match: partner, waiting: false }
      }
    }

    // Check if user is already waiting
    const existingIdx = memoryWaitingUsers.findIndex(u => u.socketId === user.socketId)
    if (existingIdx === -1) {
      memoryWaitingUsers.push(user)
    }
    return { match: null, waiting: true }
  }

  /**
   * Remove a user from the matchmaking queue (e.g. on disconnect or cancel)
   * @param {string} socketId
   */
  async removeUser(socketId) {
    if (redisClient && redisClient.status === 'ready') {
      try {
        const queueKey = 'interviewai:matchmaking:queue'
        const users = await redisClient.lrange(queueKey, 0, -1)
        for (const raw of users) {
          const parsed = JSON.parse(raw)
          if (parsed.socketId === socketId) {
            await redisClient.lrem(queueKey, 1, raw)
          }
        }
      } catch (err) {
        console.warn('[Matchmaking] Redis remove failed:', err.message)
      }
    }

    const idx = memoryWaitingUsers.findIndex(u => u.socketId === socketId)
    if (idx !== -1) {
      memoryWaitingUsers.splice(idx, 1)
    }
  }

  /**
   * Get queue length
   */
  getQueueLength() {
    return memoryWaitingUsers.length
  }
}

module.exports = new MatchmakingService()
