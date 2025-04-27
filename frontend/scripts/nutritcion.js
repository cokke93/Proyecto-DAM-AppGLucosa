const apiUrl = 'http://localhost:3000/api/food';
let editId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadFood();
  document.getElementById('searchBtn').addEventListener('click', () => loadFood());
  document.getElementById('addFoodBtn').addEventListener('click', () => openEm());
  document.getElementById('cancelBtn').addEventListener('click', closeEm);
  document.getElementById('saveBtn').addEventListener('click', saveFood);

  document.querySelectorAll('#filterButtons .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#filterButtons .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadFood();
    });
  });
});

async function loadFood() {
  const search = document.getElementById('searchInput').value;
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
          <button class="filter-btn" onclick="openEm('${item._id}', ${item.giIndex}, '${item.name}', '${item.category}', ${item.portion_g})"><i class="fas fa-edit"></i></button>
          <button class="filter-btn" onclick="deleteFood('${item._id}')"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch ( err) {
    alert('Error cargando datos');
  }
}

function openEm(id = null, gi = '', name = '', category = 'Fruta', portion = '') {
  editId = id;
  document.getElementById('emTitle').textContent = id ? 'Editar Alimento' : 'Añadir Alimento';
  document.getElementById('foodName').value = name;
  document.getElementById('foodGi').value = gi;
  document.getElementById('foodCategory').value = category;
  document.getElementById('foodPortion').value = portion;
  document.getElementById('foodEm').style.display = 'block';
}

function closeEm() {
  document.getElementById('foodEm').style.display = 'none';
  editId = null;
}

async function saveFood() {
  const name = document.getElementById('foodName').value;
  const giIndex = parseInt(document.getElementById('foodGi').value, 10);
  const category = document.getElementById('foodCategory').value;
  const portion_g = parseInt(document.getElementById('foodPortion').value, 10);
  const payload = { name, giIndex, category, portion_g };

  try {
    if (editId) {
      await axios.put(`${apiUrl}/${editId}`, payload);
    } else {
      await axios.post(apiUrl, payload);
    }
    closeEm();
    loadFood();
  } catch (err) {
    alert('Error al guardar');
  }
}

async function deleteFood(id) {
  if (confirm('¿Seguro que quieres eliminar este alimento?')) {
    try {
      await axios.delete(`${apiUrl}/${id}`);
      loadFood();
    } catch (err) {
      alert('Error al eliminar');
    }
  }
}