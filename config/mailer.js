const nodemailer = require('nodemailer');
require('dotenv').config();

const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: smtpPort,
    secure: smtpPort === 465,
    requireTLS: smtpPort !== 465,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },

    family: 4,

    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,

    tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    }
});

(async () => {
    try {
        await transporter.verify();
        console.log('✅ Mailer connected successfully');
    } catch (err) {
        console.error('❌ Mailer connection failed');
        console.error(err);
    }
})();

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