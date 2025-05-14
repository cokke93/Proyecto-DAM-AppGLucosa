// scripts/login.js
const axios = require('axios');
const { dialog } = require('@electron/remote');
const apiLogin = 'http://localhost:3000/api/auth/login';

document.addEventListener('DOMContentLoaded', () => {
  const emailInput   = document.querySelector('input[type="email"]');
  const rememberChk  = document.getElementById('rememberMe');
  const storedEmail  = localStorage.getItem('rememberedEmail');

  if (storedEmail) {
    emailInput.value = storedEmail;
    rememberChk.checked = true;
  }

  const form = document.getElementById('loginForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = emailInput.value.trim();
    const password = document.querySelector('input[type="password"]').value;

    try {
      const res = await axios.post(apiLogin, { email, password });
      if (res.data.ok) {
        if (rememberChk.checked) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.user._id);
        localStorage.setItem('userName', res.data.user.name);
        window.location.href = 'dashboard.html';
      } else {
        await dialog.showMessageBox({ type:'error', title:'Login fallido', message: res.data.error || 'Credenciales inválidas', buttons:['OK'] });
      }
    } catch (err) {
      console.error(err);
      await dialog.showMessageBox({ type:'error', title:'Error de conexión', message:'No se pudo conectar con el servidor', buttons:['OK'] });
    }
  });
});
