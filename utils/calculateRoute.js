/*
  utils/calculateRoute.js
  Route-level helpers built on top of utils/distance.js. Used by
  services/trackingService.js to turn a bus's live GPS position into an
  ETA for the "Live Tracking" nav item (see views/partials/sidebar.ejs).

  No external maps API key exists in this project (config/ only has
  db, mailer, multer, razorpay), so this intentionally stays a
  straight-line estimate rather than calling a routing provider.
*/

const { getDistanceKm } = require('./distance');

// Reasonable default for a city college-bus route; callers can override.
const DEFAULT_AVERAGE_SPEED_KMPH = 30;

// -------- Total distance (km) along an ordered list of {lat, lng} stops --------
function calculateRouteDistance(stops) {
  if (!Array.isArray(stops) || stops.length < 2) return 0;

  let totalKm = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    totalKm += getDistanceKm(a.lat, a.lng, b.lat, b.lng);
  }
  return Number(totalKm.toFixed(2));
}

// -------- Estimated minutes to travel a given distance at a given speed --------
function estimateTravelMinutes(distanceKm, avgSpeedKmph = DEFAULT_AVERAGE_SPEED_KMPH) {
  if (!distanceKm || distanceKm <= 0 || !avgSpeedKmph) return 0;
  return Math.round((distanceKm / avgSpeedKmph) * 60);
}

// -------- ETA from the bus's current position to a destination point --------
// currentSpeedKmph, when the bus is actively moving, is preferred over the
// default average so the estimate reflects real traffic conditions.
function calculateETA(currentLat, currentLng, destLat, destLng, currentSpeedKmph) {
  const distanceKm = getDistanceKm(currentLat, currentLng, destLat, destLng);
  const speed = currentSpeedKmph && currentSpeedKmph > 5 ? currentSpeedKmph : DEFAULT_AVERAGE_SPEED_KMPH;

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    etaMinutes: estimateTravelMinutes(distanceKm, speed)
  };
}

// -------- ETA to the LAST stop of a route (the campus drop-off), using route_stops rows --------
// `stops` is the array returned by `SELECT * FROM route_stops WHERE route_id = ? ORDER BY stop_order`.
// Falls back to null when there isn't at least one stop to aim for.
function calculateETAToDestination(currentLat, currentLng, stops, currentSpeedKmph) {
  if (!Array.isArray(stops) || stops.length === 0) return null;

  const destination = stops[stops.length - 1]; // highest stop_order = final stop
  const eta = calculateETA(
    currentLat,
    currentLng,
    Number(destination.latitude),
    Number(destination.longitude),
    currentSpeedKmph
  );

  return { ...eta, destinationStop: destination.stop_name };
}

// -------- Which stop is the bus heading to next, based on straight-line proximity --------
// Simple nearest-unreached-stop heuristic: the first stop (in stop_order) that
// the bus hasn't effectively reached yet (>150m away). Good enough without a
// routing engine; no external maps API key exists in this project.
function findNextStop(currentLat, currentLng, stops, reachedRadiusMeters = 150) {
  if (!Array.isArray(stops) || stops.length === 0) return null;

  for (const stop of stops) {
    const distanceKm = getDistanceKm(currentLat, currentLng, Number(stop.latitude), Number(stop.longitude));
    if (distanceKm * 1000 > reachedRadiusMeters) return stop;
  }

  return stops[stops.length - 1]; // already within range of every stop -> final stop
}

module.exports = {
  calculateRouteDistance,
  estimateTravelMinutes,
  calculateETA,
  calculateETAToDestination,
  findNextStop,
  DEFAULT_AVERAGE_SPEED_KMPH
};