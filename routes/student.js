const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// -------- Auth guard: only logged-in students --------
function isStudent(req, res, next) {
  if (req.session.user && req.session.user.role === 'student') return next();
  return res.redirect('/login');
}
router.use(isStudent);

// Helper: get the students.id row that belongs to the logged-in user
async function getStudentRecord(userId) {
  const [[student]] = await db.query('SELECT * FROM students WHERE user_id=?', [userId]);
  return student;
}

// ================= DASHBOARD =================
router.get('/dashboard', async (req, res) => {
  try {
    const student = await getStudentRecord(req.session.user.id);

    let bus = null;
    if (student && student.bus_id) {
      const [[busRow]] = await db.query(`
        SELECT b.*, u.name AS driver_name, u.phone AS driver_phone
        FROM buses b
        LEFT JOIN users u ON b.driver_id = u.id
        WHERE b.id = ?
      `, [student.bus_id]);
      bus = busRow;
    }

    const [[feeSummary]] = await db.query(
      "SELECT COUNT(*) AS unpaidCount FROM fees WHERE student_id=? AND status='unpaid'",
      [student ? student.id : 0]
    );

    const [recentRequests] = await db.query(
      'SELECT * FROM requests WHERE student_id=? ORDER BY created_at DESC LIMIT 5',
      [student ? student.id : 0]
    );

    res.render('student-dashboard', { student, bus, feeSummary, recentRequests });
  } catch (err) {
    console.error(err);
    res.send('Error loading dashboard');
  }
});

// ================= REQUESTS =================
router.get('/requests', async (req, res) => {
  try {
    const student = await getStudentRecord(req.session.user.id);
    const [requests] = await db.query(
      'SELECT * FROM requests WHERE student_id=? ORDER BY created_at DESC',
      [student ? student.id : 0]
    );
    res.render('requests', { requests });
  } catch (err) {
    console.error(err);
    res.send('Error loading requests');
  }
});

router.post('/requests', async (req, res) => {
  const { subject, message } = req.body;
  try {
    const student = await getStudentRecord(req.session.user.id);
    await db.query(
      'INSERT INTO requests (student_id, subject, message, status) VALUES (?, ?, ?, "pending")',
      [student.id, subject, message]
    );
    res.redirect('/student/requests');
  } catch (err) {
    console.error(err);
    res.redirect('/student/requests');
  }
});

// ================= FEES =================
router.get('/fees', async (req, res) => {
  try {
    const student = await getStudentRecord(req.session.user.id);
    const [fees] = await db.query(
      'SELECT * FROM fees WHERE student_id=? ORDER BY due_date DESC',
      [student ? student.id : 0]
    );
    res.render('fees', { fees, students: [] });
  } catch (err) {
    console.error(err);
    res.send('Error loading fees');
  }
});

// ================= PROFILE =================
router.get('/profile', async (req, res) => {
  try {
    const [[user]] = await db.query('SELECT * FROM users WHERE id=?', [req.session.user.id]);
    const student = await getStudentRecord(req.session.user.id);
    const profile = { ...user, ...student, name: user.name, email: user.email };
    res.render('profile', { profile, message: null });
  } catch (err) {
    console.error(err);
    res.send('Error loading profile');
  }
});

router.put('/profile', async (req, res) => {
  const { name, phone, password, department, year, address } = req.body;
  try {
    if (password && password.trim() !== '') {
      const hashed = await bcrypt.hash(password, 10);
      await db.query('UPDATE users SET name=?, phone=?, password=? WHERE id=?', [name, phone, hashed, req.session.user.id]);
    } else {
      await db.query('UPDATE users SET name=?, phone=? WHERE id=?', [name, phone, req.session.user.id]);
    }
    await db.query('UPDATE students SET department=?, year=?, address=? WHERE user_id=?', [department, year, address, req.session.user.id]);

    req.session.user.name = name;
    const [[user]] = await db.query('SELECT * FROM users WHERE id=?', [req.session.user.id]);
    const student = await getStudentRecord(req.session.user.id);
    const profile = { ...user, ...student, name: user.name, email: user.email };
    res.render('profile', { profile, message: 'Profile updated successfully!' });
  } catch (err) {
    console.error(err);
    res.redirect('/student/profile');
  }
});

module.exports = router;
