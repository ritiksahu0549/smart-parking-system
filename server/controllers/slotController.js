const ParkingSlot = require('../models/ParkingSlot');
const ParkingLot = require('../models/ParkingLot');

// @desc    Get slots for a specific parking lot
// @route   GET /api/parking/:id/slots
// @access  Public
const getSlotsByLot = async (req, res) => {
  try {
    const slots = await ParkingSlot.find({ parkingLotId: req.params.id }).sort({ slotNumber: 1 });
    res.json({ success: true, count: slots.length, slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a parking slot manually
// @route   POST /api/slots
// @access  Private/Admin
const createSlot = async (req, res) => {
  const { parkingLotId, slotNumber, vehicleType, sensorId } = req.body;

  try {
    const lot = await ParkingLot.findById(parkingLotId);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }

    const slotExists = await ParkingSlot.findOne({ parkingLotId, slotNumber });
    if (slotExists) {
      return res.status(400).json({ success: false, message: 'Slot number already exists in this lot' });
    }

    const slot = await ParkingSlot.create({
      parkingLotId,
      slotNumber,
      vehicleType: vehicleType || 'car',
      status: 'available',
      sensorId: sensorId || `sensor-${parkingLotId}-${slotNumber}`
    });

    // Update lot slot counters
    lot.totalSlots += 1;
    lot.availableSlots += 1;
    await lot.save();

    res.status(201).json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a parking slot's status or info
// @route   PUT /api/slots/:id
// @access  Private/Admin
const updateSlot = async (req, res) => {
  const { status, vehicleType, slotNumber } = req.body;

  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    const lot = await ParkingLot.findById(slot.parkingLotId);
    const oldStatus = slot.status;

    if (status) slot.status = status;
    if (vehicleType) slot.vehicleType = vehicleType;
    if (slotNumber) slot.slotNumber = slotNumber;

    const updatedSlot = await slot.save();

    // Adjust availability count on the parking lot if status changed
    if (lot && status && oldStatus !== status) {
      if (oldStatus === 'available' && status !== 'available') {
        lot.availableSlots = Math.max(0, lot.availableSlots - 1);
      } else if (oldStatus !== 'available' && status === 'available') {
        lot.availableSlots = Math.min(lot.totalSlots, lot.availableSlots + 1);
      }
      await lot.save();
    }

    // Trigger Socket.IO update (handled in socket handler, but we emit here if reference exists)
    if (global.io) {
      global.io.emit('slotUpdated', { slotId: slot._id, parkingLotId: slot.parkingLotId, slot: updatedSlot });
    }

    res.json({ success: true, slot: updatedSlot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSlotsByLot,
  createSlot,
  updateSlot
};
