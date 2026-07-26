const nodemailer = require('nodemailer');
const dns = require('dns');
require('dotenv').config();

// Prefer IPv4 over IPv6
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },

    tls: {
        servername: 'smtp.gmail.com',
        rejectUnauthorized: false
    },

    connectionTimeout: 60000,
    greetingTimeout: 60000,
    socketTimeout: 60000
});

// Verify SMTP connection
(async () => {
    try {
        await transporter.verify();
        console.log('✅ Mailer connected successfully');
    } catch (err) {
        console.error('❌ Mailer connection failed');
        console.error(err);
    }
})();

// Send email
async function sendMail(to, subject, html) {
    try {
        const info = await transporter.sendMail({
            from: `"CampusTransit" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });

        console.log(`✅ Email sent to ${to}`);
        console.log(`📨 Message ID: ${info.messageId}`);

        return {
            success: true,
            messageId: info.messageId
        };
    } catch (err) {
        console.error('❌ Email send failed');
        console.error(err);

        return {
            success: false,
            error: err.message
        };
    }
}

module.exports = {
    transporter,
    sendMail
};