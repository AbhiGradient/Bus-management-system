// helpers/paymentUtils.js


// ============================================================
// GENERATE SIMULATED TRANSACTION ID
// ============================================================

function generateTransactionId() {

    const timestamp =
        Date.now();

    const random =
        Math.floor(
            1000 +
            Math.random() * 9000
        );

    return `SIM-${timestamp}-${random}`;

}


// ============================================================
// GENERATE SIMULATED UTR NUMBER
// ============================================================

function generateUTR() {

    const timestamp =
        Date.now();

    const random =
        Math.floor(
            100 +
            Math.random() * 900
        );

    return `SIMUTR${timestamp}${random}`;

}


// ============================================================
// GENERATE RECEIPT NUMBER
// ============================================================

function generateReceiptNumber() {

    const timestamp =
        Date.now();

    const random =
        Math.floor(
            1000 +
            Math.random() * 9000
        );

    return `REC-${timestamp}-${random}`;

}


// ============================================================
// FORMAT PAYMENT METHOD
// ============================================================

function formatPaymentMethod(
    paymentMethod
) {

    const methods = {

        card:
            'Credit / Debit Card',

        upi:
            'UPI',

        upi_qr:
            'UPI QR Code',

        netbanking:
            'Net Banking',

        wallet:
            'Digital Wallet',

        rtgs:
            'RTGS / NEFT'

    };


    return (

        methods[paymentMethod]

        ||

        paymentMethod

        ||

        'Unknown'

    );

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatPaymentDate(
    date
) {

    if (!date) {

        return 'N/A';

    }


    const paymentDate =
        new Date(date);


    if (
        isNaN(
            paymentDate.getTime()
        )
    ) {

        return 'N/A';

    }


    return paymentDate.toLocaleString(
        'en-IN',
        {

            day:
                '2-digit',

            month:
                'short',

            year:
                'numeric',

            hour:
                '2-digit',

            minute:
                '2-digit',

            hour12:
                true

        }
    );

}


// ============================================================
// FORMAT AMOUNT
// ============================================================

function formatAmount(
    amount
) {

    const numericAmount =
        Number(amount);


    if (
        isNaN(
            numericAmount
        )
    ) {

        return '₹0.00';

    }


    return numericAmount.toLocaleString(
        'en-IN',
        {

            style:
                'currency',

            currency:
                'INR',

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2

        }
    );

}


// ============================================================
// CLEAN UTR
// ============================================================

function cleanUTR(
    utr
) {

    if (!utr) {

        return null;

    }


    return String(utr)
        .trim()
        .replace(
            /\s+/g,
            ''
        );

}


// ============================================================
// VALIDATE UTR
// ============================================================

function isValidUTR(
    utr
) {

    if (!utr) {

        return false;

    }


    const cleanedUTR =
        cleanUTR(utr);


    // Simulated UTR:
    // Minimum 6 characters

    return (
        cleanedUTR.length >= 6
    );

}


// ============================================================
// VALIDATE UPI ID
// ============================================================

function isValidUPI(
    upiId
) {

    if (!upiId) {

        return false;

    }


    const upi =
        String(upiId)
            .trim();


    /*
     * Basic UPI format:
     *
     * username@bank
     *
     * Examples:
     *
     * abhishek@oksbi
     * student@upi
     */

    const upiRegex =
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/;


    return upiRegex.test(
        upi
    );

}


// ============================================================
// MASK CARD NUMBER
// ============================================================

function maskCardNumber(
    cardNumber
) {

    if (!cardNumber) {

        return '**** **** **** ****';

    }


    const cleanedCard =
        String(cardNumber)
            .replace(
                /\D/g,
                ''
            );


    if (
        cleanedCard.length < 4
    ) {

        return '**** **** **** ****';

    }


    const lastFour =
        cleanedCard.slice(-4);


    return `**** **** **** ${lastFour}`;

}


// ============================================================
// GET PAYMENT STATUS LABEL
// ============================================================

function getPaymentStatusLabel(
    status
) {

    const statuses = {

        success:
            'Payment Successful',

        pending:
            'Payment Pending',

        failed:
            'Payment Failed',

        cancelled:
            'Payment Cancelled'

    };


    return (

        statuses[status]

        ||

        status

        ||

        'Unknown'

    );

}


// ============================================================
// GET PAYMENT STATUS CLASS
// ============================================================

function getPaymentStatusClass(
    status
) {

    const classes = {

        success:
            'status-success',

        pending:
            'status-pending',

        failed:
            'status-failed',

        cancelled:
            'status-cancelled'

    };


    return (

        classes[status]

        ||

        'status-unknown'

    );

}


// ============================================================
// CREATE RECEIPT DATA
// ============================================================

function createReceiptData(
    payment
) {

    if (!payment) {

        return null;

    }


    return {

        receiptNumber:

            payment.receipt_number

            ||

            generateReceiptNumber(),


        transactionId:

            payment.transaction_id

            ||

            'N/A',


        utrNumber:

            payment.utr_number

            ||

            payment.razorpay_payment_id

            ||

            'N/A',


        studentName:

            payment.student_name

            ||

            'N/A',


        studentEmail:

            payment.student_email

            ||

            'N/A',


        studentId:

            payment.student_id

            ||

            'N/A',


        feeId:

            payment.fee_id

            ||

            'N/A',


        amount:

            Number(
                payment.amount
            ) || 0,


        formattedAmount:

            formatAmount(
                payment.amount
            ),


        paymentMethod:

            formatPaymentMethod(
                payment.payment_method
            ),


        paymentDate:

            formatPaymentDate(
                payment.payment_date
            ),


        status:

            payment.status

            ||

            'success'

    };

}


// ============================================================
// CREATE SIMULATED PAYMENT DATA
// ============================================================

function createSimulatedPaymentData(
    data
) {

    const {

        feeId,

        studentId,

        amount,

        paymentMethod,

        utrNumber

    } = data;


    const transactionId =
        generateTransactionId();


    const finalUTR =

        cleanUTR(
            utrNumber
        )

        ||

        generateUTR();


    return {

        feeId:

            feeId,


        studentId:

            studentId,


        amount:

            Number(
                amount
            ),


        paymentMethod:

            paymentMethod,


        transactionId:

            transactionId,


        utrNumber:

            finalUTR,


        status:

            'success',


        paymentDate:

            new Date()

    };

}


// ============================================================
// EXPORT FUNCTIONS
// ============================================================

module.exports = {

    generateTransactionId,

    generateUTR,

    generateReceiptNumber,

    formatPaymentMethod,

    formatPaymentDate,

    formatAmount,

    cleanUTR,

    isValidUTR,

    isValidUPI,

    maskCardNumber,

    getPaymentStatusLabel,

    getPaymentStatusClass,

    createReceiptData,

    createSimulatedPaymentData

};