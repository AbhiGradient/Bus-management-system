const nodemailer = require('nodemailer');
require('dotenv').config();

const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',

    port: smtpPort,

    secure: smtpPort === 465,

    family: 4,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },

    connectionTimeout: 30000,

    greetingTimeout: 30000,

    socketTimeout: 30000
});


// =====================================================
// VERIFY SMTP CONNECTION
// =====================================================

transporter.verify((error, success) => {

    if (error) {

        console.error(
            '❌ Mailer connection failed:',
            error.code || '',
            error.message
        );

    } else {

        console.log(
            '✅ Mailer ready to send emails'
        );

    }

});


// =====================================================
// SEND EMAIL
// =====================================================

async function sendMail(to, subject, html) {

    try {

        if (!to) {

            throw new Error(
                'Recipient email address is missing'
            );

        }

        if (!process.env.SMTP_USER) {

            throw new Error(
                'SMTP_USER is not configured'
            );

        }

        if (!process.env.SMTP_PASS) {

            throw new Error(
                'SMTP_PASS is not configured'
            );

        }


        const info = await transporter.sendMail({

            from:
                `"Smart College Bus" <${process.env.SMTP_USER}>`,

            to: to,

            subject: subject,

            html: html

        });


        console.log(
            '✅ Email sent successfully to:',
            to
        );

        console.log(
            '📨 Message ID:',
            info.messageId
        );


        return {

            success: true,

            messageId:
                info.messageId

        };


    } catch (error) {

        console.error(
            '❌ Email send failed:',
            error.code || '',
            error.message
        );


        return {

            success: false,

            error:
                error.message

        };

    }

}


module.exports = {

    transporter,

    sendMail

};