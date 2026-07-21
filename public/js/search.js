/* ============================================================
   SEARCH.JS — Generic client-side search / filter
   Drop this on any page that has a search box and a table or
   list to filter. No page-specific code needed:

     <input type="text" data-search-target="#studentsTable" placeholder="Search..." />
     <table id="studentsTable">...</table>

   Filters by matching the query against each row/item's text.
   Debounced so it stays smooth on large tables.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-search-target]').forEach((input) => {
    const targetSelector = input.dataset.searchTarget;
    const target = document.querySelector(targetSelector);
    if (!target) return;

    // Rows to filter: table body rows, or direct list-item children
    const getRows = () => {
      const tbody = target.tagName === 'TABLE' ? target.querySelector('tbody') : target;
      return tbody ? Array.from(tbody.children) : [];
    };

    let debounceTimer = null;
    const emptyStateText = input.dataset.searchEmptyText || 'No matching results found.';
    let emptyRow = null;

    function runFilter() {
      const query = input.value.trim().toLowerCase();
      const rows = getRows();
      let visibleCount = 0;

      rows.forEach((row) => {
        if (row === emptyRow) return;
        const matches = !query || row.textContent.toLowerCase().includes(query);
        row.style.display = matches ? '' : 'none';
        if (matches) visibleCount += 1;
      });

      // Show/hide a friendly "no results" row
      if (visibleCount === 0 && rows.length > 0) {
        if (!emptyRow) {
          const parent = target.tagName === 'TABLE' ? target.querySelector('tbody') : target;
          const colCount = target.tagName === 'TABLE'
            ? (target.querySelector('thead tr')?.children.length || 1)
            : 1;
          emptyRow = target.tagName === 'TABLE' ? document.createElement('tr') : document.createElement('div');
          emptyRow.innerHTML = target.tagName === 'TABLE'
            ? `<td colspan="${colCount}" class="text-center text-muted py-3">${emptyStateText}</td>`
            : `<p class="text-muted text-center py-3">${emptyStateText}</p>`;
          parent.appendChild(emptyRow);
        }
        emptyRow.style.display = '';
      } else if (emptyRow) {
        emptyRow.style.display = 'none';
      }
    }

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(runFilter, 200);
    });
  });
});
