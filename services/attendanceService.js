/*
  services/attendanceService.js
  Backs the QR attendance flow already fully speced out in the comments of
  views/qr/qr-scanner.ejs and views/qr/attendance-report.ejs. This is the
  service those two view files' expected `routes/qr.js` calls into.

  QR payload written by qr-generator.ejs (and utils/generatorQR.js on the
  server side): { "type": "student", "id": <id>, "roll_no": "<roll_no>" }
*/

const db = require('../config/db');

// -------- Resolve a student from whatever the scanner/manual form sent --------
// qr-scanner.ejs posts { qr_data, id, roll_no } after a camera scan, or just
// { roll_no } from the manual-entry fallback form.
async function resolveStudent({ id, roll_no }) {
  if (id) {
    const [[student]] = await db.query(
      `SELECT s.*, u.name FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?`,
      [id]
    );
    if (student) return student;
  }
  if (roll_no) {
    const [[student]] = await db.query(
      `SELECT s.*, u.name FROM students s JOIN users u ON s.user_id = u.id WHERE s.roll_no = ?`,
      [roll_no]
    );
    if (student) return student;
  }
  return null;
}

// -------- Mark a student present on a bus, matching qr-scanner.ejs's expected response shape --------
// response JSON: { success, status: 'marked'|'duplicate'|'not_found'|'wrong_bus'|'error', message, student }
async function markAttendance({ qr_data, id, roll_no, busId, markedBy }) {
  try {
    const student = await resolveStudent({ id, roll_no });

    if (!student) {
      return { success: false, status: 'not_found', message: 'No student found for this pass / roll number.' };
    }

    if (Number(student.bus_id) !== Number(busId)) {
      return {
        success: false,
        status: 'wrong_bus',
        message: `${student.name} is assigned to a different bus.`,
        student: { name: student.name, roll_no: student.roll_no }
      };
    }

    const today = new Date().toISOString().slice(0, 10);

    const [[existing]] = await db.query(
      'SELECT * FROM attendance WHERE student_id = ? AND bus_id = ? AND date = ?',
      [student.id, busId, today]
    );

    if (existing) {
      return {
        success: false,
        status: 'duplicate',
        message: `${student.name} has already been scanned today.`,
        student: { name: student.name, roll_no: student.roll_no }
      };
    }

    const now = new Date();
    const timeIn = now.toTimeString().slice(0, 8); // HH:MM:SS

    await db.query(
      'INSERT INTO attendance (student_id, bus_id, date, time_in, status, marked_by) VALUES (?, ?, ?, ?, "present", ?)',
      [student.id, busId, today, timeIn, markedBy]
    );

    return {
      success: true,
      status: 'marked',
      message: `${student.name} marked present.`,
      student: { id: student.id, user_id: student.user_id, name: student.name, roll_no: student.roll_no }
    };
  } catch (err) {
    console.error('❌ markAttendance failed:', err.message);
    return { success: false, status: 'error', message: 'Something went wrong while marking attendance.' };
  }
}

// -------- Attendance report for admin/attendance-report.ejs --------
// filters -> { date, bus_id, status } exactly as the view's <form method="GET"> sends them.
async function getAttendanceReport(filters = {}) {
  const { date, bus_id, status } = filters;
  const where = [];
  const params = [];

  if (date) { where.push('a.date = ?'); params.push(date); }
  if (bus_id) { where.push('a.bus_id = ?'); params.push(bus_id); }
  if (status) { where.push('a.status = ?'); params.push(status); }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [records] = await db.query(
    `SELECT a.id, u.name AS student_name, s.roll_no, b.bus_number, a.date, a.time_in, a.status
     FROM attendance a
     JOIN students s ON a.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN buses b ON a.bus_id = b.id
     ${whereClause}
     ORDER BY a.date DESC, a.time_in DESC`,
    params
  );

  const present = records.filter((r) => r.status === 'present').length;

  // "Absent" only has a meaningful count when scoped to a single day (and
  // optionally a single bus) — otherwise there's no fixed roster to compare
  // scans against, so we report 0 absentees and a 100% rate for "All Dates".
  let absent = 0;
  if (date) {
    const busFilter = bus_id ? 'AND bus_id = ?' : '';
    const busParams = bus_id ? [bus_id] : [];
    const [[{ totalAssigned }]] = await db.query(
      `SELECT COUNT(*) AS totalAssigned FROM students WHERE bus_id IS NOT NULL ${busFilter}`,
      busParams
    );
    absent = Math.max(totalAssigned - present, 0);
  }

  const total = present + absent;
  const rate = total > 0 ? Math.round((present / total) * 100) : (records.length ? 100 : 0);

  return {
    records,
    stats: { total: total || records.length, present, absent, rate }
  };
}

// -------- A single student's own attendance history (used by /student/attendance) --------
async function getStudentAttendanceHistory(studentId, limit = 30) {
  const [rows] = await db.query(
    `SELECT a.date, a.time_in, a.status, b.bus_number
     FROM attendance a
     JOIN buses b ON a.bus_id = b.id
     WHERE a.student_id = ?
     ORDER BY a.date DESC, a.time_in DESC
     LIMIT ?`,
    [studentId, limit]
  );
  return rows;
}

module.exports = { markAttendance, getAttendanceReport, getStudentAttendanceHistory, resolveStudent };
