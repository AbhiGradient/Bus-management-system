/*
middleware/auth.js
*/

// Any logged-in user
function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
}

function requireRole(role) {
  return function (req, res, next) {
    const user = req.session && req.session.user;

    if (!user)
      return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));

    if (user.role !== role)
      return res.redirect(`/${user.role}/dashboard`);

    next();
  };
}

function requireAnyRole(roles) {
  return function (req, res, next) {
    const user = req.session && req.session.user;

    if (!user)
      return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));

    if (!roles.includes(user.role))
      return res.redirect(`/${user.role}/dashboard`);

    next();
  };
}

module.exports = {
  requireLogin,
  requireRole,
  requireAnyRole
};