/* Registro - EcoRutas */
(function () {
  'use strict';

  var api = window.EcoApi;

  if (api.Auth.isAuthenticated()) {
    window.location.replace('/experiencias/');
    return;
  }

  var form = document.getElementById('register-form');
  var alertBox = document.getElementById('alert');
  var submitBtn = document.getElementById('submit-btn');
  var rolSelect = document.getElementById('rol');
  var docGroup = document.getElementById('documento-group');
  var docInput = document.getElementById('documento_identidad');

  function showError(message) {
    alertBox.textContent = message;
    alertBox.className = 'alert error';
  }

  function hideAlert() {
    alertBox.className = 'alert hidden';
  }

  function toggleDocumento() {
    if (rolSelect.value === 'anfitrion') {
      docGroup.classList.remove('hidden');
    } else {
      docGroup.classList.add('hidden');
      docInput.value = '';
    }
  }

  rolSelect.addEventListener('change', toggleDocumento);
  toggleDocumento();

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    hideAlert();

    var payload = {
      first_name: document.getElementById('first_name').value.trim(),
      last_name: document.getElementById('last_name').value.trim(),
      username: document.getElementById('username').value.trim(),
      email: document.getElementById('email').value.trim(),
      rol: rolSelect.value,
      password: document.getElementById('password').value,
      password_confirm: document.getElementById('password_confirm').value
    };

    if (payload.rol === 'anfitrion') {
      payload.documento_identidad = docInput.value.trim();
    }

    if (!payload.username || !payload.email || !payload.password) {
      showError('Completa todos los campos obligatorios.');
      return;
    }
    if (payload.password.length < 8) {
      showError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (payload.password !== payload.password_confirm) {
      showError('Las contraseñas no coinciden.');
      return;
    }
    if (payload.rol === 'anfitrion' && !payload.documento_identidad) {
      showError('El documento de identidad es obligatorio para anfitriones.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';

    api.register(payload)
      .then(function () {
        // Auto-login tras el registro exitoso.
        return api.login(payload.username, payload.password);
      })
      .then(function (tokens) {
        api.Auth.setTokens(tokens.access, tokens.refresh);
        return api.loadSession();
      })
      .then(function () {
        window.location.replace('/experiencias/');
      })
      .catch(function (err) {
        showError(api.errorMessage(err));
        submitBtn.disabled = false;
        submitBtn.textContent = 'Registrarme';
      });
  });
})();
