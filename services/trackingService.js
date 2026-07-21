/*
  services/trackingService.js
  Live bus GPS tracking. Backed by the `tracking` table (one row per bus,
  upserted on every ping) and broadcast in real time over the socket.io
  server that's already a package.json dependency but wasn't wired up yet.

  server.js calls setIO(io) once at startup; routes/tracking.js and
  routes/driver.js call the functions below — neither needs to know
  socket.io exists.
*/

const db = require('../config/db');
const { calculateETA } = require('../utils/calculateRoute');
const { isValidCoordinate } = require('../utils/validators');

let ioInstance = null;

// -------- Called once from server.js after `const io = new Server(server)` --------
function setIO(io) {
  ioInstance = io;
}

// -------- Upsert a bus's latest position and broadcast it to connected clients --------
async function updateLocation(busId, latitude, longitude, speedKmph = 0) {
  if (!isValidCoordinate(latitude, longitude)) {
    throw new Error('Invalid GPS coordinates');
  }

  await db.query(
    `INSERT INTO tracking (bus_id, latitude, longitude, speed_kmph)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude), speed_kmph = VALUES(speed_kmph)`,
    [busId, latitude, longitude, speedKmph]
  );

  const location = { busId, latitude, longitude, speedKmph, updatedAt: new Date() };

  // Live push to anyone watching this bus (admin/student "Live Tracking" pages).
  // Safe no-op if socket.io hasn't connected yet or no one is listening.
  if (ioInstance) {
    ioInstance.to(`bus-${busId}`).emit('busLocation', location);
    ioInstance.emit('busLocationUpdate', location); // fleet-wide feed for admin dashboard
  }

  return location;
}

// -------- Get a single bus's last known position --------
async function getLocation(busId) {
  const [[row]] = await db.query('SELECT * FROM tracking WHERE bus_id = ?', [busId]);
  return row || null;
}

// -------- Get every active bus's last known position (admin fleet view) --------
async function getAllLocations() {
  const [rows] = await db.query(`
    SELECT t.*, b.bus_number, b.route_name
    FROM tracking t
    JOIN buses b ON t.bus_id = b.id
    WHERE b.status = 'active'
  `);
  return rows;
}

// -------- ETA from a bus's current position to a destination (e.g. campus) --------
async function getETA(busId, destLat, destLng) {
  const location = await getLocation(busId);
  if (!location) return null;

  return calculateETA(
    Number(location.latitude),
    Number(location.longitude),
    Number(destLat),
    Number(destLng),
    Number(location.speed_kmph)
  );
}

module.exports = { setIO, updateLocation, getLocation, getAllLocations, getETA };
