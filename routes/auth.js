const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/db');
const { sendMail } = require('../config/mailer');
const { isValidEmail, isValidPassword } = require('../utils/validators');

// The project ships without a migrations folder, so make sure the columns
// this feature needs exist on first load. Safe to run every restart.
(async () => {
  try {
    await db.query('ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL');
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') console.error('reset_token column check failed:', err.message);
  }
  try {
    await db.query('ALTER TABLE users ADD COLUMN reset_token_expires DATETIME NULL');
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') console.error('reset_token_expires column check failed:', err.message);
  }
})();

// Reset links are valid for 30 minutes
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

// Raw token goes in the emailed link; only its hash is ever stored in the DB
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// -------- GET: Login Page --------
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect(`/${req.session.user.role}/dashboard`);
  }
  res.render('auth/login', { error: null });
});

// -------- POST: Handle Login --------
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? AND role = ? LIMIT 1',
      [email, role]
    );

    if (rows.length === 0) {
      return res.render('auth/login', { error: 'Invalid email or role. Please try again.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render('auth/login', { error: 'Incorrect password. Please try again.' });
    }

    // Save minimal user info in session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.redirect(`/${user.role}/dashboard`);
  } catch (err) {
    console.error(err);
    res.render('auth/login', { error: 'Something went wrong. Please try again later.' });
  }
});

// -------- GET: Forgot Password Page --------
router.get('/auth/forgot-password', (req, res) => {
  res.render('auth/forgot-password', { error: null, success: null });
});

// -------- POST: Send Reset Link --------
router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!isValidEmail(email)) {
    return res.render('auth/forgot-password', { error: 'Please enter a valid email address.', success: null });
  }

  // Always show the same success message whether or not the account exists,
  // so this form can't be used to find out which emails are registered.
  const genericSuccess = 'If that email is registered, a password reset link has been sent to it.';

  try {
    const [rows] = await db.query('SELECT id, name, email FROM users WHERE email = ? LIMIT 1', [email.trim()]);

    if (rows.length > 0) {
      const user = rows[0];
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await db.query(
        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
        [hashToken(token), expires, user.id]
      );

      const resetLink = `${req.protocol}://${req.get('host')}/auth/reset-password/${token}`;

      await sendMail(
        user.email,
        'Reset your CampusTransit password',
        `<p>Hi ${user.name},</p>
         <p>We received a request to reset your CampusTransit password. This link is valid for 30 minutes:</p>
         <p><a href="${resetLink}">${resetLink}</a></p>
         <p>If you didn't request this, you can safely ignore this email.</p>`
      );
    }

    res.render('auth/forgot-password', { error: null, success: genericSuccess });
  } catch (err) {
    console.error(err);
    res.render('auth/forgot-password', { error: 'Something went wrong. Please try again later.', success: null });
  }
});

// -------- GET: Reset Password Page --------
router.get('/auth/reset-password/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1',
      [hashToken(token)]
    );

    if (rows.length === 0) {
      return res.render('auth/reset-password', {
        token,
        valid: false,
        error: 'This reset link is invalid or has expired. Please request a new one.',
        success: null
      });
    }

    res.render('auth/reset-password', { token, valid: true, error: null, success: null });
  } catch (err) {
    console.error(err);
    res.render('auth/reset-password', {
      token,
      valid: false,
      error: 'Something went wrong. Please try again later.',
      success: null
    });
  }
});

// -------- POST: Handle Reset Password --------
router.post('/auth/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1',
      [hashToken(token)]
    );

    if (rows.length === 0) {
      return res.render('auth/reset-password', {
        token,
        valid: false,
        error: 'This reset link is invalid or has expired. Please request a new one.',
        success: null
      });
    }

    if (!isValidPassword(password)) {
      return res.render('auth/reset-password', {
        token,
        valid: true,
        error: 'Password must be at least 6 characters long.',
        success: null
      });
    }

    if (password !== confirmPassword) {
      return res.render('auth/reset-password', {
        token,
        valid: true,
        error: 'Passwords do not match.',
        success: null
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = rows[0];

    await db.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.render('auth/reset-password', {
      token,
      valid: false,
      error: null,
      success: 'Your password has been reset. You can now sign in with your new password.'
    });
  } catch (err) {
    console.error(err);
    res.render('auth/reset-password', {
      token,
      valid: true,
      error: 'Something went wrong. Please try again later.',
      success: null
    });
  }
});

// -------- GET: Logout --------
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;