/*
  utils/helpers.js
  Small, dependency-free helpers reused across routes/, services/ and
  email templates. Nothing here touches the database or the network.
*/

// -------- Format a DECIMAL(10,2) fee/payment amount as Indian Rupees --------
// fees.ejs currently prints raw f.amount next to a literal ₹ symbol; this
// keeps that same look ("₹5000.00") for places that need it as one string
// (e.g. email templates).
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `₹${num.toFixed(2)}`;
}

// -------- Format a JS Date / MySQL date string as "15 Jul 2026" --------
function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// -------- Format a JS Date as "15 Jul 2026, 6:45 PM" --------
function formatDateTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// -------- Random temporary password, e.g. when admin adds a student/driver --------
// Mirrors the default 'student123' used today (routes/admin.js POST /students)
// but this is available whenever a real random one is preferred instead.
function generateRandomPassword(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// -------- Mask an email for display/logs, e.g. "ar***@college.edu" --------
function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  const visible = name.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(name.length - 2, 1))}@${domain}`;
}

// -------- Capitalize the first letter only (roles, statuses, etc.) --------
function capitalize(str) {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// -------- Today's date as YYYY-MM-DD (matches MySQL DATE columns) --------
function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = {
  formatCurrency,
  formatDate,
  formatDateTime,
  generateRandomPassword,
  maskEmail,
  capitalize,
  todayDateString
};
