const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const ParkingLot = require('./models/ParkingLot');
const ParkingSlot = require('./models/ParkingSlot');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Notification = require('./models/Notification');
const Review = require('./models/Review');
const crypto = require('crypto');

dotenv.config();

const citiesData = [
  {
    name: 'Connaught Place Multi-Level Parking',
    description: 'Automated puzzle parking system located at the heart of Delhi.',
    address: 'Outer Circle, Connaught Place', city: 'Delhi', state: 'Delhi', pincode: '110001',
    latitude: 28.6304, longitude: 77.2177, pricePerHour: 40, peakPricePerHour: 60, totalSlots: 15, rating: 4.5,
    amenities: ['CCTV', 'Covered', 'Accessible Parking']
  },
  {
    name: 'Bandra Kurla Complex Parking Area',
    description: 'Premium open parking close to major financial centers in Mumbai.',
    address: 'G Block, Bandra Kurla Complex', city: 'Mumbai', state: 'Maharashtra', pincode: '400051',
    latitude: 19.0596, longitude: 72.8689, pricePerHour: 50, peakPricePerHour: 80, totalSlots: 12, rating: 4.3,
    amenities: ['CCTV', 'EV Charging', 'Security Guards']
  },
  {
    name: 'Indiranagar 100 Feet Road Parking',
    description: 'Convenient street-side structured parking in Bangalore shopping district.',
    address: 'Hal 2nd Stage, Indiranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038',
    latitude: 12.9718, longitude: 77.6412, pricePerHour: 30, peakPricePerHour: 50, totalSlots: 10, rating: 4.1,
    amenities: ['CCTV', 'Covered']
  },
  {
    name: 'Vijay Nagar Smart Parking Lot',
    description: 'High-tech smart parking near major landmarks in Indore.',
    address: 'Vijay Nagar Square', city: 'Indore', state: 'Madhya Pradesh', pincode: '452010',
    latitude: 22.7533, longitude: 75.8937, pricePerHour: 20, peakPricePerHour: 35, totalSlots: 14, rating: 4.6,
    amenities: ['CCTV', 'EV Charging', 'Covered', 'Accessible Parking']
  },
  {
    name: 'DB City Mall Parking Ground',
    description: 'Ample multi-floor covered parking in central Bhopal.',
    address: 'Arera Hills, MP Nagar', city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462011',
    latitude: 23.2323, longitude: 77.4326, pricePerHour: 30, peakPricePerHour: 45, totalSlots: 15, rating: 4.4,
    amenities: ['CCTV', 'Covered', 'Car Wash']
  },
  {
    name: 'Cyber Hub Smart Parking',
    description: 'Premium automated multi-level parking lot in Gurugram Cyber City.',
    address: 'DLF Cyber City, Phase 3', city: 'Gurugram', state: 'Haryana', pincode: '122002',
    latitude: 28.4952, longitude: 77.0878, pricePerHour: 50, peakPricePerHour: 75, totalSlots: 16, rating: 4.7,
    amenities: ['CCTV', 'EV Charging', 'Covered', 'Accessible Parking']
  },
  {
    name: 'Sector 18 Multi-Level Parking',
    description: 'Massive multilevel public parking structure in Noida shopping hub.',
    address: 'Pocket E, Sector 18', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301',
    latitude: 28.5708, longitude: 77.3261, pricePerHour: 30, peakPricePerHour: 50, totalSlots: 20, rating: 4.2,
    amenities: ['CCTV', 'Covered', 'Accessible Parking']
  },
  {
    name: 'Mahakal Mandir Complex Parking',
    description: 'Secure open parking space close to the Mahakaleshwar Jyotirlinga Temple.',
    address: 'Mahakal Marg', city: 'Ujjain', state: 'Madhya Pradesh', pincode: '456001',
    latitude: 23.1775, longitude: 75.7682, pricePerHour: 20, peakPricePerHour: 30, totalSlots: 10, rating: 4.8,
    amenities: ['CCTV', 'Security Guards']
  },
  {
    name: 'Godowlia Multi-Level Smart Parking',
    description: 'Essential multi-story public parking near Varanasi Ghats.',
    address: 'Godowlia Square', city: 'Varanasi', state: 'Uttar Pradesh', pincode: '221001',
    latitude: 25.3076, longitude: 83.0039, pricePerHour: 35, peakPricePerHour: 50, totalSlots: 12, rating: 4.0,
    amenities: ['CCTV', 'Covered']
  },
  {
    name: 'Calangute Beach Central Parking',
    description: 'Large open public parking spot close to Calangute Beach entrance in North Goa.',
    address: 'Calangute Beach Rd', city: 'Goa', state: 'Goa', pincode: '403516',
    latitude: 15.5494, longitude: 73.7535, pricePerHour: 40, peakPricePerHour: 60, totalSlots: 8, rating: 4.2,
    amenities: ['CCTV', 'Security Guards']
  },
  {
    name: 'Pink City Heritage Parking Lot',
    description: 'Secure open parking near Hawa Mahal and Johri Bazaar in Jaipur.',
    address: 'Badi Chopad, Pink City', city: 'Jaipur', state: 'Rajasthan', pincode: '302002',
    latitude: 26.9239, longitude: 75.8267, pricePerHour: 25, peakPricePerHour: 40, totalSlots: 10, rating: 4.3,
    amenities: ['CCTV', 'Accessible Parking']
  },
  {
    name: 'Elante Mall Parking Plaza',
    description: 'Spacious multi-level modern parking lot at Elante Mall.',
    address: 'Industrial Area Phase I', city: 'Chandigarh', state: 'Punjab', pincode: '160002',
    latitude: 30.7061, longitude: 76.8013, pricePerHour: 30, peakPricePerHour: 50, totalSlots: 12, rating: 4.5,
    amenities: ['CCTV', 'Covered', 'EV Charging']
  },
  {
    name: 'Gachibowli IT Corridor Parking',
    description: 'Spacious smart parking located near major IT buildings in Hyderabad.',
    address: 'Hitech City Road, Gachibowli', city: 'Hyderabad', state: 'Telangana', pincode: '500032',
    latitude: 17.4483, longitude: 78.3741, pricePerHour: 30, peakPricePerHour: 45, totalSlots: 14, rating: 4.4,
    amenities: ['CCTV', 'EV Charging', 'Accessible Parking']
  },
  {
    name: 'T-Nagar Multi-Level Plaza',
    description: 'Shopping district smart multilevel puzzle parking in Chennai.',
    address: 'Usman Road, T-Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600017',
    latitude: 13.0405, longitude: 80.2337, pricePerHour: 40, peakPricePerHour: 60, totalSlots: 15, rating: 4.3,
    amenities: ['CCTV', 'Covered']
  },
  {
    name: 'Park Street Multi-Story Parking',
    description: 'Iconic parking facility serving the busy commercial hub of Park Street.',
    address: 'Park Street, Chowringhee', city: 'Kolkata', state: 'West Bengal', pincode: '700016',
    latitude: 22.5529, longitude: 88.3539, pricePerHour: 40, peakPricePerHour: 60, totalSlots: 10, rating: 4.2,
    amenities: ['CCTV', 'Covered']
  },
  {
    name: 'Phoenix Marketcity Pune Parking',
    description: 'Highly accessible and organized parking lot for premium shopping.',
    address: 'Viman Nagar, Pune-Ahmednagar Rd', city: 'Pune', state: 'Maharashtra', pincode: '411014',
    latitude: 18.5622, longitude: 73.9168, pricePerHour: 30, peakPricePerHour: 50, totalSlots: 14, rating: 4.5,
    amenities: ['CCTV', 'Covered', 'EV Charging', 'Accessible Parking']
  },
  {
    name: 'CG Road Commercial Lot',
    description: 'Centrally located public parking space for shoppers on CG Road.',
    address: 'CG Road, Navrangpura', city: 'Ahmedabad', state: 'Gujarat', pincode: '380009',
    latitude: 23.0246, longitude: 72.5601, pricePerHour: 20, peakPricePerHour: 35, totalSlots: 10, rating: 4.1,
    amenities: ['CCTV']
  },
  {
    name: 'Hazratganj Multi-Level Parking',
    description: 'Smart multi-level car park serving Lucknow main shopping stretch.',
    address: 'Hazratganj Main Rd', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001',
    latitude: 26.8504, longitude: 80.9446, pricePerHour: 30, peakPricePerHour: 45, totalSlots: 12, rating: 4.4,
    amenities: ['CCTV', 'Covered']
  },
  {
    name: 'Dharampeth Public Parking Lot',
    description: 'Well-maintained open parking lot in Dharampeth market, Nagpur.',
    address: 'West High Court Rd, Dharampeth', city: 'Nagpur', state: 'Maharashtra', pincode: '440010',
    latitude: 21.1415, longitude: 79.0601, pricePerHour: 20, peakPricePerHour: 30, totalSlots: 8, rating: 4.0,
    amenities: ['CCTV']
  },
  {
    name: 'Dumas Road Leisure Parking',
    description: 'Spacious parking lot serving shoppers and visitors along Dumas Road.',
    address: 'Dumas Road, Piplod', city: 'Surat', state: 'Gujarat', pincode: '395007',
    latitude: 21.1685, longitude: 72.7766, pricePerHour: 25, peakPricePerHour: 40, totalSlots: 10, rating: 4.3,
    amenities: ['CCTV', 'EV Charging']
  },
  {
    name: 'Maurya Lok Complex Parking',
    description: 'Open courtyard commercial public parking in central Patna.',
    address: 'Dak Bungalow Road', city: 'Patna', state: 'Bihar', pincode: '800001',
    latitude: 25.6112, longitude: 85.1325, pricePerHour: 20, peakPricePerHour: 30, totalSlots: 10, rating: 3.9,
    amenities: ['CCTV', 'Security Guards']
  },
  {
    name: 'Nucleus Mall Parking Yard',
    description: 'Secure multilevel indoor parking structure in Ranchi shopping district.',
    address: 'Circular Road, Lalpur', city: 'Ranchi', state: 'Jharkhand', pincode: '834001',
    latitude: 23.3761, longitude: 85.3347, pricePerHour: 25, peakPricePerHour: 40, totalSlots: 8, rating: 4.1,
    amenities: ['CCTV', 'Covered']
  }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-parking');
    console.log('Connected to MongoDB for India-wide Seeding...');

    // Clear existing
    await User.deleteMany();
    await ParkingLot.deleteMany();
    await ParkingSlot.deleteMany();
    await Booking.deleteMany();
    await Payment.deleteMany();
    await Notification.deleteMany();
    await Review.deleteMany();
    console.log('Cleared existing collections.');

    // 1. Users
    const salt = await bcrypt.genSalt(10);
    const admin = await User.create({
      name: 'Smart Admin',
      email: 'admin@parking.com',
      password: 'admin123',
      phone: '9999988888',
      role: 'admin',
      profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      vehicles: []
    });

    const user = await User.create({
      name: 'Rohan Sharma',
      email: 'user@parking.com',
      password: 'user123',
      phone: '8888877777',
      role: 'user',
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      vehicles: [
        { vehicleNumber: 'DL-3C-AS-1234', vehicleType: 'car' },
        { vehicleNumber: 'HR-26-BQ-5678', vehicleType: 'bike' }
      ]
    });

    console.log('Created Seed Users.');

    // 2. Parking Lots & Slots
    for (let cityLot of citiesData) {
      const cityKey = (cityLot.city || '').toLowerCase();
      const cityRealPhotos = {
        'delhi': 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
        'mumbai': 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        'bengaluru': 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
        'indore': 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80',
        'bhopal': 'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?auto=format&fit=crop&w=800&q=80',
        'gurugram': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
        'noida': 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80',
        'ujjain': 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
        'varanasi': 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80',
        'goa': 'https://images.unsplash.com/photo-1543465077-db45d34b88a5?auto=format&fit=crop&w=800&q=80',
        'jaipur': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
        'chandigarh': 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80',
        'hyderabad': 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80',
        'chennai': 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80',
        'kolkata': 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80',
        'pune': 'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?auto=format&fit=crop&w=800&q=80',
        'ahmedabad': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
        'lucknow': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
        'nagpur': 'https://images.unsplash.com/photo-1562911791-c7a97b729ec5?auto=format&fit=crop&w=800&q=80',
        'surat': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
        'patna': 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80',
        'ranchi': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80'
      };

      const lot = await ParkingLot.create({
        name: cityLot.name,
        description: cityLot.description,
        address: cityLot.address,
        city: cityLot.city,
        state: cityLot.state,
        country: 'India',
        pincode: cityLot.pincode,
        latitude: cityLot.latitude,
        longitude: cityLot.longitude,
        googlePlaceId: `place_${cityLot.city.toLowerCase()}_${cityLot.name.toLowerCase().replace(/\s+/g, '_')}`,
        totalSlots: cityLot.totalSlots,
        availableSlots: cityLot.totalSlots,
        pricePerHour: cityLot.pricePerHour,
        peakPricePerHour: cityLot.peakPricePerHour,
        peakStartHour: '17:00',
        peakEndHour: '21:00',
        bikeMultiplier: 0.5,
        evMultiplier: 1.2,
        openingTime: '00:00',
        closingTime: '23:59',
        amenities: cityLot.amenities,
        images: [cityRealPhotos[cityKey] || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'],
        rating: cityLot.rating,
        status: 'active'
      });

      // Generate slots for this lot
      const slots = [];
      for (let i = 1; i <= cityLot.totalSlots; i++) {
        const paddedNum = i.toString().padStart(2, '0');
        let vehicleType = 'car';
        if (i === cityLot.totalSlots) vehicleType = 'disabled';
        else if (i === cityLot.totalSlots - 1) vehicleType = 'ev';
        else if (i > cityLot.totalSlots - 4) vehicleType = 'bike';

        slots.push({
          parkingLotId: lot._id,
          slotNumber: `S-${paddedNum}`,
          vehicleType,
          status: 'available',
          sensorId: `sensor-${lot._id}-${paddedNum}`
        });
      }
      const seededSlots = await ParkingSlot.insertMany(slots);

      // Create a dummy completed review for this lot
      await Review.create({
        userId: user._id,
        parkingLotId: lot._id,
        rating: Math.floor(cityLot.rating),
        comment: `Excellent and secure smart parking experience at ${lot.name}. The slot availability status was perfectly accurate.`
      });

      // If it is Vijay Nagar Smart Parking Lot, add an active booking to demonstrate the dashboard
      if (cityLot.city === 'Indore') {
        const dateStart = new Date();
        dateStart.setHours(dateStart.getHours() - 1);
        const dateEnd = new Date();
        dateEnd.setHours(dateEnd.getHours() + 2);

        const booking = await Booking.create({
          userId: user._id,
          parkingLotId: lot._id,
          slotId: seededSlots[0]._id,
          vehicleNumber: 'DL-3C-AS-1234',
          startTime: dateStart,
          endTime: dateEnd,
          amount: lot.pricePerHour * 3,
          status: 'active',
          qrToken: crypto.randomBytes(24).toString('hex'),
          createdAt: new Date()
        });

        await Payment.create({
          bookingId: booking._id,
          userId: user._id,
          amount: booking.amount,
          transactionId: `pay_${crypto.randomBytes(12).toString('hex')}`,
          status: 'success',
          paymentProvider: 'razorpay',
          paidAt: new Date()
        });

        // Set slot to occupied
        seededSlots[0].status = 'occupied';
        await seededSlots[0].save();

        lot.availableSlots = lot.totalSlots - 1;
        await lot.save();
      }
    }

    console.log(`Successfully seeded ${citiesData.length} India-wide multi-city parking lots.`);
    
    // 3. Create generic global notification
    await Notification.create({
      userId: user._id,
      title: 'Welcome to ParkSmart India! 🇮🇳',
      message: 'Welcome to ParkSmart India! You can search parking spots anywhere in India, view availability on Google Maps, and secure booking tickets instantly.',
      type: 'info'
    });

    console.log('Seeded global notifications.');
    console.log('India-wide seeding successfully finished.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error: ', error);
    process.exit(1);
  }
};

seedData();
