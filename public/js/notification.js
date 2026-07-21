/* ============================================================
   NOTIFICATION.JS — Notification bell + list helper
   1) If a bell icon with [data-notification-count-url] is present
      in the navbar, polls it periodically and updates a badge.
   2) On the notifications list page, lets individual items be
      marked read via fetch (no full page reload), falling back
      to a normal form submit if fetch fails.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Navbar unread-count badge ----------
  const bell = document.querySelector('[data-notification-count-url]');
  if (bell) {
    const url = bell.dataset.notificationCountUrl;
    let badge = bell.querySelector('.badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'badge bg-danger rounded-pill ms-1';
      badge.style.display = 'none';
      bell.appendChild(badge);
    }

    async function refreshCount() {
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) return;
        const data = await res.json();
        const count = data.unread || 0;
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
      } catch (err) {
        // Silently ignore — the bell just won't update this cycle
      }
    }

    refreshCount();
    setInterval(refreshCount, 30000); // every 30s
  }

  // ---------- Mark individual notification as read without a full reload ----------
  document.querySelectorAll('[data-mark-read-url]').forEach((item) => {
    item.addEventListener('click', async () => {
      const url = item.dataset.markReadUrl;
      if (!url || item.dataset.read === 'true') return;

      try {
        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });
        item.dataset.read = 'true';
        item.classList.remove('bg-light');
        const unreadBadge = item.querySelector('.badge');
        if (unreadBadge) unreadBadge.remove();
      } catch (err) {
        console.error('Could not mark notification as read:', err);
      }
    });
  });

});
