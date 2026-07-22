const crypto = require('crypto');
const { sendMail } = require('../config/mailer');
/*
  middleware/auth.js
  Core session guards. Role-specific files (adminAuth.js, studentAuth.js,
  driverAuth.js) are thin wrappers around requireRole() below, so there is
  ONE place that defines what "logged in" and "wrong role" actually do.
  Do not write inline `if (req.session.user...)` checks in route files —
  use these instead.
*/

router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password', {
        error: null,
        success: null
    });
});
// Any logged-in user, regardless of role
function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
}

// Factory: only a specific role may pass. Redirects other logged-in roles
// to their own dashboard instead of showing a blank 403, and sends
// anonymous visitors to /login.
function requireRole(role) {
  return function (req, res, next) {
    const user = req.session && req.session.user;
    if (!user) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
    if (user.role !== role) return res.redirect(`/${user.role}/dashboard`);
    return next();
  };
}

// Any one of several roles (e.g. a page shared by admin + student)
function requireAnyRole(roles) {
  return function (req, res, next) {
    const user = req.session && req.session.user;
    if (!user) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
    if (!roles.includes(user.role)) return res.redirect(`/${user.role}/dashboard`);
    return next();
  };
}

module.exports = { requireLogin, requireRole, requireAnyRole };