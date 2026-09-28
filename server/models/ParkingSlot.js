const mongoose = require('mongoose');

const ParkingSlotSchema = new mongoose.Schema({
  parkingLotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLot', required: true },
  slotNumber: { type: String, required: true },
  vehicleType: { type: String, enum: ['car', 'bike', 'ev', 'disabled'], default: 'car' },
  status: { type: String, enum: ['available', 'reserved', 'occupied', 'maintenance'], default: 'available' },
  sensorId: { type: String, unique: true, sparse: true }
});

module.exports = mongoose.model('ParkingSlot', ParkingSlotSchema);
