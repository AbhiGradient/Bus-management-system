/* ============================================================
   QR.JS — QR code generator
   Renders a QR code into any element with [data-qr-value].
   Requires the "qrcode" CDN library on the page:

     <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
     <div data-qr-value="STUDENT-CS2023001" data-qr-size="200"></div>
     <script src="/js/qr.js"></script>

   Also exposes window.generateQR(text, containerEl) for
   generating QR codes dynamically (e.g. after a form submit).
   ============================================================ */

function generateQR(text, container, size) {
  if (typeof QRCode === 'undefined') {
    container.innerHTML = '<p class="text-danger small mb-0">QR library not loaded.</p>';
    return;
  }
  container.innerHTML = ''; // clear any previous code

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  QRCode.toCanvas(canvas, text, { width: size || 200, margin: 1 }, (err) => {
    if (err) {
      console.error('QR generation failed:', err);
      container.innerHTML = '<p class="text-danger small mb-0">Could not generate QR code.</p>';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-qr-value]').forEach((el) => {
    const value = el.dataset.qrValue;
    const size = parseInt(el.dataset.qrSize, 10) || 200;
    if (value) generateQR(value, el, size);
  });

  // ---------- Optional download-as-image button: <button data-qr-download="#qrContainer"> ----------
  document.querySelectorAll('[data-qr-download]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.qrDownload);
      const canvas = target ? target.querySelector('canvas') : null;
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = 'qr-code.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  });
});
