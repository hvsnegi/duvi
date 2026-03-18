const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  number: Number,
  status: {
    type: String,
    enum: ['available', 'held', 'booked', 'locked'],
    default: 'available'
  },
  heldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  heldUntil: {
    type: Date,
    default: null
  }
});

const stopSchema = new mongoose.Schema({
  location: String,
  estimatedTime: String
});

const rideSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,   // stored as "2024-12-25"
    required: true
  },
  departureTime: {
    type: String,   // stored as "06:00"
    required: true
  },
  startStop: {
    type: String,
    required: true
  },
  endStop: {
    type: String,
    required: true
  },
  stops: [stopSchema],
  fare: {
    type: Number,
    required: true
  },
  seats: [seatSchema],
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  }
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);