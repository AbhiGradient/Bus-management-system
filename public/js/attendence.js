/* ============================================================
   ATTENDANCE.JS — Driver attendance page helper
   Works with the checkbox list in views/attendence.ejs
   (input[name="present"]): adds a "select all" toggle, a live
   present/total counter, and a name filter box.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const checkboxes = document.querySelectorAll('input[name="present"]');
  if (checkboxes.length === 0) return;

  const table = checkboxes[0].closest('table');
  const summaryEl = document.querySelector('[data-attendance-summary]');

  // ---------- Live present/total counter ----------
  function updateSummary() {
    const presentCount = Array.from(checkboxes).filter((c) => c.checked).length;
    if (summaryEl) {
      summaryEl.textContent = `Present: ${presentCount} / ${checkboxes.length}`;
    }
  }

  checkboxes.forEach((cb) => cb.addEventListener('change', updateSummary));
  updateSummary();

  // ---------- "Select all" / "Deselect all" toggle button ----------
  const selectAllBtn = document.querySelector('[data-select-all]');
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      const allChecked = Array.from(checkboxes).every((c) => c.checked);
      checkboxes.forEach((c) => { c.checked = !allChecked; });
      selectAllBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
      updateSummary();
    });
  }

  // ---------- Filter rows by student name (expects input[data-attendance-search]) ----------
  const searchInput = document.querySelector('[data-attendance-search]');
  if (searchInput && table) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      table.querySelectorAll('tbody tr').forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }
});
