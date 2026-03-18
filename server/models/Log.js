const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  role: String,
  action: String,   // "booked_seat" | "accepted_booking" | "cancelled_ride" etc
  details: Object   // any relevant info
}, { timestamps: true });

module.exports = mongoose.model('Log', logSchema);