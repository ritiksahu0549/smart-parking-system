const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getMyBookings, 
  getBookingById, 
  cancelBooking,
  getPriceEstimate
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createBooking);

router.post('/estimate', getPriceEstimate);
router.get('/my', getMyBookings);

router.route('/:id')
  .get(getBookingById);

router.put('/:id/cancel', cancelBooking);

module.exports = router;
