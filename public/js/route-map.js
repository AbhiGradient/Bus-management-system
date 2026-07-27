/*
  public/js/route-map.js
  Drives the static route/stops map on views/student/route-map.ejs.
  No live position here — see public/js/track-bus.js for that.
*/
(function () {
  const mapEl = document.getElementById('routeMap');
  if (!mapEl) return;

  let stops = [];
  try {
    stops = JSON.parse(mapEl.dataset.stops || '[]');
  } catch (err) {
    console.error('Could not parse route stops', err);
  }
  if (!stops.length) return;

  const latlngs = stops.map(function (s) { return [Number(s.latitude), Number(s.longitude)]; });

  const map = L.map('routeMap');
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  L.polyline(latlngs, { color: '#1F5C4F', weight: 4, opacity: 0.75 }).addTo(map);

  const stopIcon = L.divIcon({
    className: 'stop-marker',
    html: '<div class="stop-marker-dot"></div>',
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });

  stops.forEach(function (stop) {
    L.marker([Number(stop.latitude), Number(stop.longitude)], { icon: stopIcon })
      .addTo(map)
      .bindPopup(
        '<strong>' + stop.stop_name + '</strong>' +
        (stop.expected_arrival ? '<br/>Arrival: ' + String(stop.expected_arrival).slice(0, 5) : '')
      );
  });

  map.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30] });
})();