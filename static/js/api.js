/* EcoRutas - Cliente API + gestión de sesión (JWT) y RBAC */
(function (global) {
  'use strict';

  var TOKEN_KEY = 'ecorutas_access';
  var REFRESH_KEY = 'ecorutas_refresh';
  var USER_KEY = 'ecorutas_user';
  var API_BASE = '/api';

  var Auth = {
    setTokens: function (access, refresh) {
      if (access) localStorage.setItem(TOKEN_KEY, access);
      if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    },
    getAccess: function () {
      return localStorage.getItem(TOKEN_KEY);
    },
    getRefresh: function () {
      return localStorage.getItem(REFRESH_KEY);
    },
    setUser: function (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    getUser: function () {
      var raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    },
    clear: function () {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
    },
    isAuthenticated: function () {
      return !!this.getAccess();
    },
    rol: function () {
      var user = this.getUser();
      return user ? user.rol : null;
    },
    isAnfitrion: function () {
      return this.rol() === 'anfitrion';
    }
  };

  function refreshAccessToken() {
    var refresh = Auth.getRefresh();
    if (!refresh) return Promise.resolve(false);

    return fetch(API_BASE + '/login/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refresh })
    })
      .then(function (res) {
        if (!res.ok) return false;
        return res.json().then(function (data) {
          if (data && data.access) {
            Auth.setTokens(data.access, null);
            return true;
          }
          return false;
        });
      })
      .catch(function () {
        return false;
      });
  }

  function request(path, options, allowRetry) {
    options = options || {};
    if (allowRetry === undefined) allowRetry = true;

    var headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    var access = Auth.getAccess();
    if (access && !options.skipAuth) {
      headers['Authorization'] = 'Bearer ' + access;
    }

    var fetchOptions = {
      method: options.method || 'GET',
      headers: headers
    };
    if (options.body !== undefined) fetchOptions.body = options.body;

    return fetch(API_BASE + path, fetchOptions).then(function (res) {
      if (res.status === 401 && allowRetry && !options.skipAuth && Auth.getRefresh()) {
        return refreshAccessToken().then(function (ok) {
          if (ok) return request(path, options, false);
          Auth.clear();
          return res;
        });
      }
      return res;
    });
  }

  function parseResponse(res) {
    return res.text().then(function (text) {
      var data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = text;
        }
      }
      if (!res.ok) {
        var err = new Error('Error HTTP ' + res.status);
        err.status = res.status;
        err.data = data;
        throw err;
      }
      return data;
    });
  }

  function errorMessage(err) {
    if (!err) return 'Ocurrió un error inesperado.';
    if (err.data && typeof err.data === 'object') {
      // Formato DRF: { campo: ["mensaje"], ... } o { detail: "..." }
      var parts = [];
      Object.keys(err.data).forEach(function (key) {
        var value = err.data[key];
        var text = Array.isArray(value) ? value.join(' ') : String(value);
        parts.push(key === 'detail' || key === 'non_field_errors' ? text : key + ': ' + text);
      });
      if (parts.length) return parts.join(' | ');
    }
    if (typeof err.data === 'string') return err.data;
    return err.message;
  }

  var Api = {
    Auth: Auth,
    errorMessage: errorMessage,

    login: function (username, password) {
      return request('/login/', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ username: username, password: password })
      }).then(parseResponse);
    },

    me: function () {
      return request('/usuarios/me/').then(parseResponse);
    },

    register: function (payload) {
      return request('/usuarios/registro/', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(payload)
      }).then(parseResponse);
    },

    listCategorias: function () {
      return request('/catalogo/categorias/').then(parseResponse);
    },

    listExperiencias: function (query) {
      return request('/catalogo/experiencias/' + (query || '')).then(parseResponse);
    },

    createExperiencia: function (payload) {
      return request('/catalogo/experiencias/', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(parseResponse);
    },

    updateExperiencia: function (id, payload) {
      return request('/catalogo/experiencias/' + id + '/', {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(parseResponse);
    },

    deleteExperiencia: function (id) {
      return request('/catalogo/experiencias/' + id + '/', {
        method: 'DELETE'
      }).then(parseResponse);
    },

    /** Carga el perfil del usuario autenticado y lo guarda en la sesión. */
    loadSession: function () {
      return Api.me().then(function (user) {
        Auth.setUser(user);
        return user;
      });
    },

    logout: function () {
      Auth.clear();
      global.location.href = '/';
    }
  };

  global.EcoApi = Api;
})(window);
