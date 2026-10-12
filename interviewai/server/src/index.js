const express = require('express')
const http = require('http')
const cors = require('cors')
const helmet = require('helmet')
const dotenv = require('dotenv')
const path = require('path')
const { Server } = require('socket.io')

dotenv.config()

// Startup security check: Fail immediately if JWT_SECRET is missing
if (!process.env.JWT_SECRET) {
  console.error('\n====================================================================')
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing!')
  console.error('A strong, guess-resistant secret is required to secure student PII.')
  console.error('Please configure JWT_SECRET in your .env file before starting.')
  console.error('====================================================================\n')
  process.exit(1)
}

const { connectMongo } = require('./config/db')
const authRoutes = require('./routes/auth')
const interviewRoutes = require('./routes/interview')
const reportRoutes = require('./routes/report')
const paymentRoutes = require('./routes/payment')
const adminRoutes = require('./routes/admin')
const collegeRoutes = require('./routes/college')
const uploadRoutes = require('./routes/uploads')
const { webhook } = require('./controllers/paymentController')
const { setupInterviewSocket } = require('./socket/interviewSocket')
const { rateLimiter } = require('./middleware/rateLimiter')

const app = express()
const httpServer = http.createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))

// Stripe webhook MUST be before express.json
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), webhook)

app.use(express.json({ limit: '10mb' }))
app.use(rateLimiter)

// Authenticated resume/document download routes (replaces insecure public express.static)
app.use('/api/uploads', uploadRoutes)
app.use('/uploads', uploadRoutes)

const campusRoutes = require('./modules/campus/campusRoutes')
const alumniRoutes = require('./modules/alumni/alumniRoutes')
const copilotRoutes = require('./modules/copilot/copilotRoutes')
const advancedAiRoutes = require('./modules/ai_advanced/advancedAiRoutes')
const auditRoutes = require('./modules/audit/auditRoutes')

// API Modules
app.use('/api/auth', authRoutes)
app.use('/api/interviews', interviewRoutes)
app.use('/api/report', reportRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/college', collegeRoutes)
app.use('/api/campus', campusRoutes)
app.use('/api/alumni', alumniRoutes)
app.use('/api/copilot', copilotRoutes)
app.use('/api/ai', advancedAiRoutes)
app.use('/api/audit', auditRoutes)

// OpenAPI 3.0 Documentation Endpoint
app.get('/api/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs/openapi.json'))
})

app.get('/health', (req, res) => res.json({
  status: 'ok',
  time: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development'
}))

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'))
  })
}

setupInterviewSocket(io)

const start = async () => {
  await connectMongo()
  httpServer.listen(process.env.PORT || 5000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
  })
}

// Export app and server for Jest / Supertest integration testing
module.exports = { app, httpServer }

if (require.main === module) {
  start()
}
