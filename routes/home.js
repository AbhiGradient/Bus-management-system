const express = require('express');
const router = express.Router();

const db = require('../config/db');
const upload = require('../config/multer');


// =====================================================
// HELP CENTER
// URL: /home/help-center
// =====================================================

router.get('/help-center', (req, res) => {
    res.render('home/help-center');
});


// =====================================================
// SAFETY GUIDELINES
// URL: /home/safety-guidelines
// =====================================================

router.get('/safety-guidelines', (req, res) => {
    res.render('home/safety-guidelines');
});


// =====================================================
// PRIVACY POLICY
// URL: /home/privacy-policy
// =====================================================

router.get('/privacy-policy', (req, res) => {
    res.render('home/privacy-policy');
});


// =====================================================
// TERMS & CONDITIONS
// URL: /home/terms
// =====================================================

router.get('/terms', (req, res) => {
    res.render('home/terms');
});


// =====================================================
// ABOUT
// URL: /home/about
// =====================================================

router.get('/about', (req, res) => {
    res.render('home/about');
});


// =====================================================
// CONTACT PAGE
// URL: /home/contact
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
// URL: POST /home/contact
//
// Saves user messages into:
// contact_messages
// =====================================================

router.post('/contact', (req, res) => {

    const {
        name,
        email,
        subject,
        message
    } = req.body;


    // -------------------------------------------------
    // Validate required fields
    // -------------------------------------------------

    if (
        !name ||
        !email ||
        !subject ||
        !message
    ) {

        return res.redirect(
            '/home/contact?error=' +
            encodeURIComponent(
                'Please fill in all required fields.'
            )
        );

    }


    // -------------------------------------------------
    // Insert message into database
    // -------------------------------------------------

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
                    'Contact form error:',
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


            // -------------------------------------------------
            // Redirect after successful submission
            // -------------------------------------------------

            return res.redirect(
                '/home/contact?success=1'
            );

        }
    );

});


// =====================================================
// REPORT ISSUE PAGE
// URL: /home/report-issue
// =====================================================

router.get('/report-issue', (req, res) => {

    res.render('home/report-issue', {

        user: req.session.user || null,

        success: req.query.success === '1',

        error: req.query.error || null

    });

});


// =====================================================
// REPORT ISSUE FORM SUBMISSION
// URL: POST /home/report-issue
//
// Saves reports into:
// issue_reports
//
// Supports optional image attachment.
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


        // -------------------------------------------------
        // Validate required fields
        // -------------------------------------------------

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


        // -------------------------------------------------
        // Get uploaded image filename
        // -------------------------------------------------

        const attachment = req.file
            ? req.file.filename
            : null;


        // -------------------------------------------------
        // Insert issue report into database
        // -------------------------------------------------

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
                        'Issue report error:',
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


                // -------------------------------------------------
                // Redirect after successful submission
                // -------------------------------------------------

                return res.redirect(
                    '/home/report-issue?success=1'
                );

            }
        );

    }
);


// =====================================================
// ADMIN MESSAGE INBOX
// URL: /home/messages
//
// View:
// views/home/messages-inbox.ejs
//
// This page displays:
// 1. Contact Us messages
// 2. Reported Issues
//
// Only Admin can access this page.
// =====================================================

router.get('/messages', async (req, res) => {

    // -------------------------------------------------
    // ADMIN-ONLY ACCESS
    // -------------------------------------------------

    if (
        !req.session.user ||
        req.session.user.role !== 'admin'
    ) {

        return res.redirect('/login');

    }


    try {

        // =================================================
        // FETCH ISSUE REPORTS
        // =================================================

        const [reports] = await db.promise().query(`

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


        // =================================================
        // FETCH CONTACT MESSAGES
        // =================================================

        const [messages] = await db.promise().query(`

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


        // =================================================
        // RENDER MESSAGES INBOX
        //
        // File:
        // views/home/messages-inbox.ejs
        // =================================================

        return res.render(
            'home/messages-inbox',
            {
                reports,
                messages
            }
        );


    } catch (error) {

        console.error(
            'Error loading messages inbox:',
            error
        );


        return res.status(500).send(
            'Unable to load messages inbox.'
        );

    }

});


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;