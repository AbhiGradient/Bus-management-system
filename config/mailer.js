const nodemailer = require('nodemailer');
const dns = require('dns');

require('dotenv').config();

// =====================================================
// FORCE IPv4
// Helps avoid SMTP connection issues on some
// hosting environments where IPv6 is unreliable.
// =====================================================

dns.setDefaultResultOrder('ipv4first');


// =====================================================
// CREATE SMTP TRANSPORTER
// Gmail SMTP
// =====================================================

const transporter = nodemailer.createTransport({

    host: 'smtp.gmail.com',

    // Gmail SMTP over SSL
    port: 465,

    secure: true,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },

    // Reasonable connection timeouts
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000

});


// =====================================================
// VERIFY SMTP CONNECTION
// =====================================================

async function verifyMailer() {

    try {

        await transporter.verify();

        console.log(
            '✅ Mailer connected successfully'
        );

        return true;

    } catch (error) {

        console.error(
            '❌ Mailer connection failed'
        );

        console.error(
            error
        );

        return false;

    }

}


// =====================================================
// SEND EMAIL
// =====================================================

async function sendMail(
    to,
    subject,
    html
) {

    try {

        const info = await transporter.sendMail({

            from:
                `"CampusTransit" <${process.env.SMTP_USER}>`,

            to,

            subject,

            html

        });


        console.log(
            `✅ Email sent to ${to}`
        );

        console.log(
            `📨 Message ID: ${info.messageId}`
        );


        return {

            success: true,

            messageId:
                info.messageId

        };


    } catch (error) {

        console.error(
            '❌ Email send failed'
        );

        console.error(
            error
        );


        return {

            success: false,

            error:
                error.message

        };

    }

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    transporter,

    verifyMailer,

    sendMail

};