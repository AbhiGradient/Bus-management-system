/* ============================================================
   VALIDATION.JS — Generic form validation helper
   Applies to any <form data-validate> on the site. Reads
   validation rules from each field's [data-rules] attribute,
   a comma-separated list such as:

     data-rules="required,email"
     data-rules="required,minlength:8"
     data-rules="required,match:password"
     data-rules="required,phone"

   Shows Bootstrap-style invalid-feedback messages and blocks
   submission until every rule passes.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const RULES = {
    required: (value) => value.trim().length > 0,
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    phone: (value) => /^\d{7,15}$/.test(value.replace(/[\s-]/g, '')),
    numeric: (value) => /^-?\d+(\.\d+)?$/.test(value.trim())
  };

  const MESSAGES = {
    required: 'This field is required.',
    email: 'Please enter a valid email address.',
    phone: 'Please enter a valid phone number.',
    numeric: 'Please enter a valid number.',
    minlength: (n) => `Please enter at least ${n} characters.`,
    match: (label) => `This must match ${label}.`
  };

  function ensureFeedbackEl(field) {
    let feedback = field.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      field.insertAdjacentElement('afterend', feedback);
    }
    return feedback;
  }

  function validateField(field) {
    const rulesAttr = field.dataset.rules;
    if (!rulesAttr) return true;

    const value = field.value || '';
    const feedback = ensureFeedbackEl(field);
    let message = null;

    for (const rawRule of rulesAttr.split(',')) {
      const [ruleName, arg] = rawRule.split(':');

      if (ruleName === 'minlength') {
        if (value.trim().length < parseInt(arg, 10)) message = MESSAGES.minlength(arg);
      } else if (ruleName === 'match') {
        const otherField = field.form.querySelector(`[name="${arg}"]`);
        if (otherField && value !== otherField.value) message = MESSAGES.match(arg);
      } else if (RULES[ruleName] && value.trim() !== '' ) {
        if (!RULES[ruleName](value)) message = MESSAGES[ruleName];
      } else if (RULES[ruleName] && ruleName === 'required') {
        if (!RULES.required(value)) message = MESSAGES.required;
      }

      if (message) break;
    }

    field.classList.toggle('is-invalid', !!message);
    field.classList.toggle('is-valid', !message && value.trim() !== '');
    feedback.textContent = message || '';

    return !message;
  }

  document.querySelectorAll('form[data-validate]').forEach((form) => {
    const fields = form.querySelectorAll('[data-rules]');

    fields.forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('is-invalid')) validateField(field);
      });
    });

    form.addEventListener('submit', (e) => {
      let allValid = true;
      fields.forEach((field) => {
        if (!validateField(field)) allValid = false;
      });
      if (!allValid) {
        e.preventDefault();
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
      }
    });
  });
});
