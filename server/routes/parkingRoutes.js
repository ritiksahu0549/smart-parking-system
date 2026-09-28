const express = require('express');
const router = express.Router();
const { 
  getParkingLots, 
  getParkingLotById, 
  createParkingLot, 
  updateParkingLot, 
  deleteParkingLot,
  uploadParkingImage
} = require('../controllers/parkingController');
const { getSlotsByLot } = require('../controllers/slotController');
const { getParkingLotReviews, createParkingLotReview } = require('../controllers/reviewController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.post('/upload', protect, isAdmin, uploadParkingImage);

router.route('/')
  .get(getParkingLots)
  .post(protect, isAdmin, createParkingLot);

router.route('/:id')
  .get(getParkingLotById)
  .put(protect, isAdmin, updateParkingLot)
  .delete(protect, isAdmin, deleteParkingLot);

// Nested slot route: /api/parking/:id/slots
router.get('/:id/slots', getSlotsByLot);

// Nested review routes: /api/parking/:id/reviews
router.route('/:id/reviews')
  .get(getParkingLotReviews)
  .post(protect, createParkingLotReview);

module.exports = router;
