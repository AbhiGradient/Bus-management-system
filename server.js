const express = require('express');
const path = require('path');
const session = require('express-session');
const methodOverride = require('method-override');
require('dotenv').config();

const app = express();

// ------- View engine -------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ------- Middleware -------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'busSecret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 4 } // 4 hours
}));

// Make logged-in user available in every view
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ------- Routes -------
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const driverRoutes = require('./routes/driver');
const qrRoutes = require('./routes/qr');
const paymentRoutes =
    require('./routes/payment');

app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/student', studentRoutes);
app.use('/driver', driverRoutes);
app.use('/', qrRoutes);
app.use(
    '/payment',
    paymentRoutes
);

// Root -> login page
app.get('/', (req, res) => res.redirect('/login'));

const { sendMail } = require('./config/mailer');

app.get('/test-mail', async (req, res) => {
    const result = await sendMail(
        'youremail@gmail.com',
        'Testing Mailer',
        '<h1>Hello!</h1><p>This email was sent from the Smart College Bus Management System.</p>'
    );

    res.json(result);
});

// ------- 404 handler -------
app.use((req, res) => {
  res.status(404).send('<h2 style="font-family:sans-serif;text-align:center;margin-top:50px;">404 - Page Not Found</h2><p style="text-align:center;"><a href="/login">Go to Login</a></p>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚌 Smart College Bus Management System running at http://localhost:${PORT}`);
});

