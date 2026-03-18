const otpStore = new Map();

function generateOTP(phone) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otpStore.set(phone, { otp, expiresAt, used: false });
  return otp;
}

function verifyOTP(phone, otp) {
  const record = otpStore.get(phone);

  if (!record) {
    return { valid: false, reason: 'OTP not found, request a new one' };
  }

  if (record.used) {
    return { valid: false, reason: 'OTP already used, request a new one' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return { valid: false, reason: 'OTP expired' };
  }

  if (record.otp !== otp) {
    return { valid: false, reason: 'Incorrect OTP' };
  }

  record.used = true;
  setTimeout(() => otpStore.delete(phone), 10000);

  return { valid: true };
}

function resetOTP(phone) {
  const record = otpStore.get(phone);
  if (record) {
    record.used = false;
  }
}

function getOTP(phone) {
  return otpStore.get(phone);
}

module.exports = { generateOTP, verifyOTP, resetOTP, getOTP };