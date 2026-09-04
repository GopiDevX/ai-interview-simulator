const mongoose = require('mongoose')

const connectMongo = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/interviewai'
    await mongoose.connect(uri)
    console.log('✅ MongoDB connected')
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    console.log('⚠️  Running without MongoDB — sessions will be in-memory')
  }
}

module.exports = { connectMongo }
