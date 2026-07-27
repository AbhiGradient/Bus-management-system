const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const db = require('../config/db');

// Driver authentication
const isDriver = require('../middleware/driverAuth');

// Real tracking service
const trackingService = require('../services/trackingService');

// All routes in this file require driver login
router.use(isDriver);


// =====================================================
// HELPER: GET LOGGED-IN DRIVER
// =====================================================

async function getDriverRecord(userId) {

    const [[driver]] = await db.query(
        `
        SELECT *
        FROM users
        WHERE id = ?
        AND role = 'driver'
        `,
        [userId]
    );

    return driver || null;
}


// =====================================================
// HELPER: GET DRIVER'S ASSIGNED BUS
// =====================================================

async function getDriverBus(driverId) {

    const [[bus]] = await db.query(
        `
        SELECT *
        FROM buses
        WHERE driver_id = ?
        LIMIT 1
        `,
        [driverId]
    );

    return bus || null;
}


// =====================================================
// DASHBOARD
// =====================================================

router.get('/dashboard', async (req, res) => {

    try {

        const driver =
            await getDriverRecord(
                req.session.user.id
            );


        const bus =
            await getDriverBus(
                req.session.user.id
            );


        let students = [];


        if (bus) {

            const [rows] = await db.query(
                `
                SELECT
                    s.roll_no,
                    s.department,
                    s.year,
                    u.name,
                    u.phone
                FROM students s
                JOIN users u
                    ON s.user_id = u.id
                WHERE s.bus_id = ?
                ORDER BY u.name
                `,
                [bus.id]
            );

            students = rows;

        }


        // Check whether this bus currently
        // has a running journey

        let activeJourney = null;

        if (bus) {

            activeJourney =
                await trackingService.getActiveJourney(
                    bus.id
                );

        }


        res.render(
            'driver/driver-dashboard',
            {
                driver,
                bus,
                students,
                activeJourney
            }
        );


    } catch (err) {

        console.error(
            'Driver dashboard error:',
            err
        );

        res.status(500).send(
            'Error loading dashboard'
        );

    }

});


// =====================================================
// TODAY'S ROUTE
// =====================================================

router.get('/today-route', async (req, res) => {

    try {

        const bus =
            await getDriverBus(
                req.session.user.id
            );


        let students = [];

        let route = null;


        if (bus) {

            // Get students assigned to this bus

            const [rows] = await db.query(
                `
                SELECT
                    s.roll_no,
                    s.department,
                    s.year,
                    u.name,
                    u.phone
                FROM students s
                JOIN users u
                    ON s.user_id = u.id
                WHERE s.bus_id = ?
                ORDER BY u.name
                `,
                [bus.id]
            );

            students = rows;


            // Get the real route assigned
            // to this bus

            route =
                await trackingService.getRouteForBus(
                    bus.id
                );

        }


        res.render(
            'driver/today-route',
            {
                bus,
                students,
                route
            }
        );


    } catch (err) {

        console.error(
            'Today route error:',
            err
        );

        res.status(500).send(
            "Error loading today's route"
        );

    }

});


// =====================================================
// START TRIP PAGE
// =====================================================

router.get('/trip-start', async (req, res) => {

    try {

        const bus =
            await getDriverBus(
                req.session.user.id
            );


        let activeJourney = null;


        if (bus) {

            activeJourney =
                await trackingService.getActiveJourney(
                    bus.id
                );

        }


        res.render(
            'driver/trip-start',
            {
                bus,
                activeJourney
            }
        );


    } catch (err) {

        console.error(
            'Trip start page error:',
            err
        );

        res.status(500).send(
            'Error loading trip start page'
        );

    }

});


// =====================================================
// START REAL JOURNEY
// =====================================================

router.post('/trip-start', async (req, res) => {

    try {

        const driverId =
            req.session.user.id;


        const bus =
            await getDriverBus(
                driverId
            );


        if (!bus) {

            return res
                .status(404)
                .send(
                    'No bus has been assigned to you.'
                );

        }


        // Start the REAL journey

        const journey =
            await trackingService.startJourney(
                bus.id,
                driverId
            );


        // Keep the old bus status
        // synchronized with trip state

        await db.query(
            `
            UPDATE buses
            SET status = 'active'
            WHERE id = ?
            `,
            [bus.id]
        );


        console.log(
            `🚌 Journey ${journey.id} started for Bus ${bus.bus_number}`
        );


        res.redirect(
            '/driver/trip-start'
        );


    } catch (err) {

        console.error(
            'Start journey error:',
            err
        );


        res.status(500).send(
            err.message ||
            'Could not start journey.'
        );

    }

});


// =====================================================
// END TRIP PAGE
// =====================================================

router.get('/trip-end', isDriver, async (req, res) => {

    const driverId = req.session.user.id;

    const [[bus]] = await db.query(
        'SELECT * FROM buses WHERE driver_id=? LIMIT 1',
        [driverId]
    );

    let activeJourney = null;

    if (bus) {
        activeJourney = await trackingService.getActiveJourney(bus.id);
    }

    res.render('driver/trip-end', {
        user: req.session.user,
        bus,
        activeJourney
    });

});


// =====================================================
// END REAL JOURNEY
// =====================================================

router.post('/trip-end', async (req, res) => {

    try {

        const driverId =
            req.session.user.id;


        const bus =
            await getDriverBus(
                driverId
            );


        if (!bus) {

            return res
                .status(404)
                .send(
                    'No bus has been assigned to you.'
                );

        }


        // End the REAL journey

        await trackingService.endJourney(
            bus.id
        );


        // Keep old bus status synchronized

        await db.query(
            `
            UPDATE buses
            SET status = 'inactive'
            WHERE id = ?
            `,
            [bus.id]
        );


        console.log(
            `🛑 Journey ended for Bus ${bus.bus_number}`
        );


        res.redirect(
            '/driver/trip-end'
        );


    } catch (err) {

        console.error(
            'End journey error:',
            err
        );


        res.status(500).send(
            'Could not end journey.'
        );

    }

});


// =====================================================
// LIVE LOCATION PAGE
// =====================================================

router.get('/live-location', async (req, res) => {

    try {

        const bus =
            await getDriverBus(
                req.session.user.id
            );


        if (!bus) {

            return res.render(
                'driver/live-location',
                {
                    bus: null,
                    location: null,
                    activeJourney: null
                }
            );

        }


        // Get current location

        const location =
            await trackingService.getLocation(
                bus.id
            );


        // Check active journey

        const activeJourney =
            await trackingService.getActiveJourney(
                bus.id
            );


        res.render(
            'driver/live-location',
            {
                bus,
                location,
                activeJourney
            }
        );


    } catch (err) {

        console.error(
            'Live location page error:',
            err
        );

        res.status(500).send(
            'Error loading live location page'
        );

    }

});


// =====================================================
// UPDATE DRIVER GPS LOCATION
// =====================================================
// This endpoint is used by the Live Location page.
// Browser GPS sends coordinates here.
//
// POST /driver/live-location/update
//
// Body:
// {
//     latitude: 18.5204,
//     longitude: 73.8567,
//     speed: 25,
//     heading: 90
// }

router.post(
    '/live-location/update',
    async (req, res) => {

        try {

            const driverId =
                req.session.user.id;


            const {
                latitude,
                longitude,
                speed,
                heading
            } = req.body;


            const bus =
                await getDriverBus(
                    driverId
                );


            if (!bus) {

                return res.status(404).json({

                    success: false,

                    message:
                        'No bus has been assigned to you.'

                });

            }


            // Make sure the driver
            // actually started a journey

            const activeJourney =
                await trackingService.getActiveJourney(
                    bus.id
                );


            if (!activeJourney) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Please start your trip before sharing your location.'

                });

            }


            // Send GPS location to the
            // REAL tracking service

            const location =
                await trackingService.updateLocation(
                    bus.id,
                    driverId,
                    latitude,
                    longitude,
                    speed || 0,
                    heading || 0
                );


            res.json({

                success: true,

                location

            });


        } catch (err) {

            console.error(
                'GPS update error:',
                err
            );


            res.status(500).json({

                success: false,

                message:
                    err.message ||
                    'Could not update GPS location.'

            });

        }

    }
);


// =====================================================
// GET CURRENT LIVE LOCATION
// =====================================================

router.get(
    '/live-location/data',
    async (req, res) => {

        try {

            const driverId =
                req.session.user.id;


            const bus =
                await getDriverBus(
                    driverId
                );


            if (!bus) {

                return res.json({

                    success: false,

                    location: null,

                    message:
                        'No bus assigned.'

                });

            }


            const location =
                await trackingService.getLocation(
                    bus.id
                );


            const activeJourney =
                await trackingService.getActiveJourney(
                    bus.id
                );


            res.json({

                success: true,

                location,

                activeJourney

            });


        } catch (err) {

            console.error(
                'Live location data error:',
                err
            );


            res.status(500).json({

                success: false,

                message:
                    'Could not load live location.'

            });

        }

    }
);


// =====================================================
// DRIVER PROFILE
// =====================================================

// Show Profile

router.get('/profile', async (req, res) => {

    try {

        const [[driver]] =
            await db.query(
                `
                SELECT *
                FROM users
                WHERE id = ?
                `,
                [req.session.user.id]
            );


        res.render(
            'driver/profile',
            {
                driver,
                message: null
            }
        );


    } catch (err) {

        console.error(
            'Profile error:',
            err
        );

        res.status(500).send(
            'Error loading profile'
        );

    }

});


// Update Profile

router.put('/profile', async (req, res) => {

    const {
        name,
        phone,
        password
    } = req.body;


    try {

        if (
            password &&
            password.trim() !== ''
        ) {

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            await db.query(
                `
                UPDATE users
                SET
                    name = ?,
                    phone = ?,
                    password = ?
                WHERE id = ?
                `,
                [
                    name,
                    phone,
                    hashedPassword,
                    req.session.user.id
                ]
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
                [
                    name,
                    phone,
                    req.session.user.id
                ]
            );

        }


        // Update session name

        req.session.user.name =
            name;


        // Get updated driver

        const [[driver]] =
            await db.query(
                `
                SELECT *
                FROM users
                WHERE id = ?
                `,
                [req.session.user.id]
            );


        res.render(
            'driver/profile',
            {
                driver,
                message:
                    'Profile updated successfully!'
            }
        );


    } catch (err) {

        console.error(
            'Profile update error:',
            err
        );


        res.redirect(
            '/driver/profile'
        );

    }

});


// =====================================================
// NOTIFICATIONS
// =====================================================

router.get(
    '/notifications',
    async (req, res) => {

        try {

            const [[bus]] =
                await db.query(
                    `
                    SELECT id
                    FROM buses
                    WHERE driver_id = ?
                    `,
                    [req.session.user.id]
                );


            let notifications = [];


            if (bus) {

                const [rows] =
                    await db.query(
                        `
                        SELECT *
                        FROM notifications
                        WHERE
                            audience = 'all'
                            OR audience = 'drivers'
                            OR (
                                audience = 'bus'
                                AND bus_id = ?
                            )
                        ORDER BY created_at DESC
                        `,
                        [bus.id]
                    );


                notifications =
                    rows;

            } else {

                const [rows] =
                    await db.query(
                        `
                        SELECT *
                        FROM notifications
                        WHERE
                            audience = 'all'
                            OR audience = 'drivers'
                        ORDER BY created_at DESC
                        `
                    );


                notifications =
                    rows;

            }


            res.render(
                'driver/notifications',
                {
                    notifications
                }
            );


        } catch (err) {

            console.error(
                'Notifications error:',
                err
            );


            res.status(500).send(
                err.message
            );

        }

    }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;