/*
  services/emailService.js
  Templated transactional emails for the app. Deliberately thin: all SMTP
  setup already lives in config/mailer.js (transporter + sendMail), so this
  file only builds HTML bodies and calls that existing sendMail — it does
  not create a second transporter.
*/

const { sendMail } = require('../config/mailer');
const { formatCurrency, formatDate } = require('../utils/helpers');
const { generateStudentPassQR } = require('../utils/generatorQR');

// -------- Shared wrapper so every email in the app looks the same --------
function wrapTemplate(title, bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      <div style="background: #1f2937; color: #fff; padding: 16px 24px;">
        <h2 style="margin: 0; font-size: 18px;">🚌 CampusTransit</h2>
      </div>
      <div style="padding: 24px;">
        <h3 style="margin-top: 0;">${title}</h3>
        ${bodyHtml}
      </div>
      <div style="background: #f9fafb; padding: 12px 24px; font-size: 12px; color: #6b7280;">
        This is an automated message from the Smart College Bus Management System. Please do not reply.
      </div>
    </div>
  `;
}

// -------- Welcome email when admin creates a student/driver account --------
// (routes/admin.js POST /students already hashes a password before insert;
// this is called right after with the PLAIN password, before it's discarded.)
async function sendWelcomeEmail(user, plainPassword) {
  const html = wrapTemplate('Welcome to CampusTransit', `
    <p>Hi ${user.name},</p>
    <p>Your ${user.role} account has been created. You can now log in with the credentials below:</p>
    <p>
      <strong>Email:</strong> ${user.email}<br/>
      <strong>Temporary Password:</strong> ${plainPassword}
    </p>
    <p>We recommend changing your password after your first login from your Profile page.</p>
  `);
  return sendMail(user.email, 'Welcome to CampusTransit', html);
}

// -------- Fee payment receipt (services/paymentService.js calls this after verification) --------
async function sendPaymentReceipt(user, fee, payment) {
  const html = wrapTemplate('Payment Receipt', `
    <p>Hi ${user.name},</p>
    <p>We've received your transport fee payment. Here are the details:</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
      <tr><td style="padding: 4px 0; color: #6b7280;">Amount</td><td style="text-align: right;">${formatCurrency(payment.amount)}</td></tr>
      <tr><td style="padding: 4px 0; color: #6b7280;">Payment ID</td><td style="text-align: right;">${payment.razorpay_payment_id}</td></tr>
      <tr><td style="padding: 4px 0; color: #6b7280;">Date</td><td style="text-align: right;">${formatDate(new Date())}</td></tr>
      <tr><td style="padding: 4px 0; color: #6b7280;">Status</td><td style="text-align: right; color: #16a34a;">Paid</td></tr>
    </table>
  `);
  return sendMail(user.email, 'Payment Receipt - CampusTransit', html);
}

// -------- Fee reminder (used for unpaid fees, e.g. a scheduled reminder job) --------
async function sendFeeReminder(user, fee) {
  const html = wrapTemplate('Transport Fee Due', `
    <p>Hi ${user.name},</p>
    <p>This is a reminder that your transport fee of <strong>${formatCurrency(fee.amount)}</strong> is due on <strong>${formatDate(fee.due_date)}</strong>.</p>
    <p>Please log in to CampusTransit and clear it from the Fees page to avoid disruption to your bus service.</p>
  `);
  return sendMail(user.email, 'Reminder: Transport Fee Due', html);
}

// -------- Notify a student their transport request was approved/rejected --------
async function sendRequestStatusUpdate(user, request) {
  const isApproved = request.status === 'approved';
  const html = wrapTemplate('Request Update', `
    <p>Hi ${user.name},</p>
    <p>Your request "<strong>${request.subject}</strong>" has been
      <strong style="color: ${isApproved ? '#16a34a' : '#dc2626'};">${request.status}</strong>.
    </p>
  `);
  return sendMail(user.email, `Request ${request.status === 'approved' ? 'Approved' : 'Updated'} - CampusTransit`, html);
}

// -------- Email a student's boarding pass with the QR embedded inline --------
// Uses utils/generatorQR.js so the same payload format the driver scans
// (qr-scanner.ejs) can also be delivered by email as a fallback.
async function sendBoardingPassEmail(user, student) {
  const qrDataUrl = await generateStudentPassQR(student, 'dataurl');
  const html = wrapTemplate('Your Boarding Pass', `
    <p>Hi ${user.name},</p>
    <p>Here is your bus boarding pass. Show this QR code to your driver when boarding.</p>
    <div style="text-align: center; margin: 16px 0;">
      <img src="${qrDataUrl}" alt="Boarding Pass QR" style="width: 200px; height: 200px;" />
    </div>
    <p style="text-align: center; color: #6b7280;">Roll No: ${student.roll_no}</p>
  `);
  return sendMail(user.email, 'Your CampusTransit Boarding Pass', html);
}

module.exports = {
  sendWelcomeEmail,
  sendPaymentReceipt,
  sendFeeReminder,
  sendRequestStatusUpdate,
  sendBoardingPassEmail
};
