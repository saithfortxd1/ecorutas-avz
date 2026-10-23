/* Login - EcoRutas */
(function () {
  'use strict';

  var api = window.EcoApi;

  // Si ya hay sesión activa, ir directamente al panel de experiencias.
  if (api.Auth.isAuthenticated()) {
    window.location.replace('/experiencias/');
    return;
  }

  var form = document.getElementById('login-form');
  var alertBox = document.getElementById('alert');
  var submitBtn = document.getElementById('submit-btn');

  function showError(message) {
    alertBox.textContent = message;
    alertBox.className = 'alert error';
  }

  function hideAlert() {
    alertBox.className = 'alert hidden';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    hideAlert();

    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value;

    if (!username || !password) {
      showError('Ingresa tu usuario y contraseña.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Ingresando...';

    api.login(username, password)
      .then(function (tokens) {
        api.Auth.setTokens(tokens.access, tokens.refresh);
        // Cargar el perfil (incluye el rol) para RBAC en el frontend.
        return api.loadSession();
      })
      .then(function () {
        window.location.replace('/experiencias/');
      })
      .catch(function (err) {
        api.Auth.clear();
        if (err && err.status === 401) {
          showError('Credenciales inválidas. Verifica tu usuario y contraseña.');
        } else {
          showError(api.errorMessage(err));
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Entrar';
      });
  });
})();
