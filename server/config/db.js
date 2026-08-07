const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * Uses the MONGODB_URI from environment variables
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('⚠️ Running server without MongoDB connection.');
  }
};

module.exports = connectDB;
