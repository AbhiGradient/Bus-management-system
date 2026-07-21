/* ============================================================
   CHART.JS (initializer) — Declarative charts for dashboards
   Not the Chart.js library itself — this reads <canvas> tags
   and builds charts from data attributes, so report/dashboard
   pages don't need page-specific chart code. Requires Chart.js
   to be included first:

     <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
     <canvas
       data-chart-type="bar"
       data-chart-labels="Mon,Tue,Wed,Thu,Fri"
       data-chart-values="32,28,35,30,33"
       data-chart-label="Students Boarded"
       data-chart-color="#1F5C4F"></canvas>
     <script src="/js/chart.js"></script>
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Chart === 'undefined') {
    // Chart.js not loaded on this page — nothing to do.
    return;
  }

  document.querySelectorAll('canvas[data-chart-type]').forEach((canvas) => {
    const type = canvas.dataset.chartType || 'bar';
    const labels = (canvas.dataset.chartLabels || '').split(',').map((s) => s.trim());
    const values = (canvas.dataset.chartValues || '').split(',').map((s) => parseFloat(s.trim()));
    const label = canvas.dataset.chartLabel || 'Series 1';
    const color = canvas.dataset.chartColor || '#1F5C4F';

    // Support multiple series via `data-chart-values-2`, `data-chart-label-2`, etc.
    const datasets = [{
      label,
      data: values,
      backgroundColor: type === 'line' ? `${color}33` : color,
      borderColor: color,
      borderWidth: 2,
      tension: 0.35,
      fill: type === 'line'
    }];

    let seriesIndex = 2;
    while (canvas.dataset[`chartValues${seriesIndex}`]) {
      const extraValues = canvas.dataset[`chartValues${seriesIndex}`].split(',').map((s) => parseFloat(s.trim()));
      const extraLabel = canvas.dataset[`chartLabel${seriesIndex}`] || `Series ${seriesIndex}`;
      const extraColor = canvas.dataset[`chartColor${seriesIndex}`] || '#B8863C';
      datasets.push({
        label: extraLabel,
        data: extraValues,
        backgroundColor: type === 'line' ? `${extraColor}33` : extraColor,
        borderColor: extraColor,
        borderWidth: 2,
        tension: 0.35,
        fill: type === 'line'
      });
      seriesIndex += 1;
    }

    new Chart(canvas, {
      type,
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: {
          legend: { display: datasets.length > 1 || canvas.dataset.chartLegend === 'true' }
        },
        scales: type === 'pie' || type === 'doughnut' ? {} : {
          y: { beginAtZero: true }
        }
      }
    });
  });
});
