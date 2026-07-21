const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// -------- Auth guard: only logged-in admins --------
const isAdmin = require('../middleware/adminAuth');

router.use(isAdmin);

// ================= DASHBOARD =================
router.get('/dashboard', async (req, res) => {
  try {
    const [[{ totalBuses }]] = await db.query('SELECT COUNT(*) AS totalBuses FROM buses');
    const [[{ totalStudents }]] = await db.query('SELECT COUNT(*) AS totalStudents FROM students');
    const [[{ totalDrivers }]] = await db.query("SELECT COUNT(*) AS totalDrivers FROM users WHERE role='driver'");
    const [[{ pendingRequests }]] = await db.query("SELECT COUNT(*) AS pendingRequests FROM requests WHERE status='pending'");
    const [[{ unpaidFees }]] = await db.query("SELECT COUNT(*) AS unpaidFees FROM fees WHERE status='unpaid'");

    res.render('admin/admin-dashboard', {
      stats: { totalBuses, totalStudents, totalDrivers, pendingRequests, unpaidFees }
    });
  } catch (err) {
    console.error(err);
    res.send('Error loading dashboard');
  }
});

// ================= BUSES =================
router.get('/buses', async (req, res) => {
  try {
    const [buses] = await db.query(`
      SELECT b.*, u.name AS driver_name
      FROM buses b
      LEFT JOIN users u ON b.driver_id = u.id
      ORDER BY b.id DESC
    `);
    const [drivers] = await db.query("SELECT id, name FROM users WHERE role='driver'");
    res.render('admin/buses', { buses, drivers, error: null });
  } catch (err) {
    console.error(err);
    res.send('Error loading buses');
  }
});

router.post('/buses', async (req, res) => {
  const { bus_number, route_name, capacity, driver_id, status } = req.body;
  try {
    await db.query(
      'INSERT INTO buses (bus_number, route_name, capacity, driver_id, status) VALUES (?, ?, ?, ?, ?)',
      [bus_number, route_name, capacity, driver_id || null, status || 'active']
    );
    res.redirect('/admin/buses');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/buses');
  }
});

router.put('/buses/:id', async (req, res) => {
  const { bus_number, route_name, capacity, driver_id, status } = req.body;
  try {
    await db.query(
      'UPDATE buses SET bus_number=?, route_name=?, capacity=?, driver_id=?, status=? WHERE id=?',
      [bus_number, route_name, capacity, driver_id || null, status, req.params.id]
    );
    res.redirect('/admin/buses');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/buses');
  }
});

router.delete('/buses/:id', async (req, res) => {
  try {
    await db.query('UPDATE students SET bus_id = NULL WHERE bus_id = ?', [req.params.id]);
    await db.query('DELETE FROM buses WHERE id = ?', [req.params.id]);
    res.redirect('/admin/buses');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/buses');
  }
});

// ================= STUDENTS =================
router.get('/students', async (req, res) => {
  try {
    const [students] = await db.query(`
      SELECT s.*, u.name, u.email, u.phone, b.bus_number
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN buses b ON s.bus_id = b.id
      ORDER BY s.id DESC
    `);
    res.render('admin/students', { students, error: null });
  } catch (err) {
    console.error(err);
    res.send('Error loading students');
  }
});

router.post('/students', async (req, res) => {
  const { name, email, phone, password, roll_no, department, year, address } = req.body;
  try {
    const hashed = await bcrypt.hash(password || 'student123', 10);
    const [userResult] = await db.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, "student", ?)',
      [name, email, hashed, phone]
    );
    await db.query(
      'INSERT INTO students (user_id, roll_no, department, year, address) VALUES (?, ?, ?, ?, ?)',
      [userResult.insertId, roll_no, department, year, address]
    );
    res.redirect('/admin/students');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/students');
  }
});

router.put('/students/:id', async (req, res) => {
  const { name, email, phone, roll_no, department, year, address } = req.body;
  try {
    const [[student]] = await db.query('SELECT * FROM students WHERE id=?', [req.params.id]);
    await db.query('UPDATE users SET name=?, email=?, phone=? WHERE id=?', [name, email, phone, student.user_id]);
    await db.query(
      'UPDATE students SET roll_no=?, department=?, year=?, address=? WHERE id=?',
      [roll_no, department, year, address, req.params.id]
    );
    res.redirect('/admin/students');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/students');
  }
});

router.delete('/students/:id', async (req, res) => {
  try {
    const [[student]] = await db.query('SELECT * FROM students WHERE id=?', [req.params.id]);
    if (student) {
      await db.query('DELETE FROM fees WHERE student_id=?', [req.params.id]);
      await db.query('DELETE FROM requests WHERE student_id=?', [req.params.id]);
      await db.query('DELETE FROM students WHERE id=?', [req.params.id]);
      await db.query('DELETE FROM users WHERE id=?', [student.user_id]);
    }
    res.redirect('/admin/students');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/students');
  }
});

// ================= ASSIGN BUS =================
router.get('/assign-bus', async (req, res) => {
  try {
    const [students] = await db.query(`
      SELECT s.id, u.name, s.roll_no, s.bus_id, b.bus_number
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN buses b ON s.bus_id = b.id
      ORDER BY u.name
    `);
    const [buses] = await db.query(`
      SELECT b.id, b.bus_number, b.route_name, b.driver_id, u.name AS driver_name
      FROM buses b
      LEFT JOIN users u ON b.driver_id = u.id
      ORDER BY b.bus_number
    `);
    const [drivers] = await db.query("SELECT id, name FROM users WHERE role='driver'");
    res.render('admin/assign-bus', { students, buses, drivers });
  } catch (err) {
    console.error(err);
    res.send('Error loading assign-bus page');
  }
});

router.post('/assign-bus/student', async (req, res) => {
  const { student_id, bus_id } = req.body;
  try {
    await db.query('UPDATE students SET bus_id=? WHERE id=?', [bus_id || null, student_id]);
    res.redirect('/admin/assign-bus');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/assign-bus');
  }
});

router.post('/assign-bus/driver', async (req, res) => {
  const { bus_id, driver_id } = req.body;
  try {
    await db.query('UPDATE buses SET driver_id=? WHERE id=?', [driver_id || null, bus_id]);
    res.redirect('/admin/assign-bus');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/assign-bus');
  }
});

// ================= REQUESTS =================
router.get('/requests', async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT r.*, u.name AS student_name, s.roll_no
      FROM requests r
      JOIN students s ON r.student_id = s.id
      JOIN users u ON s.user_id = u.id
      ORDER BY r.created_at DESC
    `);
    res.render('admin/requests', { requests });
  } catch (err) {
    console.error(err);
    res.send('Error loading requests');
  }
});

router.put('/requests/:id', async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE requests SET status=? WHERE id=?', [status, req.params.id]);
    res.redirect('/admin/requests');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/requests');
  }
});

// ================= FEES =================
router.get('/fees', async (req, res) => {
  try {
    const [fees] = await db.query(`
      SELECT f.*, u.name AS student_name, s.roll_no
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      ORDER BY f.due_date DESC
    `);
    const [students] = await db.query(`
      SELECT s.id, u.name, s.roll_no FROM students s JOIN users u ON s.user_id = u.id ORDER BY u.name
    `);
    res.render('admin/fees', { fees, students });
  } catch (err) {
    console.error(err);
    res.send('Error loading fees');
  }
});

router.post('/fees', async (req, res) => {
  const { student_id, amount, due_date } = req.body;
  try {
    await db.query(
      'INSERT INTO fees (student_id, amount, status, due_date) VALUES (?, ?, "unpaid", ?)',
      [student_id, amount, due_date]
    );
    res.redirect('/admin/fees');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/fees');
  }
});

router.put('/fees/:id', async (req, res) => {
  const { status } = req.body;
  try {
    const paidDate = status === 'paid' ? new Date() : null;
    await db.query('UPDATE fees SET status=?, paid_date=? WHERE id=?', [status, paidDate, req.params.id]);
    res.redirect('/admin/fees');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/fees');
  }
});
// ================= DRIVERS =================

// View Drivers
router.get('/drivers', async (req, res) => {
  try {
    const [drivers] = await db.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        b.id AS bus_id,
        b.bus_number,
        b.route_name,
        b.status AS bus_status
      FROM users u
      LEFT JOIN buses b ON u.id = b.driver_id
      WHERE u.role = 'driver'
      ORDER BY u.id DESC
    `);

    const [buses] = await db.query(`
      SELECT id, bus_number, route_name
      FROM buses
      ORDER BY bus_number
    `);

    res.render('admin/drivers', {
      drivers,
      buses
    });

  } catch (err) {
    console.error(err);
    res.send('Error loading drivers');
  }
});

// Add Driver
router.post('/drivers', async (req, res) => {
  const { name, email, phone, password, bus_id } = req.body;

  try {
    const hashed = await bcrypt.hash(password || 'driver123', 10);

    const [result] = await db.query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES (?, ?, ?, 'driver', ?)`,
      [name, email, hashed, phone]
    );

    if (bus_id) {
      await db.query(
        `UPDATE buses
         SET driver_id = ?
         WHERE id = ?`,
        [result.insertId, bus_id]
      );
    }

    res.redirect('/admin/drivers');

  } catch (err) {
    console.error(err);
    res.redirect('/admin/drivers');
  }
});

// Update Driver
router.put('/drivers/:id', async (req, res) => {
  const { name, email, phone, bus_id } = req.body;

  try {
    await db.query(
      `UPDATE users
       SET name=?, email=?, phone=?
       WHERE id=?`,
      [name, email, phone, req.params.id]
    );

    await db.query(
      `UPDATE buses
       SET driver_id = NULL
       WHERE driver_id = ?`,
      [req.params.id]
    );

    if (bus_id) {
      await db.query(
        `UPDATE buses
         SET driver_id = ?
         WHERE id = ?`,
        [req.params.id, bus_id]
      );
    }

    res.redirect('/admin/drivers');

  } catch (err) {
    console.error(err);
    res.redirect('/admin/drivers');
  }
});

// Delete Driver
router.delete('/drivers/:id', async (req, res) => {
  try {
    await db.query(
      `UPDATE buses
       SET driver_id = NULL
       WHERE driver_id = ?`,
      [req.params.id]
    );

    await db.query(
      `DELETE FROM users
       WHERE id=? AND role='driver'`,
      [req.params.id]
    );

    res.redirect('/admin/drivers');

  } catch (err) {
    console.error(err);
    res.redirect('/admin/drivers');
  }
});
// ================= SEAT MANAGEMENT =================

router.get('/seat-management', async (req, res) => {
  try {
    const { bus_id } = req.query;

    // Get all buses
    const [buses] = await db.query(`
      SELECT id, bus_number, route_name, capacity
      FROM buses
      ORDER BY bus_number
    `);

    let selectedBus = null;
    let allocatedStudents = [];

    if (bus_id) {

      const [[bus]] = await db.query(
        `SELECT id, bus_number, route_name, capacity
         FROM buses
         WHERE id = ?`,
        [bus_id]
      );

      selectedBus = bus;

      if (selectedBus) {
        const [students] = await db.query(`
          SELECT
            u.name,
            s.roll_no,
            s.department,
            s.year
          FROM students s
          JOIN users u
            ON s.user_id = u.id
          WHERE s.bus_id = ?
          ORDER BY u.name
        `, [bus_id]);

        allocatedStudents = students;
      }
    }

    res.render('admin/seat-management', {
      buses,
      selectedBus,
      allocatedStudents
    });

  } catch (err) {
    console.error(err);
    res.send('Error loading seat management');
  }
});
// ================= REPORTS =================

router.get('/reports', async (req, res) => {
  try {

    // Dashboard summary
    const [[{ totalStudents }]] =
      await db.query("SELECT COUNT(*) AS totalStudents FROM students");

    const [[{ totalBuses, activeBuses }]] =
      await db.query(`
        SELECT
          COUNT(*) AS totalBuses,
          SUM(status='active') AS activeBuses
        FROM buses
      `);

    // Fee totals
    const [feeTotals] =
      await db.query(`
        SELECT status, SUM(amount) AS total
        FROM fees
        GROUP BY status
      `);

    let feesCollected = 0;
    let feesPending = 0;

    feeTotals.forEach(f => {
      if (f.status === "paid") feesCollected = Number(f.total || 0);
      if (f.status === "unpaid") feesPending = Number(f.total || 0);
    });

    // Bus report
    const [busReport] =
      await db.query(`
        SELECT
          b.id,
          b.bus_number,
          b.route_name,
          b.capacity,
          b.status,
          u.name AS driver_name,
          COUNT(s.id) AS allocated
        FROM buses b
        LEFT JOIN users u ON b.driver_id = u.id
        LEFT JOIN students s ON s.bus_id = b.id
        GROUP BY
          b.id,
          b.bus_number,
          b.route_name,
          b.capacity,
          b.status,
          u.name
        ORDER BY b.bus_number
      `);

    // Fee report
    const [feeReport] =
      await db.query(`
        SELECT
          u.name,
          s.roll_no,
          f.amount,
          f.status,
          f.due_date,
          f.paid_date
        FROM fees f
        JOIN students s ON f.student_id = s.id
        JOIN users u ON s.user_id = u.id
        ORDER BY f.due_date DESC
      `);

    // Request report
    const [requestReport] =
      await db.query(`
        SELECT
          u.name,
          r.subject,
          r.message,
          r.status,
          r.created_at
        FROM requests r
        JOIN students s ON r.student_id = s.id
        JOIN users u ON s.user_id = u.id
        ORDER BY r.created_at DESC
      `);

    res.render("admin/reports", {
      totalStudents,
      totalBuses,
      activeBuses,
      feesCollected,
      feesPending,
      busReport,
      feeReport,
      requestReport
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading reports");
  }
});
// ================= NOTIFICATIONS =================

// View Notifications
router.get('/notifications', async (req, res) => {

    try {

        const [notifications] = await db.query(`
            SELECT
                n.*,
                b.bus_number
            FROM notifications n
            LEFT JOIN buses b
                ON n.bus_id = b.id
            ORDER BY n.created_at DESC
        `);

        const [buses] = await db.query(`
            SELECT *
            FROM buses
            ORDER BY bus_number
        `);

        res.render('admin/notifications', {
            notifications,
            buses
        });

    } catch (err) {

        console.error(err);
        res.send(err.message);

    }

});


// Add Notification
router.post('/notifications', async (req, res) => {

    const {
        title,
        message,
        audience,
        bus_id
    } = req.body;

    try {

        await db.query(`
            INSERT INTO notifications
            (title,message,audience,bus_id)
            VALUES (?,?,?,?)
        `,[
            title,
            message,
            audience,
            audience === 'bus'
                ? bus_id
                : null
        ]);

        res.redirect('/admin/notifications');

    } catch(err){

        console.error(err);
        res.send(err.message);

    }

});


// Delete Notification
router.delete('/notifications/:id', async (req, res) => {

  try {

    await db.query(
      `DELETE FROM notifications WHERE id=?`,
      [req.params.id]
    );

    res.redirect('/admin/notifications');

  } catch (err) {
    console.error(err);
    res.redirect('/admin/notifications');
  }
});
// ================= PROFILE =================
router.get('/profile', async (req, res) => {
  try {
    const [[admin]] = await db.query(
      'SELECT * FROM users WHERE id=?',
      [req.session.user.id]
    );

    res.render('admin/profile', {
      user: req.session.user,
      profile: admin,
      message: null
    });

  } catch (err) {
    console.error(err);
    res.send('Error loading profile');
  }
});
router.put(
    '/profile',
    upload.single('avatar'),
    async (req, res) => {
  const { name, phone, password } = req.body;

  try {
    if (password && password.trim() !== '') {
      const hashed = await bcrypt.hash(password, 10);

      await db.query(
        'UPDATE users SET name=?, phone=?, password=? WHERE id=?',
        [name, phone, hashed, req.session.user.id]
      );
    } else {
      await db.query(
        'UPDATE users SET name=?, phone=? WHERE id=?',
        [name, phone, req.session.user.id]
      );
    }

    req.session.user.name = name;

    const [[admin]] = await db.query(
      'SELECT * FROM users WHERE id=?',
      [req.session.user.id]
    );

    res.render('admin/profile', {
      user: req.session.user,
      profile: admin,
      message: 'Profile updated successfully!'
    });

  } catch (err) {
    console.error(err);
    res.redirect('/admin/profile');
  }
});

module.exports = router;
router.get('/settings', (req, res) => {

    res.render('admin/settings', {

        admin: {
            name: 'Admin User',
            email: 'admin@college.edu',
            phone: '9000000001'
        },

        systemInfo: {
            app_version: 'v1.0.0',
            db_status: 'Connected',
            server_status: 'Online'
        }

    });

});