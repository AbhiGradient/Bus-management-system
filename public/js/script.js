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
document.addEventListener("DOMContentLoaded", function () {

    const payment = document.getElementById("paymentMethod");
    const qr = document.getElementById("qrSection");

    if (!payment || !qr) return;

    payment.addEventListener("change", function () {

        if (this.value === "UPI") {

            qr.style.display = "block";

        } else {

            qr.style.display = "none";

        }

    });

});


   
document.querySelectorAll(".receipt-btn").forEach(button => {
    button.addEventListener("click", function () {

        const student = this.dataset.student;
        const roll = this.dataset.roll;
        const amount = this.dataset.amount;
        const status = this.dataset.status;
        const due = this.dataset.due;
        const paid = this.dataset.paid || "Not Paid";

        const receipt = `
        <html>
        <head>
            <title>Fee Receipt</title>
            <style>
                body{font-family:Arial;padding:30px;}
                h2{text-align:center;}
                table{width:100%;border-collapse:collapse;margin-top:20px;}
                td,th{border:1px solid #000;padding:8px;}
            </style>
        </head>
        <body>
            <h2>College Bus Fee Receipt</h2>
            <table>
                <tr><th>Student</th><td>${student}</td></tr>
                <tr><th>Roll No</th><td>${roll}</td></tr>
                <tr><th>Amount</th><td>₹${amount}</td></tr>
                <tr><th>Status</th><td>${status}</td></tr>
                <tr><th>Due Date</th><td>${due}</td></tr>
                <tr><th>Paid Date</th><td>${paid}</td></tr>
            </table>
        </body>
        </html>
        `;

        const win = window.open("", "_blank");
        win.document.write(receipt);
        win.document.close();
        win.print();
    });
});
