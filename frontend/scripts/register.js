var apiRegister = 'http://localhost:3000/api/auth/register';

document.getElementById('registerForm').addEventListener('submit', function(e) {
  e.preventDefault();

  var name     = document.getElementById('name').value;
  var email    = document.getElementById('email').value;
  var password = document.getElementById('password').value;

  axios.post(apiRegister, { name: name, email: email, password: password })
    .then(function(res) {
      if (res.data.ok) {
        localStorage.setItem('token',  res.data.token);
        localStorage.setItem('userId', res.data.user._id);
        localStorage.setItem('userName', res.data.user.name);
        window.location.href = 'dashboard.html';
      } else {
        alert('Error: ' + (res.data.error || 'Registro fallido'));
      }
    })
    .catch(function(err) {
      console.log(err);
      alert('No se pudo conectar con el servidor');
    });
});
