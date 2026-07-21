/* ============================================================
   MAIN.JS — Global, site-wide behaviors
   Loaded on every page (alongside script.js). Keeps small,
   cross-cutting UI logic in one place: alerts, deletes,
   sidebar highlighting, tooltips, and a mobile sidebar toggle.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Auto-hide alerts ----------
  document.querySelectorAll('.auto-alert').forEach((alertEl) => {
    setTimeout(() => {
      alertEl.classList.add('fade');
      alertEl.classList.remove('show');
      setTimeout(() => alertEl.remove(), 400);
    }, 3500);
  });

  // ---------- Confirm before destructive actions ----------
  document.querySelectorAll('.confirm-delete').forEach((form) => {
    form.addEventListener('submit', (e) => {
      const label = form.dataset.confirmLabel || 'this record';
      const ok = confirm(`Are you sure you want to delete ${label}? This cannot be undone.`);
      if (!ok) e.preventDefault();
    });
  });

  // ---------- Highlight the active sidebar link based on current URL ----------
  const currentPath = window.location.pathname;
  document.querySelectorAll('.sidebar .nav-link').forEach((link) => {
    const linkPath = link.getAttribute('href');
    if (linkPath && currentPath.startsWith(linkPath)) {
      link.classList.add('active');
    }
  });

  // ---------- Bootstrap tooltips / popovers, if any are present ----------
  if (window.bootstrap) {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => new bootstrap.Tooltip(el));
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => new bootstrap.Popover(el));
  }

  // ---------- Mobile sidebar toggle (expects a button with #sidebarToggle) ----------
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('sidebar-open'));
  }

  // ---------- Disable a submit button + show a spinner while a form is submitting ----------
  document.querySelectorAll('form[data-loading-text]').forEach((form) => {
    form.addEventListener('submit', () => {
      const btn = form.querySelector('button[type="submit"]');
      if (!btn) return;
      btn.disabled = true;
      btn.dataset.originalHtml = btn.innerHTML;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> ${form.dataset.loadingText}`;
    });
  });

});
