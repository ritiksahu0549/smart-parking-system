const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingLot = require('../models/ParkingLot');
const Notification = require('../models/Notification');

// @desc    Verify QR code and allow entry
// @route   POST /api/entry/verify
// @access  Private (Admin/Operator)
const verifyEntry = async (req, res) => {
  const { qrToken } = req.body;

  try {
    const booking = await Booking.findOne({ qrToken })
      .populate('parkingLotId')
      .populate('slotId')
      .populate('userId');

    if (!booking) {
      return res.status(404).json({ success: false, message: '❌ Invalid booking token/QR' });
    }

    if (booking.status === 'active') {
      return res.status(400).json({ success: false, message: '❌ Vehicle has already entered' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: `❌ Booking status is '${booking.status}', not confirmed` });
    }

    const now = new Date();
    // Allow entry up to 30 mins before start time
    const bufferStartTime = new Date(booking.startTime.getTime() - 30 * 60 * 1000);
    
    if (now < bufferStartTime) {
      return res.status(400).json({ 
        success: false, 
        message: `❌ Entry not allowed yet. Booking starts at ${booking.startTime.toLocaleTimeString()}` 
      });
    }

    if (now > booking.endTime) {
      // Mark as expired
      booking.status = 'expired';
      await booking.save();
      
      const slot = await ParkingSlot.findById(booking.slotId);
      if (slot && slot.status === 'reserved') {
        slot.status = 'available';
        await slot.save();

        const lot = await ParkingLot.findById(booking.parkingLotId);
        if (lot) {
          lot.availableSlots = Math.min(lot.totalSlots, lot.availableSlots + 1);
          await lot.save();
        }
        
        if (global.io) {
          global.io.emit('slotUpdated', { slotId: slot._id, parkingLotId: slot.parkingLotId, slot });
        }
      }

      return res.status(400).json({ success: false, message: '❌ Booking has expired' });
    }

    // Update Booking status to active
    booking.status = 'active';
    await booking.save();

    // Update Slot status to occupied
    const slot = await ParkingSlot.findById(booking.slotId);
    if (slot) {
      slot.status = 'occupied';
      await slot.save();
    }

    // Create entry notification
    await Notification.create({
      userId: booking.userId._id,
      message: `🚗 Vehicle entry verified for slot ${slot.slotNumber} at ${booking.parkingLotId.name}. Welcome!`,
      type: 'entry_success'
    });

    // Broadcast socket event
    if (global.io) {
      global.io.emit('slotUpdated', { slotId: slot._id, parkingLotId: slot.parkingLotId, slot });
      global.io.emit('vehicleEntered', { bookingId: booking._id, slotId: slot._id });
    }

    res.json({ 
      success: true, 
      message: '✅ Entry Allowed! Slot status updated to Occupied.', 
      booking 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process vehicle exit
// @route   POST /api/exit
// @access  Private (Admin/Operator)
const processExit = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId)
      .populate('parkingLotId')
      .populate('slotId')
      .populate('userId');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'active') {
      return res.status(400).json({ success: false, message: `Cannot exit: Booking status is '${booking.status}' (must be 'active')` });
    }

    // Update booking status
    booking.status = 'completed';
    await booking.save();

    // Update slot status to available
    const slot = await ParkingSlot.findById(booking.slotId);
    if (slot) {
      slot.status = 'available';
      await slot.save();
    }

    // Increment available slots in ParkingLot
    const lot = await ParkingLot.findById(booking.parkingLotId);
    if (lot) {
      lot.availableSlots = Math.min(lot.totalSlots, lot.availableSlots + 1);
      await lot.save();
    }

    // Create exit notification
    await Notification.create({
      userId: booking.userId._id,
      message: `🏁 Vehicle exit completed for slot ${slot ? slot.slotNumber : ''} at ${lot ? lot.name : ''}. Thank you!`,
      type: 'exit_success'
    });

    // Broadcast socket event
    if (global.io) {
      global.io.emit('slotUpdated', { slotId: slot._id, parkingLotId: slot.parkingLotId, slot });
      global.io.emit('vehicleExited', { bookingId: booking._id, slotId: slot._id });
    }

    res.json({ 
      success: true, 
      message: 'Vehicle exit successfully completed. Slot is now Available.', 
      booking 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { verifyEntry, processExit };
