const ParkingSlot = require('../models/ParkingSlot');
const ParkingLot = require('../models/ParkingLot');

// @desc    Simulate IoT sensor status change for a slot
// @route   PATCH /api/iot/slot/:id/status
// @access  Private/Admin
const updateSlotIotStatus = async (req, res) => {
  const { status } = req.body; // 'available', 'occupied', 'reserved', 'maintenance'

  if (!['available', 'occupied', 'reserved', 'maintenance'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid slot status' });
  }

  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    const oldStatus = slot.status;
    slot.status = status;
    const updatedSlot = await slot.save();

    // Adjust availability count on the parking lot
    const lot = await ParkingLot.findById(slot.parkingLotId);
    if (lot && oldStatus !== status) {
      if (oldStatus === 'available' && status !== 'available') {
        lot.availableSlots = Math.max(0, lot.availableSlots - 1);
      } else if (oldStatus !== 'available' && status === 'available') {
        lot.availableSlots = Math.min(lot.totalSlots, lot.availableSlots + 1);
      }
      await lot.save();
    }

    // Broadcast the update immediately via Socket.IO
    if (global.io) {
      global.io.emit('slotUpdated', {
        slotId: slot._id,
        parkingLotId: slot.parkingLotId,
        slot: updatedSlot
      });
    }

    res.json({ 
      success: true, 
      message: `IoT Event: Slot status changed from ${oldStatus} to ${status}`, 
      slot: updatedSlot 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { updateSlotIotStatus };
