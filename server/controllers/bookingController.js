const Booking = require('../models/Booking');
const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');
const Notification = require('../models/Notification');
const crypto = require('crypto');

// Helper function to calculate price
const calculatePrice = (startTime, endTime, lot, vehicleType) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  
  if (diffMs <= 0) return 0;
  
  // Convert duration to hours (ceil to nearest hour)
  const durationHours = Math.ceil(diffMs / (1000 * 60 * 60));
  
  // Multipliers
  let multiplier = 1.0;
  if (vehicleType === 'bike') multiplier = lot.bikeMultiplier || 0.5;
  if (vehicleType === 'ev') multiplier = lot.evMultiplier || 1.2;
  
  let totalAmount = 0;
  
  // Calculate hour by hour to apply peak rates
  for (let i = 0; i < durationHours; i++) {
    const currentHourTime = new Date(start.getTime() + i * 60 * 60 * 1000);
    const hour = currentHourTime.getHours();
    
    // Parse peak hours config
    const peakStart = parseInt(lot.peakStartHour.split(':')[0], 10);
    const peakEnd = parseInt(lot.peakEndHour.split(':')[0], 10);
    
    let isPeak = false;
    if (peakStart <= peakEnd) {
      isPeak = hour >= peakStart && hour < peakEnd;
    } else {
      // Over midnight peak hours (e.g. 22:00 to 04:00)
      isPeak = hour >= peakStart || hour < peakEnd;
    }
    
    const rate = isPeak ? lot.peakPricePerHour : lot.pricePerHour;
    totalAmount += rate;
  }
  
  return Math.round(totalAmount * multiplier);
};

// @desc    Calculate parking price estimation
// @route   POST /api/bookings/estimate
// @access  Private
const getPriceEstimate = async (req, res) => {
  const { parkingLotId, startTime, endTime, vehicleType } = req.body;
  try {
    const lot = await ParkingLot.findById(parkingLotId);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }
    const amount = calculatePrice(startTime, endTime, lot, vehicleType);
    res.json({ success: true, amount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a booking (starts as 'pending')
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  const { parkingLotId, slotId, vehicleNumber, vehicleType, startTime, endTime } = req.body;

  try {
    // 1. Validation
    const lot = await ParkingLot.findById(parkingLotId);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }

    const slot = await ParkingSlot.findById(slotId);
    if (!slot || slot.status === 'maintenance') {
      return res.status(400).json({ success: false, message: 'Slot not available or under maintenance' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }
    if (start < new Date(Date.now() - 5 * 60 * 1000)) { // allow 5 mins tolerance
      return res.status(400).json({ success: false, message: 'Start time cannot be in the past' });
    }

    // 2. Overlap Booking Check
    const overlappingBooking = await Booking.findOne({
      slotId,
      status: { $in: ['confirmed', 'active', 'pending'] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({ 
        success: false, 
        message: 'This slot is already booked or reserved for the selected time range' 
      });
    }

    // 3. Calculate Amount
    const amount = calculatePrice(startTime, endTime, lot, vehicleType);

    // 4. Create Booking in 'pending' status (waiting for payment)
    const qrToken = crypto.randomBytes(24).toString('hex');
    const booking = await Booking.create({
      userId: req.user._id,
      parkingLotId,
      slotId,
      vehicleNumber,
      startTime,
      endTime,
      amount,
      status: 'pending',
      qrToken
    });

    res.status(201).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in user's bookings
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('parkingLotId', 'name address city')
      .populate('slotId', 'slotNumber vehicleType')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get booking details by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('parkingLotId')
      .populate('slotId')
      .populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ensure users can only view their own bookings unless they are admin
    if (booking.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Auth check
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'completed' || booking.status === 'active' || booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: `Cannot cancel a booking that is ${booking.status}` });
    }

    const previousStatus = booking.status;
    booking.status = 'cancelled';
    await booking.save();

    // If it was already paid/confirmed, set slot back to available and update lot stats
    if (previousStatus === 'confirmed') {
      const slot = await ParkingSlot.findById(booking.slotId);
      if (slot && slot.status === 'reserved') {
        slot.status = 'available';
        await slot.save();

        const lot = await ParkingLot.findById(booking.parkingLotId);
        if (lot) {
          lot.availableSlots = Math.min(lot.totalSlots, lot.availableSlots + 1);
          await lot.save();
        }

        // Notify socket clients of slot availability
        if (global.io) {
          global.io.emit('slotUpdated', { slotId: slot._id, parkingLotId: slot.parkingLotId, slot });
        }
      }
    }

    // Create notification
    await Notification.create({
      userId: booking.userId,
      message: `Your booking for slot ${booking.slotId.slotNumber || 'reserved slot'} at ${booking.parkingLotId.name || 'parking lot'} has been cancelled.`,
      type: 'cancelled'
    });

    if (global.io) {
      global.io.emit('bookingCancelled', { bookingId: booking._id, userId: booking.userId });
    }

    res.json({ success: true, message: 'Booking cancelled successfully', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPriceEstimate,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking
};
