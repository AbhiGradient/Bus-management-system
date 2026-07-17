const nodemailer = require('nodemailer');
require('dotenv').config();

// -------- Transporter (Gmail SMTP by default) --------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for port 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify connection on startup so config problems show up immediately
transporter.verify((err) => {
  if (err) {
    console.error('❌ Mailer connection failed:', err.message);
  } else {
    console.log('✅ Mailer ready to send emails');
  }
});

// -------- Send a generic email --------
// to      : recipient email address
// subject : email subject line
// html    : HTML body content
const sendMail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"College Bus Management" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { transporter, sendMail };