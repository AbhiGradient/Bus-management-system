/* ============================================================
   SEAT.JS — Interactive bus seat map
   Renders a clickable seat grid inside a container and keeps a
   hidden input in sync with the selected seat number(s).

     <div id="seatMap"
          data-total-seats="40"
          data-taken-seats="3,4,17"
          data-max-select="1"></div>
     <input type="hidden" name="seat_no" id="seatInput" />
     <script src="/js/seat.js"></script>
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('seatMap');
  if (!container) return;

  const totalSeats = parseInt(container.dataset.totalSeats, 10) || 40;
  const takenSeats = (container.dataset.takenSeats || '')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
  const maxSelect = parseInt(container.dataset.maxSelect, 10) || 1;
  const seatInput = document.getElementById('seatInput');
  const summaryEl = document.querySelector('[data-seat-summary]');

  const selected = new Set();

  function updateSummary() {
    if (seatInput) seatInput.value = Array.from(selected).join(',');
    if (summaryEl) {
      summaryEl.textContent = selected.size
        ? `Selected seat${selected.size > 1 ? 's' : ''}: ${Array.from(selected).sort((a, b) => a - b).join(', ')}`
        : 'No seat selected';
    }
  }

  container.innerHTML = '';
  container.classList.add('seat-grid');
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(4, 44px)';
  container.style.gap = '10px';

  for (let seatNo = 1; seatNo <= totalSeats; seatNo++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-sm seat-btn';
    btn.textContent = seatNo;
    btn.style.width = '44px';
    btn.style.height = '38px';

    const isTaken = takenSeats.includes(seatNo);

    if (isTaken) {
      btn.classList.add('btn-secondary');
      btn.disabled = true;
      btn.title = 'Already taken';
    } else {
      btn.classList.add('btn-outline-primary');
      btn.addEventListener('click', () => {
        if (selected.has(seatNo)) {
          selected.delete(seatNo);
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-outline-primary');
        } else {
          if (selected.size >= maxSelect) {
            // Enforce max selectable seats: drop the oldest selection first
            const first = selected.values().next().value;
            selected.delete(first);
            const prevBtn = container.querySelector(`[data-seat="${first}"]`);
            if (prevBtn) {
              prevBtn.classList.remove('btn-primary');
              prevBtn.classList.add('btn-outline-primary');
            }
          }
          selected.add(seatNo);
          btn.classList.remove('btn-outline-primary');
          btn.classList.add('btn-primary');
        }
        updateSummary();
      });
    }

    btn.dataset.seat = seatNo;
    container.appendChild(btn);
  }

  updateSummary();
});
