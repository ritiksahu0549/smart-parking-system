const Review = require('../models/Review');
const Booking = require('../models/Booking');

// @desc    Get reviews for a parking lot
// @route   GET /api/parking/:id/reviews
// @access  Public
const getParkingLotReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ parkingLotId: req.params.id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add review for a parking lot
// @route   POST /api/parking/:id/reviews
// @access  Private
const createParkingLotReview = async (req, res) => {
  const { rating, comment } = req.body;
  const parkingLotId = req.params.id;

  try {
    // Check if user has completed a booking at this parking lot to verify a real review
    const bookingExists = await Booking.findOne({
      userId: req.user._id,
      parkingLotId,
      status: 'completed'
    });

    if (!bookingExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only review a parking lot after you have completed a booking session there.' 
      });
    }

    const review = await Review.create({
      userId: req.user._id,
      parkingLotId,
      rating,
      comment
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getParkingLotReviews, createParkingLotReview };
