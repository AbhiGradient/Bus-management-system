/*
  middleware/studentAuth.js
  Use on every route in routes/student.js:  router.use(isStudent);
*/
const { requireRole } = require('./auth');

const isStudent = requireRole('student');

module.exports = isStudent;