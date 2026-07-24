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
// PAYMENT HISTORY
// GET /payment/history
// =====================================================

router.get('/history', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;

        console.log('📜 Loading payment history for user:', userId);

        // Find student linked to logged-in user
        const [studentRows] = await db.query(
            `
            SELECT *
            FROM students
            WHERE user_id = ?
            LIMIT 1
            `,
            [userId]
        );

        if (!studentRows || studentRows.length === 0) {
            return res.status(404).send(`
                <h2>Student record not found.</h2>
                <a href="/student/dashboard">Go to Dashboard</a>
            `);
        }

        const student = studentRows[0];

        // Get all payment records for this student
        const [payments] = await db.query(
            `
            SELECT
                p.*,
                f.due_date
            FROM payments p
            LEFT JOIN fees f
                ON p.fee_id = f.id
            WHERE p.student_id = ?
            ORDER BY p.created_at DESC
            `,
            [student.id]
        );

        console.log(
            `✅ Found ${payments.length} payment records`
        );

        return res.render(
            'student/payment-history',
            {
                payments: payments,
                student: student
            }
        );

    } catch (error) {

        console.error(
            '❌ Payment history error:',
            error
        );

        return res.status(500).send(`
            <div style="
                font-family: Arial;
                text-align: center;
                margin-top: 80px;
            ">

                <h2>Unable to load payment history</h2>

                <p>
                    Please try again later.
                </p>

                <a href="/student/dashboard">
                    Go Back to Dashboard
                </a>

            </div>
        `);
    }
});

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
// =====================================================
// DOWNLOAD PAYMENT RECEIPT
// GET /payment/receipt/:paymentId
// =====================================================

router.get('/receipt/:paymentId', requireLogin, async (req, res) => {

    try {

        const paymentId = req.params.paymentId;
        const userId = req.session.user.id;

        console.log('Generating receipt for payment:', paymentId);


        // -------------------------------------------------
        // GET PAYMENT + FEE + STUDENT
        // -------------------------------------------------

        const [rows] = await db.query(
            `
            SELECT
                p.id AS payment_id,
                p.fee_id,
                p.student_id,
                p.amount,
                p.currency,
                p.payment_method,
                p.status,
                p.receipt_no,
                p.razorpay_payment_id,
                p.transaction_date,

                f.due_date,

                u.name AS student_name,
                u.email AS student_email

            FROM payments p

            LEFT JOIN fees f
                ON p.fee_id = f.id

            LEFT JOIN students s
                ON p.student_id = s.id

            LEFT JOIN users u
                ON s.user_id = u.id

            WHERE p.id = ?
            AND s.user_id = ?

            LIMIT 1
            `,
            [
                paymentId,
                userId
            ]
        );


        // -------------------------------------------------
        // PAYMENT NOT FOUND
        // -------------------------------------------------

        if (rows.length === 0) {

            return res.status(404).send(
                'Payment receipt not found.'
            );

        }


        const payment = rows[0];


        // -------------------------------------------------
        // CREATE HTML RECEIPT
        // -------------------------------------------------

        const receiptHTML = `

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<title>Payment Receipt - ${payment.receipt_no}</title>

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<style>

* {
    box-sizing: border-box;
}

body {

    margin: 0;

    padding: 40px;

    background: #f4f6f8;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    color: #222;

}

.receipt {

    max-width: 800px;

    margin: auto;

    background: white;

    padding: 45px;

    border-radius: 12px;

    box-shadow:
        0 10px 30px
        rgba(0,0,0,0.12);

}

.header {

    text-align: center;

    border-bottom:
        2px solid #1f3556;

    padding-bottom: 25px;

    margin-bottom: 30px;

}

.header h1 {

    margin: 0;

    color: #1f3556;

    font-size: 30px;

}

.header p {

    color: #666;

    margin-top: 8px;

}

.success {

    text-align: center;

    background: #eaf7ec;

    color: #2e7d32;

    padding: 15px;

    border-radius: 8px;

    font-weight: bold;

    margin-bottom: 30px;

}

.info {

    width: 100%;

    border-collapse: collapse;

}

.info tr {

    border-bottom:
        1px solid #eee;

}

.info td {

    padding: 14px 5px;

}

.info td:first-child {

    font-weight: bold;

    color: #555;

    width: 45%;

}

.amount {

    font-size: 24px;

    color: #d4380d;

    font-weight: bold;

}

.footer {

    text-align: center;

    margin-top: 35px;

    padding-top: 20px;

    border-top:
        1px solid #ddd;

    color: #777;

    font-size: 13px;

}

.print-btn {

    display: block;

    margin: 30px auto 0;

    padding: 12px 25px;

    border: none;

    border-radius: 7px;

    background: #1f3556;

    color: white;

    cursor: pointer;

    font-size: 15px;

}

@media print {

    body {

        background: white;

        padding: 0;

    }

    .receipt {

        box-shadow: none;

        max-width: 100%;

    }

    .print-btn {

        display: none;

    }

}

</style>

</head>


<body>


<div class="receipt">


<div class="header">

<h1>
Smart College Bus Management System
</h1>

<p>
Official Fee Payment Receipt
</p>

</div>


<div class="success">

✓ PAYMENT SUCCESSFUL

</div>


<table class="info">


<tr>

<td>
Receipt Number
</td>

<td>
${payment.receipt_no || 'N/A'}
</td>

</tr>


<tr>

<td>
Payment ID
</td>

<td>
#${payment.payment_id}
</td>

</tr>


<tr>

<td>
Student Name
</td>

<td>
${payment.student_name || 'N/A'}
</td>

</tr>


<tr>

<td>
Student Email
</td>

<td>
${payment.student_email || 'N/A'}
</td>

</tr>


<tr>

<td>
Payment Method
</td>

<td>
${payment.payment_method || 'N/A'}
</td>

</tr>


<tr>

<td>
Transaction Reference
</td>

<td>
${payment.razorpay_payment_id || 'N/A'}
</td>

</tr>


<tr>

<td>
Amount Paid
</td>

<td class="amount">

₹${Number(payment.amount || 0).toFixed(2)}

</td>

</tr>


<tr>

<td>
Payment Status
</td>

<td>

${payment.status || 'N/A'}

</td>

</tr>


<tr>

<td>
Transaction Date
</td>

<td>

${payment.transaction_date
    ? new Date(payment.transaction_date).toLocaleString()
    : 'N/A'}

</td>

</tr>


</table>


<div class="footer">

<p>

This is a computer-generated payment receipt.

</p>

<p>

Smart College Bus Management System

</p>

</div>


<button
    class="print-btn"
    onclick="window.print()">

🖨 Print / Save as PDF

</button>


</div>


</body>

</html>

        `;


        // -------------------------------------------------
        // SEND RECEIPT
        // -------------------------------------------------

        res.setHeader(
            'Content-Type',
            'text/html; charset=utf-8'
        );

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${payment.receipt_no || 'payment-receipt'}.html"`
        );

        return res.send(receiptHTML);


    } catch (error) {

        console.error(
            'Receipt generation error:',
            error
        );

        return res.status(500).send(
            'Unable to generate payment receipt.'
        );

    }

});


module.exports = router;