/**
 * routes/payment.js
 * -------------------
 * Simulated Bus Fee Payment System — complete router.
 *
 * Flow:
 *   GET  /payment/:feeId          -> render payment page for one unpaid fee
 *   POST /payment/:feeId/confirm  -> validate UTR, mark fee paid, generate receipt, email it
 *   GET  /payment/success/:paymentId -> success page after payment
 *   GET  /payment/receipt/:receiptNo -> printable receipt view
 *   GET  /payment/receipt/:receiptNo/download -> download the generated PDF
 *
 * This is NOT a real payment gateway. No money moves. The student enters
 * a fake UTR/Transaction ID and confirms — the backend then records it
 * as a successful payment.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sendMail } = require('../config/mailer');
const isStudent = require('../middleware/studentAuth');

const {
  generateReceiptNumber,
  generateTransactionId,
  getMySQLTimestamp,
  isValidUtr,
  formatCurrency,
  formatDisplayDate
} = require('../helpers/paymentUtils');

const { generateReceiptPDF } = require('../helpers/receiptGenerator');

// Every route below requires a logged-in student
router.use(isStudent);

// Helper: get the students.id row that belongs to the logged-in user
async function getStudentRecord(userId) {
  const [[student]] = await db.query('SELECT * FROM students WHERE user_id=?', [userId]);
  return student;
}

// Helper: get bus + route info for a student (may be null if unassigned)
async function getBusForStudent(student) {
  if (!student || !student.bus_id) return null;
  const [[bus]] = await db.query(
    `SELECT b.*, u.name AS driver_name, u.phone AS driver_phone
     FROM buses b
     LEFT JOIN users u ON b.driver_id = u.id
     WHERE b.id = ?`,
    [student.bus_id]
  );
  return bus || null;
}

// ================= GET PAYMENT PAGE =================
// Shows the "pay this fee" screen for one specific unpaid fee record.
router.get('/:feeId', async (req, res) => {
  try {
    const { feeId } = req.params;
    const student = await getStudentRecord(req.session.user.id);

    if (!student) {
      return res.send('Student record not found');
    }

    // Fetch the fee and make sure it belongs to this student
    const [[fee]] = await db.query(
      'SELECT * FROM fees WHERE id=? AND student_id=?',
      [feeId, student.id]
    );

    if (!fee) {
      return res.status(404).send('Fee record not found');
    }

    if (fee.status === 'paid') {
      // Already paid — send them to their payment history instead
      return res.redirect('/student/payment-history');
    }

    const bus = await getBusForStudent(student);

    // UPI details shown on the payment page (simulated)
    const upiId = process.env.COLLEGE_UPI_ID || 'campustransit@upi';
    const qrImagePath = '/images/payment-qr.png';

    res.render('payment', {
      student,
      user: req.session.user,
      bus,
      fee,
      upiId,
      qrImagePath,
      formatCurrency,
      error: null
    });
  } catch (err) {
    console.error('Error loading payment page:', err);
    res.send('Error loading payment page');
  }
});

// ================= CONFIRM PAYMENT =================
// Student clicked "I Have Paid" — validate, record payment, update fee,
// generate PDF receipt, email it, then redirect to success page.
router.post('/:feeId/confirm', async (req, res) => {
  const { feeId } = req.params;
  const { utr } = req.body;

  try {
    const student = await getStudentRecord(req.session.user.id);
    if (!student) {
      return res.send('Student record not found');
    }

    const [[fee]] = await db.query(
      'SELECT * FROM fees WHERE id=? AND student_id=?',
      [feeId, student.id]
    );

    if (!fee) {
      return res.status(404).send('Fee record not found');
    }

    if (fee.status === 'paid') {
      return res.redirect('/student/payment-history');
    }

    // -------- Validate the fake UTR field --------
    if (!isValidUtr(utr)) {
      const bus = await getBusForStudent(student);
      const upiId = process.env.COLLEGE_UPI_ID || 'campustransit@upi';
      return res.render('payment', {
        student,
        user: req.session.user,
        bus,
        fee,
        upiId,
        qrImagePath: '/images/payment-qr.png',
        formatCurrency,
        error: 'Please enter a valid Transaction ID / UTR (6-30 letters or numbers).'
      });
    }

    // -------- Get supporting details for receipt/email --------
    const [[user]] = await db.query('SELECT * FROM users WHERE id=?', [req.session.user.id]);
    const bus = await getBusForStudent(student);

    const receiptNo = generateReceiptNumber();
    const transactionId = generateTransactionId();
    const now = new Date();
    const mysqlNow = getMySQLTimestamp(now);

    // -------- Insert payment record --------
    // razorpay_order_id / razorpay_payment_id / razorpay_signature columns
    // are repurposed here to store the simulated transaction data —
    // no schema changes were made to the existing payments table.
    await db.query(
      `INSERT INTO payments
        (fee_id, student_id, razorpay_order_id, razorpay_payment_id, razorpay_signature,
         amount, currency, payment_method, status, receipt_no, transaction_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'INR', 'UPI (Simulated)', 'success', ?, ?, ?)`,
      [
        fee.id,
        student.id,
        `SIM-ORD-${Date.now()}`,   // simulated order id
        transactionId,             // student-provided UTR is embedded in transactionId flow below
        utr.trim(),                // store the student-entered UTR as the "signature" field
        fee.amount,
        receiptNo,
        mysqlNow,
        mysqlNow
      ]
    );

    // -------- Update the fee record as paid --------
    await db.query(
      `UPDATE fees SET status='paid', paid_date=? WHERE id=?`,
      [now.toISOString().slice(0, 10), fee.id]
    );

    // -------- Get the newly created payment's ID for the success page --------
    const [[payment]] = await db.query(
      'SELECT * FROM payments WHERE receipt_no=? ORDER BY id DESC LIMIT 1',
      [receiptNo]
    );

    // -------- Generate PDF receipt --------
    const receiptData = {
      studentName: user.name,
      rollNo: student.roll_no,
      department: student.department,
      routeName: bus ? bus.route_name : null,
      busNumber: bus ? bus.bus_number : null,
      amount: fee.amount,
      receiptNo,
      transactionId: utr.trim(),
      paymentDate: now
    };

    let pdfPath = null;
    try {
      pdfPath = await generateReceiptPDF(receiptData);
    } catch (pdfErr) {
      console.error('Receipt PDF generation failed:', pdfErr.message);
      // Continue even if PDF fails — payment itself already succeeded
    }

    // -------- Email the receipt (non-blocking on failure) --------
    try {
      const emailHtml = await new Promise((resolve, reject) => {
        req.app.render(
          'emails/paymentReceipt',
          {
            studentName: user.name,
            rollNo: student.roll_no,
            routeName: bus ? bus.route_name : '—',
            amount: formatCurrency(fee.amount),
            receiptNo,
            transactionId: utr.trim(),
            paymentDate: formatDisplayDate(now)
          },
          (err, html) => (err ? reject(err) : resolve(html))
        );
      });

      await sendMail(user.email, `Payment Receipt - ${receiptNo}`, emailHtml);
    } catch (mailErr) {
      console.error('Receipt email failed:', mailErr.message);
      // Continue — payment already recorded successfully
    }

    res.redirect(`/payment/success/${payment.id}`);
  } catch (err) {
    console.error('Error confirming payment:', err);
    res.send('Error processing payment. Please contact administration.');
  }
});

// ================= PAYMENT SUCCESS PAGE =================
router.get('/success/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const student = await getStudentRecord(req.session.user.id);

    const [[payment]] = await db.query(
      'SELECT * FROM payments WHERE id=? AND student_id=?',
      [paymentId, student.id]
    );

    if (!payment) {
      return res.status(404).send('Payment record not found');
    }

    res.render('payment-success', {
      payment,
      formatCurrency,
      formatDisplayDate
    });
  } catch (err) {
    console.error('Error loading success page:', err);
    res.send('Error loading payment confirmation');
  }
});

// ================= PRINTABLE RECEIPT VIEW =================
router.get('/receipt/:receiptNo', async (req, res) => {
  try {
    const { receiptNo } = req.params;
    const student = await getStudentRecord(req.session.user.id);

    const [[payment]] = await db.query(
      'SELECT * FROM payments WHERE receipt_no=? AND student_id=?',
      [receiptNo, student.id]
    );

    if (!payment) {
      return res.status(404).send('Receipt not found');
    }

    const [[fee]] = await db.query('SELECT * FROM fees WHERE id=?', [payment.fee_id]);
    const [[user]] = await db.query('SELECT * FROM users WHERE id=?', [req.session.user.id]);
    const bus = await getBusForStudent(student);

    res.render('receipt', {
      payment,
      fee,
      user,
      student,
      bus,
      formatCurrency,
      formatDisplayDate
    });
  } catch (err) {
    console.error('Error loading receipt:', err);
    res.send('Error loading receipt');
  }
});

// ================= DOWNLOAD RECEIPT PDF =================
router.get('/receipt/:receiptNo/download', async (req, res) => {
  try {
    const { receiptNo } = req.params;
    const student = await getStudentRecord(req.session.user.id);

    const [[payment]] = await db.query(
      'SELECT * FROM payments WHERE receipt_no=? AND student_id=?',
      [receiptNo, student.id]
    );

    if (!payment) {
      return res.status(404).send('Receipt not found');
    }

    const path = require('path');
    const filePath = path.join(__dirname, '..', 'public', 'receipts', `${receiptNo}.pdf`);

    res.download(filePath, `${receiptNo}.pdf`, (err) => {
      if (err) {
        console.error('Receipt download failed:', err.message);
        res.status(404).send('Receipt file not found. It may not have been generated.');
      }
    });
  } catch (err) {
    console.error('Error downloading receipt:', err);
    res.send('Error downloading receipt');
  }
});

module.exports = router;