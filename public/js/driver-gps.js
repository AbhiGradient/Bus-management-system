/*
    public/js/driver-gps.js

    Driver live GPS tracking.

    Flow:

    Start Journey
        ↓
    Browser requests GPS permission
        ↓
    GPS coordinates are collected
        ↓
    Coordinates are sent to:
        POST /tracking/update

    Stop Journey
        ↓
    GPS tracking stops
        ↓
    Journey is marked COMPLETED
*/


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let gpsWatchId = null;

let isTracking = false;

let lastSentTime = 0;


// Send GPS update every 5 seconds
const GPS_UPDATE_INTERVAL = 5000;


// =====================================================
// GET ELEMENTS
// =====================================================

const startJourneyBtn =
    document.getElementById(
        'startJourneyBtn'
    );

const stopJourneyBtn =
    document.getElementById(
        'stopJourneyBtn'
    );

const gpsStatus =
    document.getElementById(
        'gpsStatus'
    );
    const gpsConnectionBadge =
    document.getElementById(
        'gpsConnectionBadge'
    );

const gpsLocationInfo =
    document.getElementById(
        'gpsLocationInfo'
    );

const gpsLatitude =
    document.getElementById(
        'gpsLatitude'
    );

const gpsLongitude =
    document.getElementById(
        'gpsLongitude'
    );

const gpsSpeed =
    document.getElementById(
        'gpsSpeed'
    );


// =====================================================
// HELPER: UPDATE STATUS
// =====================================================

function updateGPSStatus(
    message,
    type = 'info'
) {

    if (!gpsStatus) {

        return;

    }


    gpsStatus.textContent =
        message;


    gpsStatus.className =
        `gps-status ${type}`;

}


// =====================================================
// START JOURNEY
// =====================================================

async function startJourney() {

    // Prevent duplicate clicks
    if (isTracking) {

        return;

    }


    try {

        updateGPSStatus(
            'Starting journey...',
            'info'
        );


        // -------------------------------------------------
        // Tell server to start journey
        // -------------------------------------------------

        const response =
            await fetch(
                '/tracking/start',
                {

                    method: 'POST',

                    headers: {

                        'Content-Type':
                            'application/json'

                    }

                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(

                data.message ||
                'Could not start journey.'

            );

        }


        console.log(
            'Journey started:',
            data.journey
        );
        // -------------------------------------------------
// Update GPS information on driver dashboard
// -------------------------------------------------

if (gpsConnectionBadge) {

    gpsConnectionBadge.textContent =
        'GPS Online';

    gpsConnectionBadge.className =
        'badge bg-success';

}


if (gpsLocationInfo) {

    gpsLocationInfo.style.display =
        'block';

}


if (gpsLatitude) {

    gpsLatitude.textContent =
        latitude.toFixed(6);

}


if (gpsLongitude) {

    gpsLongitude.textContent =
        longitude.toFixed(6);

}


if (gpsSpeed) {

    gpsSpeed.textContent =
        `${speedKmph.toFixed(1)} km/h`;

}


        // -------------------------------------------------
        // Update UI
        // -------------------------------------------------

        isTracking =
            true;


        if (startJourneyBtn) {

            startJourneyBtn.disabled =
                true;

            startJourneyBtn.style.display =
                'none';

        }


        if (stopJourneyBtn) {

            stopJourneyBtn.disabled =
                false;

            stopJourneyBtn.style.display =
                'inline-block';

        }


        updateGPSStatus(
            'Journey started. Requesting GPS location...',
            'success'
        );


        // -------------------------------------------------
        // Start GPS
        // -------------------------------------------------

        startGPS();


    } catch (error) {

        console.error(
            'Start journey error:',
            error
        );


        updateGPSStatus(

            error.message ||
            'Could not start journey.',

            'error'

        );

    }

}


// =====================================================
// START GPS WATCH
// =====================================================

function startGPS() {

    // -------------------------------------------------
    // Check browser GPS support
    // -------------------------------------------------

    if (
        !navigator.geolocation
    ) {

        updateGPSStatus(

            'GPS is not supported by this browser.',

            'error'

        );

        return;

    }


    updateGPSStatus(

        'Waiting for GPS location permission...',

        'info'

    );


    // -------------------------------------------------
    // Start watching position
    // -------------------------------------------------

    gpsWatchId =
        navigator.geolocation.watchPosition(

            handleGPSPosition,

            handleGPSError,

            {

                enableHighAccuracy: true,

                maximumAge: 5000,

                timeout: 15000

            }

        );

}


// =====================================================
// GPS POSITION RECEIVED
// =====================================================

async function handleGPSPosition(
    position
) {

    if (!isTracking) {

        return;

    }


    const now =
        Date.now();


    // -------------------------------------------------
    // Avoid sending GPS too frequently
    // -------------------------------------------------

    if (
        now - lastSentTime <
        GPS_UPDATE_INTERVAL
    ) {

        return;

    }


    lastSentTime =
        now;


    // -------------------------------------------------
    // Extract GPS data
    // -------------------------------------------------

    const latitude =
        position.coords.latitude;

    const longitude =
        position.coords.longitude;

    const speedMetersPerSecond =
        position.coords.speed;

    const heading =
        position.coords.heading;


    // -------------------------------------------------
    // Convert speed:
    //
    // m/s → km/h
    // -------------------------------------------------

    let speedKmph =
        0;


    if (
        speedMetersPerSecond !== null &&
        speedMetersPerSecond >= 0
    ) {

        speedKmph =
            speedMetersPerSecond *
            3.6;

    }


    // -------------------------------------------------
    // Send location to server
    // -------------------------------------------------

    try {

        updateGPSStatus(

            'Sending live GPS location...',

            'info'

        );


        const response =
            await fetch(

                '/tracking/update',

                {

                    method: 'POST',

                    headers: {

                        'Content-Type':
                            'application/json'

                    },

                    body:
                        JSON.stringify({

                            latitude,

                            longitude,

                            speed:
                                speedKmph,

                            heading:
                                heading || 0

                        })

                }

            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(

                data.message ||
                'GPS update failed.'

            );

        }


        console.log(

            'GPS updated:',

            data.location

        );


        updateGPSStatus(

            `Live GPS active • ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,

            'success'

        );


    } catch (error) {

        console.error(

            'GPS update error:',

            error

        );


        updateGPSStatus(

            error.message ||
            'Could not send GPS location.',

            'error'

        );

    }

}


// =====================================================
// GPS ERROR
// =====================================================

function handleGPSError(
    error
) {

    console.error(
        'GPS error:',
        error
    );


    let message =
        'Unable to get GPS location.';


    switch (
        error.code
    ) {

        case error.PERMISSION_DENIED:

            message =
                'GPS permission denied. Please allow location access.';

            break;


        case error.POSITION_UNAVAILABLE:

            message =
                'GPS position is currently unavailable.';

            break;


        case error.TIMEOUT:

            message =
                'GPS request timed out. Trying again...';

            break;

    }


    updateGPSStatus(

        message,

        'error'

    );

}


// =====================================================
// STOP JOURNEY
// =====================================================

async function stopJourney() {

    if (!isTracking) {

        return;

    }


    try {

        updateGPSStatus(

            'Stopping journey...',

            'info'

        );


        // -------------------------------------------------
        // Stop browser GPS watcher
        // -------------------------------------------------

        if (
            gpsWatchId !== null
        ) {

            navigator.geolocation.clearWatch(

                gpsWatchId

            );

            gpsWatchId =
                null;

        }


        // -------------------------------------------------
        // Tell server to stop journey
        // -------------------------------------------------

        const response =
            await fetch(

                '/tracking/stop',

                {

                    method: 'POST',

                    headers: {

                        'Content-Type':
                            'application/json'

                    }

                }

            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(

                data.message ||
                'Could not stop journey.'

            );

        }


        // -------------------------------------------------
        // Update state
        // -------------------------------------------------

        isTracking =
            false;


        lastSentTime =
            0;


        // -------------------------------------------------
        // Update UI
        // -------------------------------------------------

        if (startJourneyBtn) {

            startJourneyBtn.disabled =
                false;

            startJourneyBtn.style.display =
                'inline-block';

        }


        if (stopJourneyBtn) {

            stopJourneyBtn.disabled =
                true;

            stopJourneyBtn.style.display =
                'none';

        }


        updateGPSStatus(

            'Journey completed successfully.',

            'success'

        );


        console.log(
            'Journey stopped:',
            data
        );


    } catch (error) {

        console.error(

            'Stop journey error:',

            error

        );


        updateGPSStatus(

            error.message ||
            'Could not stop journey.',

            'error'

        );

    }

}


// =====================================================
// BUTTON EVENTS
// =====================================================

if (
    startJourneyBtn
) {

    startJourneyBtn.addEventListener(

        'click',

        startJourney

    );

}


if (
    stopJourneyBtn
) {

    stopJourneyBtn.addEventListener(

        'click',

        stopJourney

    );

}


// =====================================================
// INITIAL UI STATE
// =====================================================

if (
    stopJourneyBtn
) {

    stopJourneyBtn.disabled =
        true;

    stopJourneyBtn.style.display =
        'none';

}


console.log(
    '🚍 Driver GPS tracking script loaded.'
);