/*
  utils/distance.js
  Pure geo-math helpers, no DB/IO. Consumed by utils/calculateRoute.js and
  services/trackingService.js wherever a straight-line distance between two
  GPS points is needed (live tracking, ETA estimates, route length).
*/

const EARTH_RADIUS_KM = 6371;

// Convert degrees to radians
const toRad = (deg) => (deg * Math.PI) / 180;

// -------- Haversine great-circle distance between two GPS points (km) --------
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// -------- Same as above but returns metres (useful for "arrived" checks) --------
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  return getDistanceKm(lat1, lon1, lat2, lon2) * 1000;
}

// -------- Is point within radiusMeters of a target point? --------
function isWithinRadius(lat1, lon1, lat2, lon2, radiusMeters) {
  return getDistanceMeters(lat1, lon1, lat2, lon2) <= radiusMeters;
}

module.exports = { getDistanceKm, getDistanceMeters, isWithinRadius, toRad };
