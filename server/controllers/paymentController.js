const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingLot = require('../models/ParkingLot');
const Notification = require('../models/Notification');
const crypto = require('crypto');

// @desc    Create Razorpay Order (Mocked for sandbox mode)
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking is not in pending status' });
    }

    // Simulate Razorpay order details
    const orderId = `order_${crypto.randomBytes(12).toString('hex')}`;
    
    // Create or update pending payment log
    let payment = await Payment.findOne({ bookingId: booking._id });
    if (!payment) {
      payment = await Payment.create({
        bookingId: booking._id,
        userId: req.user._id,
        amount: booking.amount,
        transactionId: orderId,
        status: 'pending',
        paymentProvider: 'razorpay'
      });
    } else {
      payment.transactionId = orderId;
      payment.status = 'pending';
      await payment.save();
    }

    res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkeyid123',
      orderId,
      amount: booking.amount * 100, // Razorpay works in paise
      currency: 'INR',
      bookingId: booking._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay Payment (Simulated checkout verify)
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
  const { bookingId, transactionId, paymentStatus } = req.body; // paymentStatus = 'success' or 'failed'

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const effectiveTxnId = transactionId || `pay_${crypto.randomBytes(12).toString('hex')}`;

    // Find or create the corresponding payment record
    let payment = await Payment.findOne({ bookingId: booking._id });
    if (!payment) {
      payment = new Payment({
        bookingId: booking._id,
        userId: req.user._id,
        amount: booking.amount,
        transactionId: effectiveTxnId,
        status: paymentStatus === 'success' ? 'success' : 'failed',
        paymentProvider: 'razorpay',
        paidAt: paymentStatus === 'success' ? new Date() : null
      });
    }

    if (paymentStatus === 'success') {
      // 1. Update Payment status
      payment.status = 'success';
      payment.paidAt = new Date();
      payment.transactionId = effectiveTxnId;
      await payment.save();

      // 2. Ensure booking has a QR token and update status to confirmed
      if (!booking.qrToken) {
        booking.qrToken = crypto.randomBytes(24).toString('hex');
      }
      booking.status = 'confirmed';
      await booking.save();

      // 3. Update slot status to reserved
      const slot = await ParkingSlot.findById(booking.slotId);
      if (slot) {
        slot.status = 'reserved';
        await slot.save();
      }

      // 4. Update available slots count of the ParkingLot
      const lot = await ParkingLot.findById(booking.parkingLotId);
      if (lot) {
        lot.availableSlots = Math.max(0, lot.availableSlots - 1);
        await lot.save();
      }

      // 5. Create notifications
      await Notification.create({
        userId: req.user._id,
        title: 'Payment Successful',
        message: `Payment of ₹${booking.amount} was successfully verified. Transaction ID: ${payment.transactionId}`,
        type: 'payment_success'
      });

      await Notification.create({
        userId: req.user._id,
        title: 'Booking Confirmed 🎉',
        message: `Your reservation for Slot ${slot ? slot.slotNumber : ''} at ${lot ? lot.name : 'Parking Lot'} is confirmed! QR Ticket is ready.`,
        type: 'booking_confirmed'
      });

      // 6. Broadcast socket update
      if (global.io) {
        global.io.emit('slotUpdated', { slotId: slot ? slot._id : null, parkingLotId: lot ? lot._id : null, slot });
        global.io.emit('bookingCreated', { bookingId: booking._id, userId: req.user._id });
      }

      // 7. Return fully populated booking
      const populatedBooking = await Booking.findById(booking._id)
        .populate('parkingLotId')
        .populate('slotId')
        .populate('userId', 'name email phone');

      res.json({
        success: true,
        message: 'Payment verified and booking confirmed successfully!',
        booking: populatedBooking,
        payment
      });
    } else {
      // Payment Failed
      payment.status = 'failed';
      await payment.save();

      booking.status = 'cancelled';
      await booking.save();

      res.status(400).json({ success: false, message: 'Payment failed. Booking cancelled.', payment });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's payment transaction history
// @route   GET /api/payment/my
// @access  Private
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'parkingLotId', select: 'name city address' },
          { path: 'slotId', select: 'slotNumber vehicleType' }
        ]
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: payments.length, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createOrder, verifyPayment, getMyPayments };
