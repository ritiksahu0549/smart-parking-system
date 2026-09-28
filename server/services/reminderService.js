const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');

const checkUpcomingBookings = async () => {
  try {
    const now = new Date();
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

    // Find bookings starting in next 30 minutes, confirmed, and reminder not sent
    const bookings = await Booking.find({
      status: 'confirmed',
      reminderSent: false,
      startTime: { $gte: now, $lte: thirtyMinutesLater }
    }).populate('parkingLotId').populate('slotId');

    for (let booking of bookings) {
      // Create notification
      const lotName = booking.parkingLotId ? booking.parkingLotId.name : 'Reserved Lot';
      const slotNum = booking.slotId ? booking.slotId.slotNumber : 'assigned slot';

      await Notification.create({
        userId: booking.userId,
        title: 'Upcoming Booking Reminder ⏰',
        message: `⏰ Your parking reservation at ${lotName} starts soon (at ${new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). Slot: ${slotNum}`,
        type: 'reminder'
      });

      // Mark reminder as sent
      booking.reminderSent = true;
      await booking.save();

      // Emit socket event to the user
      if (global.io) {
        global.io.emit('notification:new', {
          userId: booking.userId,
          message: `Upcoming booking starting soon at slot ${slotNum}.`
        });
      }

      console.log(`[Reminder Service] Sent reminder to user ${booking.userId} for booking ${booking._id}`);
    }
  } catch (error) {
    console.error('[Reminder Service Error]:', error.message);
  }
};

const startReminderScheduler = () => {
  console.log('[Reminder Service] Initialized upcoming booking reminder worker (Runs every 1 min)...');
  // Run check every 60 seconds
  setInterval(checkUpcomingBookings, 60000);
  
  // Also run immediately on boot
  checkUpcomingBookings();
};

module.exports = { startReminderScheduler };
