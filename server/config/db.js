const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  try {
    const defaultAtlasUri = 'mongodb+srv://ritiksahu915496_db_user:6lkQg90Qx9cD9x12@cluster0.wug6yd1.mongodb.net/smart-parking?retryWrites=true&w=majority';
    let mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri || mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')) {
      mongoUri = defaultAtlasUri;
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Info: ${error.message}`);
  }
};

module.exports = connectDB;
