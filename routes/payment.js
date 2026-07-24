const express = require('express');
const router = express.Router();

const db = require('../config/db');
const { sendMail } = require('../config/mailer');
const isStudent = require('../middleware/studentAuth');


/* =========================================================
   GET STUDENT RECORD
========================================================= */

async function getStudent(userId) {

  const [rows] = await db.query(
    'SELECT * FROM students WHERE user_id = ?',
    [userId]
  );

  return rows[0];

}


/* =========================================================
   PAYMENT PAGE
   GET /payment/:feeId
========================================================= */




/* =========================================================
   PAYMENT SUCCESS
   GET /payment/success/:paymentId
========================================================= */

router.get(
  '/success/:paymentId',
  isStudent,
  async (req, res) => {

    try {

      const student =
        await getStudent(req.session.user.id);


      const [[payment]] = await db.query(
        `
        SELECT
          p.*,
          f.due_date
        FROM payments p
        JOIN fees f
          ON p.fee_id = f.id
        WHERE p.receipt_no = ?
        AND p.student_id = ?
        `,
        [
          req.params.paymentId,
          student.id
        ]
      );


      if (!payment) {

        return res.status(404).send(
          'Payment record not found'
        );

      }


      res.render(
        'student/payment-success',
        {
          payment
        }
      );


    } catch (err) {

      console.error(
        'PAYMENT SUCCESS ERROR:',
        err
      );

      res.status(500).send(
        'Error loading payment success page: ' +
        err.message
      );

    }

  }
);




/* =========================================================
   RECEIPT
   GET /payment/receipt/:paymentId
========================================================= */

router.get('/receipt/:receiptNo', isStudent, async (req, res) => {
  try {

    const student = await getStudent(req.session.user.id);

    if (!student) {
      return res.status(404).send('Student record not found');
    }

    const [[payment]] = await db.query(
      `
      SELECT p.*, f.due_date
      FROM payments p
      JOIN fees f ON p.fee_id = f.id
      WHERE p.receipt_no = ?
      AND p.student_id = ?
      `,
      [req.params.receiptNo, student.id]
    );

    if (!payment) {
      return res.status(404).send('Receipt not found');
    }

    const [[fee]] = await db.query(
      'SELECT * FROM fees WHERE id=?',
      [payment.fee_id]
    );

    let bus = null;

    if (student.bus_id) {
      const [[busRow]] = await db.query(
        'SELECT * FROM buses WHERE id=?',
        [student.bus_id]
      );
      bus = busRow;
    }

    res.render('student/payment-receipt', {
      payment,
      student,
      fee,
      bus
    });

  } catch (err) {

    console.error(err);

    res.status(500).send(err.message);

  }
});
/* =========================================================
   CONFIRM PAYMENT
   POST /:feeId/confirm
========================================================= */

router.post('/:feeId/confirm', isStudent, async (req, res) => {

  try {

    const feeId = req.params.feeId;
    const { utr } = req.body;

    if (!utr || !utr.trim()) {
      return res.status(400).send('Transaction ID / UTR is required');
    }

    const student = await getStudent(req.session.user.id);
    const [[user]] = await db.query(
  'SELECT * FROM users WHERE id = ?',
  [req.session.user.id]
);

    if (!student) {
      return res.status(404).send('Student record not found');
    }

    const [[fee]] = await db.query(
      'SELECT * FROM fees WHERE id = ? AND student_id = ?',
      [feeId, student.id]
    );

    if (!fee) {
      return res.status(404).send('Fee record not found');
    }

    if (fee.status === 'paid') {
  return res.redirect('/student/fees-status');
}

const receiptNo = 'BUS-' + Date.now();

console.log('==============================');
console.log('Receipt No:', receiptNo);
console.log('Fee ID:', fee.id);
console.log('Student ID:', student.id);
console.log('UTR:', utr.trim());
console.log('Amount:', fee.amount);
console.log('==============================');

const sql = `
INSERT INTO payments
(
  fee_id,
  student_id,
  receipt_no,
  razorpay_payment_id,
  amount,
  status
)
VALUES (?, ?, ?, ?, ?, 'success')
`;

const values = [
  fee.id,
  student.id,
  receiptNo,
  utr.trim(),
  fee.amount
];

console.log(sql);
console.log(values);

const [result] = await db.query(sql, values);

    await db.query(
      `UPDATE fees
       SET status='paid',
           paid_date=CURDATE()
       WHERE id=?`,
      [fee.id]
    );

    const paymentId = result.insertId;
    await sendMail(
  user.email,
  'Bus Fee Payment Successful',
  `
    <h2>Payment Successful</h2>

    <p>Hello <b>${user.name}</b>,</p>

    <p>Your bus fee payment has been received successfully.</p>

    <table border="1" cellpadding="8" cellspacing="0">
      <tr>
        <td><b>Receipt No</b></td>
        <td>${receiptNo}</td>
      </tr>

      <tr>
        <td><b>Amount</b></td>
        <td>₹${fee.amount}</td>
      </tr>

      <tr>
        <td><b>Transaction ID</b></td>
        <td>${utr}</td>
      </tr>

      <tr>
        <td><b>Status</b></td>
        <td>Paid</td>
      </tr>
    </table>

    <br>

    <p>Thank you.</p>

    <p>College Bus Management System</p>
  `
);

    return res.redirect('/payment/success/' + receiptNo);

  } catch (err) {

    console.error('PAYMENT CONFIRMATION ERROR:', err);

    res.status(500).send(
      'Error confirming payment: ' + err.message
    );

  }

});
module.exports = router;