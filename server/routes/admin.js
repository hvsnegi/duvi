const router = require('express').Router();
const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const Log = require('../models/Log');
const auth = require('../middleware/auth');

// Admin middleware — only admins can access these routes
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access only' });
  }
  next();
};

// GET /api/admin/users — get all users
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PATCH /api/admin/users/:id/verify — verify a driver
router.patch('/users/:id/verify', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'driver') {
      return res.status(400).json({ error: 'User is not a driver' });
    }

    user.isVerified = true;
    await user.save();

    // Log the action
    await Log.create({
      userId: req.user._id,
      role: 'admin',
      action: 'verified_driver',
      details: { driverId: user._id, driverName: user.name }
    });

    res.json({ message: `${user.name} verified successfully`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PATCH /api/admin/users/:id/suspend — suspend a user
router.patch('/users/:id/suspend', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot suspend an admin' });
    }

    user.isSuspended = true;
    await user.save();

    await Log.create({
      userId: req.user._id,
      role: 'admin',
      action: 'suspended_user',
      details: { targetId: user._id, targetName: user.name }
    });

    res.json({ message: `${user.name} suspended`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PATCH /api/admin/users/:id/unsuspend — unsuspend a user
router.patch('/users/:id/unsuspend', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isSuspended = false;
    await user.save();

    await Log.create({
      userId: req.user._id,
      role: 'admin',
      action: 'unsuspended_user',
      details: { targetId: user._id, targetName: user.name }
    });

    res.json({ message: `${user.name} unsuspended`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PATCH /api/admin/users/:id/make-driver — promote passenger to driver
router.patch('/users/:id/make-driver', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = 'driver';
    user.isVerified = true;
    await user.save();

    await Log.create({
      userId: req.user._id,
      role: 'admin',
      action: 'promoted_to_driver',
      details: { targetId: user._id, targetName: user.name }
    });

    res.json({ message: `${user.name} is now a verified driver`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/admin/rides — get all rides
router.get('/rides', auth, adminOnly, async (req, res) => {
  try {
    const rides = await Ride.find()
      .populate('driverId', 'name phone')
      .select('-seats -stops -__v')
      .sort({ createdAt: -1 });

    res.json(rides);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/admin/rides/:id — get single ride with full details
router.get('/rides/:id', auth, adminOnly, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driverId', 'name phone age');

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const bookings = await Booking.find({ rideId: req.params.id })
      .populate('passengerId', 'name phone age');

    res.json({ ride, bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PATCH /api/admin/rides/:id/cancel — admin cancels a ride
router.patch('/rides/:id/cancel', auth, adminOnly, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.status === 'cancelled') {
      return res.status(400).json({ error: 'Ride already cancelled' });
    }

    ride.status = 'cancelled';
    await ride.save();

    // Cancel all bookings for this ride
    await Booking.updateMany(
      { rideId: ride._id, status: { $in: ['pending', 'accepted'] } },
      { status: 'cancelled', cancelledBy: 'driver' }
    );

    await Log.create({
      userId: req.user._id,
      role: 'admin',
      action: 'cancelled_ride',
      details: { rideId: ride._id }
    });

    // TODO: notify all passengers via WhatsApp

    res.json({ message: 'Ride cancelled by admin', ride });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/admin/logs — get all action logs
router.get('/logs', auth, adminOnly, async (req, res) => {
  try {
    const logs = await Log.find()
      .populate('userId', 'name phone role')
      .sort({ createdAt: -1 })
      .limit(100);  // last 100 actions

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/admin/stats — overview numbers for dashboard
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const totalPassengers = await User.countDocuments({ role: 'passenger' });
    const pendingVerification = await User.countDocuments({
      role: 'driver',
      isVerified: false
    });
    const totalRides = await Ride.countDocuments();
    const scheduledRides = await Ride.countDocuments({ status: 'scheduled' });
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });

    res.json({
      users: { total: totalUsers, drivers: totalDrivers, passengers: totalPassengers, pendingVerification },
      rides: { total: totalRides, scheduled: scheduledRides },
      bookings: { total: totalBookings, pending: pendingBookings }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;