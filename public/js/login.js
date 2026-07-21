/* ============================================================
   LOGIN.JS — Login page enhancements
   Works with the existing login form (role select, email,
   password) without needing any markup changes: it finds the
   fields by [name] and injects a show/hide password toggle.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.login-card form');
  if (!form) return;

  const emailInput = form.querySelector('input[name="email"]');
  const passwordInput = form.querySelector('input[name="password"]');
  const submitBtn = form.querySelector('button[type="submit"]');

  // ---------- Show / hide password ----------
  if (passwordInput) {
    const wrapper = document.createElement('div');
    wrapper.className = 'position-relative';
    passwordInput.parentNode.insertBefore(wrapper, passwordInput);
    wrapper.appendChild(passwordInput);
    passwordInput.style.paddingRight = '42px';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.setAttribute('aria-label', 'Show password');
    toggleBtn.className = 'btn btn-sm position-absolute top-50 end-0 translate-middle-y me-1 p-1 border-0 bg-transparent';
    toggleBtn.innerHTML = '<i class="bi bi-eye"></i>';
    wrapper.appendChild(toggleBtn);

    toggleBtn.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      toggleBtn.innerHTML = isHidden ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
    });
  }

  // ---------- Basic client-side validation before submit ----------
  form.addEventListener('submit', (e) => {
    let valid = true;

    if (emailInput) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailInput.value.trim())) {
        valid = false;
        emailInput.classList.add('is-invalid');
      } else {
        emailInput.classList.remove('is-invalid');
      }
    }

    if (passwordInput && passwordInput.value.trim().length < 4) {
      valid = false;
      passwordInput.classList.add('is-invalid');
    } else if (passwordInput) {
      passwordInput.classList.remove('is-invalid');
    }

    if (!valid) {
      e.preventDefault();
      return;
    }

    // ---------- Prevent double-submit / show a loading state ----------
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Logging in...';
    }
  });
});
