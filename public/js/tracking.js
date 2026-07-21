/* ============================================================
   TRACKING.JS — Live bus tracking (viewer side)
   For students/admins watching a bus move in real time. Reads
   config from a container element's data-attributes so it can
   be dropped onto any tracking page:

     <div id="map"
          data-tracking-url="/student/tracking/1/location"
          data-bus-lat="18.5204"
          data-bus-lng="73.8567"
          data-poll-interval="5000"></div>
     <script src="/js/map.js"></script>
     <script src="/js/tracking.js"></script>

   Uses map.js's window.BusMap helper if a Leaflet map is present,
   and updates any [data-tracking-status] / [data-tracking-updated]
   elements on the page.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('map');
  if (!el || !el.dataset.trackingUrl) return; // nothing to track on this page

  const trackingUrl = el.dataset.trackingUrl;
  const pollInterval = parseInt(el.dataset.pollInterval, 10) || 5000;
  const startLat = parseFloat(el.dataset.busLat) || 18.5204;
  const startLng = parseFloat(el.dataset.busLng) || 73.8567;

  const statusEl = document.querySelector('[data-tracking-status]');
  const updatedEl = document.querySelector('[data-tracking-updated]');

  let map = null;
  let marker = null;

  if (window.BusMap) {
    map = window.BusMap.initMap('map', { lat: startLat, lng: startLng, zoom: 14 });
    marker = window.BusMap.setBusMarker(map, null, startLat, startLng, 'Your bus');
  }

  function setStatus(text, ok) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle('bg-success', !!ok);
    statusEl.classList.toggle('bg-secondary', !ok);
  }

  async function poll() {
    try {
      const res = await fetch(trackingUrl, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Bad response');
      const data = await res.json();

      if (data && data.latitude && data.longitude) {
        marker = window.BusMap
          ? window.BusMap.setBusMarker(map, marker, data.latitude, data.longitude)
          : marker;
        if (map) window.BusMap.panTo(map, data.latitude, data.longitude);
        if (updatedEl) updatedEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        setStatus('Live', true);
      } else {
        setStatus('No signal', false);
      }
    } catch (err) {
      console.error('Tracking poll failed:', err);
      setStatus('Offline', false);
    }
  }

  poll();
  setInterval(poll, pollInterval);
});
