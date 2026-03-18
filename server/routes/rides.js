const router = require('express').Router();
const Ride = require('../models/Ride');
const auth = require('../middleware/auth');
const { calculateStopTimes, isValidStartEnd, isValidRoute, ROUTE } = require('../utils/route');

// POST /api/rides — driver creates a ride
router.post('/', auth, async (req, res) => {
  try {
    // Only drivers can create rides
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Only drivers can create rides' });
    }

    // Only verified drivers can create rides
    if (!req.user.isVerified) {
      return res.status(403).json({ error: 'Your account is pending verification by admin' });
    }

    const { date, departureTime, startStop, endStop, fare } = req.body;

    // Validate required fields
    if (!date || !departureTime || !startStop || !endStop || !fare) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate start and end stops
    if (!isValidStartEnd(startStop, endStop)) {
      return res.status(400).json({ error: `${endStop} must come after ${startStop} on the route` });
    }

    // Auto generate stops with estimated times
    const stops = calculateStopTimes(startStop, departureTime).filter(stop => {
      const startIndex = ROUTE.findIndex(s => s.name === startStop);
      const endIndex = ROUTE.findIndex(s => s.name === endStop);
      const stopIndex = ROUTE.findIndex(s => s.name === stop.location);
      return stopIndex >= startIndex && stopIndex <= endIndex;
    });

    // Create 10 seats
    const seats = Array.from({ length: 10 }, (_, i) => ({
      number: i + 1,
      status: 'available',
      heldBy: null,
      heldUntil: null
    }));

    const ride = await Ride.create({
      driverId: req.user._id,
      date,
      departureTime,
      startStop,
      endStop,
      stops,
      fare,
      seats
    });

    res.status(201).json({ message: 'Ride scheduled successfully', ride });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/rides/driver — driver sees their own rides
router.get('/driver', auth, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Only drivers can access this' });
    }

    const rides = await Ride.find({ driverId: req.user._id })
      .sort({ date: -1, departureTime: -1 });

    res.json(rides);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


// GET /api/rides — passenger searches rides by date
router.get('/', auth, async (req, res) => {
  try {
    const { date, pickup, dropoff } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Validate pickup and dropoff direction
    if (pickup && dropoff && !isValidRoute(pickup, dropoff)) {
      return res.status(400).json({ error: `${dropoff} comes before ${pickup} on the route` });
    }

    // Search exact date
    let query = { date, status: 'scheduled' };

    // Filter by pickup and dropoff if provided
    if (pickup) query['stops.location'] = pickup;

    let rides = await Ride.find(query).populate('driverId', 'name phone age');

    // Filter rides that have available seats
    rides = rides.filter(ride =>
      ride.seats.some(seat => seat.status === 'available')
    );

    // If no rides on exact date, check nearby dates
    let nearbyRides = [];
    if (rides.length === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const searchDate = new Date(date);
      const dates = [];

      for (let i = 1; i <= 3; i++) {
        const before = new Date(searchDate);
        before.setDate(before.getDate() - i);
        if (before >= today) {
          dates.push(before.toISOString().split('T')[0]);
        }

        const after = new Date(searchDate);
        after.setDate(after.getDate() + i);
        dates.push(after.toISOString().split('T')[0]);
      }

      nearbyRides = await Ride.find({
        date: { $in: dates },
        status: 'scheduled'
      }).populate('driverId', 'name phone age');

      nearbyRides = nearbyRides.filter(ride =>
        ride.seats.some(seat => seat.status === 'available')
      );
    }

    res.json({
      exactDate: rides,
      nearbyDates: nearbyRides,
      searchedDate: date
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/rides/:id — get single ride details
router.get('/:id', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driverId', 'name phone age');

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json(ride);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PATCH /api/rides/:id/seats — driver locks or unlocks a seat
router.patch('/:id/seats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Only drivers can manage seats' });
    }

    const { seatNumber, action } = req.body; // action: lock | unlock

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your ride' });
    }

    const seat = ride.seats.find(s => s.number === seatNumber);

    if (!seat) {
      return res.status(404).json({ error: 'Seat not found' });
    }

    if (action === 'lock') {
      if (seat.status === 'booked') {
        return res.status(400).json({ error: 'Cannot lock a booked seat' });
      }
      seat.status = 'locked';
    } else if (action === 'unlock') {
      if (seat.status !== 'locked') {
        return res.status(400).json({ error: 'Seat is not locked' });
      }
      seat.status = 'available';
    }

    await ride.save();
    res.json({ message: `Seat ${seatNumber} ${action}ed`, ride });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PATCH /api/rides/:id/cancel — driver cancels entire ride
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Only drivers can cancel rides' });
    }

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your ride' });
    }

    if (ride.status === 'cancelled') {
      return res.status(400).json({ error: 'Ride already cancelled' });
    }

    ride.status = 'cancelled';
    await ride.save();

    // TODO: notify all passengers via WhatsApp

    res.json({ message: 'Ride cancelled successfully', ride });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
