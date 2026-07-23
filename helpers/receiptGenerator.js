/**
 * helpers/receiptGenerator.js
 * -----------------------------
 * Generates a professional PDF fee receipt using PDFKit.
 * Called from routes/payment.js after a successful simulated payment.
 *
 * Usage:
 *   const { generateReceiptPDF } = require('./receiptGenerator');
 *   const filePath = await generateReceiptPDF(receiptData);
 *   // filePath -> absolute path to the generated PDF on disk
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { formatCurrency, formatDisplayDate } = require('./paymentUtils');

// Directory where generated receipts are stored
const RECEIPTS_DIR = path.join(__dirname, '..', 'public', 'receipts');

// Ensure the receipts directory exists
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

/**
 * Generate a PDF fee receipt and save it to disk.
 *
 * @param {Object} data
 * @param {string} data.studentName
 * @param {string} data.rollNo
 * @param {string} data.department
 * @param {string} data.routeName
 * @param {string} data.busNumber
 * @param {number} data.amount
 * @param {string} data.receiptNo
 * @param {string} data.transactionId
 * @param {Date}   data.paymentDate
 * @returns {Promise<string>} absolute file path of the saved PDF
 */
function generateReceiptPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `${data.receiptNo}.pdf`;
      const filePath = path.join(RECEIPTS_DIR, fileName);

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ---------- Header ----------
      doc
        .fillColor('#1F5C4F')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('CampusTransit', { align: 'left' })
        .fontSize(10)
        .fillColor('#4B5A54')
        .font('Helvetica')
        .text('Smart College Bus Management System', { align: 'left' });

      doc
        .moveTo(50, 100)
        .lineTo(545, 100)
        .strokeColor('#B8863C')
        .lineWidth(1.5)
        .stroke();

      // ---------- Title ----------
      doc
        .moveDown(1.5)
        .fillColor('#16332C')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Bus Fee Payment Receipt', { align: 'center' });

      doc.moveDown(1);

      // ---------- Receipt meta box ----------
      const metaTop = doc.y;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1C2622')
        .text('Receipt No:', 50, metaTop)
        .font('Helvetica')
        .text(data.receiptNo, 150, metaTop);

      doc
        .font('Helvetica-Bold')
        .text('Payment Date:', 320, metaTop)
        .font('Helvetica')
        .text(formatDisplayDate(data.paymentDate), 410, metaTop);

      doc.moveDown(2);

      // ---------- Student Details Section ----------
      const sectionTop = doc.y + 10;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#1F5C4F')
        .text('Student Details', 50, sectionTop);

      doc
        .moveTo(50, sectionTop + 18)
        .lineTo(545, sectionTop + 18)
        .strokeColor('#E5E0D3')
        .lineWidth(1)
        .stroke();

      const rows = [
        ['Student Name', data.studentName],
        ['Roll Number', data.rollNo],
        ['Department', data.department || '—'],
        ['Bus Route', data.routeName || '—'],
        ['Bus Number', data.busNumber || '—']
      ];

      let rowY = sectionTop + 30;
      rows.forEach(([label, value]) => {
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#4B5A54')
          .text(label, 50, rowY)
          .font('Helvetica')
          .fillColor('#1C2622')
          .text(value, 220, rowY);
        rowY += 22;
      });

      // ---------- Payment Details Section ----------
      const payTop = rowY + 20;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#1F5C4F')
        .text('Payment Details', 50, payTop);

      doc
        .moveTo(50, payTop + 18)
        .lineTo(545, payTop + 18)
        .strokeColor('#E5E0D3')
        .lineWidth(1)
        .stroke();

      const payRows = [
        ['Transaction ID (UTR)', data.transactionId],
        ['Payment Method', 'UPI (Simulated)'],
        ['Payment Status', 'SUCCESS']
      ];

      let payRowY = payTop + 30;
      payRows.forEach(([label, value]) => {
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#4B5A54')
          .text(label, 50, payRowY)
          .font('Helvetica')
          .fillColor('#1C2622')
          .text(value, 220, payRowY);
        payRowY += 22;
      });

      // ---------- Amount Box ----------
      const amountBoxTop = payRowY + 20;
      doc
        .rect(50, amountBoxTop, 495, 50)
        .fill('#F6F3EC')
        .strokeColor('#B8863C')
        .lineWidth(1)
        .stroke();

      doc
        .fillColor('#16332C')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Total Amount Paid', 65, amountBoxTop + 17);

      doc
        .fillColor('#1F5C4F')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(formatCurrency(data.amount), 350, amountBoxTop + 13, {
          width: 180,
          align: 'right'
        });

      // ---------- Footer ----------
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#8A9591')
        .text(
          'This is a system-generated receipt for a simulated payment and does not require a physical signature.',
          50,
          amountBoxTop + 80,
          { align: 'center', width: 495 }
        );

      doc
        .fontSize(8)
        .fillColor('#8A9591')
        .text('CampusTransit · Smart College Bus Management System', 50, amountBoxTop + 95, {
          align: 'center',
          width: 495
        });

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateReceiptPDF };