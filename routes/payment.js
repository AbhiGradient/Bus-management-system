const express = require('express');
const router = express.Router();

const db = require('../config/db');


/* =========================================================
   AUTHENTICATION
   ========================================================= */

function requireLogin(req, res, next) {

    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }

    next();
}


/* =========================================================
   GET CURRENT STUDENT
   =========================================================

   We only depend on students.user_id.

   We do NOT assume roll_number or department columns exist.

   Student name and email are obtained from users table.

   ========================================================= */

async function getStudentForUser(userId) {

    const [rows] = await db.query(
        `
        SELECT
            s.*,
            u.name AS student_name,
            u.email AS student_email

        FROM students s

        LEFT JOIN users u
            ON s.user_id = u.id

        WHERE s.user_id = ?

        LIMIT 1
        `,
        [userId]
    );

    if (!rows || rows.length === 0) {
        return null;
    }

    return rows[0];
}


/* =========================================================
   1. PAYMENT HISTORY
   =========================================================

   IMPORTANT:

   This route MUST appear BEFORE:

   /:feeId

   Otherwise:

   /payment/history

   will be interpreted as:

   feeId = "history"

   ========================================================= */

router.get(
    '/history',
    requireLogin,
    async (req, res) => {

        try {

            const userId = req.session.user.id;

            console.log(
                '📜 Loading payment history for user:',
                userId
            );


            const student =
                await getStudentForUser(userId);


            if (!student) {

                return res.status(404).send(`
                    <div style="
                        font-family:Arial;
                        text-align:center;
                        margin-top:80px;
                    ">

                        <h2>Student Record Not Found</h2>

                        <p>
                            Your student account could not
                            be found.
                        </p>

                        <a href="/student/dashboard">
                            Go Back to Dashboard
                        </a>

                    </div>
                `);

            }


            /*
            =================================================
            GET PAYMENT HISTORY
            =================================================
            */

            const [payments] = await db.query(
                `
                SELECT
                    p.*,
                    f.due_date

                FROM payments p

                LEFT JOIN fees f
                    ON p.fee_id = f.id

                WHERE p.student_id = ?

                ORDER BY
                    COALESCE(
                        p.transaction_date,
                        p.created_at
                    ) DESC
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
                    font-family:Arial;
                    text-align:center;
                    margin-top:80px;
                ">

                    <h2>
                        Unable to Load Payment History
                    </h2>

                    <p>
                        Please try again later.
                    </p>

                    <a href="/student/dashboard">
                        Go Back to Dashboard
                    </a>

                </div>
            `);

        }

    }
);


/* =========================================================
   2. PAYMENT SUCCESS PAGE
   =========================================================

   URL:

   /payment/success/:paymentId

   Example:

   /payment/success/11

   ========================================================= */

router.get(
    '/success/:paymentId',
    requireLogin,
    async (req, res) => {

        try {

            const paymentId =
                req.params.paymentId;

            const userId =
                req.session.user.id;


            console.log(
                '✅ Loading payment success:',
                paymentId
            );


            /*
            =================================================
            GET STUDENT
            =================================================
            */

            const student =
                await getStudentForUser(userId);


            if (!student) {

                return res.status(404).send(
                    'Student record not found.'
                );

            }


            /*
            =================================================
            GET PAYMENT

            We verify BOTH:

            payment ID
            AND
            logged-in student

            This prevents another student from viewing
            someone else's payment.
            =================================================
            */

            const [rows] = await db.query(
                `
                SELECT
                    p.*,
                    f.due_date

                FROM payments p

                LEFT JOIN fees f
                    ON p.fee_id = f.id

                WHERE
                    p.id = ?

                    AND

                    p.student_id = ?

                LIMIT 1
                `,
                [
                    paymentId,
                    student.id
                ]
            );


            if (!rows || rows.length === 0) {

                return res.status(404).send(`
                    <div style="
                        font-family:Arial;
                        text-align:center;
                        margin-top:80px;
                    ">

                        <h2>
                            Payment Not Found
                        </h2>

                        <p>
                            The requested payment could
                            not be found.
                        </p>

                        <a href="/student/dashboard">
                            Go to Dashboard
                        </a>

                    </div>
                `);

            }


            /*
            =================================================
            COMBINE STUDENT + PAYMENT DATA

            This makes EJS access easy:

            payment.student_name
            payment.student_email
            payment.roll_number
            payment.department

            We use fallback values if those columns
            don't exist in your students table.
            =================================================
            */

            const payment = {

                ...rows[0],

                student_name:
                    student.student_name ||
                    student.name ||
                    'N/A',

                student_email:
                    student.student_email ||
                    student.email ||
                    'N/A',

                roll_number:
                    student.roll_number ||
                    student.roll_no ||
                    student.registration_number ||
                    student.enrollment_number ||
                    'N/A',

                department:
                    student.department ||
                    student.dept ||
                    student.branch ||
                    'N/A'

            };


            console.log(
                '✅ Payment success details:',
                payment
            );


            return res.render(
                'student/payment-success',
                {
                    payment: payment
                }
            );


        } catch (error) {

            console.error(
                '❌ Payment success page error:',
                error
            );


            return res.status(500).send(`
                <div style="
                    font-family:Arial;
                    text-align:center;
                    margin-top:80px;
                ">

                    <h2>
                        Unable to Open Payment Success Page
                    </h2>

                    <p>
                        Please try again later.
                    </p>

                    <a href="/student/dashboard">
                        Go to Dashboard
                    </a>

                </div>
            `);

        }

    }
);


/* =========================================================
   3. PAYMENT RECEIPT
   =========================================================

   URL:

   /payment/receipt/:paymentId

   Example:

   /payment/receipt/11

   This opens an HTML receipt.

   User can:

   CTRL + P

   or

   Print → Save as PDF

   ========================================================= */

router.get(
    '/receipt/:paymentId',
    requireLogin,
    async (req, res) => {

        try {

            const paymentId =
                req.params.paymentId;

            const userId =
                req.session.user.id;


            const student =
                await getStudentForUser(userId);


            if (!student) {

                return res.status(404).send(
                    'Student record not found.'
                );

            }


            /*
            =================================================
            GET PAYMENT
            =================================================
            */

            const [rows] = await db.query(
                `
                SELECT
                    p.*,
                    f.due_date

                FROM payments p

                LEFT JOIN fees f
                    ON p.fee_id = f.id

                WHERE
                    p.id = ?

                    AND

                    p.student_id = ?

                LIMIT 1
                `,
                [
                    paymentId,
                    student.id
                ]
            );


            if (!rows || rows.length === 0) {

                return res.status(404).send(
                    'Payment receipt not found.'
                );

            }


            const payment = {

                ...rows[0],

                student_name:
                    student.student_name ||
                    student.name ||
                    'N/A',

                student_email:
                    student.student_email ||
                    student.email ||
                    'N/A',

                roll_number:
                    student.roll_number ||
                    student.roll_no ||
                    student.registration_number ||
                    student.enrollment_number ||
                    'N/A',

                department:
                    student.department ||
                    student.dept ||
                    student.branch ||
                    'N/A'

            };


            /*
            =================================================
            FORMAT DATE
            =================================================
            */

            let formattedDate = 'N/A';

            const rawDate =
                payment.transaction_date ||
                payment.created_at;

            if (rawDate) {

                formattedDate =
                    new Date(rawDate)
                        .toLocaleString('en-US');

            }


            /*
            =================================================
            GENERATE RECEIPT HTML
            =================================================
            */

            const receiptHTML = `

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>
Payment Receipt
</title>


<style>

* {
    box-sizing: border-box;
}


body {

    margin: 0;

    padding: 40px 20px;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    background: #f4f6f8;

    color: #222;

}


.receipt {

    max-width: 800px;

    margin: auto;

    background: #fff;

    padding: 45px;

    border-radius: 14px;

    box-shadow:
        0 10px 35px
        rgba(0,0,0,0.12);

}


.header {

    text-align: center;

    border-bottom:
        2px solid #213755;

    padding-bottom: 25px;

    margin-bottom: 25px;

}


.header h1 {

    margin: 0;

    color: #213755;

}


.header p {

    color: #666;

}


.success {

    text-align: center;

    padding: 14px;

    background: #eaf7ec;

    color: #2e7d32;

    border-radius: 8px;

    font-weight: bold;

    margin-bottom: 25px;

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

    width: 42%;

    font-weight: bold;

    color: #555;

}


.amount {

    font-size: 22px;

    font-weight: bold;

    color: #d4380d;

}


.footer {

    margin-top: 30px;

    padding-top: 20px;

    border-top:
        1px solid #ddd;

    text-align: center;

    color: #777;

    font-size: 13px;

}


.print-btn {

    display: block;

    margin: 25px auto 0;

    padding: 12px 25px;

    background: #213755;

    color: white;

    border: none;

    border-radius: 7px;

    cursor: pointer;

    font-size: 15px;

}


.print-btn:hover {

    opacity: 0.9;

}


@media print {

    body {

        padding: 0;

        background: #fff;

    }


    .receipt {

        max-width: 100%;

        box-shadow: none;

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
Official Student Fee Payment Receipt
</p>

</div>


<div class="success">

✓ PAYMENT SUCCESSFUL

</div>


<table class="info">


<tr>

<td>
Student Name
</td>

<td>
${payment.student_name}
</td>

</tr>


<tr>

<td>
Student Email
</td>

<td>
${payment.student_email}
</td>

</tr>


<tr>

<td>
Roll Number
</td>

<td>
${payment.roll_number}
</td>

</tr>


<tr>

<td>
Department
</td>

<td>
${payment.department}
</td>

</tr>


<tr>

<td>
Payment ID
</td>

<td>
#${payment.id}
</td>

</tr>


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
${
    payment.razorpay_payment_id ||
    payment.razorpay_order_id ||
    'SIMULATED-' + payment.id
}
</td>

</tr>


<tr>

<td>
Amount Paid
</td>

<td class="amount">

${
    payment.currency || 'INR'
}
${Number(payment.amount || 0).toFixed(2)}

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

${formattedDate}

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
    onclick="window.print()"
>

🖨 Print / Save as PDF

</button>


</div>


</body>

</html>

            `;


            /*
            =================================================
            SEND RECEIPT

            IMPORTANT:

            We intentionally send HTML directly.

            This means the user can open the receipt
            and use Print → Save as PDF.
            =================================================
            */

            res.setHeader(
                'Content-Type',
                'text/html; charset=utf-8'
            );


            return res.send(
                receiptHTML
            );


        } catch (error) {

            console.error(
                '❌ Receipt generation error:',
                error
            );


            return res.status(500).send(
                'Unable to generate payment receipt.'
            );

        }

    }
);


/* =========================================================
   4. OPEN PAYMENT PAGE
   =========================================================

   URL:

   /payment/:feeId

   Example:

   /payment/5

   IMPORTANT:

   This route is AFTER:

   /history
   /success/:paymentId
   /receipt/:paymentId

   ========================================================= */

router.get(
    '/:feeId',
    requireLogin,
    async (req, res) => {

        try {

            const feeId =
                req.params.feeId;

            const userId =
                req.session.user.id;


            console.log(
                '💳 Opening payment page for Fee ID:',
                feeId
            );


            /*
            =================================================
            GET FEE
            =================================================
            */

            const [feeRows] = await db.query(
                `
                SELECT *
                FROM fees
                WHERE id = ?
                LIMIT 1
                `,
                [feeId]
            );


            if (!feeRows || feeRows.length === 0) {

                return res.status(404).send(`
                    <div style="
                        font-family:Arial;
                        text-align:center;
                        margin-top:80px;
                    ">

                        <h2>
                            Fee Record Not Found
                        </h2>

                        <p>
                            The requested fee payment
                            record does not exist.
                        </p>

                        <a href="/student/dashboard">
                            Go Back to Dashboard
                        </a>

                    </div>
                `);

            }


            const fee =
                feeRows[0];


            /*
            =================================================
            GET STUDENT
            =================================================
            */

            const student =
                await getStudentForUser(userId);


            if (!student) {

                return res.status(404).send(`
                    <div style="
                        font-family:Arial;
                        text-align:center;
                        margin-top:80px;
                    ">

                        <h2>
                            Student Record Not Found
                        </h2>

                        <p>
                            Your student account could
                            not be found.
                        </p>

                        <a href="/student/dashboard">
                            Go Back to Dashboard
                        </a>

                    </div>
                `);

            }


            /*
            =================================================
            SECURITY CHECK

            Make sure the fee actually belongs
            to the logged-in student.

            =================================================
            */

            if (
                fee.student_id &&
                Number(fee.student_id) !==
                Number(student.id)
            ) {

                console.log(
                    '⚠️ Unauthorized fee payment attempt'
                );


                return res.status(403).send(`
                    <div style="
                        font-family:Arial;
                        text-align:center;
                        margin-top:80px;
                    ">

                        <h2>
                            Unauthorized Payment
                        </h2>

                        <p>
                            This fee does not belong
                            to your account.
                        </p>

                        <a href="/student/dashboard">
                            Go Back to Dashboard
                        </a>

                    </div>
                `);

            }


            /*
            =================================================
            PREPARE STUDENT DATA

            These fallbacks prevent EJS errors.

            =================================================
            */

            const studentData = {

                ...student,

                student_name:
                    student.student_name ||
                    student.name ||
                    'Student',

                email:
                    student.student_email ||
                    student.email ||
                    '',

                roll_number:
                    student.roll_number ||
                    student.roll_no ||
                    student.registration_number ||
                    student.enrollment_number ||
                    'N/A',

                department:
                    student.department ||
                    student.dept ||
                    student.branch ||
                    'N/A'

            };


            console.log(
                '✅ Payment page loaded'
            );


            return res.render(
                'student/payment',
                {
                    fee: fee,
                    student: studentData
                }
            );


        } catch (error) {

            console.error(
                '❌ Payment page error:',
                error
            );


            return res.status(500).send(`
                <div style="
                    font-family:Arial;
                    text-align:center;
                    margin-top:80px;
                ">

                    <h2>
                        Unable to Open Payment Page
                    </h2>

                    <p>
                        Please try again later.
                    </p>

                    <a href="/student/dashboard">
                        Go Back to Dashboard
                    </a>

                </div>
            `);

        }

    }
);


/* =========================================================
   5. PROCESS SIMULATED PAYMENT
   =========================================================

   POST:

   /payment/:feeId/pay

   ========================================================= */

router.post(
    '/:feeId/pay',
    requireLogin,
    async (req, res) => {

        let connection;

        try {

            const feeId =
                req.params.feeId;

            const userId =
                req.session.user.id;


            const {

                payment_method,

                upi_id,

                utr_number,

                bank_name,

                wallet_name

            } = req.body;


            console.log(
                '💳 Simulated payment request:',
                {
                    feeId,
                    userId,
                    payment_method,
                    upi_id,
                    utr_number,
                    bank_name,
                    wallet_name
                }
            );


            /*
            =================================================
            VALIDATE METHOD
            =================================================
            */

            const allowedMethods = [

                'UPI',

                'CARD',

                'NETBANKING',

                'WALLET',

                'RTGS_NEFT'

            ];


            if (
                !allowedMethods.includes(
                    payment_method
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Invalid payment method.'

                });

            }


            /*
            =================================================
            GET STUDENT
            =================================================
            */

            const student =
                await getStudentForUser(userId);


            if (!student) {

                return res.status(404).json({

                    success: false,

                    message:
                        'Student record not found.'

                });

            }


            /*
            =================================================
            GET FEE
            =================================================
            */

            const [feeRows] = await db.query(
                `
                SELECT *
                FROM fees
                WHERE id = ?
                LIMIT 1
                `,
                [feeId]
            );


            if (!feeRows || feeRows.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        'Fee record not found.'

                });

            }


            const fee =
                feeRows[0];


            /*
            =================================================
            SECURITY CHECK
            =================================================
            */

            if (
                fee.student_id &&
                Number(fee.student_id) !==
                Number(student.id)
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        'This fee does not belong to you.'

                });

            }


            /*
            =================================================
            CHECK ALREADY PAID
            =================================================
            */

            if (
                fee.status &&
                String(fee.status).toLowerCase()
                === 'paid'
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'This fee has already been paid.'

                });

            }


            /*
            =================================================
            GENERATE SIMULATED IDs
            =================================================
            */

            const simulatedPaymentId =

                'SIM_PAY_' +

                Date.now() +

                '_' +

                Math.floor(
                    Math.random() * 10000
                );


            const simulatedOrderId =

                'SIM_ORDER_' +

                Date.now();


            const receiptNumber =

                'BUS-REC-' +

                Date.now();


            /*
            =================================================
            GET DB CONNECTION
            =================================================
            */

            connection =
                await db.getConnection();


            /*
            =================================================
            START TRANSACTION
            =================================================
            */

            await connection.beginTransaction();


            /*
            =================================================
            INSERT PAYMENT

            Uses your actual payments table structure.

            =================================================
            */

            const [paymentResult] =
                await connection.query(
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
                        transaction_date
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
                        NOW()
                    )
                    `,
                    [

                        feeId,

                        student.id,

                        simulatedOrderId,

                        simulatedPaymentId,

                        'SIMULATED_SIGNATURE',

                        fee.amount,

                        fee.currency || 'INR',

                        payment_method,

                        'success',

                        receiptNumber

                    ]
                );


            const newPaymentId =
                paymentResult.insertId;


            /*
            =================================================
            UPDATE FEE

            Your fees table uses:

            status
            paid_date

            =================================================
            */

            await connection.query(
                `
                UPDATE fees

                SET
                    status = 'paid',
                    paid_date = NOW()

                WHERE id = ?
                `,
                [feeId]
            );


            /*
            =================================================
            COMMIT
            =================================================
            */

            await connection.commit();


            console.log(
                '✅ Simulated payment successful:',
                newPaymentId
            );


            /*
            =================================================
            SUCCESS RESPONSE
            =================================================

            The frontend should redirect to:

            /payment/success/:paymentId

            =================================================
            */

            return res.json({

                success: true,

                message:
                    'Payment successful.',

                paymentId:
                    newPaymentId,

                transactionId:
                    simulatedPaymentId,

                receiptNo:
                    receiptNumber,

                amount:
                    fee.amount

            });


        } catch (error) {


            /*
            =================================================
            ROLLBACK
            =================================================
            */

            if (connection) {

                try {

                    await connection.rollback();

                } catch (rollbackError) {

                    console.error(
                        'Rollback error:',
                        rollbackError
                    );

                }

            }


            console.error(
                '❌ Simulated payment error:',
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    'Unable to process payment.',

                error:
                    process.env.NODE_ENV === 'development'
                        ? error.message
                        : undefined

            });


        } finally {


            /*
            =================================================
            RELEASE CONNECTION
            =================================================
            */

            if (connection) {

                connection.release();

            }

        }

    }
);


/* =========================================================
   EXPORT ROUTER
   ========================================================= */

   router.get('/receipt/:paymentId', requireLogin, async (req, res) => {
    try {

        const paymentId = req.params.paymentId;
        const userId = req.session.user.id;

        console.log('🧾 Opening receipt for payment ID:', paymentId);

        const [rows] = await db.query(
            `
            SELECT
                p.*,
                u.name AS student_name,
                u.email AS student_email

            FROM payments p

            LEFT JOIN students s
                ON p.student_id = s.id

            LEFT JOIN users u
                ON s.user_id = u.id

            WHERE p.id = ?
            AND s.user_id = ?

            LIMIT 1
            `,
            [paymentId, userId]
        );

        if (!rows || rows.length === 0) {

            console.log(
                '❌ Receipt not found for payment ID:',
                paymentId
            );

            return res.status(404).send(`
                <div style="
                    font-family:Arial;
                    text-align:center;
                    margin-top:80px;
                ">

                    <h2>
                        Payment Receipt Not Found
                    </h2>

                    <p>
                        The requested payment receipt could not be found.
                    </p>

                    <a href="/payment/history">
                        Back to Payment History
                    </a>

                </div>
            `);
        }

        const payment = rows[0];

        console.log(
            '✅ Receipt found:',
            payment.id
        );

        return res.render(
            'student/payment-receipt',
            {
                payment: payment
            }
        );

    } catch (error) {

        console.error(
            '❌ Receipt error:',
            error
        );

        return res.status(500).send(`
            <div style="
                font-family:Arial;
                text-align:center;
                margin-top:80px;
            ">

                <h2>
                    Unable to open payment receipt
                </h2>

                <p>
                    Please try again later.
                </p>

                <a href="/payment/history">
                    Back to Payment History
                </a>

            </div>
        `);
    }
});
module.exports = router;