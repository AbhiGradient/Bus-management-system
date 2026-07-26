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
// TERMS & CONDITIONS
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


    // Validate required fields

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


    // Insert message into database

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


            // Redirect after successful submission

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
// REPORT ISSUE FORM SUBMISSION
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


        // Validate required fields

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


        // Get uploaded image filename

        const attachment = req.file
            ? req.file.filename
            : null;


        // Insert issue report into database

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


                // Redirect after successful submission

                return res.redirect(
                    '/home/report-issue?success=1'
                );

            }
        );

    }
);


module.exports = router;