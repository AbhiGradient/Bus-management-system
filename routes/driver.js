const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// -------- Auth guard: only logged-in drivers --------
const isDriver = require("../middleware/driverAuth");
router.use(isDriver);

async function getDriverRecord(userId) {

    const [[driver]] = await db.query(`
        SELECT *
        FROM users
        WHERE id = ?
        AND role = 'driver'
    `,[userId]);

    return driver;
}

// ================= DASHBOARD =================
router.get('/dashboard', async (req, res) => {

    try {

        const driver = await getDriverRecord(req.session.user.id);

        const [[bus]] = await db.query(`
            SELECT *
            FROM buses
            WHERE driver_id = ?
        `,[req.session.user.id]);

        let students = [];

        if(bus){

            const [rows] = await db.query(`
                SELECT
                    s.roll_no,
                    s.department,
                    s.year,
                    u.name,
                    u.phone
                FROM students s
                JOIN users u
                    ON s.user_id = u.id
                WHERE s.bus_id=?
                ORDER BY u.name
            `,[bus.id]);

            students = rows;
        }

        res.render('driver/driver-dashboard',{

            driver,
            bus,
            students

        });

    }

    catch(err){

        console.error(err);
        res.send("Error loading dashboard");

    }

});
// ================= TODAY'S ROUTE =================
// ================= TODAY'S ROUTE =================
router.get('/today-route', async (req, res) => {

    try {

        const [[bus]] = await db.query(`
            SELECT *
            FROM buses
            WHERE driver_id = ?
        `, [req.session.user.id]);

        let students = [];

        if (bus) {

            const [rows] = await db.query(`
                SELECT
                    s.roll_no,
                    s.department,
                    u.name
                FROM students s
                JOIN users u
                    ON s.user_id = u.id
                WHERE s.bus_id = ?
                ORDER BY u.name
            `, [bus.id]);

            students = rows;
        }

        res.render('driver/today-route', {
            bus,
            students
        });

    } catch (err) {

        console.error(err);
        res.send("Error loading today's route");

    }

});
// ==============================
// Start Trip (Page)
// ==============================
// ================= START TRIP PAGE =================
router.get('/trip-start', async (req, res) => {

    try {

        const [[bus]] = await db.query(`
            SELECT *
            FROM buses
            WHERE driver_id = ?
        `, [req.session.user.id]);

        res.render('driver/trip-start', {
            bus
        });

    } catch (err) {

        console.error(err);
        res.send("Error loading trip page");

    }

});
// ==============================
// Start Trip
// ==============================
// ================= START TRIP =================
router.post('/trip-start', async (req, res) => {

    try {

        await db.query(`
            UPDATE buses
            SET status='active'
            WHERE driver_id=?
        `, [req.session.user.id]);

        res.redirect('/driver/trip-start');

    } catch (err) {

        console.error(err);
        res.redirect('/driver/trip-start');

    }

});
// ================= END TRIP PAGE =================
router.get('/trip-end', async (req, res) => {

    try {

        const [[bus]] = await db.query(`
            SELECT *
            FROM buses
            WHERE driver_id = ?
        `, [req.session.user.id]);

        res.render('driver/trip-end', {
            bus
        });

    } catch (err) {

        console.error(err);
        res.send("Error loading trip page");

    }

});
// ================= END TRIP =================
router.post('/trip-end', async (req, res) => {

    try {

        await db.query(`
            UPDATE buses
            SET status='inactive'
            WHERE driver_id=?
        `, [req.session.user.id]);

        res.redirect('/driver/trip-end');

    } catch (err) {

        console.error(err);
        res.redirect('/driver/trip-end');

    }

});

// ================= PROFILE =================

// Show Profile
router.get('/profile', async (req, res) => {
    try {

        const [[driver]] = await db.query(
            'SELECT * FROM users WHERE id=?',
            [req.session.user.id]
        );

        res.render('driver/profile', {
            driver,
            message: null
        });

    } catch (err) {
        console.error(err);
        res.send('Error loading profile');
    }
});


// Update Profile
router.put('/profile', async (req, res) => {

    const { name, phone, password } = req.body;

    try {

        // Update password only if entered
        if (password && password.trim() !== '') {

            const hashedPassword = await bcrypt.hash(password, 10);

            await db.query(
                `
                UPDATE users
                SET
                    name = ?,
                    phone = ?,
                    password = ?
                WHERE id = ?
                `,
                [name, phone, hashedPassword, req.session.user.id]
            );

        } else {

            await db.query(
                `
                UPDATE users
                SET
                    name = ?,
                    phone = ?
                WHERE id = ?
                `,
                [name, phone, req.session.user.id]
            );

        }

        // Update session name
        req.session.user.name = name;

        // Get updated driver record
        const [[driver]] = await db.query(
            'SELECT * FROM users WHERE id = ?',
            [req.session.user.id]
        );

        // Reload profile page
        res.render('driver/profile', {
            driver,
            message: 'Profile updated successfully!'
        });

    } catch (err) {

        console.error(err);
        res.redirect('/driver/profile');

    }

});
// ================= NOTIFICATIONS =================
router.get('/notifications', async (req, res) => {

    try {

        // Get driver's assigned bus
        const [[bus]] = await db.query(`
            SELECT id
            FROM buses
            WHERE driver_id = ?
        `, [req.session.user.id]);

        let notifications = [];

        if (bus) {

            // Driver has a bus
            const [rows] = await db.query(`
                SELECT *
                FROM notifications
                WHERE
                    audience = 'all'
                    OR audience = 'drivers'
                    OR (audience = 'bus' AND bus_id = ?)
                ORDER BY created_at DESC
            `, [bus.id]);

            notifications = rows;

        } else {

            // Driver has no bus assigned
            const [rows] = await db.query(`
                SELECT *
                FROM notifications
                WHERE
                    audience = 'all'
                    OR audience = 'drivers'
                ORDER BY created_at DESC
            `);

            notifications = rows;

        }

        res.render('driver/notifications', {
            notifications
        });

    } catch (err) {

        console.error(err);
        res.send(err.message);

    }

});

module.exports = router;