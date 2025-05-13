// scripts/reportes.js
const axios = require('axios');
const { dialog, getCurrentWindow } = require('@electron/remote');
const fs = require('fs');

const API_MEAS = 'http://localhost:3000/api/measurements';
const API_PDF = 'http://localhost:3000/api/report';

document.addEventListener('DOMContentLoaded', () => {
  const startInput = document.getElementById('startDate');
  const endInput = document.getElementById('endDate');
  const filterBtn = document.querySelector('.report-date-picker .btn');
  const downloadBtn = document.getElementById('exportPdfBtn');

  // Start date: 7 days ago
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  startInput.value = weekAgo.toISOString().slice(0, 10);
  endInput.value = now.toISOString().slice(0, 10);

  filterBtn.addEventListener('click', loadPreview);
  downloadBtn.addEventListener('click', downloadPdf);

  loadPreview();
});

async function loadPreview() {
  const token = localStorage.getItem('token') || '';
  const userId = localStorage.getItem('userId') || '';
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;
  if (!start || !end) return;

  try {
    const resp = await axios.get(API_MEAS, {
      headers: { Authorization: `Bearer ${token}` },
      params: { user: userId, type: 'glucosa', start, end }
    });
    const data = resp.data.measurements;

    document.querySelector('.preview-header p')
      .textContent = `Periodo: ${start} — ${end}`;

    const table = document.querySelector('.pdf-preview table');
    table.querySelectorAll('tr:not(:first-child)').forEach(r => r.remove());

    data.forEach(m => {
      const d = new Date(m.timestamp).toLocaleDateString();
      const estado = getStateLabel(m.value);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${d}</td>
        <td>${m.value} mg/dL</td>
        <td>${estado}</td>
      `;
      table.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    await dialog.showMessageBox(getCurrentWindow(), {
      type: 'error',
      title: 'Error',
      message: 'Error cargando vista previa:\n' + (err.response?.data?.error || err.message),
      buttons: ['OK']
    });
  }
}

//Download PDF
async function downloadPdf() {
  const win = getCurrentWindow();
  const token = localStorage.getItem('token') || '';
  const userId = localStorage.getItem('userId') || '';
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;

  if (!start || !end) {
    await dialog.showMessageBox(win, {
      type: 'warning',
      title: 'Atención',
      message: 'Selecciona fecha de inicio y fin',
      buttons: ['OK']
    });
    return;
  }

  try {
    // Download PDF from server
    const resp = await axios.get(API_PDF, {
      headers: { Authorization: `Bearer ${token}` },
      params: { user: userId, type: 'glucosa', start, end },
      responseType: 'arraybuffer'
    });
    const pdfBuffer = Buffer.from(resp.data);


    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      title: 'Guardar reporte como PDF',
      defaultPath: `reporte_${start}_${end}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });
    if (!canceled && filePath) {
      fs.writeFileSync(filePath, pdfBuffer);
      await dialog.showMessageBox(win, {
        type: 'info',
        title: '¡Listo!',
        message: `PDF guardado en:\n${filePath}`,
        buttons: ['OK']
      });
    }

  } catch (err) {
    console.error(err);
    await dialog.showMessageBox(win, {
      type: 'error',
      title: 'Error al generar PDF',
      message: err.response?.data?.error || err.message,
      buttons: ['OK']
    });
  }
}

function getStateLabel(v) {
  if (v < 70) return '<span style="color:blue">Hipo</span>';
  if (v > 180) return '<span style="color:red">Híper</span>';
  return '<span style="color:green">Normal</span>';
}

  document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';})
