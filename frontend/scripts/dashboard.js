// scripts/dashboard.js
const axios = require('axios')
const { dialog } = require('@electron/remote');
const API_BASE = 'http://localhost:3000/api/measurements';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token') || '';
  const userId = localStorage.getItem('userId') || '';
  const userName = localStorage.getItem('userName') || 'Usuario';

  document.getElementById('loggedUserName').textContent = userName;

  const rangeSelect = document.getElementById('rangeSelect');
  const newBtn = document.getElementById('newMeasurementBtn');
  const cancelBtn = document.getElementById('cancelMeasurementBtn');
  const saveBtn = document.getElementById('saveMeasurementBtn');
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const registerFoodBtn = document.getElementById('registerFoodBtn');
  const modal = document.getElementById('measurementModal');

  // Listeners
  rangeSelect.addEventListener('change', () => loadMeasurements(rangeSelect.value, token));
  newBtn.addEventListener('click', showModal);
  cancelBtn.addEventListener('click', hideModal);
  window.addEventListener('click', e => { if (e.target === modal) hideModal(); });
  saveBtn.addEventListener('click', () => saveMeasurement(userId, token));
  deleteAllBtn.addEventListener('click', () => deleteAllMeasurements(userId, token));
  refreshBtn.addEventListener('click', () => loadMeasurements(rangeSelect.value, token));
  registerFoodBtn.addEventListener('click', () => window.location.href = './nutricion.html');

  loadMeasurements(rangeSelect.value, token);
});

// Load measurements on page load
async function loadMeasurements(range, token) {
  try {
    const url = `${API_BASE}?range=${range}`;
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = res.data.measurements;

    renderTable(data);
    renderChart(data);
  } catch (err) {
    console.error(err);
    dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: 'Error cargando mediciones',
      buttons: ['OK']
    });
  }
}

// Render table and chart
function renderTable(data) {
  const tb = document.getElementById('measurementsBody');
  tb.innerHTML = '';
  data.forEach(m => {
    const d = new Date(m.timestamp);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${d.toLocaleDateString()}</td>
      <td>${d.toLocaleTimeString()}</td>
      <td>${m.value}</td>
      <td><button onclick="deleteMeasurement('${m._id}')">Borrar</button></td>
    `;
    tb.appendChild(row);
  });
}

// Render chart using Chart.js
function renderChart(data) {
  const ordered = data.slice();
  const labels = ordered.map(m => new Date(m.timestamp).toLocaleDateString());
  const vals = ordered.map(m => m.value);

  if (window.myChart) window.myChart.destroy();
  window.myChart = new Chart(
    document.getElementById('glucoseChart').getContext('2d'),
    { type: 'line', data: { labels, datasets: [{ label: 'Glucosa', data: vals }] } }
  );
}

// Modal functions
function showModal() {
  document.getElementById('inputValue').value = '';
  document.getElementById('inputTimestamp').value = new Date().toISOString().slice(0, 16);
  document.getElementById('measurementModal').style.display = 'block';
}

function hideModal() {
  document.getElementById('measurementModal').style.display = 'none';
}

// Save measurement
async function saveMeasurement(userId, token) {
  const v = parseFloat(document.getElementById('inputValue').value);
  const ts = new Date(document.getElementById('inputTimestamp').value);
  try {
    await axios.post(
      API_BASE,
      { user: userId, type: 'glucosa', value: v, timestamp: ts },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    hideModal();
    loadMeasurements(document.getElementById('rangeSelect').value, token);
    dialog.showMessageBox({
      type: 'info',
      title: 'Guardado',
      message: 'Medición guardada',
      buttons: ['OK']
    });
  } catch (err) {
    console.error(err);
    dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: 'Error guardando medición',
      buttons: ['OK']
    });
  }
}

// Delete single measurement
async function deleteMeasurement(id) {
  const { response } = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Cancelar', 'Borrar'],
    defaultId: 1,
    cancelId: 0,
    title: 'Confirmar',
    message: '¿Seguro que quieres borrar esta medición?'
  });
  if (response !== 1) return;

  const token = localStorage.getItem('token');
  try {
    await axios.delete(`${API_BASE}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    loadMeasurements(document.getElementById('rangeSelect').value, token);
    dialog.showMessageBox({
      type: 'info',
      title: 'Borrado',
      message: 'Medición borrada',
      buttons: ['OK']
    });
  } catch (err) {
    console.error(err);
    dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: 'Error borrando medición',
      buttons: ['OK']
    });
  }
}

// Delete all measurements
async function deleteAllMeasurements(userId, token) {
  if (!userId) {
    await dialog.showMessageBox({
      type: 'warning',
      title: 'Atención',
      message: 'No hay usuario logueado',
      buttons: ['OK']
    });
    return;
  }

  const { response } = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Cancelar', 'Borrar todas'],
    defaultId: 1,
    cancelId: 0,
    title: 'Confirmar',
    message: '¿Seguro que quieres borrar TODAS tus mediciones?'
  });
  if (response !== 1) return;

  try {
    const res = await axios.delete(`${API_BASE}?user=${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await dialog.showMessageBox({
      type: 'info',
      title: 'Borrado',
      message: `Se han borrado ${res.data.deletedCount} mediciones`,
      buttons: ['OK']
    });
    loadMeasurements(document.getElementById('rangeSelect').value, token);
  } catch (err) {
    console.error(err);
    dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: 'Error al borrar todas las mediciones',
      buttons: ['OK']
    });
  }
}
