const mongoose = require('mongoose');

const ParkingLotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
  pincode: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  googlePlaceId: { type: String, default: '' },
  totalSlots: { type: Number, required: true },
  availableSlots: { type: Number, required: true },
  pricePerHour: { type: Number, required: true, default: 20 },
  peakPricePerHour: { type: Number, required: true, default: 30 },
  peakStartHour: { type: String, required: true, default: "17:00" },
  peakEndHour: { type: String, required: true, default: "21:00" },
  bikeMultiplier: { type: Number, required: true, default: 0.5 },
  evMultiplier: { type: Number, required: true, default: 1.2 },
  openingTime: { type: String, required: true, default: "00:00" },
  closingTime: { type: String, required: true, default: "23:59" },
  amenities: [{ type: String }],
  images: [{ type: String }],
  rating: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ParkingLot', ParkingLotSchema);
