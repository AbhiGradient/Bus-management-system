// services/paymentService.js

const db = require('../config/db');


// ============================================================
// GENERATE SIMULATED TRANSACTION ID
// ============================================================

function generateTransactionId() {

    return (
        'SIM-' +
        Date.now() +
        '-' +
        Math.floor(
            1000 +
            Math.random() * 9000
        )
    );

}


// ============================================================
// GENERATE SIMULATED UTR
// ============================================================

function generateUTR() {

    return (
        'SIMUTR' +
        Date.now() +
        Math.floor(
            100 +
            Math.random() * 900
        )
    );

}


// ============================================================
// GET FEE DETAILS
// ============================================================

async function getFeeById(
    feeId,
    studentId
) {

    const [rows] =
        await db.promise().query(
            `
            SELECT
                f.*,
                s.id AS student_id,
                s.name AS student_name,
                s.email AS student_email
            FROM fees f
            JOIN students s
                ON f.student_id = s.id
            WHERE f.id = ?
              AND f.student_id = ?
            LIMIT 1
            `,
            [
                feeId,
                studentId
            ]
        );


    if (rows.length === 0) {

        return null;

    }


    return rows[0];

}


// ============================================================
// CHECK IF FEE IS ALREADY PAID
// ============================================================

async function isFeeAlreadyPaid(
    feeId,
    studentId
) {

    const fee =
        await getFeeById(
            feeId,
            studentId
        );


    if (!fee) {

        return false;

    }


    return (
        fee.status &&
        fee.status.toLowerCase() === 'paid'
    );

}


// ============================================================
// PROCESS SIMULATED PAYMENT
// ============================================================

async function processSimulatedPayment(
    paymentData
) {

    const {

        feeId,

        studentId,

        paymentMethod,

        utrNumber,

        upiId,

        cardHolderName,

        cardNumber,

        bankName,

        walletName

    } = paymentData;


    // --------------------------------------------------------
    // Validate required IDs
    // --------------------------------------------------------

    if (
        !feeId ||
        !studentId
    ) {

        throw new Error(
            'Fee ID and Student ID are required.'
        );

    }


    // --------------------------------------------------------
    // Validate payment method
    // --------------------------------------------------------

    const allowedMethods = [

        'card',

        'upi',

        'upi_qr',

        'netbanking',

        'wallet',

        'rtgs'

    ];


    if (
        !allowedMethods.includes(
            paymentMethod
        )
    ) {

        throw new Error(
            'Invalid payment method.'
        );

    }


    // --------------------------------------------------------
    // Get fee
    // --------------------------------------------------------

    const fee =
        await getFeeById(
            feeId,
            studentId
        );


    if (!fee) {

        throw new Error(
            'Fee record not found.'
        );

    }


    // --------------------------------------------------------
    // Prevent duplicate payment
    // --------------------------------------------------------

    if (
        fee.status &&
        fee.status.toLowerCase() === 'paid'
    ) {

        throw new Error(
            'This fee has already been paid.'
        );

    }


    // --------------------------------------------------------
    // Determine fee amount
    // --------------------------------------------------------

    const amount = Number(

        fee.amount ||

        fee.total_amount ||

        fee.fee_amount ||

        0

    );


    if (
        !amount ||
        amount <= 0
    ) {

        throw new Error(
            'Invalid fee amount.'
        );

    }


    // --------------------------------------------------------
    // Validate UPI QR
    // --------------------------------------------------------

    if (
        paymentMethod === 'upi_qr'
    ) {

        if (
            !utrNumber ||
            utrNumber.trim().length < 6
        ) {

            throw new Error(
                'Please enter a valid UTR number.'
            );

        }

    }


    // --------------------------------------------------------
    // Validate UPI
    // --------------------------------------------------------

    if (
        paymentMethod === 'upi'
    ) {

        if (
            !upiId ||
            !upiId.includes('@')
        ) {

            throw new Error(
                'Please enter a valid UPI ID.'
            );

        }

    }


    // --------------------------------------------------------
    // Generate transaction details
    // --------------------------------------------------------

    const transactionId =
        generateTransactionId();


    const finalUTR =

        utrNumber &&
        utrNumber.trim()

            ? utrNumber.trim()

            : generateUTR();


    // ========================================================
    // DATABASE TRANSACTION
    // ========================================================

    const connection =
        await db
            .promise()
            .getConnection();


    try {

        await connection.beginTransaction();


        // ----------------------------------------------------
        // Insert payment record
        // ----------------------------------------------------

        const [paymentResult] =

            await connection.query(

                `
                INSERT INTO payments
                (
                    fee_id,
                    student_id,
                    amount,
                    payment_method,
                    transaction_id,
                    razorpay_payment_id,
                    status,
                    payment_date
                )
                VALUES
                (?, ?, ?, ?, ?, ?, ?, NOW())
                `,

                [

                    feeId,

                    studentId,

                    amount,

                    paymentMethod,

                    transactionId,

                    finalUTR,

                    'success'

                ]

            );


        // ----------------------------------------------------
        // Update fee status
        // ----------------------------------------------------

        await connection.query(

            `
            UPDATE fees

            SET status = 'paid'

            WHERE id = ?

              AND student_id = ?

              AND (
                    status IS NULL
                    OR status != 'paid'
                  )
            `,

            [

                feeId,

                studentId

            ]

        );


        // ----------------------------------------------------
        // Commit
        // ----------------------------------------------------

        await connection.commit();


        // ----------------------------------------------------
        // Return payment result
        // ----------------------------------------------------

        return {

            success: true,

            paymentId:
                paymentResult.insertId,

            transactionId:

                transactionId,

            utr:

                finalUTR,

            amount:

                amount,

            paymentMethod:

                paymentMethod,

            feeId:

                feeId,

            studentId:

                studentId,

            paymentDate:

                new Date()

        };


    } catch (error) {


        // ----------------------------------------------------
        // Rollback on error
        // ----------------------------------------------------

        await connection.rollback();


        throw error;


    } finally {


        // ----------------------------------------------------
        // Release connection
        // ----------------------------------------------------

        connection.release();

    }

}


// ============================================================
// GET PAYMENT BY FEE
// ============================================================

async function getPaymentByFeeId(
    feeId,
    studentId
) {


    const [rows] =

        await db
            .promise()
            .query(

                `
                SELECT
                    p.*,

                    f.status
                        AS fee_status,

                    s.name
                        AS student_name,

                    s.email
                        AS student_email

                FROM payments p

                JOIN fees f

                    ON p.fee_id = f.id

                JOIN students s

                    ON p.student_id = s.id

                WHERE p.fee_id = ?

                  AND p.student_id = ?

                  AND p.status = 'success'

                ORDER BY
                    p.payment_date DESC

                LIMIT 1
                `,

                [

                    feeId,

                    studentId

                ]

            );


    if (
        rows.length === 0
    ) {

        return null;

    }


    return rows[0];

}


// ============================================================
// GET STUDENT PAYMENT HISTORY
// ============================================================

async function getPaymentHistory(
    studentId
) {


    const [rows] =

        await db
            .promise()
            .query(

                `
                SELECT

                    p.*,

                    f.status
                        AS fee_status

                FROM payments p

                LEFT JOIN fees f

                    ON p.fee_id = f.id

                WHERE p.student_id = ?

                ORDER BY
                    p.payment_date DESC
                `,

                [

                    studentId

                ]

            );


    return rows;

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    generateTransactionId,

    generateUTR,

    getFeeById,

    isFeeAlreadyPaid,

    processSimulatedPayment,

    getPaymentByFeeId,

    getPaymentHistory

};