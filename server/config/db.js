const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  try {
    const defaultAtlasUri = 'mongodb+srv://ritiksahu915496_db_user:6lkQg90Qx9cD9x12@cluster0.wug6yd1.mongodb.net/smart-parking?retryWrites=true&w=majority';
    let mongoUri = process.env.MONGO_URI;
    
    // In production (Render/Vercel), fall back to Atlas if MONGO_URI is not set or is localhost
    if (!mongoUri || mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')) {
      if (process.env.NODE_ENV === 'production') {
        mongoUri = defaultAtlasUri;
      } else {
        mongoUri = mongoUri || defaultAtlasUri;
      }
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Info: ${error.message}`);
  }
};

module.exports = connectDB;
