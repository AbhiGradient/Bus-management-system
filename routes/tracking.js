/*
  routes/tracking.js

  Mounted at:

  /tracking

  Examples:

  POST /tracking/start
  POST /tracking/stop
  POST /tracking/update

  GET /tracking/live
  GET /tracking/bus/:busId
*/

const express = require('express');

const router =
    express.Router();

const db =
    require('../config/db');

const isDriver =
    require('../middleware/driverAuth');

const {
    requireAnyRole
} = require('../middleware/auth');

const trackingService =
    require('../services/trackingService');

const {
    isValidCoordinate
} = require('../utils/validators');


// =====================================================
// HELPER
// GET BUS ASSIGNED TO DRIVER
// =====================================================

async function getDriverBus(driverId) {

    const [[bus]] =
        await db.query(

            `
            SELECT
                *

            FROM buses

            WHERE driver_id = ?

            LIMIT 1
            `,

            [driverId]

        );


    return bus || null;

}


// =====================================================
// DRIVER: START JOURNEY
// POST /tracking/start
// =====================================================

router.post(
    '/start',
    isDriver,
    async (req, res) => {

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
                    .json({

                        success: false,

                        message:
                            'No bus is assigned to you.'

                    });

            }


            const journey =
                await trackingService.startJourney(

                    bus.id,

                    driverId

                );


            return res.json({

                success: true,

                message:
                    'Journey started successfully.',

                journey

            });


        } catch (error) {

            console.error(
                '❌ Start journey error:',
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        error.message ||
                        'Could not start journey.'

                });

        }

    }

);


// =====================================================
// DRIVER: STOP JOURNEY
// POST /tracking/stop
// =====================================================

router.post(
    '/stop',
    isDriver,
    async (req, res) => {

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
                    .json({

                        success: false,

                        message:
                            'No bus is assigned to you.'

                    });

            }


            const result =
                await trackingService.endJourney(

                    bus.id,

                    driverId

                );


            return res.json({

                success: true,

                message:
                    'Journey stopped successfully.',

                result

            });


        } catch (error) {

            console.error(
                '❌ Stop journey error:',
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        error.message ||
                        'Could not stop journey.'

                });

        }

    }

);


// =====================================================
// DRIVER: UPDATE GPS LOCATION
// POST /tracking/update
// =====================================================

router.post(
    '/update',
    isDriver,
    async (req, res) => {

        try {

            const {

                latitude,

                longitude,

                speed,

                heading

            } = req.body;


            // -------------------------------------------------
            // Validate GPS
            // -------------------------------------------------

            if (
                !isValidCoordinate(
                    latitude,
                    longitude
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            'Invalid GPS coordinates.'

                    });

            }


            const driverId =
                req.session.user.id;


            // -------------------------------------------------
            // Find driver's bus
            // -------------------------------------------------

            const bus =
                await getDriverBus(
                    driverId
                );


            if (!bus) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            'No bus is assigned to you.'

                    });

            }


            // -------------------------------------------------
            // Update GPS
            // -------------------------------------------------

            const location =
                await trackingService.updateLocation(

                    bus.id,

                    driverId,

                    Number(latitude),

                    Number(longitude),

                    Number(speed) || 0,

                    Number(heading) || 0

                );


            return res.json({

                success: true,

                message:
                    'Location updated successfully.',

                location

            });


        } catch (error) {

            console.error(
                '❌ GPS update error:',
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        error.message ||
                        'Could not update location.'

                });

        }

    }

);


// =====================================================
// LIVE TRACKING
// GET /tracking/live
// =====================================================

router.get(
    '/live',
    requireAnyRole([
        'admin',
        'student',
        'driver'
    ]),
    async (req, res) => {

        try {

            const role =
                req.session.user.role;


            // =================================================
            // ADMIN
            // =================================================

            if (
                role === 'admin'
            ) {

                const locations =
                    await trackingService
                        .getAllLocations();


                return res.json({

                    success: true,

                    locations

                });

            }


            // =================================================
            // STUDENT
            // =================================================

            if (
                role === 'student'
            ) {

                const [[student]] =
                    await db.query(

                        `
                        SELECT
                            bus_id

                        FROM students

                        WHERE user_id = ?

                        LIMIT 1
                        `,

                        [
                            req.session.user.id
                        ]

                    );


                if (
                    !student ||
                    !student.bus_id
                ) {

                    return res.json({

                        success: true,

                        location: null,

                        message:
                            'No bus is assigned to you yet.'

                    });

                }


                const location =
                    await trackingService
                        .getLocation(
                            student.bus_id
                        );


                return res.json({

                    success: true,

                    location

                });

            }


            // =================================================
            // DRIVER
            // =================================================

            if (
                role === 'driver'
            ) {

                const bus =
                    await getDriverBus(

                        req.session.user.id

                    );


                if (!bus) {

                    return res.json({

                        success: true,

                        location: null,

                        message:
                            'No bus is assigned to you.'

                    });

                }


                const location =
                    await trackingService
                        .getLocation(
                            bus.id
                        );


                return res.json({

                    success: true,

                    location

                });

            }


            return res
                .status(403)
                .json({

                    success: false,

                    message:
                        'Unauthorized.'

                });


        } catch (error) {

            console.error(
                '❌ Live tracking error:',
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        'Could not load live tracking data.'

                });

        }

    }

);


// =====================================================
// SINGLE BUS DETAILS
// GET /tracking/bus/:busId
// =====================================================

router.get(
    '/bus/:busId',
    requireAnyRole([
        'admin',
        'student',
        'driver'
    ]),
    async (req, res) => {

        try {

            const busId =
                Number(
                    req.params.busId
                );


            if (
                !Number.isInteger(busId) ||
                busId <= 0
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            'Invalid bus ID.'

                    });

            }


            // -------------------------------------------------
            // Get all tracking information
            // -------------------------------------------------

            const [

                location,

                route,

                eta,

                nextStop,

                activeJourney

            ] = await Promise.all([

                trackingService
                    .getLocation(
                        busId
                    ),

                trackingService
                    .getRouteForBus(
                        busId
                    ),

                trackingService
                    .getETA(
                        busId
                    ),

                trackingService
                    .getNextStop(
                        busId
                    ),

                trackingService
                    .getActiveJourney(
                        busId
                    )

            ]);


            return res.json({

                success: true,

                location,

                route,

                eta,

                nextStop,

                activeJourney

            });


        } catch (error) {

            console.error(
                '❌ Bus tracking error:',
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        'Could not load bus tracking data.'

                });

        }

    }

);


module.exports =
    router;