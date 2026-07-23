/*
|--------------------------------------------------------------------------
| routes/payment.js
|--------------------------------------------------------------------------
|
| Mounted in server.js:
| app.use('/payment', require('./routes/payment'));
|
| Handles:
| GET  /payment/:feeId
| POST /payment/:feeId/confirm
| GET  /payment/success/:receipt
| GET  /payment/receipt/:receipt
| GET  /payment/receipt/:receipt/download
|
*/

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sendMail } = require('../config/mailer');
const isStudent = require('../middleware/studentAuth');

/* -------------------------------------------------------------------------- */
/* Helper                                                                      */
/* -------------------------------------------------------------------------- */

async function getStudent(userId) {
    const [rows] = await db.query(
        'SELECT * FROM students WHERE user_id = ?',
        [userId]
    );

    return rows[0];
}

/* -------------------------------------------------------------------------- */
/* PAYMENT PAGE                                                                */
/* -------------------------------------------------------------------------- */

router.get('/:feeId', isStudent, async (req, res) => {

    // TODO

});

/* -------------------------------------------------------------------------- */
/* CONFIRM PAYMENT                                                             */
/* -------------------------------------------------------------------------- */

router.post('/:feeId/confirm', isStudent, async (req, res) => {

    // TODO

});

/* -------------------------------------------------------------------------- */
/* PAYMENT SUCCESS                                                             */
/* -------------------------------------------------------------------------- */

router.get('/success/:receipt', isStudent, async (req, res) => {

    // TODO

});

/* -------------------------------------------------------------------------- */
/* RECEIPT                                                                     */
/* -------------------------------------------------------------------------- */

router.get('/receipt/:receipt', isStudent, async (req, res) => {

    // TODO

});

/* -------------------------------------------------------------------------- */
/* DOWNLOAD PDF                                                                */
/* -------------------------------------------------------------------------- */

router.get('/receipt/:receipt/download', isStudent, async (req, res) => {

    // TODO

});

module.exports = router;