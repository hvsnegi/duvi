const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, verifyOTP, resetOTP} = require('../utils/otp');
const { notify } = require('../utils/whatsapp');

// Rate limiting — max 3 OTP requests per phone per hour
const otpRequestCount = new Map();

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Rate limiting
    const count = otpRequestCount.get(phone) || 0;
    if (count >= 3) {
      return res.status(429).json({ error: 'Too many OTP requests, try after 1 hour' });
    }
    otpRequestCount.set(phone, count + 1);
    setTimeout(() => otpRequestCount.delete(phone), 60 * 60 * 1000);

    // Generate OTP
    const otp = generateOTP(phone);

    // Send via WhatsApp
    await notify.sendOTP(phone, otp);
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({ message: 'OTP sent successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/verify-otp', async (req, res) => {
  console.log('verify-otp called at:', new Date().toISOString());
  try {
    const { phone, otp, name, age } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    // Check if user exists first
    let user = await User.findOne({ phone });

    if (!user) {
  // Verify OTP
  const result = verifyOTP(phone, otp);
  if (!result.valid) {
    return res.status(400).json({ error: result.reason });
  }

  // Name and age required
  if (!name || !age) {
    resetOTP(phone); // allow them to submit again with name/age
    return res.status(400).json({
      error: 'New user — name and age are required',
      isNewUser: true
    });
  }

  // Create new user
  user = await User.create({
    phone,
    name,
    age: parseInt(age),
    role: 'passenger'
  });

} else {
  // Existing user — verify OTP
  const result = verifyOTP(phone, otp);
  if (!result.valid) {
    return res.status(400).json({ error: result.reason });
  }
}
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        age: user.age,
        isVerified: user.isVerified
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    phone: req.user.phone,
    role: req.user.role,
    age: req.user.age,
    isVerified: req.user.isVerified
  });
});

module.exports = router;