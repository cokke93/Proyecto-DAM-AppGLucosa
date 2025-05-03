var apiLogin = 'http://localhost:3000/api/auth/login';

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();

  var email    = this.querySelector('input[type="email"]').value;
  var password = this.querySelector('input[type="password"]').value;

  axios.post(apiLogin, { email: email, password: password })
    .then(function(res) {
      if (res.data.ok) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.user._id);
        localStorage.setItem('userName', res.data.user.name);
        window.location.href = 'dashboard.html';
      } else {
        alert('Error: ' + (res.data.error||'Credenciales inválidas'));
      }
    })
    .catch(function(err) {
      console.log(err);
      alert('Error al conectar con el servidor');
    });
});
