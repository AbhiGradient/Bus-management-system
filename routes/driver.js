const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// -------- Auth guard: only logged-in drivers --------
function isDriver(req, res, next) {
  if (req.session.user && req.session.user.role === 'driver') return next();
  return res.redirect('/login');
}
router.use(isDriver);

// ================= DASHBOARD =================
router.get('/dashboard', async (req, res) => {
  try {
    const [[bus]] = await db.query('SELECT * FROM buses WHERE driver_id=?', [req.session.user.id]);

    let students = [];
    if (bus) {
      const [rows] = await db.query(`
        SELECT s.roll_no, s.department, u.name, u.phone
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.bus_id = ?
        ORDER BY u.name
      `, [bus.id]);
      students = rows;
    }

    res.render('driver-dashboard', { bus, students });
  } catch (err) {
    console.error(err);
    res.send('Error loading dashboard');
  }
});

// ================= PROFILE =================
router.get('/profile', async (req, res) => {
  try {
    const [[user]] = await db.query('SELECT * FROM users WHERE id=?', [req.session.user.id]);
    res.render('profile', { profile: user, message: null });
  } catch (err) {
    console.error(err);
    res.send('Error loading profile');
  }
});

router.put('/profile', async (req, res) => {
  const { name, phone, password } = req.body;
  try {
    if (password && password.trim() !== '') {
      const hashed = await bcrypt.hash(password, 10);
      await db.query('UPDATE users SET name=?, phone=?, password=? WHERE id=?', [name, phone, hashed, req.session.user.id]);
    } else {
      await db.query('UPDATE users SET name=?, phone=? WHERE id=?', [name, phone, req.session.user.id]);
    }
    req.session.user.name = name;
    const [[user]] = await db.query('SELECT * FROM users WHERE id=?', [req.session.user.id]);
    res.render('profile', { profile: user, message: 'Profile updated successfully!' });
  } catch (err) {
    console.error(err);
    res.redirect('/driver/profile');
  }
});

module.exports = router;
