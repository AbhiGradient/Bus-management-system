const express = require('express');
const router = express.Router();

const db = require('../config/db');


// =====================================================
// LOGIN CHECK
// =====================================================

function requireLogin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }

    next();
}


// =====================================================
// GET PAYMENT PAGE
// URL: /payment/:feeId
// =====================================================

router.get('/:feeId', requireLogin, async (req, res) => {

    try {

        const feeId = req.params.feeId;
        const userId = req.session.user.id;

        console.log('Opening payment page');
        console.log('Fee ID:', feeId);
        console.log('User ID:', userId);


        // -------------------------------------------------
        // GET FEE
        // -------------------------------------------------

        const [feeRows] = await db.query(
            `
            SELECT
                id,
                student_id,
                amount,
                status,
                due_date,
                paid_date
            FROM fees
            WHERE id = ?
            LIMIT 1
            `,
            [feeId]
        );


        if (feeRows.length === 0) {

            return res.status(404).send(
                'Fee record not found.'
            );

        }


        const fee = feeRows[0];


        // -------------------------------------------------
        // GET STUDENT
        // -------------------------------------------------

        const [studentRows] = await db.query(
            `
            SELECT
                s.*,
                u.name AS student_name,
                u.email AS user_email
            FROM students s
            LEFT JOIN users u
                ON s.user_id = u.id
            WHERE s.user_id = ?
            LIMIT 1
            `,
            [userId]
        );


        if (studentRows.length === 0) {

            return res.status(404).send(
                'Student record not found.'
            );

        }


        const student = studentRows[0];


        // -------------------------------------------------
        // NORMALIZE DATA
        // -------------------------------------------------

        student.student_name =
            student.student_name ||
            student.name ||
            'Student';

        student.email =
            student.email ||
            student.user_email ||
            '';


        console.log('Payment page loaded successfully');


        // -------------------------------------------------
        // RENDER
        // -------------------------------------------------

        return res.render(
            'student/payment',
            {
                fee: fee,
                student: student
            }
        );


    } catch (error) {

        console.error(
            'Payment page error:',
            error.message
        );

        return res.status(500).send(
            'Unable to open payment page.'
        );

    }

});


// =====================================================
// SIMULATED PAYMENT
// POST /payment/:feeId/pay
// =====================================================

router.post('/:feeId/pay', requireLogin, async (req, res) => {

    try {

        const feeId = req.params.feeId;
        const userId = req.session.user.id;

        const {
            payment_method,
            upi_id,
            utr_number,
            bank_name,
            wallet_name
        } = req.body;


        console.log('-----------------------------');
        console.log('SIMULATED PAYMENT');
        console.log('Fee ID:', feeId);
        console.log('User ID:', userId);
        console.log('Method:', payment_method);
        console.log('-----------------------------');


        // -------------------------------------------------
        // VALID PAYMENT METHODS
        // -------------------------------------------------

        const allowedMethods = [
            'UPI',
            'CARD',
            'NETBANKING',
            'WALLET',
            'RTGS_NEFT'
        ];


        if (!allowedMethods.includes(payment_method)) {

            return res.status(400).json({
                success: false,
                message: 'Invalid payment method.'
            });

        }


        // -------------------------------------------------
        // GET FEE
        // -------------------------------------------------

        const [feeRows] = await db.query(
            `
            SELECT
                id,
                student_id,
                amount,
                status
            FROM fees
            WHERE id = ?
            LIMIT 1
            `,
            [feeId]
        );


        if (feeRows.length === 0) {

            return res.status(404).json({
                success: false,
                message: 'Fee record not found.'
            });

        }


        const fee = feeRows[0];


        // -------------------------------------------------
        // CHECK ALREADY PAID
        // -------------------------------------------------

        if (
            fee.status &&
            String(fee.status).toLowerCase() === 'paid'
        ) {

            return res.status(400).json({
                success: false,
                message: 'This fee has already been paid.'
            });

        }


        // -------------------------------------------------
        // VERIFY STUDENT
        // -------------------------------------------------

        const [studentRows] = await db.query(
            `
            SELECT
                id
            FROM students
            WHERE user_id = ?
            LIMIT 1
            `,
            [userId]
        );


        if (studentRows.length === 0) {

            return res.status(404).json({
                success: false,
                message: 'Student record not found.'
            });

        }


        const studentId = studentRows[0].id;


        // -------------------------------------------------
        // SECURITY CHECK
        // MAKE SURE FEE BELONGS TO STUDENT
        // -------------------------------------------------

        if (
            Number(fee.student_id) !==
            Number(studentId)
        ) {

            return res.status(403).json({
                success: false,
                message: 'This fee does not belong to your account.'
            });

        }


        // -------------------------------------------------
        // GENERATE SIMULATED TRANSACTION
        // -------------------------------------------------

        const transactionId =
            'SIM' +
            Date.now() +
            Math.floor(
                Math.random() * 10000
            );


        // -------------------------------------------------
        // GENERATE RECEIPT NUMBER
        // -------------------------------------------------

        const receiptNo =
            'BUS-' +
            Date.now();


        // -------------------------------------------------
        // INSERT PAYMENT
        //
        // IMPORTANT:
        // These column names exactly match
        // your current payments table.
        // -------------------------------------------------

        const [paymentResult] = await db.query(
            `
            INSERT INTO payments
            (
                fee_id,
                student_id,
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                amount,
                currency,
                payment_method,
                status,
                receipt_no,
                transaction_date,
                screenshot
            )
            VALUES
            (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                NOW(),
                ?
            )
            `,
            [

                feeId,

                studentId,

                // Old Razorpay field.
                // We use it to store our simulated reference.
                'SIM_ORDER_' + transactionId,

                // Simulated payment ID
                transactionId,

                // No Razorpay signature needed
                null,

                // Amount
                fee.amount,

                // Currency
                'INR',

                // Payment method
                payment_method,

                // Your ENUM accepts:
                // created, pending, success, failed
                'success',

                // Receipt number
                receiptNo,

                // Screenshot
                null

            ]
        );


        // -------------------------------------------------
        // UPDATE FEES TABLE
        // -------------------------------------------------

        await db.query(
            `
            UPDATE fees
            SET
                status = 'paid',
                paid_date = CURDATE()
            WHERE id = ?
            `,
            [feeId]
        );


        console.log(
            'Payment successful:',
            transactionId
        );


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        return res.json({

            success: true,

            message:
                'Payment completed successfully.',

            paymentId:
                paymentResult.insertId,

            transactionId:
                transactionId,

            receiptNo:
                receiptNo,

            amount:
                fee.amount

        });


    } catch (error) {

        console.error(
            'SIMULATED PAYMENT ERROR:',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Unable to process payment.',

            error:
                error.message

        });

    }

});


// =====================================================
// PAYMENT SUCCESS PAGE
// =====================================================

router.get(
    '/success/:paymentId',
    requireLogin,
    async (req, res) => {

        try {

            const paymentId =
                req.params.paymentId;


            const [rows] = await db.query(
                `
                SELECT
                    p.*,
                    f.amount AS fee_amount
                FROM payments p
                LEFT JOIN fees f
                    ON p.fee_id = f.id
                WHERE p.id = ?
                LIMIT 1
                `,
                [paymentId]
            );


            if (rows.length === 0) {

                return res.status(404).send(
                    'Payment not found.'
                );

            }


            return res.render(
                'student/payment-success',
                {
                    payment: rows[0]
                }
            );


        } catch (error) {

            console.error(
                'Payment success error:',
                error
            );

            return res.status(500).send(
                'Unable to open payment success page.'
            );

        }

    }
);


module.exports = router;