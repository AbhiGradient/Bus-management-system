const express = require('express');
const router = express.Router();

const db = require('../config/db');
const upload = require('../config/multer');


// =====================================================
// HELP CENTER
// =====================================================

router.get('/help-center', (req, res) => {
    res.render('home/help-center');
});


// =====================================================
// SAFETY GUIDELINES
// =====================================================

router.get('/safety-guidelines', (req, res) => {
    res.render('home/safety-guidelines');
});


// =====================================================
// PRIVACY POLICY
// =====================================================

router.get('/privacy-policy', (req, res) => {
    res.render('home/privacy-policy');
});


// =====================================================
// TERMS
// =====================================================

router.get('/terms', (req, res) => {
    res.render('home/terms');
});


// =====================================================
// ABOUT
// =====================================================

router.get('/about', (req, res) => {
    res.render('home/about');
});


// =====================================================
// CONTACT PAGE
// =====================================================

router.get('/contact', (req, res) => {

    res.render('home/contact', {
        user: req.session.user || null,
        success: req.query.success === '1',
        error: req.query.error || null
    });

});


// =====================================================
// CONTACT FORM SUBMISSION
// =====================================================

router.post('/contact', (req, res) => {

    const {
        name,
        email,
        subject,
        message
    } = req.body;


    if (!name || !email || !subject || !message) {

        return res.redirect(
            '/home/contact?error=' +
            encodeURIComponent(
                'Please fill in all required fields.'
            )
        );

    }


    const sql = `
        INSERT INTO contact_messages
        (
            name,
            email,
            subject,
            message
        )
        VALUES (?, ?, ?, ?)
    `;


    db.query(
        sql,
        [
            name,
            email,
            subject,
            message
        ],
        (err, result) => {

            if (err) {

                console.error(
                    'Contact form database error:',
                    err
                );

                return res.redirect(
                    '/home/contact?error=' +
                    encodeURIComponent(
                        'Something went wrong while sending your message.'
                    )
                );

            }


            console.log(
                'Contact message saved successfully. ID:',
                result.insertId
            );


            return res.redirect(
                '/home/contact?success=1'
            );

        }
    );

});


// =====================================================
// REPORT ISSUE PAGE
// =====================================================

router.get('/report-issue', (req, res) => {

    res.render('home/report-issue', {

        user: req.session.user || null,

        success: req.query.success === '1',

        error: req.query.error || null

    });

});


// =====================================================
// REPORT ISSUE SUBMISSION
// =====================================================

router.post(
    '/report-issue',
    upload.single('attachment'),
    (req, res) => {

        const {
            issueType,
            busRoute,
            priority,
            subject,
            description,
            contactName,
            contactNumber
        } = req.body;


        if (
            !issueType ||
            !priority ||
            !subject ||
            !description ||
            !contactName ||
            !contactNumber
        ) {

            return res.redirect(
                '/home/report-issue?error=' +
                encodeURIComponent(
                    'Please fill in all required fields.'
                )
            );

        }


        const attachment = req.file
            ? req.file.filename
            : null;


        const sql = `
            INSERT INTO issue_reports
            (
                issue_type,
                bus_route,
                priority,
                subject,
                description,
                attachment,
                contact_name,
                contact_number
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;


        db.query(
            sql,
            [
                issueType,
                busRoute || null,
                priority,
                subject,
                description,
                attachment,
                contactName,
                contactNumber
            ],
            (err, result) => {

                if (err) {

                    console.error(
                        'Issue report database error:',
                        err
                    );

                    return res.redirect(
                        '/home/report-issue?error=' +
                        encodeURIComponent(
                            'Unable to submit your report. Please try again.'
                        )
                    );

                }


                console.log(
                    'Issue report created successfully. ID:',
                    result.insertId
                );


                return res.redirect(
                    '/home/report-issue?success=1'
                );

            }
        );

    }
);


// =====================================================
// ADMIN MESSAGE INBOX
// URL:
// /home/messages-inbox
// =====================================================

// =====================================================
// ADMIN MESSAGE INBOX
// =====================================================

router.get('/messages-inbox', async (req, res) => {

    // Admin-only access
    if (
        !req.session.user ||
        req.session.user.role !== 'admin'
    ) {
        return res.redirect('/login');
    }

    try {

        console.log('📨 Loading admin message inbox...');

        // =================================================
        // GET ISSUE REPORTS
        // =================================================

        const [reports] = await db.query(`
            SELECT
                id,
                issue_type AS issueType,
                bus_route AS busRoute,
                priority,
                subject,
                description,
                attachment AS attachmentUrl,
                contact_name AS contactName,
                contact_number AS contactNumber,
                status,
                created_at AS createdAt
            FROM issue_reports
            ORDER BY created_at DESC
        `);

        console.log(`✅ Issue reports loaded: ${reports.length}`);


        // =================================================
        // GET CONTACT MESSAGES
        // =================================================

        const [messages] = await db.query(`
            SELECT
                id,
                name,
                email,
                subject,
                message,
                status,
                created_at AS createdAt
            FROM contact_messages
            ORDER BY created_at DESC
        `);

        console.log(`✅ Contact messages loaded: ${messages.length}`);


        // =================================================
        // RENDER INBOX
        // =================================================

        res.render('home/messages-inbox', {
            reports: reports || [],
            messages: messages || []
        });


    } catch (error) {

        console.error('========================================');
        console.error('❌ MESSAGE INBOX ERROR');
        console.error('========================================');
        console.error(error);
        console.error('========================================');

        res.status(500).send(`
            <h1>Internal Server Error</h1>
            <h3>Message Inbox Error</h3>
            <pre>${error.message}</pre>
        `);

    }

});


module.exports = router;