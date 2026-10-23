/* Panel de Experiencias con RBAC - EcoRutas */
(function () {
  'use strict';

  var api = window.EcoApi;

  // --- Bloqueo de ruta no autorizada: se requiere sesión ---
  if (!api.Auth.isAuthenticated()) {
    window.location.replace('/');
    return;
  }

  var state = { user: null, categorias: [], experiencias: [] };

  // Referencias DOM
  var userInfo = document.getElementById('user-info');
  var rolBadge = document.getElementById('rol-badge');
  var createBtn = document.getElementById('create-btn');
  var logoutBtn = document.getElementById('logout-btn');
  var alertBox = document.getElementById('alert');
  var searchInput = document.getElementById('search-input');
  var orderingSelect = document.getElementById('ordering-select');
  var grid = document.getElementById('experiencias-grid');
  var emptyState = document.getElementById('empty-state');

  var modal = document.getElementById('modal');
  var modalTitle = document.getElementById('modal-title');
  var modalAlert = document.getElementById('modal-alert');
  var form = document.getElementById('experiencia-form');
  var saveBtn = document.getElementById('save-btn');
  var cancelBtn = document.getElementById('cancel-btn');
  var expIdInput = document.getElementById('exp-id');
  var categoriaSelect = document.getElementById('exp-categoria');

  function esc(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = 'alert ' + (type || 'error');
  }
  function hideAlert() { alertBox.className = 'alert hidden'; }
  function showModalAlert(message) {
    modalAlert.textContent = message;
    modalAlert.className = 'alert error';
  }
  function hideModalAlert() { modalAlert.className = 'alert hidden'; }

  function debounce(fn, wait) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, wait);
    };
  }

  // --- RBAC en la interfaz ---
  function renderHeader() {
    var user = state.user;
    var nombre = (user.first_name || '') + ' ' + (user.last_name || '');
    userInfo.textContent = nombre.trim()
      ? nombre.trim() + ' (@' + user.username + ')'
      : '@' + user.username;

    var esAnfitrion = api.Auth.isAnfitrion();
    rolBadge.textContent = esAnfitrion ? 'Anfitrión' : 'Turista';
    rolBadge.className = 'badge ' + (esAnfitrion ? 'anfitrion' : 'turista');

    // Mostrar/ocultar el botón de crear según el rol
    if (esAnfitrion) {
      createBtn.classList.remove('hidden');
    } else {
      createBtn.classList.add('hidden');
    }
  }

  function buildQuery() {
    var params = [];
    var search = searchInput.value.trim();
    var ordering = orderingSelect.value;
    if (search) params.push('search=' + encodeURIComponent(search));
    if (ordering) params.push('ordering=' + encodeURIComponent(ordering));
    return params.length ? '?' + params.join('&') : '';
  }

  function renderList() {
    if (!state.experiencias.length) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    var esAnfitrion = api.Auth.isAnfitrion();
    var userId = state.user.id;

    grid.innerHTML = state.experiencias.map(function (exp) {
      var esPropietario = esAnfitrion && exp.anfitrion === userId;
      var categoria = exp.categoria_nombre ? esc(exp.categoria_nombre) : 'Sin categoría';

      var acciones = '';
      if (esPropietario) {
        acciones =
          '<button class="btn btn-ghost btn-sm" data-action="edit" data-id="' + exp.id + '">Editar</button>' +
          '<button class="btn btn-danger btn-sm" data-action="delete" data-id="' + exp.id + '">Eliminar</button>';
      }

      return '' +
        '<article class="card">' +
          '<span class="cat">' + categoria + '</span>' +
          '<h3>' + esc(exp.titulo) + '</h3>' +
          '<p>' + esc(exp.descripcion) + '</p>' +
          '<div class="meta">Ubicación: ' + esc(exp.latitud) + ', ' + esc(exp.longitud) + '</div>' +
          '<div class="price">' + esc(exp.precio_unitario) + ' &euro; / persona</div>' +
          '<div class="meta">Estado: ' + esc(exp.estado) + '</div>' +
          '<div class="meta owner-tag">Anfitrión: @' + esc(exp.anfitrion_username || exp.anfitrion) + '</div>' +
          (acciones ? '<div class="actions">' + acciones + '</div>' : '') +
        '</article>';
    }).join('');
  }

  function loadCategorias() {
    return api.listCategorias().then(function (data) {
      state.categorias = Array.isArray(data) ? data : (data.results || []);
      categoriaSelect.innerHTML = '<option value="">Selecciona una categoría</option>' +
        state.categorias.map(function (c) {
          return '<option value="' + c.id + '">' + esc(c.nombre) + '</option>';
        }).join('');
    }).catch(function () {
      // No bloquear la página si el catálogo de categorías falla.
      categoriaSelect.innerHTML = '<option value="">Sin categorías disponibles</option>';
    });
  }

  var listRequestId = 0;

  function loadExperiencias() {
    var requestId = ++listRequestId;
    return api.listExperiencias(buildQuery())
      .then(function (data) {
        // Ignora respuestas obsoletas (búsqueda/orden cambiaron mientras tanto).
        if (requestId !== listRequestId) return;
        state.experiencias = Array.isArray(data) ? data : (data.results || []);
        renderList();
      })
      .catch(function (err) {
        if (requestId !== listRequestId) return;
        showAlert(api.errorMessage(err));
      });
  }

  // --- Modal crear / editar ---
  function openModal(id) {
    hideModalAlert();
    form.reset();
    expIdInput.value = '';

    if (id) {
      var exp = state.experiencias.filter(function (e) { return e.id === id; })[0];
      if (!exp) return;
      modalTitle.textContent = 'Editar Experiencia';
      expIdInput.value = exp.id;
      document.getElementById('exp-titulo').value = exp.titulo;
      document.getElementById('exp-descripcion').value = exp.descripcion;
      categoriaSelect.value = exp.categoria || '';
      document.getElementById('exp-precio').value = exp.precio_unitario;
      document.getElementById('exp-latitud').value = exp.latitud;
      document.getElementById('exp-longitud').value = exp.longitud;
      document.getElementById('exp-estado').value = exp.estado;
    } else {
      modalTitle.textContent = 'Crear Experiencia';
    }
    modal.classList.remove('hidden');
  }

  function closeModal() {
    modal.classList.add('hidden');
  }

  // --- Eventos ---
  grid.addEventListener('click', function (event) {
    var target = event.target.closest('button[data-action]');
    if (!target) return;
    var id = parseInt(target.getAttribute('data-id'), 10);
    var action = target.getAttribute('data-action');
    if (action === 'edit') openModal(id);
    if (action === 'delete') removeExperiencia(id);
  });

  createBtn.addEventListener('click', function () {
    if (!api.Auth.isAnfitrion()) return;
    openModal(null);
  });

  cancelBtn.addEventListener('click', closeModal);

  logoutBtn.addEventListener('click', function () {
    api.logout();
  });

  searchInput.addEventListener('input', debounce(function () {
    hideAlert();
    loadExperiencias();
  }, 350));

  orderingSelect.addEventListener('change', function () {
    hideAlert();
    loadExperiencias();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    hideModalAlert();

    // Doble verificación de RBAC en el cliente
    if (!api.Auth.isAnfitrion()) {
      showModalAlert('Solo los anfitriones pueden crear o editar experiencias.');
      return;
    }

    var categoriaId = categoriaSelect.value;
    var payload = {
      titulo: document.getElementById('exp-titulo').value.trim(),
      descripcion: document.getElementById('exp-descripcion').value.trim(),
      precio_unitario: document.getElementById('exp-precio').value,
      latitud: document.getElementById('exp-latitud').value,
      longitud: document.getElementById('exp-longitud').value,
      estado: document.getElementById('exp-estado').value,
      categoria: categoriaId ? parseInt(categoriaId, 10) : null
    };

    if (!payload.titulo || !payload.descripcion ||
        payload.precio_unitario === '' || payload.latitud === '' || payload.longitud === '') {
      showModalAlert('Completa todos los campos obligatorios.');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    var id = expIdInput.value;
    var request = id ? api.updateExperiencia(id, payload) : api.createExperiencia(payload);

    request
      .then(function () {
        closeModal();
        showAlert(id ? 'Experiencia actualizada correctamente.' : 'Experiencia creada correctamente.', 'success');
        return loadExperiencias();
      })
      .catch(function (err) {
        showModalAlert(api.errorMessage(err));
      })
      .finally(function () {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar';
      });
  });

  function removeExperiencia(id) {
    if (!window.confirm('¿Seguro que deseas eliminar esta experiencia?')) return;
    api.deleteExperiencia(id)
      .then(function () {
        showAlert('Experiencia eliminada correctamente.', 'success');
        return loadExperiencias();
      })
      .catch(function (err) {
        showAlert(api.errorMessage(err));
      });
  }

  // --- Inicialización ---
  api.loadSession()
    .then(function (user) {
      state.user = user;
      renderHeader();
      if (!api.Auth.isAnfitrion()) {
        // Los turistas no necesitan el formulario de categorías.
        return loadExperiencias();
      }
      return Promise.all([loadCategorias(), loadExperiencias()]);
    })
    .catch(function () {
      api.Auth.clear();
      window.location.replace('/');
    });
})();
