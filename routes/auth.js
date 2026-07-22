const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

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
  } 
 catch (err) {
    console.error("LOGIN ERROR:", err);
    res.render('auth/login', { error: err.message });
}
});   // <-- THIS LINE IS MISSING

// -------- GET: Logout --------
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;