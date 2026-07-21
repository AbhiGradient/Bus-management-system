/* ============================================================
   PAYMENT.JS — Fee payment page helper
   Handles payment-method switching, basic card-field validation
   (Luhn check + expiry format) and a live payment summary.
   Expects a form with:
     - radio/select inputs named "payment_method" (values like
       "card", "upi", "netbanking")
     - a container per method: [data-method-fields="card"], etc.
     - card fields: input[name="card_number"], [name="card_expiry"],
       [name="card_cvv"]
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-payment-form]');
  if (!form) return;

  const methodInputs = form.querySelectorAll('input[name="payment_method"], select[name="payment_method"]');
  const methodFieldGroups = form.querySelectorAll('[data-method-fields]');

  // ---------- Show only the fields relevant to the selected payment method ----------
  function showMethod(method) {
    methodFieldGroups.forEach((group) => {
      group.style.display = group.dataset.methodFields === method ? '' : 'none';
    });
  }

  methodInputs.forEach((input) => {
    input.addEventListener('change', () => showMethod(input.value));
  });

  const initiallyChecked = form.querySelector('input[name="payment_method"]:checked');
  showMethod(initiallyChecked ? initiallyChecked.value : (methodInputs[0] && methodInputs[0].value));

  // ---------- Luhn check for card numbers ----------
  function isValidCardNumber(number) {
    const digits = number.replace(/\s+/g, '');
    if (!/^\d{12,19}$/.test(digits)) return false;

    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  // ---------- Auto-format card number as the user types (adds spaces every 4 digits) ----------
  const cardNumberInput = form.querySelector('input[name="card_number"]');
  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', () => {
      const digitsOnly = cardNumberInput.value.replace(/\D/g, '').slice(0, 19);
      cardNumberInput.value = digitsOnly.replace(/(.{4})/g, '$1 ').trim();
    });
  }

  // ---------- Validate before submit ----------
  form.addEventListener('submit', (e) => {
    const selectedMethod = form.querySelector('input[name="payment_method"]:checked, select[name="payment_method"]');
    const method = selectedMethod ? selectedMethod.value : null;

    if (method === 'card') {
      const cardExpiry = form.querySelector('input[name="card_expiry"]');
      const cardCvv = form.querySelector('input[name="card_cvv"]');
      let valid = true;

      if (cardNumberInput && !isValidCardNumber(cardNumberInput.value)) {
        cardNumberInput.classList.add('is-invalid');
        valid = false;
      } else if (cardNumberInput) {
        cardNumberInput.classList.remove('is-invalid');
      }

      if (cardExpiry && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.value.trim())) {
        cardExpiry.classList.add('is-invalid');
        valid = false;
      } else if (cardExpiry) {
        cardExpiry.classList.remove('is-invalid');
      }

      if (cardCvv && !/^\d{3,4}$/.test(cardCvv.value.trim())) {
        cardCvv.classList.add('is-invalid');
        valid = false;
      } else if (cardCvv) {
        cardCvv.classList.remove('is-invalid');
      }

      if (!valid) {
        e.preventDefault();
        return;
      }
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Processing payment...';
    }
  });

  // ---------- Live total summary (expects [data-fee-amount] + optional [data-convenience-fee]) ----------
  const summaryEl = document.querySelector('[data-payment-summary]');
  const amountEl = document.querySelector('[data-fee-amount]');
  if (summaryEl && amountEl) {
    const baseAmount = parseFloat(amountEl.dataset.feeAmount || '0');
    const convenienceFee = parseFloat((document.querySelector('[data-convenience-fee]') || {}).dataset?.convenienceFee || '0');
    summaryEl.textContent = `₹${(baseAmount + convenienceFee).toFixed(2)}`;
  }
});
