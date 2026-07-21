/*
  utils/generatorQR.js
  Server-side QR generation via the "qrcode" npm package.

  views/qr/qr-generator.ejs already draws boarding-pass QR codes in the
  browser (qrcode CDN build + <canvas>) for on-screen preview/print/download.
  This util covers the cases the browser can't: emailing a pass as an
  attachment (services/emailService.js) and serving a downloadable PNG
  directly from the server (routes/qr.js).

  The QR payload format matches what qr-generator.ejs already writes, so a
  pass generated here scans identically on qr-scanner.ejs:
    { "type": "student", "id": <student.id>, "roll_no": "<roll_no>" }
*/

const QRCode = require('qrcode');

// -------- Build the same JSON payload the client-side generator uses --------
function buildStudentPassPayload(student) {
  return JSON.stringify({
    type: 'student',
    id: student.id,
    roll_no: student.roll_no
  });
}

// -------- Generate a QR code as a PNG data URL (for <img src="..."> / emails) --------
async function generateQRDataURL(data, options = {}) {
  try {
    return await QRCode.toDataURL(data, { width: 220, margin: 1, ...options });
  } catch (err) {
    console.error('❌ QR generation (data URL) failed:', err.message);
    throw err;
  }
}

// -------- Generate a QR code as a raw PNG buffer (for file downloads / attachments) --------
async function generateQRBuffer(data, options = {}) {
  try {
    return await QRCode.toBuffer(data, { width: 220, margin: 1, ...options });
  } catch (err) {
    console.error('❌ QR generation (buffer) failed:', err.message);
    throw err;
  }
}

// -------- Convenience: build + generate a student's boarding-pass QR in one call --------
async function generateStudentPassQR(student, format = 'dataurl') {
  const payload = buildStudentPassPayload(student);
  return format === 'buffer' ? generateQRBuffer(payload) : generateQRDataURL(payload);
}

module.exports = {
  buildStudentPassPayload,
  generateQRDataURL,
  generateQRBuffer,
  generateStudentPassQR
};
