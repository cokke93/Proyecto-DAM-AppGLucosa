// scripts/login.js

const axios = require('axios')
const { dialog } = require('@electron/remote');
const apiLogin = 'http://localhost:3000/api/auth/login';

document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = this.querySelector('input[type="email"]').value;
  const password = this.querySelector('input[type="password"]').value;

  try {
    const res = await axios.post(apiLogin, { email, password });
    if (res.data.ok) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.user._id);
      localStorage.setItem('userName', res.data.user.name);
      window.location.href = 'dashboard.html';
    } else {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Error de autenticación',
        message: res.data.error || 'Credenciales inválidas',
        buttons: ['OK']
      });
    }
  } catch (err) {
    console.error(err);
    await dialog.showMessageBox({
      type: 'error',
      title: 'Error de conexión',
      message: 'No se pudo conectar con el servidor',
      buttons: ['OK']
    });
  }
});
