// Confirm before deleting a record
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.confirm-delete').forEach((form) => {
    form.addEventListener('submit', (e) => {
      const ok = confirm('Are you sure you want to delete this record?');
      if (!ok) e.preventDefault();
    });
  });

  // Auto-hide alerts after 3.5 seconds
  document.querySelectorAll('.auto-alert').forEach((alertEl) => {
    setTimeout(() => {
      alertEl.classList.remove('show');
      alertEl.classList.add('fade');
    }, 3500);
  });
});
