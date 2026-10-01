const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');
const { startReminderScheduler } = require('./services/reminderService');

// Load environment variables
dotenv.config();

// Connect to MongoDB asynchronously without blocking server start
connectDB().then(() => {
  startReminderScheduler();
}).catch((err) => {
  console.warn('MongoDB connection pending or failed. Waiting for valid MONGO_URI in environment variables.', err?.message || err);
});

const app = express();

// Securely serve Google Maps configuration to frontend
app.get('/api/config/maps', (req, res) => {
  res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY || '' });
});

const server = http.createServer(app);

// Initialize Socket.IO and register it globally
socketHandler(server);

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve Frontend Static Files & Uploads
const clientDistPath = path.join(__dirname, '../client/dist');
const serverPublicPath = path.join(__dirname, 'public');
const vanillaPath = path.join(__dirname, '../client-vanilla');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
} else if (fs.existsSync(serverPublicPath)) {
  app.use(express.static(serverPublicPath));
} else if (fs.existsSync(vanillaPath)) {
  app.use(express.static(vanillaPath));
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: '🚀 Smart Parking System API is running successfully!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/parking', require('./routes/parkingRoutes'));
app.use('/api/slots', require('./routes/slotRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/entry', require('./routes/entryExitRoutes'));
app.use('/api/iot', require('./routes/iotRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Root & SPA Fallback: Serve React SPA index.html for non-api routes
app.get('*', (req, res) => {
  const reactIndexHtml = path.join(__dirname, '../client/dist/index.html');
  const serverPublicIndexHtml = path.join(__dirname, 'public/index.html');
  const vanillaIndexHtml = path.join(__dirname, '../client-vanilla/index.html');

  if (fs.existsSync(reactIndexHtml)) {
    return res.sendFile(reactIndexHtml);
  }
  if (fs.existsSync(serverPublicIndexHtml)) {
    return res.sendFile(serverPublicIndexHtml);
  }
  if (fs.existsSync(vanillaIndexHtml)) {
    return res.sendFile(vanillaIndexHtml);
  }
  res.status(404).json({
    status: 'error',
    message: `Route '${req.originalUrl}' not found. Please ensure the frontend build exists ('npm run build').`
  });
});

// Port configuration
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Smart Parking Frontend served at http://localhost:${PORT}`);
});
