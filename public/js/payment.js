/**
 * public/js/payment.js
 * ----------------------
 * Client-side JavaScript for the simulated Bus Fee Payment page (payment.ejs).
 *
 * Responsibilities:
 *   1. Toggle between payment method panels (UPI / QR Code)
 *   2. Show a loading state on the "I Have Paid" button on submit
 *      to prevent double-submission while the server processes payment
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initPaymentMethodToggle();
    initPaymentFormSubmit();
  });

  // -------- Payment method toggle (UPI <-> QR Code) --------
  function initPaymentMethodToggle() {
    const optionButtons = document.querySelectorAll('.pay-option[data-target]');
    const methodBoxes = document.querySelectorAll('.payment-method-box');

    if (!optionButtons.length || !methodBoxes.length) return;

    optionButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const targetId = btn.getAttribute('data-target');

        // Hide all method boxes, then show the selected one
        methodBoxes.forEach(function (box) {
          box.style.display = 'none';
        });
        const targetBox = document.getElementById(targetId);
        if (targetBox) {
          targetBox.style.display = 'block';
        }

        // Update active state on buttons
        optionButtons.forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
      });
    });
  }

  // -------- Prevent double-submit + show loading state --------
  function initPaymentFormSubmit() {
    const form = document.getElementById('paymentForm');
    const confirmBtn = document.getElementById('confirmPayBtn');

    if (!form || !confirmBtn) return;

    form.addEventListener('submit', function (e) {
      const utrInput = form.querySelector('input[name="utr"]');

      // Basic client-side check (server re-validates regardless)
      if (!utrInput || !utrInput.value.trim()) {
        e.preventDefault();
        utrInput && utrInput.focus();
        return;
      }

      // Disable button + show loading text so the student can't click twice
      confirmBtn.disabled = true;
      confirmBtn.innerHTML =
        '<i class="bi bi-arrow-repeat" style="animation:spin 0.8s linear infinite;"></i> Processing Payment...';
    });
  }
})();

// Small inline keyframe injection for the spin animation used above,
// since no new stylesheet is being created for this feature.
(function injectSpinKeyframes() {
  const style = document.createElement('style');
  style.textContent =
    '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
})();