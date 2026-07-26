const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const path = require('path');
const session = require('express-session');
const methodOverride = require('method-override');

require('dotenv').config();

const app = express();


// =====================================================
// VIEW ENGINE
// =====================================================

app.set('view engine', 'ejs');

app.set(
    'views',
    path.join(__dirname, 'views')
);


// =====================================================
// MIDDLEWARE
// =====================================================

// Parse HTML form data
app.use(
    express.urlencoded({
        extended: true
    })
);


// Parse JSON requests
app.use(
    express.json()
);


// Support PUT / DELETE through HTML forms
app.use(
    methodOverride('_method')
);


// Serve files from /public
app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);


// =====================================================
// SESSION
// =====================================================

app.use(
    session({

        secret:
            process.env.SESSION_SECRET ||
            'busSecret',

        resave: false,

        saveUninitialized: false,

        cookie: {

            maxAge:
                1000 *
                60 *
                60 *
                4

        }

    })
);


// =====================================================
// MAKE LOGGED-IN USER AVAILABLE TO ALL EJS VIEWS
// =====================================================

app.use(
    (req, res, next) => {

        res.locals.user =
            req.session.user ||
            null;

        next();

    }
);


// =====================================================
// ROUTES
// =====================================================

const authRoutes =
    require('./routes/auth');

const adminRoutes =
    require('./routes/admin');

const studentRoutes =
    require('./routes/student');

const driverRoutes =
    require('./routes/driver');

const qrRoutes =
    require('./routes/qr');

const paymentRoutes =
    require('./routes/payment');

const homeRoutes =
    require('./routes/home');


// =====================================================
// ROUTE MOUNTING
// =====================================================

// Authentication
app.use(
    '/',
    authRoutes
);


// Admin
app.use(
    '/admin',
    adminRoutes
);


// Student
app.use(
    '/student',
    studentRoutes
);


// Driver
app.use(
    '/driver',
    driverRoutes
);


// QR
app.use(
    '/',
    qrRoutes
);


// Payment
app.use(
    '/payment',
    paymentRoutes
);


// Public / General Home Pages
app.use(
    '/home',
    homeRoutes
);


// =====================================================
// TRANSPORT OFFICE
// =====================================================

app.get(
    '/home/transport-office',
    (req, res) => {

        res.render(
            'home/transport-office'
        );

    }
);


// =====================================================
// ROOT
// =====================================================

app.get(
    '/',
    (req, res) => {

        res.redirect('/login');

    }
);


// =====================================================
// TEST MAIL
// =====================================================

const {
    sendMail
} = require('./config/mailer');


app.get(
    '/test-mail',
    async (req, res) => {

        try {

            const result =
                await sendMail(

                    'youremail@gmail.com',

                    'Testing Mailer',

                    '<h1>Hello!</h1><p>This email was sent from the Smart College Bus Management System.</p>'

                );


            res.json(result);


        } catch (error) {

            console.error(
                'Test mail error:',
                error
            );


            res.status(500).json({

                success: false,

                message:
                    'Failed to send test email.'

            });

        }

    }
);


// =====================================================
// 404 HANDLER
// =====================================================

app.use(
    (req, res) => {

        res
            .status(404)
            .send(`

                <h2
                    style="
                        font-family:sans-serif;
                        text-align:center;
                        margin-top:50px;
                    "
                >
                    404 - Page Not Found
                </h2>

                <p
                    style="
                        text-align:center;
                    "
                >

                    <a href="/login">
                        Go to Login
                    </a>

                </p>

            `);

    }
);


// =====================================================
// START SERVER
// =====================================================

const PORT =
    process.env.PORT ||
    3000;


app.listen(
    PORT,
    () => {

        console.log(

            `🚌 Smart College Bus Management System running at http://localhost:${PORT}`

        );

    }
);