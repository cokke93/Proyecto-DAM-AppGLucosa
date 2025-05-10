// scripts/food.js

const { dialog } = require('@electron/remote');
const apiUrl = 'http://localhost:3000/api/food';
let editId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadFood();
  document.getElementById('searchBtn').addEventListener('click', loadFood);
  document.getElementById('addFoodBtn').addEventListener('click', () => openEm());
  document.getElementById('cancelBtn').addEventListener('click', closeEm);
  document.getElementById('saveBtn').addEventListener('click', saveFood);

  document.querySelectorAll('#filterButtons .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#filterButtons .filter-btn')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadFood();
    });
  });
});

// Load food items
async function loadFood() {
  const search = document.getElementById('searchInput').value.trim();
  const giFilter = [...document.querySelectorAll('#filterButtons .filter-btn.active')]
    .map(b => b.getAttribute('data-gi'))[0];
  const params = {};
  if (search) params.search = search;
  if (giFilter && giFilter !== 'all') params.giCategory = giFilter;

  try {
    const res = await axios.get(apiUrl, { params });
    const tbody = document.getElementById('foodTableBody');
    tbody.innerHTML = '';
    res.data.food.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.giIndex}</td>
        <td>${item.category}</td>
        <td>${item.portion_g}</td>
        <td>
          <button class="filter-btn"
                  onclick="openEm('${item._id}', ${item.giIndex}, '${item.name}', '${item.category}', ${item.portion_g})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="filter-btn" onclick="deleteFood('${item._id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    await dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: 'Error cargando datos',
      buttons: ['OK']
    });
  }
}

// Open modal for adding/editing food item
function openEm(id = null, gi = '', name = '', category = 'Fruta', portion = '') {
  editId = id;
  document.getElementById('emTitle').textContent = id ? 'Editar Alimento' : 'Añadir Alimento';
  document.getElementById('foodName').value = name;
  document.getElementById('foodGi').value = gi;
  document.getElementById('foodCategory').value = category;
  document.getElementById('foodPortion').value = portion;
  document.getElementById('foodEm').style.display = 'block';
}

// Close modal
function closeEm() {
  document.getElementById('foodEm').style.display = 'none';
  editId = null;
}

// Save food item
async function saveFood() {
  const name = document.getElementById('foodName').value.trim();
  const giIndex = parseInt(document.getElementById('foodGi').value, 10);
  const category = document.getElementById('foodCategory').value;
  const portion_g = parseInt(document.getElementById('foodPortion').value, 10);
  const payload = { name, giIndex, category, portion_g };

  try {
    if (editId) {
      await axios.put(`${apiUrl}/${editId}`, payload);
      await dialog.showMessageBox({
        type: 'info',
        title: 'Actualizado',
        message: 'Alimento actualizado',
        buttons: ['OK']
      });
    } else {
      await axios.post(apiUrl, payload);
      await dialog.showMessageBox({
        type: 'info',
        title: 'Añadido',
        message: 'Alimento añadido',
        buttons: ['OK']
      });
    }
    closeEm();
    loadFood();
  } catch (err) {
    console.error(err);
    await dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: 'Error al guardar',
      buttons: ['OK']
    });
  }
}

// Delete food item
async function deleteFood(id) {
  const { response } = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Cancelar', 'Eliminar'],
    defaultId: 1,
    cancelId: 0,
    title: 'Confirmar',
    message: '¿Seguro que quieres eliminar este alimento?'
  });
  if (response !== 1) return;

  try {
    await axios.delete(`${apiUrl}/${id}`);
    await dialog.showMessageBox({
      type: 'info',
      title: 'Eliminado',
      message: 'Alimento eliminado',
      buttons: ['OK']
    });
    loadFood();
  } catch (err) {
    console.error(err);
    await dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: 'Error al eliminar',
      buttons: ['OK']
    });
  }
}
