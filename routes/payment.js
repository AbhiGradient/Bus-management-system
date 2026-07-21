/*
  routes/payment.js
  Mounted at /payment in server.js — matches the '/payment/payment-history'
  link already reserved in views/partials/sidebar.ejs. Online fee payment
  is student-facing; the payment history/list endpoints are shared between
  student (their own history) and admin (everyone's history), same split
  used for /admin/fees vs /student/fees today.
*/

const express = require('express');
const router = express.Router();
const db = require('../config/db');

const isStudent = require('../middleware/studentAuth');
const isAdmin = require('../middleware/adminAuth');

const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');

// -------- Same helper routes/student.js uses to go from session user -> students row --------
async function getStudentRecord(userId) {
  const [[student]] = await db.query('SELECT * FROM students WHERE user_id=?', [userId]);
  return student;
}

// ================= CREATE ORDER (student pays their own fee) =================
router.post('/create-order/:feeId', isStudent, async (req, res) => {
  try {
    const student = await getStudentRecord(req.session.user.id);
    const [[fee]] = await db.query('SELECT * FROM fees WHERE id = ? AND student_id = ?', [req.params.feeId, student.id]);

    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found.' });

    const { order } = await paymentService.createOrder(fee.id);
    res.json({ success: true, order, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Could not start payment.' });
  }
});

// ================= VERIFY PAYMENT (Razorpay checkout callback) =================
router.post('/verify', isStudent, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const result = await paymentService.verifyPayment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (result.success) {
      notificationService.createNotification({
        userId: req.session.user.id,
        title: 'Payment Successful',
        message: `Your fee payment was received. Thank you!`,
        type: 'success'
      });
      emailService.sendPaymentReceipt(req.session.user, result.fee, result.payment).catch((err) =>
        console.error('❌ sendPaymentReceipt failed:', err.message)
      );
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
});

// ================= PAYMENT HISTORY =================
// Student sees their own history; admin sees everyone's.
router.get('/payment-history', isStudent, async (req, res) => {
  try {
    const student = await getStudentRecord(req.session.user.id);
    const payments = await paymentService.getPaymentHistory(student ? student.id : 0);
    res.json({ success: true, payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not load payment history.' });
  }
});

router.get('/admin/payment-history', isAdmin, async (req, res) => {
  try {
    const payments = await paymentService.getAllPayments();
    res.json({ success: true, payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not load payment history.' });
  }
});

module.exports = router;
