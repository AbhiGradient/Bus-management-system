/*
  services/trackingService.js

  Live bus GPS tracking service.

  Database tables used:

  buses
  bus_route_assignment
  routes
  route_stops
  journeys
  live_locations
  journey_locations

  Responsibilities:

  1. Start a bus journey
  2. End a bus journey
  3. Receive GPS coordinates
  4. Store latest GPS location
  5. Store GPS history
  6. Broadcast live GPS through Socket.IO
  7. Return route and stop information
  8. Calculate ETA
  9. Find next bus stop
*/

const db = require('../config/db');

const {
    calculateETAToDestination,
    findNextStop
} = require('../utils/calculateRoute');

const {
    isValidCoordinate
} = require('../utils/validators');


// =====================================================
// SOCKET.IO INSTANCE
// =====================================================

let ioInstance = null;


/*
  Called once from server.js.

  server.js:

  trackingService.setIO(io);
*/

function setIO(io) {

    ioInstance = io;

    console.log(
        '📡 Tracking service connected to Socket.IO'
    );

}


// =====================================================
// GET ROUTE ASSIGNED TO BUS
// =====================================================

async function getRouteForBus(busId) {

    const [[route]] = await db.query(

        `
        SELECT
            r.*
        FROM bus_route_assignment bra

        INNER JOIN routes r
            ON r.id = bra.route_id

        WHERE bra.bus_id = ?

        LIMIT 1
        `,

        [busId]

    );


    if (!route) {

        return null;

    }


    const [stops] = await db.query(

        `
        SELECT
            *
        FROM route_stops

        WHERE route_id = ?

        ORDER BY stop_order ASC
        `,

        [route.id]

    );


    return {

        ...route,

        stops

    };

}


// =====================================================
// GET ACTIVE JOURNEY
// =====================================================

async function getActiveJourney(busId) {

    const [[journey]] = await db.query(

        `
        SELECT
            *
        FROM journeys

        WHERE bus_id = ?

        AND status = 'RUNNING'

        ORDER BY id DESC

        LIMIT 1
        `,

        [busId]

    );


    return journey || null;

}


// =====================================================
// START JOURNEY
// =====================================================

async function startJourney(busId, driverId) {

    // -------------------------------------------------
    // Check bus exists
    // -------------------------------------------------

    const [[bus]] = await db.query(

        `
        SELECT
            *
        FROM buses

        WHERE id = ?

        LIMIT 1
        `,

        [busId]

    );


    if (!bus) {

        throw new Error(
            'Bus not found.'
        );

    }


    // -------------------------------------------------
    // Verify driver is assigned to this bus
    // -------------------------------------------------

    if (
        bus.driver_id &&
        Number(bus.driver_id) !== Number(driverId)
    ) {

        throw new Error(
            'You are not assigned to this bus.'
        );

    }


    // -------------------------------------------------
    // Check whether journey already running
    // -------------------------------------------------

    const existingJourney =
        await getActiveJourney(busId);


    if (existingJourney) {

        return existingJourney;

    }


    // -------------------------------------------------
    // Find assigned route
    // -------------------------------------------------

    const [[assignment]] = await db.query(

        `
        SELECT
            route_id

        FROM bus_route_assignment

        WHERE bus_id = ?

        LIMIT 1
        `,

        [busId]

    );


    if (
        !assignment ||
        !assignment.route_id
    ) {

        throw new Error(
            'This bus has no route assigned yet.'
        );

    }


    const routeId =
        assignment.route_id;


    // -------------------------------------------------
    // Create journey
    // -------------------------------------------------

    const [result] = await db.query(

        `
        INSERT INTO journeys
        (
            bus_id,
            driver_id,
            route_id,
            journey_date,
            started_at,
            status
        )

        VALUES
        (
            ?,
            ?,
            ?,
            CURDATE(),
            NOW(),
            'RUNNING'
        )
        `,

        [
            busId,
            driverId,
            routeId
        ]

    );


    const journeyId =
        result.insertId;


    // -------------------------------------------------
    // Reset / create live location row
    //
    // IMPORTANT:
    //
    // We DO NOT insert latitude = 0
    // longitude = 0.
    //
    // The first real GPS update will create
    // the live_locations row.
    // -------------------------------------------------

    await db.query(

        `
        UPDATE live_locations

        SET
            driver_id = ?,
            journey_status = 'RUNNING'

        WHERE bus_id = ?
        `,

        [
            driverId,
            busId
        ]

    );


    // -------------------------------------------------
    // Notify connected clients
    // -------------------------------------------------

    if (ioInstance) {

        ioInstance.emit(

            'journeyStarted',

            {

                busId: Number(busId),

                driverId: Number(driverId),

                journeyId: Number(journeyId)

            }

        );

    }


    // -------------------------------------------------
    // Return newly created journey
    // -------------------------------------------------

    const [[journey]] = await db.query(

        `
        SELECT
            *
        FROM journeys

        WHERE id = ?

        LIMIT 1
        `,

        [journeyId]

    );


    return journey;

}


// =====================================================
// END JOURNEY
// =====================================================

async function endJourney(
    busId,
    driverId = null
) {

    // -------------------------------------------------
    // Find active journey
    // -------------------------------------------------

    let journey;


    if (driverId) {

        const [[foundJourney]] =
            await db.query(

                `
                SELECT
                    *
                FROM journeys

                WHERE bus_id = ?

                AND driver_id = ?

                AND status = 'RUNNING'

                ORDER BY id DESC

                LIMIT 1
                `,

                [
                    busId,
                    driverId
                ]

            );


        journey =
            foundJourney;

    } else {

        journey =
            await getActiveJourney(busId);

    }


    if (!journey) {

        return {

            success: true,

            message:
                'No active journey found.'

        };

    }


    // -------------------------------------------------
    // Complete journey
    // -------------------------------------------------

    await db.query(

        `
        UPDATE journeys

        SET
            status = 'COMPLETED',
            ended_at = NOW()

        WHERE id = ?
        `,

        [journey.id]

    );


    // -------------------------------------------------
    // Update live location status
    //
    // Keep the latest GPS coordinates.
    // Only change journey status.
    // -------------------------------------------------

    await db.query(

        `
        UPDATE live_locations

        SET
            journey_status = 'COMPLETED'

        WHERE bus_id = ?
        `,

        [busId]

    );


    // -------------------------------------------------
    // Notify clients
    // -------------------------------------------------

    if (ioInstance) {

        ioInstance.emit(

            'journeyEnded',

            {

                busId: Number(busId),

                journeyId:
                    Number(journey.id)

            }

        );

    }


    return {

        success: true,

        journeyId:
            journey.id

    };

}


// =====================================================
// UPDATE BUS LOCATION
// =====================================================

async function updateLocation(
    busId,
    driverId,
    latitude,
    longitude,
    speed = 0,
    heading = 0
) {

    // -------------------------------------------------
    // Validate coordinates
    // -------------------------------------------------

    if (
        !isValidCoordinate(
            latitude,
            longitude
        )
    ) {

        throw new Error(
            'Invalid GPS coordinates.'
        );

    }


    // -------------------------------------------------
    // Verify bus belongs to driver
    // -------------------------------------------------

    const [[bus]] = await db.query(

        `
        SELECT
            id,
            driver_id

        FROM buses

        WHERE id = ?

        LIMIT 1
        `,

        [busId]

    );


    if (!bus) {

        throw new Error(
            'Bus not found.'
        );

    }


    if (
        bus.driver_id &&
        Number(bus.driver_id) !== Number(driverId)
    ) {

        throw new Error(
            'You are not assigned to this bus.'
        );

    }


    // -------------------------------------------------
    // Make sure journey is active
    // -------------------------------------------------

    const journey =
        await getActiveJourney(busId);


    if (!journey) {

        throw new Error(
            'No active journey. Please start the journey first.'
        );

    }


    // -------------------------------------------------
    // Sanitize speed and heading
    // -------------------------------------------------

    speed =
        Number(speed) || 0;

    heading =
        Number(heading) || 0;


    // Prevent invalid negative speed
    if (speed < 0) {

        speed = 0;

    }


    // -------------------------------------------------
    // Update latest live location
    //
    // live_locations has UNIQUE(bus_id)
    //
    // So this creates the row on first GPS ping
    // and updates it afterwards.
    // -------------------------------------------------

    await db.query(

        `
        INSERT INTO live_locations
        (
            bus_id,
            driver_id,
            latitude,
            longitude,
            speed,
            heading,
            journey_status
        )

        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'RUNNING'
        )

        ON DUPLICATE KEY UPDATE

            driver_id =
                VALUES(driver_id),

            latitude =
                VALUES(latitude),

            longitude =
                VALUES(longitude),

            speed =
                VALUES(speed),

            heading =
                VALUES(heading),

            journey_status =
                'RUNNING'
        `,

        [
            busId,
            driverId,
            latitude,
            longitude,
            speed,
            heading
        ]

    );


    // -------------------------------------------------
    // Save GPS history
    // -------------------------------------------------

    await db.query(

        `
        INSERT INTO journey_locations
        (
            journey_id,
            latitude,
            longitude,
            speed,
            heading
        )

        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?
        )
        `,

        [
            journey.id,
            latitude,
            longitude,
            speed,
            heading
        ]

    );


    // -------------------------------------------------
    // Prepare response object
    // -------------------------------------------------

    const location = {

        busId:
            Number(busId),

        driverId:
            Number(driverId),

        journeyId:
            Number(journey.id),

        latitude:
            Number(latitude),

        longitude:
            Number(longitude),

        speed:
            Number(speed),

        heading:
            Number(heading),

        journeyStatus:
            'RUNNING',

        updatedAt:
            new Date()

    };


    // -------------------------------------------------
    // Broadcast to specific bus room
    //
    // Student tracking page should join:
    //
    // socket.emit('joinBus', busId)
    //
    // Then it receives:
    //
    // busLocation
    // -------------------------------------------------

    if (ioInstance) {

        ioInstance
            .to(`bus-${busId}`)
            .emit(
                'busLocation',
                location
            );


        // -------------------------------------------------
        // Broadcast to entire fleet
        //
        // Admin live tracking page can listen to this.
        // -------------------------------------------------

        ioInstance.emit(

            'busLocationUpdate',

            location

        );

    }


    return location;

}


// =====================================================
// GET LATEST LOCATION OF ONE BUS
// =====================================================

async function getLocation(busId) {

    const [[row]] =
        await db.query(

            `
            SELECT
                ll.*,

                b.bus_number,

                b.route_name,

                b.status AS bus_status

            FROM live_locations ll

            INNER JOIN buses b
                ON b.id = ll.bus_id

            WHERE ll.bus_id = ?

            LIMIT 1
            `,

            [busId]

        );


    return row || null;

}


// =====================================================
// GET ALL ACTIVE BUS LOCATIONS
// =====================================================

async function getAllLocations() {

    const [rows] =
        await db.query(

            `
            SELECT

                ll.*,

                b.bus_number,

                b.route_name,

                b.status AS bus_status,

                r.route_name AS assigned_route_name

            FROM live_locations ll

            INNER JOIN buses b
                ON b.id = ll.bus_id

            LEFT JOIN bus_route_assignment bra
                ON bra.bus_id = b.id

            LEFT JOIN routes r
                ON r.id = bra.route_id

            WHERE b.status = 'active'

            AND ll.journey_status = 'RUNNING'

            ORDER BY b.bus_number ASC
            `

        );


    return rows;

}


// =====================================================
// CALCULATE ETA
// =====================================================

async function getETA(busId) {

    const location =
        await getLocation(busId);


    if (!location) {

        return null;

    }


    const route =
        await getRouteForBus(busId);


    if (
        !route ||
        !route.stops ||
        route.stops.length === 0
    ) {

        return null;

    }


    return calculateETAToDestination(

        Number(location.latitude),

        Number(location.longitude),

        route.stops,

        Number(location.speed)

    );

}


// =====================================================
// FIND NEXT STOP
// =====================================================

async function getNextStop(busId) {

    const location =
        await getLocation(busId);


    if (!location) {

        return null;

    }


    const route =
        await getRouteForBus(busId);


    if (
        !route ||
        !route.stops ||
        route.stops.length === 0
    ) {

        return null;

    }


    return findNextStop(

        Number(location.latitude),

        Number(location.longitude),

        route.stops

    );

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    setIO,

    getRouteForBus,

    getActiveJourney,

    startJourney,

    endJourney,

    updateLocation,

    getLocation,

    getAllLocations,

    getETA,

    getNextStop

};