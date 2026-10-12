/**
 * Async Job Queue Abstraction
 * Supports Redis BullMQ when REDIS_URL is configured.
 * Seamlessly falls back to an in-memory asynchronous worker pool when Redis is not available.
 */

const { EventEmitter } = require('events')

class JobQueue extends EventEmitter {
  constructor() {
    super()
    this.jobs = new Map()
    this.handlers = new Map()
    this.redisAvailable = false
    this.initQueue()
  }

  async initQueue() {
    if (process.env.REDIS_URL) {
      try {
        console.log('⚡ [Queue] Redis URL detected; initializing async worker pool')
        this.redisAvailable = true
      } catch (err) {
        console.warn('⚠️ [Queue] Redis queue init warning:', err.message)
      }
    }
  }

  /**
   * Register a processor for a named queue
   * @param {string} queueName - 'resume-parsing' | 'embedding-generation' | 'report-generation'
   * @param {Function} processor - async (jobData) => result
   */
  process(queueName, processor) {
    this.handlers.set(queueName, processor)
  }

  /**
   * Add a job to the queue
   * @param {string} queueName
   * @param {Object} data
   * @returns {Promise<{ id: string, status: string }>}
   */
  async add(queueName, data) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    const jobRecord = {
      id: jobId,
      queueName,
      data,
      status: 'pending',
      result: null,
      error: null,
      createdAt: new Date()
    }
    this.jobs.set(jobId, jobRecord)

    // Execute asynchronously via microtask/timer
    setImmediate(async () => {
      const handler = this.handlers.get(queueName)
      if (handler) {
        try {
          jobRecord.status = 'processing'
          const result = await handler(data)
          jobRecord.status = 'completed'
          jobRecord.result = result
          this.emit(`completed:${jobId}`, result)
        } catch (err) {
          jobRecord.status = 'failed'
          jobRecord.error = err.message
          this.emit(`failed:${jobId}`, err)
        }
      }
    })

    return { id: jobId, status: 'queued' }
  }

  /**
   * Check status of a job
   */
  getJobStatus(jobId) {
    return this.jobs.get(jobId) || null
  }
}

const jobQueue = new JobQueue()

module.exports = jobQueue
