const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['passenger', 'driver', 'admin'],
    default: 'passenger'
  },
  age: {
    type: Number,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false    // admin verifies drivers manually
  },
  isSuspended: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);