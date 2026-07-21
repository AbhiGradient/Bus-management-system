/*
  services/notificationService.js
  In-app notifications (notifications table, added in database/bus_management.sql).
  Used from routes/admin.js, routes/student.js, routes/driver.js, routes/qr.js
  and services/paymentService.js whenever something happens that the
  affected user should see on their "Notifications" nav item
  (see views/partials/sidebar.ejs -> /admin|student|driver/notifications).
*/

const db = require('../config/db');

// -------- Create a single notification for one user --------
async function createNotification({ userId, title, message, type = 'info' }) {
  try {
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, title, message, type]
    );
    return { id: result.insertId, userId, title, message, type };
  } catch (err) {
    console.error('❌ createNotification failed:', err.message);
    // Notifications are a side-effect, not the primary action (e.g. approving
    // a request). Callers should not fail the primary action if this errors.
    return null;
  }
}

// -------- Notify every user of a given role at once (e.g. all admins on a new request) --------
async function notifyRole(role, { title, message, type = 'info' }) {
  try {
    const [users] = await db.query('SELECT id FROM users WHERE role = ?', [role]);
    if (users.length === 0) return [];

    const values = users.map((u) => [u.id, title, message, type]);
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ?',
      [values]
    );
    return { count: result.affectedRows };
  } catch (err) {
    console.error('❌ notifyRole failed:', err.message);
    return null;
  }
}

// -------- Fetch a user's notifications, most recent first --------
async function getUserNotifications(userId, { unreadOnly = false, limit = 50 } = {}) {
  const whereUnread = unreadOnly ? 'AND is_read = 0' : '';
  const [rows] = await db.query(
    `SELECT * FROM notifications WHERE user_id = ? ${whereUnread} ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  );
  return rows;
}

// -------- Count unread notifications (for a navbar badge) --------
async function getUnreadCount(userId) {
  const [[{ unread }]] = await db.query(
    "SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0",
    [userId]
  );
  return unread;
}

// -------- Mark one notification as read --------
async function markAsRead(notificationId, userId) {
  const [result] = await db.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );
  return result.affectedRows > 0;
}

// -------- Mark all of a user's notifications as read --------
async function markAllAsRead(userId) {
  const [result] = await db.query(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return result.affectedRows;
}

module.exports = {
  createNotification,
  notifyRole,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
