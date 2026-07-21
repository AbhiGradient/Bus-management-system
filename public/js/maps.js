/* ============================================================
   MAP.JS — Reusable Leaflet map helper
   Wraps Leaflet (https://leafletjs.com) so any page can create
   a bus-tracking map without repeating boilerplate. Requires
   the Leaflet CSS/JS to already be included on the page:

     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
     <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
     <script src="/js/map.js"></script>

   Exposes a small global helper: window.BusMap
   ============================================================ */

window.BusMap = (function () {

  const busIcon = () => L.divIcon({
    html: '<i class="bi bi-bus-front-fill" style="font-size:1.6rem;color:#1F5C4F;"></i>',
    className: '',
    iconSize: [24, 24]
  });

  const stopIcon = () => L.divIcon({
    html: '<i class="bi bi-geo-alt-fill" style="font-size:1.2rem;color:#B23B2E;"></i>',
    className: '',
    iconSize: [20, 20]
  });

  /**
   * Create a map inside the given container id.
   * @param {string} containerId
   * @param {{lat:number,lng:number,zoom?:number}} center
   * @returns {L.Map|null}
   */
  function initMap(containerId, center) {
    if (typeof L === 'undefined') {
      console.warn('BusMap: Leaflet library not found. Include leaflet.js before map.js.');
      return null;
    }
    const el = document.getElementById(containerId);
    if (!el) return null;

    const map = L.map(containerId).setView([center.lat, center.lng], center.zoom || 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    return map;
  }

  /** Add (or move, if already added) a bus marker on the map. */
  function setBusMarker(map, markerRef, lat, lng, label) {
    if (!map) return markerRef;
    if (!markerRef) {
      markerRef = L.marker([lat, lng], { icon: busIcon() }).addTo(map);
      if (label) markerRef.bindPopup(label);
    } else {
      markerRef.setLatLng([lat, lng]);
    }
    return markerRef;
  }

  /** Add a stop/pickup-point marker. */
  function addStopMarker(map, lat, lng, label) {
    if (!map) return null;
    const marker = L.marker([lat, lng], { icon: stopIcon() }).addTo(map);
    if (label) marker.bindPopup(label);
    return marker;
  }

  /** Smoothly pan the map to a new position. */
  function panTo(map, lat, lng) {
    if (map) map.panTo([lat, lng]);
  }

  return { initMap, setBusMarker, addStopMarker, panTo };
})();
