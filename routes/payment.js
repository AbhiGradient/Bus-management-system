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

router.get('/:feeId', isStudent, async (req, res) => {

  try {

    const feeId = req.params.feeId;

    const student = await getStudent(req.session.user.id);

    if (!student) {
      return res.status(404).send('Student record not found');
    }


    /* Get fee belonging to this student */

    const [[fee]] = await db.query(
      `
      SELECT *
      FROM fees
      WHERE id = ?
      AND student_id = ?
      `,
      [
        feeId,
        student.id
      ]
    );


    if (!fee) {
      return res.status(404).send('Fee record not found');
    }


    /* Prevent paying already-paid fee */

    if (fee.status === 'paid') {

      return res.redirect('/student/fees-status');

    }


    /* Get user */

    const [[user]] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [req.session.user.id]
    );


    /* Get bus */

    let bus = null;

    if (student.bus_id) {

      const [[busRow]] = await db.query(
        `
        SELECT *
        FROM buses
        WHERE id = ?
        `,
        [student.bus_id]
      );

      bus = busRow;

    }


    /* College UPI ID */

    const upiId =
      process.env.COLLEGE_UPI_ID ||
      'college@upi';


    /*
      QR image path

      Put your QR image inside:

      public/images/payment-qr.png

      Then browser URL becomes:

      /images/payment-qr.png
    */

    const qrImagePath =
      '/images/payment-qr.png';


    /* Render payment page */

    res.render('student/payment', {

      user,
      student,
      bus,
      fee,
      upiId,
      qrImagePath,
      error: null

    });


  } catch (err) {

    console.error('PAYMENT PAGE ERROR:', err);

    res.status(500).send(
      'Error loading payment page: ' +
      err.message
    );

  }

});


/* =========================================================
   CONFIRM PAYMENT
   POST /payment/:feeId/confirm
========================================================= */

router.post('/:feeId/confirm', isStudent, async (req, res) => {

  try {

    const feeId = req.params.feeId;

    const { utr } = req.body;


    if (!utr || !utr.trim()) {

      return res.status(400).send(
        'Transaction ID / UTR is required'
      );

    }


    const student = await getStudent(req.session.user.id);


    if (!student) {

      return res.status(404).send(
        'Student record not found'
      );

    }


    /* Find student's fee */

    const [[fee]] = await db.query(
      `
      SELECT *
      FROM fees
      WHERE id = ?
      AND student_id = ?
      `,
      [
        feeId,
        student.id
      ]
    );


    if (!fee) {

      return res.status(404).send(
        'Fee record not found'
      );

    }


    /* Check if already paid */

    if (fee.status === 'paid') {

      return res.redirect(
        '/student/fees-status'
      );

    }


    /*
      Generate receipt number
    */

    const receiptNo =
      'BUS-' +
      Date.now();


    /*
      Generate transaction ID

      This is simulated payment.

      The actual UTR entered by student
      is stored as razorpay_payment_id
      only if your existing database requires it.

      Ideally, your payments table should have
      a utr column.
    */


    /*
      Check if payments table has UTR column.

      For now we use razorpay_payment_id
      because your existing paymentService expects it.
    */


    await db.query(
      `
      INSERT INTO payments
      (
        fee_id,
        student_id,
        razorpay_payment_id,
        amount,
        status
      )
      VALUES (?, ?, ?, ?, 'success')
      `,
      [
        fee.id,
        student.id,
        utr.trim(),
        fee.amount
      ]
    );


    /*
      Mark fee as paid
    */

    await db.query(
      `
      UPDATE fees
      SET
        status = 'paid',
        paid_date = CURDATE()
      WHERE id = ?
      `,
      [fee.id]
    );


    /*
      Get newly created payment
    */

    const [[payment]] = await db.query(
      `
      SELECT *
      FROM payments
      WHERE fee_id = ?
      AND student_id = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [
        fee.id,
        student.id
      ]
    );


    /*
      Redirect to success page
    */

    return res.redirect(
      '/payment/success/' + payment.id
    );


  } catch (err) {

    console.error(
      'PAYMENT CONFIRMATION ERROR:',
      err
    );

    res.status(500).send(
      'Error confirming payment: ' +
      err.message
    );

  }

});


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
        WHERE p.id = ?
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

router.get(
  '/receipt/:paymentId',
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
        WHERE p.id = ?
        AND p.student_id = ?
        `,
        [
          req.params.paymentId,
          student.id
        ]
      );


      if (!payment) {

        return res.status(404).send(
          'Receipt not found'
        );

      }


      res.render(
        'student/payment-receipt',
        {
          payment
        }
      );


    } catch (err) {

      console.error(
        'RECEIPT ERROR:',
        err
      );

      res.status(500).send(
        'Error loading receipt: ' +
        err.message
      );

    }

  }
);


module.exports = router;