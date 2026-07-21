/* ============================================================
   DASHBOARD.JS — Shared dashboard enhancements
   Applies to admin-dashboard.ejs, student-dashboard.ejs and
   driver-dashboard.ejs: animated stat counters and a live clock.
   Safe to include on every dashboard; it no-ops if elements
   aren't present.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Count-up animation for .stat-card h2/h5 numeric values ----------
  const counters = document.querySelectorAll('.stat-card h2, .stat-card h5');

  counters.forEach((el) => {
    const raw = el.textContent.trim();
    const match = raw.match(/-?\d+(\.\d+)?/); // first number in the text, e.g. "12 / 40"
    if (!match) return; // skip non-numeric cards (e.g. route names)

    const target = parseFloat(match[0]);
    const suffix = raw.slice(match.index + match[0].length); // keep " / 40" etc.
    const prefix = raw.slice(0, match.index);
    const duration = 700; // ms
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.round(target * eased);
      el.textContent = `${prefix}${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });

  // ---------- Live clock (expects an element with #liveClock) ----------
  const clockEl = document.getElementById('liveClock');
  if (clockEl) {
    const updateClock = () => {
      clockEl.textContent = new Date().toLocaleString('en-IN', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  // ---------- Period filter buttons (data-period="today|week|month") ----------
  // Expects each filter button to toggle a `.active` class and dashboards
  // to read the selected period from `document.querySelector('[data-period].active')`.
  document.querySelectorAll('[data-period]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-period]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.dispatchEvent(new CustomEvent('dashboard:period-change', { detail: btn.dataset.period }));
    });
  });

});
