/*
  utils/validators.js
  Shared input validation, used by route handlers before touching the
  database. See CLAUDE.md "Backend Rules" -> Validation. Every function
  returns a plain boolean so callers can compose their own error messages
  in the same style already used in routes/*.js (render the page again
  with an `error` local).
*/

// -------- Email --------
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// -------- Indian 10-digit mobile number (project seed data uses 10-digit numbers) --------
function isValidPhone(phone) {
  if (!phone) return true; // phone is optional across the schema (users.phone is nullable)
  return /^[6-9]\d{9}$/.test(String(phone).trim());
}

// -------- Password strength (used when admin sets a custom student/driver password) --------
function isValidPassword(password) {
  return typeof password === 'string' && password.trim().length >= 6;
}

// -------- Generic required-string check --------
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// -------- Fee / payment amount --------
function isValidAmount(amount) {
  const num = Number(amount);
  return !Number.isNaN(num) && num > 0;
}

// -------- YYYY-MM-DD date string coming from <input type="date"> --------
function isValidDate(dateStr) {
  if (!isNonEmptyString(dateStr)) return false;
  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
}

// -------- GPS coordinate sanity check (used by trackingService) --------
function isValidCoordinate(lat, lng) {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  return (
    !Number.isNaN(latNum) && !Number.isNaN(lngNum) &&
    latNum >= -90 && latNum <= 90 &&
    lngNum >= -180 && lngNum <= 180
  );
}

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isNonEmptyString,
  isValidAmount,
  isValidDate,
  isValidCoordinate
};
