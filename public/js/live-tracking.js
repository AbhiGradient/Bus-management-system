/*
  public/js/live-tracking.js
  Drives the map on views/admin/live-tracking.ejs.

  Data flow:
    1. GET /tracking/live         -> place every bus that already has a position
    2. socket.io 'busLocationUpdate' -> move a marker as new pings arrive
    3. socket.io 'journeyStarted' / 'journeyEnded' -> refresh status badges

  No API key anywhere — tiles come from the public OpenStreetMap server.
*/
(function () {
  const mapEl = document.getElementById('fleetMap');
  if (!mapEl) return;

  const NARHE_FALLBACK_CENTER = [18.4600, 73.8080]; // used only if no bus has reported a position yet

  const map = L.map('fleetMap').setView(NARHE_FALLBACK_CENTER, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  const busIcon = L.divIcon({
    className: 'bus-marker',
    html: '<div class="bus-marker-dot"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  const markers = {}; // busId -> L.Marker
  const busMeta = {}; // busId -> { busNumber, routeName, driverName }

  document.querySelectorAll('#busList [data-bus-id]').forEach(function (el) {
    busMeta[el.dataset.busId] = {
      busNumber: el.dataset.busNumber,
      routeName: el.dataset.routeName,
      driverName: el.dataset.driverName
    };
  });

  function statusLabel(status) {
    if (status === 'RUNNING') return 'Running';
    if (status === 'PAUSED') return 'Paused';
    if (status === 'COMPLETED') return 'Completed';
    return 'Not Started';
  }

  function statusClass(status) {
    if (status === 'RUNNING') return 'is-running';
    if (status === 'PAUSED') return 'is-paused';
    if (status === 'COMPLETED') return 'is-completed';
    return 'is-idle';
  }

  function updateListStatus(busId, status) {
    const item = document.querySelector('#busList [data-bus-id="' + busId + '"]');
    if (!item) return;
    const dot = item.querySelector('.bus-status-dot');
    const label = item.querySelector('.bus-status-label');
    if (dot) dot.className = 'bus-status-dot ' + statusClass(status);
    if (label) label.textContent = statusLabel(status);
    recomputeStats();
  }

  function recomputeStats() {
    const runningEl = document.getElementById('statRunning');
    const idleEl = document.getElementById('statIdle');
    if (!runningEl || !idleEl) return;
    const total = document.querySelectorAll('#busList [data-bus-id]').length;
    const running = document.querySelectorAll('#busList .bus-status-dot.is-running').length;
    runningEl.textContent = String(running);
    idleEl.textContent = String(total - running);
  }

  // `loc` can come from either the REST snapshot (snake_case, always has
  // journey_status) or a live socket ping (camelCase, no journey_status —
  // a ping only ever fires while a journey is RUNNING, so default to that).
  function upsertMarker(loc) {
    const busId = String(loc.bus_id || loc.busId || '');
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    if (!busId || !lat || !lng) return; // skips the (0,0) placeholder row inserted on Start Journey

    const status = loc.journey_status || 'RUNNING';
    const meta = busMeta[busId] || {};
    const popupHtml =
      '<strong>' + (meta.busNumber || 'Bus ' + busId) + '</strong><br/>' +
      (meta.routeName ? meta.routeName + '<br/>' : '') +
      (meta.driverName ? 'Driver: ' + meta.driverName + '<br/>' : '') +
      'Speed: ' + (loc.speed != null ? Number(loc.speed).toFixed(0) : 0) + ' km/h<br/>' +
      'Status: ' + statusLabel(status);

    if (markers[busId]) {
      markers[busId].setLatLng([lat, lng]);
      markers[busId].getPopup().setContent(popupHtml);
    } else {
      markers[busId] = L.marker([lat, lng], { icon: busIcon }).addTo(map).bindPopup(popupHtml);
    }

    updateListStatus(busId, status);
  }

  function fitToMarkers() {
    const positions = Object.values(markers).map(function (m) { return m.getLatLng(); });
    if (positions.length) {
      map.fitBounds(L.latLngBounds(positions), { padding: [40, 40], maxZoom: 15 });
    }
  }

  // -------- Initial load --------
  fetch('/tracking/live')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.success && Array.isArray(data.locations)) {
        data.locations.forEach(upsertMarker);
        fitToMarkers();
      }
    })
    .catch(function (err) { console.error('Could not load live locations', err); });

  // -------- Live updates over Socket.IO (see services/trackingService.js) --------
  const socket = io();

  socket.on('busLocationUpdate', upsertMarker);

  socket.on('journeyStarted', function () {
    fetch('/tracking/live')
      .then(function (res) { return res.json(); })
      .then(function (data) { if (data.success) data.locations.forEach(upsertMarker); });
  });

  socket.on('journeyEnded', function (payload) {
    updateListStatus(String(payload.busId), 'COMPLETED');
  });

  // -------- Clicking a bus in the side list pans the map to it --------
  document.querySelectorAll('#busList [data-bus-id]').forEach(function (el) {
    el.addEventListener('click', function () {
      const marker = markers[el.dataset.busId];
      if (marker) {
        map.setView(marker.getLatLng(), 16);
        marker.openPopup();
      }
    });
  });
})();