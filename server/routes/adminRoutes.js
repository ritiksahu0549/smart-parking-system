const express = require('express');
const router = express.Router();
const { 
  getDashboardStats, 
  getUsers, 
  toggleUserStatus, 
  getAllBookings, 
  getAllPayments 
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(isAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/bookings', getAllBookings);
router.get('/payments', getAllPayments);

module.exports = router;
