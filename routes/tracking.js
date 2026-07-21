/*
  routes/tracking.js
  Mounted at /tracking in server.js — matches the '/tracking/live' link
  already reserved in views/partials/sidebar.ejs for admin and student.
  Driver pushes GPS pings here; admin/student read the live feed.
*/

const express = require('express');
const router = express.Router();
const db = require('../config/db');

const isDriver = require('../middleware/driverAuth');
// requireAnyRole already exists in middleware/auth.js for exactly this
// kind of shared page — reused here instead of writing a new guard.
const { requireAnyRole } = require('../middleware/auth');

const trackingService = require('../services/trackingService');
const { isValidCoordinate } = require('../utils/validators');

// ================= DRIVER: PUSH LIVE LOCATION =================
router.post('/update', isDriver, async (req, res) => {
  try {
    const { latitude, longitude, speed } = req.body;
    if (!isValidCoordinate(latitude, longitude)) {
      return res.status(400).json({ success: false, message: 'Invalid GPS coordinates.' });
    }

    const [[bus]] = await db.query('SELECT * FROM buses WHERE driver_id = ?', [req.session.user.id]);
    if (!bus) return res.status(404).json({ success: false, message: 'No bus assigned to you.' });

    const location = await trackingService.updateLocation(bus.id, latitude, longitude, speed || 0);
    res.json({ success: true, location });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not update location.' });
  }
});

// ================= ADMIN + STUDENT: LIVE FLEET / BUS VIEW =================
// Admin gets every active bus; a student gets just the bus they're assigned to.
router.get('/live', requireAnyRole(['admin', 'student', 'driver']), async (req, res) => {
  try {
    if (req.session.user.role === 'admin') {
      const locations = await trackingService.getAllLocations();
      return res.json({ success: true, locations });
    }

    if (req.session.user.role === 'student') {
      const [[student]] = await db.query('SELECT bus_id FROM students WHERE user_id = ?', [req.session.user.id]);
      if (!student || !student.bus_id) {
        return res.json({ success: true, location: null, message: 'No bus assigned yet.' });
      }
      const location = await trackingService.getLocation(student.bus_id);
      return res.json({ success: true, location });
    }

    // Driver checking their own bus's last pushed location
    const [[bus]] = await db.query('SELECT id FROM buses WHERE driver_id = ?', [req.session.user.id]);
    const location = bus ? await trackingService.getLocation(bus.id) : null;
    res.json({ success: true, location });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not load live tracking data.' });
  }
});

// ================= GET SINGLE BUS + ETA TO CAMPUS =================
router.get('/bus/:busId', requireAnyRole(['admin', 'student', 'driver']), async (req, res) => {
  try {
    const location = await trackingService.getLocation(req.params.busId);
    if (!location) return res.json({ success: true, location: null });

    // Campus coordinates aren't stored anywhere in this project yet
    // (no "campus" table/config), so ETA is computed only when the caller
    // supplies a destination via query params.
    const { destLat, destLng } = req.query;
    let eta = null;
    if (destLat && destLng) {
      eta = await trackingService.getETA(req.params.busId, destLat, destLng);
    }

    res.json({ success: true, location, eta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not load bus location.' });
  }
});

module.exports = router;
