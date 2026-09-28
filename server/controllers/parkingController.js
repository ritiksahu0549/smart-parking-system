const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');

// @desc    Get all parking lots (with optional filters)
// @route   GET /api/parking
// @access  Public
const getParkingLots = async (req, res) => {
  const { search, city, status } = req.query;

  try {
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }

    const lots = await ParkingLot.find(query);
    res.json({ success: true, count: lots.length, lots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single parking lot by ID
// @route   GET /api/parking/:id
// @access  Public
const getParkingLotById = async (req, res) => {
  try {
    const lot = await ParkingLot.findById(req.params.id);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }
    res.json({ success: true, lot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a parking lot
// @route   POST /api/parking
// @access  Private/Admin
const createParkingLot = async (req, res) => {
  const { 
    name, description, address, city, state, pincode, latitude, longitude, totalSlots, pricePerHour, 
    peakPricePerHour, peakStartHour, peakEndHour, bikeMultiplier, evMultiplier,
    openingTime, closingTime, images, amenities
  } = req.body;

  try {
    const lot = await ParkingLot.create({
      name,
      description: description || '',
      address,
      city,
      state: state || city,
      pincode: pincode || '100001',
      latitude,
      longitude,
      totalSlots,
      availableSlots: totalSlots, // Initially all slots available
      pricePerHour,
      peakPricePerHour,
      peakStartHour: peakStartHour || "17:00",
      peakEndHour: peakEndHour || "21:00",
      bikeMultiplier: bikeMultiplier || 0.5,
      evMultiplier: evMultiplier || 1.2,
      openingTime: openingTime || "00:00",
      closingTime: closingTime || "23:59",
      images: images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80'],
      amenities: amenities || ['CCTV', 'Covered']
    });

    // Automatically seed slot numbers (A01, A02, etc.) for convenience
    const slotsToCreate = [];
    for (let i = 1; i <= totalSlots; i++) {
      const paddedNum = i.toString().padStart(2, '0');
      // Assign types: first 70% cars, 15% bikes, 10% EVs, 5% disabled
      let vehicleType = 'car';
      if (i > Math.floor(totalSlots * 0.95)) {
        vehicleType = 'disabled';
      } else if (i > Math.floor(totalSlots * 0.85)) {
        vehicleType = 'ev';
      } else if (i > Math.floor(totalSlots * 0.70)) {
        vehicleType = 'bike';
      }

      slotsToCreate.push({
        parkingLotId: lot._id,
        slotNumber: `S-${paddedNum}`,
        vehicleType,
        status: 'available',
        sensorId: `sensor-${lot._id}-${paddedNum}`
      });
    }
    await ParkingSlot.insertMany(slotsToCreate);

    res.status(201).json({ success: true, lot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a parking lot
// @route   PUT /api/parking/:id
// @access  Private/Admin
const updateParkingLot = async (req, res) => {
  try {
    const lot = await ParkingLot.findById(req.params.id);

    if (!lot) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }

    // Update fields
    const updatedLot = await ParkingLot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, lot: updatedLot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a parking lot
// @route   DELETE /api/parking/:id
// @access  Private/Admin
const deleteParkingLot = async (req, res) => {
  try {
    const lot = await ParkingLot.findById(req.params.id);

    if (!lot) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }

    // Delete associated slots
    await ParkingSlot.deleteMany({ parkingLotId: lot._id });
    await lot.deleteOne();

    res.json({ success: true, message: 'Parking lot and all its slots deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload an image file / base64 to server/uploads
// @route   POST /api/parking/upload
// @access  Private/Admin
const uploadParkingImage = async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.json({ success: true, imageUrl: imageBase64 });
    }

    const ext = matches[1].split('/')[1] || 'png';
    const buffer = Buffer.from(matches[2], 'base64');
    const safeName = `lot_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
    const uploadDir = path.join(__dirname, '../uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadDir, safeName), buffer);
    const imageUrl = `/uploads/${safeName}`;

    res.json({ success: true, imageUrl, message: 'Image uploaded successfully' });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ success: false, message: 'Failed to save image' });
  }
};

module.exports = {
  getParkingLots,
  getParkingLotById,
  createParkingLot,
  updateParkingLot,
  deleteParkingLot,
  uploadParkingImage
};
