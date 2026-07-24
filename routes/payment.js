const express = require('express');
const router = express.Router();
const db = require('../config/db');

function requireLogin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }

    next();
}

router.get('/:feeId', requireLogin, async (req, res) => {
    try {
        const feeId = req.params.feeId;
        const userId = req.session.user.id;

        const [feeRows] = await db.query(
            'SELECT * FROM fees WHERE id = ? LIMIT 1',
            [feeId]
        );

        if (feeRows.length === 0) {
            return res.status(404).send('Fee record not found');
        }

        const fee = feeRows[0];

        const [studentRows] = await db.query(
            'SELECT * FROM students WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (studentRows.length === 0) {
            return res.status(404).send('Student record not found');
        }

        const student = studentRows[0];

        return res.render('student/payment', {
            fee: fee,
            student: student
        });

    } catch (error) {
        console.error('Payment page error:', error);
        return res.status(500).send('Unable to open payment page');
    }
});

router.post('/:feeId/pay', requireLogin, async (req, res) => {
    try {
        const feeId = req.params.feeId;
        const userId = req.session.user.id;

        const paymentMethod = req.body.payment_method || 'UPI';

        const [feeRows] = await db.query(
            'SELECT * FROM fees WHERE id = ? LIMIT 1',
            [feeId]
        );

        if (feeRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fee record not found'
            });
        }

        const fee = feeRows[0];

        const [studentRows] = await db.query(
            'SELECT * FROM students WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student record not found'
            });
        }

        const student = studentRows[0];

        const transactionId =
            'SIM-' +
            Date.now() +
            '-' +
            Math.floor(Math.random() * 10000);

        await db.query(
            `
            INSERT INTO payments
            (
                fee_id,
                student_id,
                amount,
                payment_method,
                transaction_id,
                status,
                payment_date
            )
            VALUES (?, ?, ?, ?, ?, ?, NOW())
            `,
            [
                feeId,
                student.id,
                fee.amount,
                paymentMethod,
                transactionId,
                'SUCCESS'
            ]
        );

        try {
            await db.query(
                'UPDATE fees SET status = ? WHERE id = ?',
                ['paid', feeId]
            );
        } catch (error) {
            console.log('Fee status update skipped');
        }

        return res.json({
            success: true,
            message: 'Payment successful',
            transactionId: transactionId,
            amount: fee.amount
        });

    } catch (error) {
        console.error('Payment error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to process payment',
            error: error.message
        });
    }
});

router.get('/success/:paymentId', requireLogin, async (req, res) => {
    try {
        const paymentId = req.params.paymentId;

        const [rows] = await db.query(
            'SELECT * FROM payments WHERE transaction_id = ? LIMIT 1',
            [paymentId]
        );

        if (rows.length === 0) {
            return res.status(404).send('Payment not found');
        }

        return res.render('student/payment-success', {
            payment: rows[0]
        });

    } catch (error) {
        console.error('Payment success error:', error);
        return res.status(500).send('Unable to open payment success page');
    }
});

module.exports = router;