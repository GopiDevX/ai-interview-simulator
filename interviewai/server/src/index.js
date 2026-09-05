const express = require('express')
const http = require('http')
const cors = require('cors')
const helmet = require('helmet')
const dotenv = require('dotenv')
const { Server } = require('socket.io')
const { connectMongo } = require('./config/db')
const authRoutes = require('./routes/auth')
const interviewRoutes = require('./routes/interview')
const reportRoutes = require('./routes/report')
const { setupInterviewSocket } = require('./socket/interviewSocket')
const { rateLimiter } = require('./middleware/rateLimiter')

dotenv.config()

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
app.use(express.json({ limit: '10mb' }))
app.use(rateLimiter)

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'))

app.use('/api/auth', authRoutes)
app.use('/api/interviews', interviewRoutes)
app.use('/api/report', reportRoutes)

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

const path = require('path')

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

start()
