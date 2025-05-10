// scripts/estadisticas.js
const API_BASE = 'http://localhost:3000/api/measurements';

document.addEventListener('DOMContentLoaded', () => {
  const timeRange = document.getElementById('timeRange');
  timeRange.addEventListener('change', refresh);

  refresh();
});

async function refresh() {
  try {
    const token = localStorage.getItem('token') || '';
    const userId = localStorage.getItem('userId');
    if (!userId) throw new Error('Sin usuario logueado');

    const params = { user: userId, type: 'glucosa' };
    const tr = document.getElementById('timeRange').value;
    if (tr === 'Últimos 7 días') params.range = '7d';
    if (tr === 'Últimos 30 días') params.range = '30d';

    //Petition to backend
    const res = await axios.get(API_BASE, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    const data = res.data.measurements;

    renderChart(data);
    renderDistribution(data);
    renderSummary(data);
    renderLastRecords(data);

  } catch (err) {
    console.error(err);
    await dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: 'Error al cargar estadísticas: ' + err.message,
      buttons: ['OK']
    });
  }
}

//Chart.js
function renderChart(data) {
  const prev = Chart.getChart('mainChart');
  //If there is a previous chart, destroy it
  if (prev) prev.destroy();

  //Group by day
  const byDay = {};
  data.forEach(m => {
    const day = new Date(m.timestamp).toLocaleDateString();
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(m.value);
  });
  const labels = Object.keys(byDay)
    .sort((a, b) => new Date(a) - new Date(b));
  const values = labels.map(d => {
    const arr = byDay[d];
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  });

  const ctx = document.getElementById('mainChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Glucosa',
        data: values,
        borderColor: '#1e3c72',
        tension: 0.3
      }]
    },
    options: {
      scales: { y: { beginAtZero: false } }
    }
  });
}

//Bar chart for distribution
function renderDistribution(data) {
  const prev = Chart.getChart('distributionChart');
  if (prev) prev.destroy();

  const counts = { Normal: 0, Hipo: 0, Hiper: 0 };
  data.forEach(m => {
    if (m.value < 70) counts.Hipo++;
    else if (m.value > 180) counts.Hiper++;
    else counts.Normal++;
  });

  const ctx2 = document.getElementById('distributionChart').getContext('2d');
  new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: ['Normal', 'Hipo', 'Híper'],
      datasets: [{
        label: 'Frecuencia',
        data: [counts.Normal, counts.Hipo, counts.Hiper],
        backgroundColor: ['green', 'blue', 'red']
      }]
    }
  });
}

//Measurement summary
function renderSummary(data) {
  // agrupación por día (repetido)
  const byDay = {}, all = [];
  data.forEach(m => {
    const day = new Date(m.timestamp).toLocaleDateString();
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(m.value);
    all.push(m.value);
  });

  //Average daily values
  const dailyMeans = Object.values(byDay).map(arr =>
    arr.reduce((s, v) => s + v, 0) / arr.length
  );
  const meanDaily = dailyMeans.length
    ? dailyMeans.reduce((s, v) => s + v, 0) / dailyMeans.length
    : 0;

  // HbA1c (%) ≃ (BG + 46.7) / 28.7
  const hba1c = (meanDaily + 46.7) / 28.7;

  // Variability: CV = sd(all)/mean(all)*100
  const meanAll = all.length
    ? all.reduce((s, v) => s + v, 0) / all.length
    : 0;
  const sd = all.length
    ? Math.sqrt(all.reduce((s, v) => s + Math.pow(v - meanAll, 2), 0) / all.length)
    : 0;
  const cv = meanAll ? (sd / meanAll * 100) : 0;

  document.getElementById('meanValue').innerText = meanDaily.toFixed(1) + ' mg/dL';
  document.getElementById('hba1cValue').innerText = hba1c.toFixed(1) + ' %';
  document.getElementById('cvValue').innerText = cv.toFixed(1) + ' %';
}

//Last registers table
function renderLastRecords(data) {
  const tbody = document.getElementById('lastRecordsBody');
  tbody.innerHTML = '';
  //Filter by last 5 records
  data.slice(0, 5).forEach(m => {
    const d = new Date(m.timestamp);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${d.toLocaleDateString()}</td>
      <td>${m.value}</td>
      <td>${getStateLabel(m.value)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function getStateLabel(v) {
  if (v < 70) return '<span style="color:blue">Hipo</span>';
  if (v > 180) return '<span style="color:red">Híper</span>';
  return '<span style="color:green">Normal</span>';
}
