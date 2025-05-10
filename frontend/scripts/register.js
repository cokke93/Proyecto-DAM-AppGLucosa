// scripts/register.js

const { dialog } = require('@electron/remote');
const apiRegister = 'http://localhost:3000/api/auth/register';

document.getElementById('registerForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await axios.post(apiRegister, { name, email, password });
    if (res.data.ok) {
      localStorage.setItem('token',    res.data.token);
      localStorage.setItem('userId',   res.data.user._id);
      localStorage.setItem('userName', res.data.user.name);
      window.location.href = 'dashboard.html';
    } else {
      await dialog.showMessageBox({
        type:    'error',
        title:   'Error de registro',
        message: res.data.error || 'Registro fallido',
        buttons: ['OK']
      });
    }
  } catch (err) {
    console.error(err);
    await dialog.showMessageBox({
      type:    'error',
      title:   'Error de conexión',
      message: 'No se pudo conectar con el servidor',
      buttons: ['OK']
    });
  }
});
