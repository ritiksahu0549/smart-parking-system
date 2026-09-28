const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');
const { startReminderScheduler } = require('./services/reminderService');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB().then(() => {
  // Start upcoming reservation reminders worker
  startReminderScheduler();
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
app.use(express.static(path.join(__dirname, '../client/dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// SPA Fallback: Serve React SPA index.html for all non-api routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Port configuration
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Smart Parking Frontend served at http://localhost:${PORT}`);
});
