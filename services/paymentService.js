/*
  services/paymentService.js
  Wraps config/razorpay.js (already an existing, unused dependency) around
  the `fees` and `payments` tables. Does not create its own Razorpay
  instance or re-implement signature verification — both already live in
  config/razorpay.js and are reused here as-is.
*/

const db = require('../config/db');
const { razorpay, verifyPaymentSignature } = require('../config/razorpay');
const { isValidAmount } = require('../utils/validators');

// -------- Create a Razorpay order for a fee record and log it as 'created' --------
async function createOrder(feeId) {
  if (!razorpay) throw new Error('Online payments are not configured. Contact the administrator.');

  const [[fee]] = await db.query('SELECT * FROM fees WHERE id = ?', [feeId]);
  if (!fee) throw new Error('Fee record not found');
  if (fee.status === 'paid') throw new Error('This fee has already been paid');
  if (!isValidAmount(fee.amount)) throw new Error('Invalid fee amount');

  const order = await razorpay.orders.create({
    amount: Math.round(Number(fee.amount) * 100), // Razorpay expects paise
    currency: 'INR',
    receipt: `fee_${fee.id}_${Date.now()}`
  });

  await db.query(
    'INSERT INTO payments (fee_id, student_id, razorpay_order_id, amount, status) VALUES (?, ?, ?, ?, "created")',
    [fee.id, fee.student_id, order.id, fee.amount]
  );

  return { order, fee };
}

// -------- Verify the checkout response and mark the fee as paid --------
async function verifyPayment({ orderId, paymentId, signature }) {
  const isValid = verifyPaymentSignature(orderId, paymentId, signature);

  const [[payment]] = await db.query('SELECT * FROM payments WHERE razorpay_order_id = ?', [orderId]);
  if (!payment) throw new Error('Payment record not found for this order');

  if (!isValid) {
    await db.query('UPDATE payments SET status = "failed" WHERE id = ?', [payment.id]);
    return { success: false, message: 'Payment signature verification failed' };
  }

  await db.query(
    'UPDATE payments SET razorpay_payment_id = ?, status = "success" WHERE id = ?',
    [paymentId, payment.id]
  );
  await db.query('UPDATE fees SET status = "paid", paid_date = CURDATE() WHERE id = ?', [payment.fee_id]);

  const [[updatedPayment]] = await db.query('SELECT * FROM payments WHERE id = ?', [payment.id]);
  const [[fee]] = await db.query('SELECT * FROM fees WHERE id = ?', [payment.fee_id]);

  return { success: true, payment: updatedPayment, fee };
}

// -------- A student's own payment history --------
async function getPaymentHistory(studentId) {
  const [rows] = await db.query(
    `SELECT p.*, f.due_date FROM payments p
     JOIN fees f ON p.fee_id = f.id
     WHERE p.student_id = ?
     ORDER BY p.created_at DESC`,
    [studentId]
  );
  return rows;
}

// -------- All payments across all students (admin view) --------
async function getAllPayments() {
  const [rows] = await db.query(`
    SELECT p.*, u.name AS student_name, s.roll_no
    FROM payments p
    JOIN students s ON p.student_id = s.id
    JOIN users u ON s.user_id = u.id
    ORDER BY p.created_at DESC
  `);
  return rows;
}

module.exports = { createOrder, verifyPayment, getPaymentHistory, getAllPayments };
