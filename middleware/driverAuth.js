/*
  middleware/driverAuth.js
  Use on every route in routes/driver.js:  router.use(isDriver);
*/
const { requireRole } = require('./auth');

const isDriver = requireRole('driver');

module.exports = isDriver;