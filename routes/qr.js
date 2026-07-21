/*
  routes/qr.js
  Implements the routes views/qr/qr-generator.ejs, views/qr/qr-scanner.ejs
  and views/qr/attendance-report.ejs already document in their own header
  comments (GET /admin/qr-generator, GET /driver/qr-scanner,
  POST /driver/qr-scanner/mark, GET /admin/attendance-report).

  Spans two roles, so — like routes/admin.js and routes/driver.js each
  guarding their own paths — every route here applies isAdmin/isDriver
  individually instead of a single router.use(), since neither guard
  covers the whole file.
*/

const express = require('express');
const router = express.Router();
const db = require('../config/db');

const isAdmin = require('../middleware/adminAuth');
const isDriver = require('../middleware/driverAuth');

const attendanceService = require('../services/attendanceService');
const notificationService = require('../services/notificationService');
const { generateQRBuffer, buildStudentPassPayload } = require('../utils/generatorQR');

// ================= ADMIN: QR GENERATOR =================
router.get('/admin/qr-generator', isAdmin, async (req, res) => {
  try {
    const [students] = await db.query(`
      SELECT s.id, u.name, s.roll_no, s.department, b.bus_number
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN buses b ON s.bus_id = b.id
      ORDER BY u.name
    `);
    res.render('qr/qr-generator', { students });
  } catch (err) {
    console.error(err);
    res.send('Error loading QR generator');
  }
});

// -------- Server-rendered PNG download, as a fallback to the client-side canvas download --------
router.get('/admin/qr-generator/:studentId/download', isAdmin, async (req, res) => {
  try {
    const [[student]] = await db.query('SELECT * FROM students WHERE id = ?', [req.params.studentId]);
    if (!student) return res.status(404).send('Student not found');

    const buffer = await generateQRBuffer(buildStudentPassPayload(student));
    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `attachment; filename="qr-pass-${student.roll_no}.png"`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating QR code');
  }
});

// ================= ADMIN: ATTENDANCE REPORT =================
router.get('/admin/attendance-report', isAdmin, async (req, res) => {
  try {
    const filters = {
      date: req.query.date || '',
      bus_id: req.query.bus_id || '',
      status: req.query.status || ''
    };

    const [buses] = await db.query('SELECT id, bus_number FROM buses ORDER BY bus_number');
    const { records, stats } = await attendanceService.getAttendanceReport(filters);

    res.render('qr/attendance-report', { buses, filters, stats, records });
  } catch (err) {
    console.error(err);
    res.send('Error loading attendance report');
  }
});

// ================= DRIVER: QR SCANNER =================
router.get('/driver/qr-scanner', isDriver, async (req, res) => {
  try {
    const [[bus]] = await db.query('SELECT * FROM buses WHERE driver_id = ?', [req.session.user.id]);
    res.render('qr/qr-scanner', { bus });
  } catch (err) {
    console.error(err);
    res.send('Error loading QR scanner');
  }
});

// -------- POST /driver/qr-scanner/mark, exactly as documented in qr-scanner.ejs --------
router.post('/driver/qr-scanner/mark', isDriver, async (req, res) => {
  try {
    const [[bus]] = await db.query('SELECT * FROM buses WHERE driver_id = ?', [req.session.user.id]);
    if (!bus) {
      return res.json({ success: false, status: 'error', message: 'No bus assigned to you.' });
    }

    const { qr_data, id, roll_no } = req.body;
    const result = await attendanceService.markAttendance({
      qr_data,
      id,
      roll_no,
      busId: bus.id,
      markedBy: req.session.user.id
    });

    // Let the student know they've been marked present (best-effort, never
    // blocks the scan response the driver is waiting on).
    if (result.success && result.student && result.student.user_id) {
      notificationService.createNotification({
        userId: result.student.user_id,
        title: 'Attendance Marked',
        message: `You were marked present on ${bus.bus_number} at ${new Date().toLocaleTimeString()}.`,
        type: 'success'
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.json({ success: false, status: 'error', message: 'Server error while marking attendance.' });
  }
});

module.exports = router;
