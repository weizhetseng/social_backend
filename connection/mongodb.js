const mongoose = require('mongoose')

const dbURL = 'mongodb://localhost:27017/WEBAPI'

const connect = async () => {
  try {
    await mongoose.connect(dbURL)
    console.log('MongoDB connected...')
  } catch (error) {
    console.error('MongoDB connection error:', error)
  }
}

connect()

module.exports = connect
