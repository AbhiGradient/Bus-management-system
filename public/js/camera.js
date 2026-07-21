/* ============================================================
   CAMERA.JS — Camera access + QR code scanning
   Opens the device camera into a <video> element and decodes
   QR codes from the live feed using the browser's native
   BarcodeDetector API (Chrome/Edge/Android). Where it isn't
   supported, shows a friendly fallback message instead of
   silently failing.

     <video id="scannerVideo" autoplay muted playsinline></video>
     <button data-camera-start="#scannerVideo">Start Scanner</button>
     <button data-camera-stop="#scannerVideo">Stop Scanner</button>

   Dispatches a `qr-scanned` CustomEvent on the video element
   with `detail.value` set to the decoded text, e.g.:

     document.getElementById('scannerVideo')
       .addEventListener('qr-scanned', (e) => console.log(e.detail.value));
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const streams = new Map(); // videoEl -> { stream, detector, rafId }

  async function startCamera(videoEl) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera access is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      videoEl.srcObject = stream;
      await videoEl.play();

      let detector = null;
      if ('BarcodeDetector' in window) {
        detector = new BarcodeDetector({ formats: ['qr_code'] });
      } else {
        console.warn('BarcodeDetector API not supported — showing camera feed only.');
      }

      const state = { stream, detector, rafId: null, lastValue: null };
      streams.set(videoEl, state);

      if (detector) scanLoop(videoEl, state);
    } catch (err) {
      console.error('Camera access failed:', err);
      alert('Could not access the camera. Please check permissions.');
    }
  }

  async function scanLoop(videoEl, state) {
    try {
      const codes = await state.detector.detect(videoEl);
      if (codes.length > 0) {
        const value = codes[0].rawValue;
        if (value !== state.lastValue) {
          state.lastValue = value;
          videoEl.dispatchEvent(new CustomEvent('qr-scanned', { detail: { value } }));
        }
      }
    } catch (err) {
      // Detection can transiently fail on odd frames — ignore and keep scanning.
    }

    if (streams.has(videoEl)) {
      state.rafId = requestAnimationFrame(() => scanLoop(videoEl, state));
    }
  }

  function stopCamera(videoEl) {
    const state = streams.get(videoEl);
    if (!state) return;

    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.stream.getTracks().forEach((track) => track.stop());
    videoEl.srcObject = null;
    streams.delete(videoEl);
  }

  document.querySelectorAll('[data-camera-start]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const video = document.querySelector(btn.dataset.cameraStart);
      if (video) startCamera(video);
    });
  });

  document.querySelectorAll('[data-camera-stop]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const video = document.querySelector(btn.dataset.cameraStop);
      if (video) stopCamera(video);
    });
  });

  // ---------- Clean up camera streams when leaving the page ----------
  window.addEventListener('beforeunload', () => {
    streams.forEach((_, videoEl) => stopCamera(videoEl));
  });
});
