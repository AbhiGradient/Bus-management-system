const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// -------- Auth guard: only logged-in students --------
const isStudent = require('../middleware/studentAuth');
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

    res.render('student/student-dashboard', { student, bus, feeSummary, recentRequests });
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
    res.render('student/requests', { requests });
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
// ================= FEE STATUS =================
router.get('/fees-status', async (req, res) => {
  try {
    // Get logged-in student's record
    const student = await getStudentRecord(req.session.user.id);

    if (!student) {
      return res.send('Student record not found');
    }

    // Get all fee records for this student
    const [fees] = await db.query(
      `
      SELECT *
      FROM fees
      WHERE student_id = ?
      ORDER BY due_date DESC
      `,
      [student.id]
    );

    // Calculate totals
    const totalAmount = fees.reduce(
      (sum, fee) => sum + Number(fee.amount),
      0
    );

    const paidAmount = fees
      .filter(fee => fee.status === 'paid')
      .reduce(
        (sum, fee) => sum + Number(fee.amount),
        0
      );

    const unpaidAmount = fees
      .filter(fee => fee.status === 'unpaid')
      .reduce(
        (sum, fee) => sum + Number(fee.amount),
        0
      );

    // Send everything to EJS
    res.render('student/fees-status', {
      student,
      fees,
      totalAmount,
      paidAmount,
      unpaidAmount
    });

  } catch (err) {
    console.error('Error loading fee status:', err);
    res.send('Error loading fee status');
  }
});
// ================= PAYMENT HISTORY =================
router.get('/payment-history', async (req, res) => {
  try {
    const student = await getStudentRecord(req.session.user.id);

    const [fees] = await db.query(
      'SELECT * FROM fees WHERE student_id=? ORDER BY paid_date DESC',
      [student ? student.id : 0]
    );

    res.render('student/payment-history', {
      fees
    });

  } catch (err) {
    console.error(err);
    res.send('Error loading payment history');
  }
});
// ================= PROFILE =================
router.get('/profile', async (req, res) => {
  try {

    const [[user]] = await db.query(
      'SELECT * FROM users WHERE id=?',
      [req.session.user.id]
    );

    const student = await getStudentRecord(req.session.user.id);

    res.render('student/profile', {
      user,
      student
    });

  } catch (err) {
    console.error(err);
    res.send('Error loading profile');
  }
});
// ================= UPDATE PROFILE =================
router.post('/profile', async (req, res) => {
  try {

    const {
      name,
      email,
      phone,
      address
    } = req.body;

    // Update users table
    await db.query(
      `
      UPDATE users
      SET
        name = ?,
        email = ?,
        phone = ?
      WHERE id = ?
      `,
      [
        name,
        email,
        phone,
        req.session.user.id
      ]
    );

    // Update students table
    await db.query(
      `
      UPDATE students
      SET
        address = ?
      WHERE user_id = ?
      `,
      [
        address,
        req.session.user.id
      ]
    );

    // Update session
    req.session.user.name = name;
    req.session.user.email = email;

    res.redirect('/student/profile');

  } catch (err) {
    console.error(err);
    res.send('Error updating profile');
  }
});
// ================= BUS DETAILS =================
router.post('/request-bus-change', async (req, res) => {
  try {

    const student = await getStudentRecord(req.session.user.id);

    const { requested_bus_id, message } = req.body;

    // Find requested bus
    const [[requestedBus]] = await db.query(
      'SELECT bus_number, route_name FROM buses WHERE id = ?',
      [requested_bus_id]
    );

    const subject = 'Bus Change Request';

    const fullMessage =
`Requested Bus: ${requestedBus.bus_number}
Route: ${requestedBus.route_name}

Reason:
${message}`;

    await db.query(
      `INSERT INTO requests
      (student_id, subject, message, status)
      VALUES (?, ?, ?, 'pending')`,
      [student.id, subject, fullMessage]
    );

    res.redirect('/student/requests');

  } catch (err) {
    console.error(err);
    res.send('Error submitting request');
  }
});
router.get('/bus-details', async (req, res) => {
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

    res.render('student/bus-details', {
      student,
      bus,
      mySeatNo: null
    });

  } catch (err) {
    console.error(err);
    res.send('Error loading bus details');
  }
});

// ==============================
// Seat Management
// ==============================
router.get('/seat-management', async (req, res) => {
  try {
    const student = await getStudentRecord(req.session.user.id);

    if (!student || !student.bus_id) {
      return res.render('student/seat-management', {
        user: req.session.user,
        student,
        buses: [],
        selectedBus: null,
        allocatedStudents: []
      });
    }

    // Get bus details
    const [[selectedBus]] = await db.query(
      'SELECT * FROM buses WHERE id = ?',
      [student.bus_id]
    );

    // Get all students on this bus
    const [allocatedStudents] = await db.query(`
      SELECT
        s.*,
        u.name
      FROM students s
      JOIN users u
        ON s.user_id = u.id
      WHERE s.bus_id = ?
      ORDER BY s.id
    `, [student.bus_id]);

    res.render('student/seat-management', {
      user: req.session.user,
      student,
      buses: [],
      selectedBus,
      allocatedStudents
    });

  } catch (err) {
    console.error(err);
    res.send('Error loading seat management');
  }
});
// ==============================
// Request Bus Change
// ==============================
router.get('/request-bus-change', async (req, res) => {
  try {

    const student = await getStudentRecord(req.session.user.id);

    let bus = null;

    if (student && student.bus_id) {
      const [[busRow]] = await db.query(
        'SELECT * FROM buses WHERE id = ?',
        [student.bus_id]
      );

      bus = busRow;
    }

    const [buses] = await db.query(
      'SELECT * FROM buses WHERE status = "active" ORDER BY bus_number'
    );

    res.render('student/request-bus-change', {
      student,
      bus,
      buses
    });

  } catch (err) {
    console.error(err);
    res.send('Error loading bus change page');
  }
});
// ==============================
// Notifications
// ==============================

router.get('/notifications', async (req, res) => {

    try {

        const student = await getStudentRecord(req.session.user.id);

        let notifications = [];

        if(student && student.bus_id){

            const [rows] = await db.query(`
                SELECT *
                FROM notifications
                WHERE audience='all'
                   OR audience='students'
                   OR (audience='bus' AND bus_id=?)
                ORDER BY created_at DESC
            `,[student.bus_id]);

            notifications = rows;

        }else{

            const [rows] = await db.query(`
                SELECT *
                FROM notifications
                WHERE audience='all'
                   OR audience='students'
                ORDER BY created_at DESC
            `);

            notifications = rows;

        }

        res.render('student/notifications',{
            notifications
        });

    } catch(err){

        console.error(err);
        res.send(err.message);

    }

});
module.exports = router;
