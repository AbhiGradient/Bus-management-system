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

module.exports = { calculateRouteDistance, estimateTravelMinutes, calculateETA, DEFAULT_AVERAGE_SPEED_KMPH };
