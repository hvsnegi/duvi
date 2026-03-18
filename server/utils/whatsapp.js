const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client = null;
let isReady = false;

function createClient() {
  return new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });
}

function initWhatsApp() {
  client = createClient();

  client.on('qr', (qr) => {
    console.log('\n📱 Scan this QR code with your spare WhatsApp number:\n');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    isReady = true;
    console.log('✅ WhatsApp client is ready');
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    console.log('❌ WhatsApp disconnected:', reason);
    console.log('🔄 Reconnecting in 5 seconds...');
    setTimeout(() => {
      initWhatsApp();
    }, 5000);
  });

  client.on('auth_failure', (reason) => {
    isReady = false;
    console.log('❌ WhatsApp auth failed:', reason);
    setTimeout(() => {
      initWhatsApp();
    }, 5000);
  });

  client.initialize();
}

async function sendMessage(phone, message) {
  try {
    if (!isReady || !client) {
      console.log(`⚠️ WhatsApp not ready — message not sent to ${phone}`);
      return false;
    }

    const cleanPhone = phone.replace(/^(0|91)/, '');
    const chatId = `91${cleanPhone}@c.us`;

    // Check if number is registered
    const isRegistered = await client.isRegisteredUser(chatId);
    if (!isRegistered) {
      console.log(`❌ ${phone} is not registered on WhatsApp`);
      return false;
    }

    await client.sendMessage(chatId, message);
    console.log(`✅ WhatsApp sent to ${phone}`);
    return true;

  } catch (err) {
    console.error(`❌ WhatsApp error for ${phone}:`, err.message);

    // If detached frame error — reinitialize
    if (err.message.includes('detached Frame') || err.message.includes('Session closed')) {
      console.log('🔄 Detached frame detected — reinitializing WhatsApp...');
      isReady = false;
      setTimeout(() => {
        initWhatsApp();
      }, 3000);
    }

    return false;
  }
}

const notify = {
  sendOTP: (phone, otp) =>
    sendMessage(phone,
      `Your Duvi OTP is: *${otp}*\nValid for 5 minutes. Do not share with anyone.`
    ),

  newBookingDriver: (phone, passengerName, passengerAge, seatNumber, pickupStop, pickupLandmark, dropoffStop, date, departureTime) =>
    sendMessage(phone,
      `🔔 *New Booking Request*\n\nPassenger: ${passengerName}, ${passengerAge}\nSeat: ${seatNumber}\nPickup: ${pickupLandmark}, ${pickupStop}\nDropoff: ${dropoffStop}\nDate: ${date} at ${departureTime}\n\nOpen Duvi to accept or reject.`
    ),

  bookingAccepted: (phone, driverName, driverPhone, seatNumber, pickupLandmark, pickupStop, date, departureTime, fare) =>
    sendMessage(phone,
      `✅ *Booking Confirmed!*\n\nSeat ${seatNumber} confirmed for ${date} at ${departureTime}.\nPickup: ${pickupLandmark}, ${pickupStop}\nFare: ₹${fare}\nDriver: ${driverName} — ${driverPhone}\n\nHave a safe journey! 🙏`
    ),

  bookingRejected: (phone, date, departureTime) =>
    sendMessage(phone,
      `❌ *Booking Not Accepted*\n\nSorry, your booking for ${date} at ${departureTime} was not accepted by the driver.\n\nPlease search for another ride on Duvi.`
    ),

  bookingCancelledByPassenger: (phone, passengerName, seatNumber, date) =>
    sendMessage(phone,
      `ℹ️ *Booking Cancelled*\n\n${passengerName} cancelled seat ${seatNumber} for your ${date} ride.\n\nSeat is now available for others.`
    ),

  rideCancelledByDriver: (phone, date, departureTime, driverPhone) =>
    sendMessage(phone,
      `⚠️ *Ride Cancelled*\n\nYour ride on ${date} at ${departureTime} has been cancelled by the driver.\n\nPlease search for another ride or contact the driver: ${driverPhone}`
    ),

  noResponseDriver: (phone, driverPhone, date) =>
    sendMessage(phone,
      `⏰ *Booking Pending*\n\nYour booking for ${date} hasn't been responded to yet.\n\nContact the driver directly: *${driverPhone}*`
    ),

  passengerReminder: (phone, date, departureTime, pickupLandmark, pickupStop, driverPhone) =>
    sendMessage(phone,
      `⏰ *Ride Reminder*\n\nYour ride is on ${date} at ${departureTime}.\nPickup: ${pickupLandmark}, ${pickupStop}\n\nFor any issues contact driver: ${driverPhone}`
    ),

  driverReminder: (phone, date, departureTime, passengerList) =>
    sendMessage(phone,
      `⏰ *Ride Reminder — ${date} at ${departureTime}*\n\nPassenger pickup list:\n\n${passengerList}`
    ),
};

module.exports = { initWhatsApp, sendMessage, notify };