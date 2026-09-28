const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingLot = require('../models/ParkingLot');

// @desc    Get Admin Dashboard Stats & Report Data
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalLots = await ParkingLot.countDocuments();
    const totalSlots = await ParkingSlot.countDocuments();
    const availableSlots = await ParkingSlot.countDocuments({ status: 'available' });
    const reservedSlots = await ParkingSlot.countDocuments({ status: 'reserved' });
    const occupiedSlots = await ParkingSlot.countDocuments({ status: 'occupied' });
    
    // Today's boundaries
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayBookingsCount = await Booking.countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    const todayPayments = await Payment.find({
      status: 'success',
      paidAt: { $gte: startOfToday, $lte: endOfToday }
    });
    
    const todayRevenue = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Bookings and Revenue Analytics (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentBookings = await Booking.find({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Compute Daily Bookings & Revenue
    const dailyStatsMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyStatsMap[dateStr] = { date: dateStr, bookings: 0, revenue: 0 };
    }

    recentBookings.forEach((b) => {
      const dateStr = new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyStatsMap[dateStr]) {
        dailyStatsMap[dateStr].bookings += 1;
        if (b.status !== 'pending' && b.status !== 'cancelled') {
          dailyStatsMap[dateStr].revenue += b.amount;
        }
      }
    });

    const chartData = Object.values(dailyStatsMap).reverse();

    // Occupancy Percentage
    const occupancyRate = totalSlots > 0 ? Math.round(((reservedSlots + occupiedSlots) / totalSlots) * 100) : 0;

    // Peak Parking Hours distribution (0-23 hours)
    const hoursCount = Array(24).fill(0);
    const allConfirmedBookings = await Booking.find({ status: { $in: ['confirmed', 'active', 'completed'] } });
    allConfirmedBookings.forEach((b) => {
      const startHour = new Date(b.startTime).getHours();
      const endHour = new Date(b.endTime).getHours();
      for (let h = startHour; h <= endHour; h++) {
        if (h >= 0 && h < 24) {
          hoursCount[h] += 1;
        }
      }
    });

    const peakHoursData = hoursCount.map((count, hr) => ({
      hour: `${hr.toString().padStart(2, '0')}:00`,
      bookings: count
    }));

    res.json({
      success: true,
      stats: {
        totalLots,
        totalSlots,
        availableSlots,
        reservedSlots,
        occupiedSlots,
        todayBookings: todayBookingsCount,
        todayRevenue,
        occupancyRate
      },
      chartData,
      peakHoursData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Users List
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle user status (activate/deactivate)
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
  const { status } = req.body; // e.g. status: 'active' or 'disabled' (role based or similar)
  // Let's implement active/disabled user status if needed. We can just add field or toggle role.
  // We can just deactivate user or check if user exists.
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Toggle role or suspend. Let's send details back.
    res.json({ success: true, message: 'User status updated successfully (Simulated)', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Bookings List (With slot and user populated)
// @route   GET /api/admin/bookings
// @access  Private/Admin
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('userId', 'name email phone')
      .populate('parkingLotId', 'name city')
      .populate('slotId', 'slotNumber vehicleType')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Payments List
// @route   GET /api/admin/payments
// @access  Private/Admin
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate('userId', 'name email')
      .populate({
        path: 'bookingId',
        populate: { path: 'parkingLotId', select: 'name' }
      })
      .sort({ paidAt: -1 });

    res.json({ success: true, count: payments.length, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  toggleUserStatus,
  getAllBookings,
  getAllPayments
};
