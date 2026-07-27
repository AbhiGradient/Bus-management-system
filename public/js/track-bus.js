/*
  public/js/track-bus.js
  Drives the single-bus map on views/student/track-bus.ejs.

  Unlike the admin fleet map (public/js/live-tracking.js), this joins ONE
  Socket.IO room via 'joinBus' and only ever listens for that bus's
  room-scoped 'busLocation' event (see server.js and
  services/trackingService.js#updateLocation), so a student never receives
  another bus's position.
*/
(function () {
  const mapEl = document.getElementById('trackMap');
  if (!mapEl) return;

  const busId = mapEl.dataset.busId;
  if (!busId) return;

  const NARHE_FALLBACK_CENTER = [18.4600, 73.8080];

  const map = L.map('trackMap').setView(NARHE_FALLBACK_CENTER, 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  const busIcon = L.divIcon({
    className: 'bus-marker',
    html: '<div class="bus-marker-dot"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
  const stopIcon = L.divIcon({
    className: 'stop-marker',
    html: '<div class="stop-marker-dot"></div>',
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });

  let busMarker = null;
  let routeLine = null;
  let stopMarkers = [];
  let hasCenteredOnBus = false;

  function setBusPosition(lat, lng) {
    if (!lat || !lng) return; // skip the (0,0) placeholder row inserted on Start Journey
    if (busMarker) {
      busMarker.setLatLng([lat, lng]);
    } else {
      busMarker = L.marker([lat, lng], { icon: busIcon }).addTo(map);
    }
    if (!hasCenteredOnBus) {
      map.setView([lat, lng], 15);
      hasCenteredOnBus = true;
    }
  }

  function drawRoute(route) {
    if (!route || !Array.isArray(route.stops) || !route.stops.length) return;

    if (routeLine) map.removeLayer(routeLine);
    stopMarkers.forEach(function (m) { map.removeLayer(m); });
    stopMarkers = [];

    const latlngs = route.stops.map(function (s) { return [Number(s.latitude), Number(s.longitude)]; });
    routeLine = L.polyline(latlngs, { color: '#1F5C4F', weight: 4, opacity: 0.7 }).addTo(map);

    route.stops.forEach(function (stop) {
      const m = L.marker([Number(stop.latitude), Number(stop.longitude)], { icon: stopIcon })
        .addTo(map)
        .bindPopup(
          '<strong>' + stop.stop_name + '</strong>' +
          (stop.expected_arrival ? '<br/>Arrival: ' + String(stop.expected_arrival).slice(0, 5) : '')
        );
      stopMarkers.push(m);
    });

    if (!hasCenteredOnBus) {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30] });
    }
  }

  function updateStatusPanel(data) {
    const statusEl = document.getElementById('journeyStatus');
    const speedEl = document.getElementById('busSpeed');
    const etaEl = document.getElementById('busEta');
    const nextStopEl = document.getElementById('nextStop');

    if (statusEl) statusEl.textContent = data.activeJourney ? 'Running' : 'Not started yet';
    if (speedEl && data.location) speedEl.textContent = Number(data.location.speed || 0).toFixed(0) + ' km/h';
    if (etaEl) etaEl.textContent = data.eta ? data.eta.etaMinutes + ' min (' + data.eta.distanceKm + ' km)' : '—';
    if (nextStopEl) nextStopEl.textContent = data.nextStop ? data.nextStop.stop_name : '—';
  }

  // -------- Full snapshot: position + route + ETA + next stop + journey status --------
  function loadBusDetails() {
    fetch('/tracking/bus/' + busId)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.success) return;
        if (data.location) {
          setBusPosition(Number(data.location.latitude), Number(data.location.longitude));
        }
        drawRoute(data.route);
        updateStatusPanel(data);
      })
      .catch(function (err) { console.error('Could not load bus details', err); });
  }

  loadBusDetails();
  // ETA and next-stop drift a little between GPS pings — a light periodic
  // refresh keeps them honest without hammering the server.
  setInterval(loadBusDetails, 20000);

  // -------- Live position over Socket.IO, scoped to just this bus's room --------
  const socket = io();
  socket.emit('joinBus', busId);

  socket.on('busLocation', function (loc) {
    setBusPosition(Number(loc.latitude), Number(loc.longitude));
    const speedEl = document.getElementById('busSpeed');
    if (speedEl) speedEl.textContent = Number(loc.speed || 0).toFixed(0) + ' km/h';
  });

  socket.on('journeyStarted', loadBusDetails);
  socket.on('journeyEnded', loadBusDetails);
})();