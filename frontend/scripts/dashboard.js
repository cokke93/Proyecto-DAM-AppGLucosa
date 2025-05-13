// scripts/dashboard.js

const axios = require('axios')
const { dialog } = require('@electron/remote')
const Chart = require('chart.js/auto')
window.Chart = Chart

const API_BASE = 'http://localhost:3000/api/measurements'

document.addEventListener('DOMContentLoaded', () => {
  const token     = localStorage.getItem('token')    || ''
  const userId    = localStorage.getItem('userId')   || ''
  const userName  = localStorage.getItem('userName') || 'Usuario'

  document.getElementById('loggedUserName').textContent = userName

  const rangeSelect      = document.getElementById('rangeSelect')
  const newBtn           = document.getElementById('newMeasurementBtn')
  const cancelBtn        = document.getElementById('cancelMeasurementBtn')
  const saveBtn          = document.getElementById('saveMeasurementBtn')
  const deleteAllBtn     = document.getElementById('deleteAllBtn')
  const refreshBtn       = document.getElementById('refreshBtn')
  const registerFoodBtn  = document.getElementById('registerFoodBtn')
  const modal            = document.getElementById('measurementModal')

  rangeSelect.addEventListener('change', () => loadMeasurements(rangeSelect.value, token, userId))
  newBtn.addEventListener('click', showModal)
  cancelBtn.addEventListener('click', hideModal)
  window.addEventListener('click', e => { if (e.target === modal) hideModal() })
  saveBtn.addEventListener('click', () => saveMeasurement(userId, token))
  deleteAllBtn.addEventListener('click', () => deleteAllMeasurements(userId, token))
  refreshBtn.addEventListener('click', () => loadMeasurements(rangeSelect.value, token, userId))
  registerFoodBtn.addEventListener('click', () => window.location.href = './nutricion.html')

  // Primera carga
  loadMeasurements(rangeSelect.value, token, userId)
})

async function loadMeasurements(range, token, userId) {
  if (!userId) {
    return dialog.showMessageBox({
      type: 'warning',
      title: 'Atención',
      message: 'No hay usuario logueado',
      buttons: ['OK']
    })
  }

  try {
    const url = `${API_BASE}` +
                `?user=${encodeURIComponent(userId)}` +
                `&type=glucosa` +
                `&range=${encodeURIComponent(range)}`
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = res.data.measurements

    renderTable(data)
    renderChart(data)
  } catch (err) {
    console.error('loadMeasurements error:', err)
    dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: 'Error cargando mediciones',
      buttons: ['OK']
    })
  }
}

function renderTable(data) {
  const tb = document.getElementById('measurementsBody')
  tb.innerHTML = ''
  data.forEach(m => {
    const d   = new Date(m.timestamp)
    const row = document.createElement('tr')
    row.innerHTML = `
      <td>${d.toLocaleDateString()}</td>
      <td>${d.toLocaleTimeString()}</td>
      <td>${m.value}</td>
      <td><button onclick="deleteMeasurement('${m._id}')">Borrar</button></td>
    `
    tb.appendChild(row)
  })
}

function renderChart(data) {
  const ordered = data.slice();
  const labels  = ordered.map(m => new Date(m.timestamp).toLocaleDateString());
  const vals    = ordered.map(m => m.value);

  if (window.myChart) window.myChart.destroy();

  const ctx = document.getElementById('glucoseChart').getContext('2d');
  window.myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Glucosa (mg/dL)',
        data: vals,
        borderColor: '#1e3c72',
        tension: 0.4,
        fill: false,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#1e3c72',
        pointRadius: 4
      }]
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: 'Fecha'
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true
          }
        },
        y: {
          title: {
            display: true,
            text: 'Valor (mg/dL)'
          },
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: context => `${context.parsed.y} mg/dL`
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });
}


function showModal() {
  document.getElementById('inputValue').value = ''
  document.getElementById('inputTimestamp').value = new Date().toISOString().slice(0,16)
  document.getElementById('measurementModal').style.display = 'block'
}

function hideModal() {
  document.getElementById('measurementModal').style.display = 'none'
}

async function saveMeasurement(userId, token) {
  const v  = parseFloat(document.getElementById('inputValue').value)
  const ts = new Date(document.getElementById('inputTimestamp').value)
  try {
    await axios.post(
      API_BASE,
      { user: userId, type: 'glucosa', value: v, timestamp: ts },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    hideModal()
    loadMeasurements(document.getElementById('rangeSelect').value, token, userId)
    dialog.showMessageBox({ type:'info', title:'Guardado', message:'Medición guardada', buttons:['OK'] })
  } catch (err) {
    console.error('saveMeasurement error:', err)
    dialog.showMessageBox({ type:'error', title:'Error', message:'Error guardando medición', buttons:['OK'] })
  }
}

async function deleteMeasurement(id) {
  const { response } = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Cancelar','Borrar'],
    defaultId:1,
    cancelId:0,
    title: 'Confirmar',
    message: '¿Seguro que quieres borrar esta medición?'
  })
  if (response !== 1) return

  const token = localStorage.getItem('token') || ''
  try {
    await axios.delete(`${API_BASE}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    loadMeasurements(document.getElementById('rangeSelect').value, token, localStorage.getItem('userId'))
    dialog.showMessageBox({ type:'info', title:'Borrado', message:'Medición borrada', buttons:['OK'] })
  } catch (err) {
    console.error('deleteMeasurement error:', err)
    dialog.showMessageBox({ type:'error', title:'Error', message:'Error borrando medición', buttons:['OK'] })
  }
}

async function deleteAllMeasurements(userId, token) {
  if (!userId) {
    return dialog.showMessageBox({ type:'warning', title:'Atención', message:'No hay usuario logueado', buttons:['OK'] })
  }
  const { response } = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Cancelar','Borrar todas'],
    defaultId:1,
    cancelId:0,
    title:'Confirmar',
    message:'¿Seguro que quieres borrar TODAS tus mediciones?'
  })
  if (response !== 1) return

  try {
    const res = await axios.delete(`${API_BASE}?user=${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    dialog.showMessageBox({
      type:'info',
      title:'Borrado',
      message:`Se han borrado ${res.data.deletedCount} mediciones`,
      buttons:['OK']
    })
    loadMeasurements(document.getElementById('rangeSelect').value, token, userId)
  } catch (err) {
    console.error('deleteAllMeasurements error:', err)
    dialog.showMessageBox({ type:'error', title:'Error', message:'Error al borrar mediciones', buttons:['OK'] })
  }
}

  document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';})
