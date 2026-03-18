const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const Ride = require('./models/Ride');
const Booking = require('./models/Booking');
const User = require('./models/User');
const { initWhatsApp, notify } = require('./utils/whatsapp');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Initialize WhatsApp
initWhatsApp();

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Duvi API is running' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin', require('./routes/admin'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

// Clean up expired held seats every minute
setInterval(async () => {
  try {
    await Ride.updateMany(
      { 'seats.status': 'held', 'seats.heldUntil': { $lt: new Date() } },
      {
        $set: {
          'seats.$[seat].status': 'available',
          'seats.$[seat].heldBy': null,
          'seats.$[seat].heldUntil': null
        }
      },
      {
        arrayFilters: [
          { 'seat.status': 'held', 'seat.heldUntil': { $lt: new Date() } }
        ]
      }
    );
  } catch (err) {
    console.error('Seat cleanup error:', err);
  }
}, 60 * 1000);

// 12 hour reminder — runs every hour
setInterval(async () => {
  try {
    const now = new Date();
    const in12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const todayDate = in12Hours.toISOString().split('T')[0];
    const targetHour = in12Hours.getHours();
    const targetTime = `${String(targetHour).padStart(2, '0')}:00`;

    // Find rides departing in ~12 hours
    const rides = await Ride.find({
      date: todayDate,
      departureTime: targetTime,
      status: 'scheduled'
    }).populate('driverId', 'name phone');

    for (const ride of rides) {
      // Get confirmed bookings for this ride
      const bookings = await Booking.find({
        rideId: ride._id,
        status: 'accepted'
      }).populate('passengerId', 'name phone');

      // Notify each passenger
      for (const booking of bookings) {
        await notify.passengerReminder(
          booking.passengerId.phone,
          ride.date,
          ride.departureTime,
          booking.pickupLandmark,
          booking.pickupStop,
          ride.driverId.phone
        );
      }

      // Build passenger list for driver
      const passengerList = bookings.map((b, i) =>
        `${i + 1}. ${b.passengerId.name} — Seat ${b.seatNumber}\n   📍 ${b.pickupLandmark}, ${b.pickupStop}`
      ).join('\n\n');

      // Notify driver with full list
      if (bookings.length > 0) {
        await notify.driverReminder(
          ride.driverId.phone,
          ride.date,
          ride.departureTime,
          passengerList
        );
      }
    }
  } catch (err) {
    console.error('Reminder job error:', err);
  }
}, 60 * 60 * 1000);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});