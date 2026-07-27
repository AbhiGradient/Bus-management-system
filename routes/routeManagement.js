/*
  routes/routeManagement.js
  Mounted at /admin/routes in server.js.

  Admin CRUD for the tables that already exist in the live database:
    routes             - route definitions (name, endpoints, distance, ETA)
    route_stops        - ordered stops belonging to a route
    bus_route_assignment - which single route a bus currently runs (1 per bus)

  These are the same tables services/trackingService.js reads from, so
  anything created here is immediately usable by the Live Tracking module.
*/

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// -------- Auth guard: only logged-in admins --------
const isAdmin = require('../middleware/adminAuth');

router.use(isAdmin);

// ================= LIST ROUTES =================
router.get('/', async (req, res) => {
  try {
    const [routes] = await db.query(`
      SELECT r.*,
        (SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id) AS stop_count,
        (SELECT GROUP_CONCAT(b.bus_number ORDER BY b.bus_number SEPARATOR ', ')
           FROM bus_route_assignment bra
           JOIN buses b ON b.id = bra.bus_id
           WHERE bra.route_id = r.id) AS assigned_buses
      FROM routes r
      ORDER BY r.id DESC
    `);

    const [stopRows] = await db.query('SELECT * FROM route_stops ORDER BY route_id ASC, stop_order ASC');
    const stopsByRoute = {};
    stopRows.forEach((stop) => {
      if (!stopsByRoute[stop.route_id]) stopsByRoute[stop.route_id] = [];
      stopsByRoute[stop.route_id].push(stop);
    });

    const [buses] = await db.query(`
      SELECT b.id, b.bus_number, bra.route_id AS assigned_route_id
      FROM buses b
      LEFT JOIN bus_route_assignment bra ON bra.bus_id = b.id
      ORDER BY b.bus_number
    `);

    res.render('admin/routes', {
      routes,
      stopsByRoute,
      buses,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.send('Error loading routes');
  }
});

// ================= CREATE ROUTE =================
router.post('/', async (req, res) => {
  const { route_name, start_location, end_location, total_distance, estimated_time } = req.body;
  try {
    await db.query(
      `INSERT INTO routes (route_name, start_location, end_location, total_distance, estimated_time, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [route_name, start_location, end_location, total_distance || null, estimated_time || null]
    );
    res.redirect('/admin/routes');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/routes');
  }
});

// ================= EDIT ROUTE =================
router.put('/:id', async (req, res) => {
  const { route_name, start_location, end_location, total_distance, estimated_time, is_active } = req.body;
  try {
    await db.query(
      `UPDATE routes
       SET route_name=?, start_location=?, end_location=?, total_distance=?, estimated_time=?, is_active=?
       WHERE id=?`,
      [route_name, start_location, end_location, total_distance || null, estimated_time || null, is_active ? 1 : 0, req.params.id]
    );
    res.redirect('/admin/routes');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/routes');
  }
});

// ================= DELETE ROUTE =================
// route_stops and bus_route_assignment cascade automatically at the DB level.
// journeys.route_id does NOT cascade (trip history is never silently wiped),
// so a route that has already run at least one journey can't be hard-deleted
// — mark it inactive from the edit modal instead.
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM routes WHERE id = ?', [req.params.id]);
    res.redirect('/admin/routes');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.redirect(
        '/admin/routes?error=' +
          encodeURIComponent("This route already has journey history and can't be deleted. Mark it inactive instead.")
      );
    }
    console.error(err);
    res.redirect('/admin/routes');
  }
});

// ================= ADD STOP =================
router.post('/:id/stops', async (req, res) => {
  const { stop_name, latitude, longitude, stop_order, expected_arrival } = req.body;
  try {
    await db.query(
      `INSERT INTO route_stops (route_id, stop_name, latitude, longitude, stop_order, expected_arrival)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.id, stop_name, latitude, longitude, stop_order, expected_arrival || null]
    );
    res.redirect('/admin/routes');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/routes');
  }
});

// ================= EDIT STOP =================
router.put('/stops/:stopId', async (req, res) => {
  const { stop_name, latitude, longitude, stop_order, expected_arrival } = req.body;
  try {
    await db.query(
      `UPDATE route_stops
       SET stop_name=?, latitude=?, longitude=?, stop_order=?, expected_arrival=?
       WHERE id=?`,
      [stop_name, latitude, longitude, stop_order, expected_arrival || null, req.params.stopId]
    );
    res.redirect('/admin/routes');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/routes');
  }
});

// ================= DELETE STOP =================
router.delete('/stops/:stopId', async (req, res) => {
  try {
    await db.query('DELETE FROM route_stops WHERE id = ?', [req.params.stopId]);
    res.redirect('/admin/routes');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/routes');
  }
});

// ================= ASSIGN ROUTE TO A BUS =================
// bus_route_assignment.bus_id is UNIQUE, so a bus can only run one route —
// assigning a new one here silently replaces whatever it had before.
router.post('/:id/assign', async (req, res) => {
  const { bus_id } = req.body;
  try {
    if (!bus_id) return res.redirect('/admin/routes');
    await db.query(
      `INSERT INTO bus_route_assignment (bus_id, route_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE route_id = VALUES(route_id)`,
      [bus_id, req.params.id]
    );
    res.redirect('/admin/routes');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/routes');
  }
});

// ================= UNASSIGN A BUS FROM ITS ROUTE =================
router.delete('/assign/:busId', async (req, res) => {
  try {
    await db.query('DELETE FROM bus_route_assignment WHERE bus_id = ?', [req.params.busId]);
    res.redirect('/admin/routes');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/routes');
  }
});

module.exports = router;