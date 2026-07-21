/*
  middleware/adminAuth.js
  Use on every route in routes/admin.js and any shared route only an
  admin should reach:  router.use(isAdmin);
*/
const { requireRole } = require('./auth');

const isAdmin = requireRole('admin');

module.exports = isAdmin;