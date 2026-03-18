const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seatNumber: {
    type: Number,
    required: true
  },
  pickupStop: {
    type: String,
    required: true
  },
  pickupLandmark: {
    type: String,
    required: true
  },
  pickupCoordinates: {
    lat: Number,
    lng: Number
  },
  dropoffStop: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  cancelledBy: {
    type: String,
    enum: ['passenger', 'driver', null],
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);