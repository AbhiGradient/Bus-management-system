const nodemailer = require('nodemailer');
require('dotenv').config();

// -------- Transporter (Gmail SMTP by default) --------
const port = Number(process.env.SMTP_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port,
  secure: port === 465, // true for 465, false for 587/STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  // Without these, a blocked/unreachable SMTP server hangs indefinitely
  // instead of failing — which is what looked like "infinite spinning".
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
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
    const info = await Promise.race([
      transporter.sendMail({
        from: `"College Bus Management" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timed out after 15s — check SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS in .env')), 15000)
      )
    ]);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Email send failed:', err.code || '', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { transporter, sendMail };