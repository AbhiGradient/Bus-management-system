/**
 * helpers/paymentUtils.js
 * ------------------------
 * Utility functions for the simulated Bus Fee Payment System.
 * Generates receipt numbers, fake transaction IDs (UTR), and
 * payment timestamps used across routes/payment.js.
 *
 * No external dependencies — pure helper functions.
 */

// Generate a unique Receipt Number
// Format: RCPT-YYYYMMDD-XXXXXX (XXXXXX = random alphanumeric)
function generateReceiptNumber() {
  const date = new Date();
  const datePart =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');

  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `RCPT-${datePart}-${randomPart}`;
}

// Generate a fake Transaction ID / UTR Number
// Format: TXN + 12-digit numeric string (mimics real UPI UTR style)
function generateTransactionId() {
  let txnId = 'TXN';
  for (let i = 0; i < 12; i++) {
    txnId += Math.floor(Math.random() * 10);
  }
  return txnId;
}

// Generate a MySQL-compatible datetime string for the current moment
// Format: YYYY-MM-DD HH:MM:SS
function getMySQLTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');

  return (
    date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    ' ' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds())
  );
}

// Format a numeric amount as Indian Rupees (₹1,234.00)
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return num.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  });
}

// Validate a fake UTR input from the student
// Accepts 6-30 alphanumeric characters (loose validation since it's simulated)
function isValidUtr(utr) {
  if (!utr || typeof utr !== 'string') return false;
  const trimmed = utr.trim();
  return /^[A-Za-z0-9]{6,30}$/.test(trimmed);
}

// Generate a human-readable date for display (e.g. "23 Jul 2026, 03:45 PM")
function formatDisplayDate(date = new Date()) {
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

module.exports = {
  generateReceiptNumber,
  generateTransactionId,
  getMySQLTimestamp,
  formatCurrency,
  isValidUtr,
  formatDisplayDate
};