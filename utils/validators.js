/*
  utils/validators.js

  Central validation helpers used by:
  - Authentication
  - Live GPS tracking
*/


// =====================================================
// EMAIL VALIDATION
// =====================================================

function isValidEmail(email) {

  if (
    typeof email !== 'string' ||
    !email.trim()
  ) {

    return false;

  }

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(
    email.trim()
  );

}


// =====================================================
// GPS COORDINATE VALIDATION
// =====================================================

function isValidCoordinate(
  latitude,
  longitude
) {

  const lat =
    Number(latitude);

  const lng =
    Number(longitude);


  // Latitude must be between -90 and 90

  if (
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90
  ) {

    return false;

  }


  // Longitude must be between -180 and 180

  if (
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180
  ) {

    return false;

  }


  // Prevent fake "0,0" GPS location

  if (
    lat === 0 &&
    lng === 0
  ) {

    return false;

  }


  return true;

}


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

  isValidEmail,

  isValidCoordinate

};