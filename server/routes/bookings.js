const { notify } = require('../utils/whatsapp');
const User = require('../models/User');
const router = require('express').Router();
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const auth = require('../middleware/auth');
const { isValidRoute } = require('../utils/route');

// POST /api/bookings — passenger books a seat
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'passenger') {
      return res.status(403).json({ error: 'Only passengers can book seats' });
    }

    const {
      rideId,
      seatNumber,
      pickupStop,
      pickupLandmark,
      pickupCoordinates,
      dropoffStop
    } = req.body;

    if (!rideId || !seatNumber || !pickupStop || !pickupLandmark || !dropoffStop) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate pickup → dropoff direction
    if (!isValidRoute(pickupStop, dropoffStop)) {
      return res.status(400).json({
        error: `${dropoffStop} comes before ${pickupStop} on the route`
      });
    }

    // Find the ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.status !== 'scheduled') {
      return res.status(400).json({ error: 'Ride is not available' });
    }

    // Validate pickup stop is on this ride
    const pickupOnRide = ride.stops.find(s => s.location === pickupStop);
    if (!pickupOnRide) {
      return res.status(400).json({
        error: `${pickupStop} is not a stop on this ride`
      });
    }

    // Atomic seat hold — only succeeds if seat is still available
    const result = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        'seats.number': seatNumber,
        'seats.status': 'available'
      },
      {
        $set: {
          'seats.$.status': 'held',
          'seats.$.heldBy': req.user._id,
          'seats.$.heldUntil': new Date(Date.now() + 5 * 60 * 1000)
        }
      },
      { new: true }
    );

    if (!result) {
      return res.status(409).json({
        error: 'Seat is no longer available, please pick another'
      });
    }

    // Create booking
    const booking = await Booking.create({
      rideId,
      passengerId: req.user._id,
      seatNumber,
      pickupStop,
      pickupLandmark,
      pickupCoordinates,
      dropoffStop,
      status: 'pending'
    });

    // Mark seat as booked
    await Ride.findOneAndUpdate(
      { _id: rideId, 'seats.number': seatNumber },
      { $set: { 'seats.$.status': 'booked' } }
    );

    // Notify driver via WhatsApp
const driver = await User.findById(ride.driverId);
if (driver) {
  await notify.newBookingDriver(
    driver.phone,
    req.user.name,
    req.user.age,
    seatNumber,
    pickupStop,
    pickupLandmark,
    dropoffStop,
    ride.date,
    ride.departureTime
  );
}

    res.status(201).json({
      message: 'Seat booked successfully, waiting for driver to accept',
      booking
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/bookings/my — passenger sees their bookings
router.get('/my', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ passengerId: req.user._id })
      .populate('rideId', 'date departureTime startStop endStop fare driverId')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/rides/:id/bookings — driver sees bookings for their ride
router.get('/ride/:rideId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Only drivers can view ride bookings' });
    }

    const ride = await Ride.findById(req.params.rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your ride' });
    }

    const bookings = await Booking.find({ rideId: req.params.rideId })
      .populate('passengerId', 'name phone age')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PATCH /api/bookings/:id/accept — driver accepts booking
router.patch('/:id/accept', auth, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Only drivers can accept bookings' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('passengerId', 'name phone')
      .populate('rideId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Make sure this is the driver's ride
    if (booking.rideId.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your ride' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: `Booking is already ${booking.status}` });
    }

    booking.status = 'accepted';
    await booking.save();

    // Notify passenger via WhatsApp
const driver = await User.findById(booking.rideId.driverId);
await notify.bookingAccepted(
  booking.passengerId.phone,
  req.user.name,
  req.user.phone,
  booking.seatNumber,
  booking.pickupLandmark,
  booking.pickupStop,
  booking.rideId.date,
  booking.rideId.departureTime,
  booking.rideId.fare
);

    res.json({
      message: 'Booking accepted',
      booking
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PATCH /api/bookings/:id/reject — driver rejects booking
router.patch('/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Only drivers can reject bookings' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('passengerId', 'name phone')
      .populate('rideId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.rideId.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your ride' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: `Booking is already ${booking.status}` });
    }

    booking.status = 'rejected';
    await booking.save();

    // Release the seat back to available
    await Ride.findOneAndUpdate(
      { _id: booking.rideId._id, 'seats.number': booking.seatNumber },
      { $set: { 'seats.$.status': 'available' } }
    );

    // Notify passenger via WhatsApp
await notify.bookingRejected(
  booking.passengerId.phone,
  booking.rideId.date,
  booking.rideId.departureTime
);

    res.json({
      message: 'Booking rejected',
      booking
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PATCH /api/bookings/:id/cancel — passenger cancels booking
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('rideId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only the passenger who made the booking can cancel it
    if (booking.passengerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking already cancelled' });
    }

    booking.status = 'cancelled';
    booking.cancelledBy = 'passenger';
    await booking.save();

    // Release seat back to available
    await Ride.findOneAndUpdate(
      { _id: booking.rideId._id, 'seats.number': booking.seatNumber },
      { $set: { 'seats.$.status': 'available' } }
    );

    // Notify driver via WhatsApp
const driver = await User.findById(booking.rideId.driverId);
if (driver) {
  await notify.bookingCancelledByPassenger(
    driver.phone,
    req.user.name,
    booking.seatNumber,
    booking.rideId.date
  );
}

    res.json({
      message: 'Booking cancelled',
      booking
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;