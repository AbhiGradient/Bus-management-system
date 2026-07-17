const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

// -------- Razorpay instance --------
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// -------- Verify payment signature after checkout --------
// Razorpay sends order_id, payment_id and signature back to the client;
// this must be re-verified on the server before marking a fee as paid.
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

module.exports = { razorpay, verifyPaymentSignature };