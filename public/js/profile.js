/* ============================================================
   PROFILE.JS — Profile page enhancements
   Works with views/profile.ejs and views/driver-profile.ejs:
   password strength meter, confirm-password matching, and
   avatar image preview before upload.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[action*="/profile"]');
  if (!form) return;

  // ---------- Password strength meter ----------
  const passwordInput = form.querySelector('input[name="password"]');
  if (passwordInput) {
    const meter = document.createElement('div');
    meter.className = 'progress mt-2';
    meter.style.height = '6px';
    meter.innerHTML = '<div class="progress-bar" role="progressbar" style="width:0%"></div>';
    passwordInput.insertAdjacentElement('afterend', meter);
    const bar = meter.querySelector('.progress-bar');

    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      let score = 0;
      if (val.length >= 8) score += 1;
      if (/[A-Z]/.test(val)) score += 1;
      if (/[0-9]/.test(val)) score += 1;
      if (/[^A-Za-z0-9]/.test(val)) score += 1;

      const percentages = [0, 25, 50, 75, 100];
      const colors = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-info', 'bg-success'];

      bar.style.width = `${percentages[score]}%`;
      bar.className = `progress-bar ${val ? colors[score] : ''}`;
      meter.style.display = val ? 'block' : 'none';
    });
    meter.style.display = 'none';
  }

  // ---------- Confirm-password matching (only if a confirm field exists) ----------
  const confirmInput = form.querySelector('input[name="password_confirm"]');
  if (passwordInput && confirmInput) {
    function checkMatch() {
      if (!confirmInput.value) {
        confirmInput.classList.remove('is-invalid', 'is-valid');
        return;
      }
      const matches = passwordInput.value === confirmInput.value;
      confirmInput.classList.toggle('is-invalid', !matches);
      confirmInput.classList.toggle('is-valid', matches);
    }
    passwordInput.addEventListener('input', checkMatch);
    confirmInput.addEventListener('input', checkMatch);

    form.addEventListener('submit', (e) => {
      if (passwordInput.value && passwordInput.value !== confirmInput.value) {
        e.preventDefault();
        confirmInput.classList.add('is-invalid');
      }
    });
  }

  // ---------- Avatar preview (expects input[type=file][name=avatar] + img#avatarPreview) ----------
  const avatarInput = form.querySelector('input[type="file"][name="avatar"]');
  const avatarPreview = document.getElementById('avatarPreview');
  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener('change', () => {
      const file = avatarInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => { avatarPreview.src = e.target.result; };
      reader.readAsDataURL(file);
    });
  }
});
