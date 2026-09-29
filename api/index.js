const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('../server/config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Securely serve Google Maps configuration to frontend
app.get('/api/config/maps', (req, res) => {
  res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY || '' });
});

// Mount API Routes
app.use('/api/auth', require('../server/routes/authRoutes'));
app.use('/api/parking', require('../server/routes/parkingRoutes'));
app.use('/api/slots', require('../server/routes/slotRoutes'));
app.use('/api/bookings', require('../server/routes/bookingRoutes'));
app.use('/api/payment', require('../server/routes/paymentRoutes'));
app.use('/api/entry', require('../server/routes/entryExitRoutes'));
app.use('/api/iot', require('../server/routes/iotRoutes'));
app.use('/api/admin', require('../server/routes/adminRoutes'));
app.use('/api/notifications', require('../server/routes/notificationRoutes'));

module.exports = app;
