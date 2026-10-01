const mongoose = require('mongoose')

const connectMongo = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/interviewai'
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 })
    console.log('✅ MongoDB connected')
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    console.log('⚠️  Running in In-Memory Mode (MongoDB offline) — auth and sessions stored in memory')
  }
}

module.exports = { connectMongo }
