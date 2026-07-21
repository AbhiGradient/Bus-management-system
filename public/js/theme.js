/* ============================================================
   THEME.JS — Light / dark theme toggle
   Applies `data-theme="dark"` on <html> and remembers the
   user's choice in localStorage. Works with any toggle button:

     <button id="themeToggle"><i class="bi bi-moon-stars"></i></button>
     <script src="/js/theme.js"></script>

   Pairs with a small "Theme Toggle" section in style.css that
   defines dark-mode variable overrides under
   `html[data-theme="dark"]`.
   ============================================================ */

(function () {
  const STORAGE_KEY = 'busapp-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      toggleBtn.innerHTML = theme === 'dark'
        ? '<i class="bi bi-sun"></i>'
        : '<i class="bi bi-moon-stars"></i>';
    }
  }

  // Apply saved (or system-preferred) theme as early as possible to avoid a flash of the wrong theme.
  const saved = localStorage.getItem(STORAGE_KEY);
  const preferred = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(preferred);

  document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('themeToggle');
    applyTheme(document.documentElement.getAttribute('data-theme') || preferred); // sync icon now the button exists

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
      });
    }
  });
})();
