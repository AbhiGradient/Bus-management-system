const PDFDocument = require('pdfkit');

/**
 * Generate payment receipt PDF
 *
 * @param {Object} payment
 * @param {Object} res
 */

function generatePaymentReceipt(payment, res) {

    const receiptNumber =
        payment.receipt_number ||
        `BUS-${Date.now()}`;

    const transactionId =
        payment.transaction_id ||
        'N/A';

    const studentName =
        payment.student_name ||
        'N/A';

    const studentId =
        payment.student_id ||
        'N/A';

    const feeId =
        payment.fee_id ||
        payment.id ||
        'N/A';

    const paymentMethod =
        payment.payment_method ||
        'Simulated Payment';

    const amount =
        Number(payment.amount || 0).toFixed(2);

    const paymentDate =
        payment.payment_date
            ? new Date(
                payment.payment_date
            ).toLocaleString('en-IN')
            : new Date().toLocaleString('en-IN');


    /*
    =====================================================
    CREATE PDF
    =====================================================
    */

    const doc = new PDFDocument({
        size: 'A4',
        margin: 50
    });


    /*
    =====================================================
    DOWNLOAD FILE NAME
    =====================================================
    */

    const fileName =
        `payment-receipt-${receiptNumber}.pdf`;


    /*
    =====================================================
    RESPONSE HEADERS
    =====================================================
    */

    res.setHeader(
        'Content-Type',
        'application/pdf'
    );

    res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`
    );


    /*
    =====================================================
    PIPE PDF TO BROWSER
    =====================================================
    */

    doc.pipe(res);


    /*
    =====================================================
    HEADER
    =====================================================
    */

    doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(
            'SMART COLLEGE BUS',
            {
                align: 'center'
            }
        );


    doc
        .fontSize(12)
        .font('Helvetica')
        .text(
            'College Bus Management System',
            {
                align: 'center'
            }
        );


    doc.moveDown();


    /*
    =====================================================
    TITLE
    =====================================================
    */

    doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(
            'PAYMENT RECEIPT',
            {
                align: 'center'
            }
        );


    doc.moveDown(2);


    /*
    =====================================================
    SUCCESS MESSAGE
    =====================================================
    */

    doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(
            'PAYMENT SUCCESSFUL',
            {
                align: 'center'
            }
        );


    doc.moveDown(2);


    /*
    =====================================================
    RECEIPT DETAILS
    =====================================================
    */

    function addRow(label, value) {

        const startY =
            doc.y;

        doc
            .font('Helvetica-Bold')
            .fontSize(11)
            .text(
                label,
                70,
                startY,
                {
                    width: 180
                }
            );


        doc
            .font('Helvetica')
            .fontSize(11)
            .text(
                String(value),
                260,
                startY,
                {
                    width: 260
                }
            );


        doc.moveDown(1.5);

    }


    addRow(
        'Receipt Number',
        receiptNumber
    );


    addRow(
        'Transaction ID',
        transactionId
    );


    addRow(
        'Student Name',
        studentName
    );


    addRow(
        'Student ID',
        studentId
    );


    addRow(
        'Fee ID',
        feeId
    );


    addRow(
        'Payment Method',
        paymentMethod
    );


    addRow(
        'Payment Date',
        paymentDate
    );


    /*
    =====================================================
    SEPARATOR
    =====================================================
    */

    doc
        .moveDown()
        .moveTo(
            70,
            doc.y
        )
        .lineTo(
            525,
            doc.y
        )
        .stroke();


    doc.moveDown();


    /*
    =====================================================
    AMOUNT
    =====================================================
    */

    doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(
            'Amount Paid',
            70,
            doc.y
        );


    doc
        .fontSize(18)
        .text(
            `₹${amount}`,
            350,
            doc.y - 20,
            {
                width: 175,
                align: 'right'
            }
        );


    doc.moveDown(3);


    /*
    =====================================================
    PAYMENT STATUS
    =====================================================
    */

    doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(
            'Status: PAYMENT SUCCESSFUL',
            {
                align: 'center'
            }
        );


    doc.moveDown(3);


    /*
    =====================================================
    FOOTER NOTE
    =====================================================
    */

    doc
        .fontSize(9)
        .font('Helvetica')
        .text(
            'This is a computer-generated payment receipt.',
            {
                align: 'center'
            }
        );


    doc
        .text(
            'No physical signature is required.',
            {
                align: 'center'
            }
        );


    doc.moveDown();


    doc
        .fontSize(8)
        .text(
            'Smart College Bus Management System',
            {
                align: 'center'
            }
        );


    /*
    =====================================================
    FINALIZE PDF
    =====================================================
    */

    doc.end();

}


module.exports =
    generatePaymentReceipt;