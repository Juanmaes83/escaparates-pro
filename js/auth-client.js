(function() {
    'use strict';

    window.EP = window.EP || {};

    var DEFAULT_API_BASE = 'https://escaparates-pro-api-staging-staging.up.railway.app';
    var TOKEN_KEY = 'ep.refreshToken';
    var API_BASE_KEY = 'ep.apiBaseUrl';

    var state = {
        token: null,
        user: null,
        billing: null,
        isOpen: false
    };

    function $(id) {
        return document.getElementById(id);
    }

    function apiBase() {
        return (localStorage.getItem(API_BASE_KEY) || DEFAULT_API_BASE).replace(/\/+$/, '');
    }

    function setStatus(message, type) {
        var status = $('auth-status');
        if (!status) return;
        status.textContent = message;
        status.classList.remove('ok', 'error');
        if (type) status.classList.add(type);
    }

    function setBusy(isBusy) {
        ['auth-login', 'auth-register', 'auth-logout', 'auth-upgrade'].forEach(function(id) {
            var el = $(id);
            if (el) el.dataset.busy = isBusy ? '1' : '0';
        });
    }

    async function request(path, options) {
        var headers = Object.assign({
            'Content-Type': 'application/json'
        }, (options && options.headers) || {});

        if (state.token) {
            headers.Authorization = 'Bearer ' + state.token;
        }

        var response = await fetch(apiBase() + path, Object.assign({}, options, { headers: headers }));
        var data = null;
        try {
            data = await response.json();
        } catch (_err) {
            data = null;
        }

        if (!response.ok) {
            var message = data && data.error ? data.error.message : 'Error de API';
            var code = data && data.error ? data.error.code : 'REQUEST_FAILED';
            throw new Error(code + ': ' + message);
        }

        return data;
    }

    function getCredentials() {
        return {
            email: ($('auth-email') && $('auth-email').value || '').trim(),
            password: ($('auth-password') && $('auth-password').value || ''),
            name: ($('auth-name') && $('auth-name').value || '').trim(),
            termsAccepted: Boolean($('auth-terms') && $('auth-terms').checked)
        };
    }

    function rememberSession(data) {
        state.user = data.user;
        state.token = data.session && data.session.refreshToken ? data.session.refreshToken : state.token;
        if (state.token) localStorage.setItem(TOKEN_KEY, state.token);
    }

    function clearSession() {
        state.user = null;
        state.billing = null;
        state.token = null;
        localStorage.removeItem(TOKEN_KEY);
        syncPlanGate();
        render();
        openPanel();
    }

    function syncPlanGate() {
        if (window.EP && EP.PlanGate && typeof EP.PlanGate.setAuthState === 'function') {
            EP.PlanGate.setAuthState(state.user, state.billing);
        }
    }

    function render() {
        var accountBtn = $('btn-account');
        var logoutBtn = $('auth-logout');
        var upgradeBtn = $('auth-upgrade');
        var planLabel = $('auth-plan-label');
        var planCopy = $('auth-plan-copy');
        var closeBtn = $('auth-close');
        var requiresAuth = !state.user;

        document.body.classList.toggle('auth-required', requiresAuth);
        document.body.classList.toggle('auth-connected', Boolean(state.user));

        if (accountBtn) {
            accountBtn.textContent = state.user ? state.user.email : 'Login';
            accountBtn.classList.toggle('auth-connected', Boolean(state.user));
        }

        if (logoutBtn) logoutBtn.disabled = !state.user;
        if (upgradeBtn) upgradeBtn.disabled = !state.user;
        if (closeBtn) {
            closeBtn.disabled = requiresAuth;
            closeBtn.setAttribute('aria-hidden', requiresAuth ? 'true' : 'false');
        }

        if (planLabel) {
            planLabel.textContent = state.billing
                ? (state.billing.plan || 'free') + ' / ' + (state.billing.billingStatus || 'free')
                : (state.user ? 'Consultando plan...' : 'Sin sesion');
        }

        if (planCopy) {
            if (!state.user) {
                planCopy.textContent = 'Login obligatorio: entra o crea una cuenta para acceder al editor real. Sin sesion el estudio queda bloqueado.';
            } else if (state.billing && !state.billing.billingConfigured) {
                planCopy.textContent = 'Cuenta activa. Billing aun no tiene Stripe configurado en este entorno.';
            } else if (state.billing) {
                planCopy.textContent = 'Cuenta activa. Billing conectado al backend real.';
            }
        }

        if (requiresAuth) {
            var panel = $('auth-panel');
            if (panel) {
                state.isOpen = true;
                panel.classList.add('open');
                panel.setAttribute('aria-hidden', 'false');
            }
        }
    }

    async function refreshMe() {
        if (!state.token) {
            syncPlanGate();
            render();
            openPanel();
            setStatus('Login obligatorio: entra o crea cuenta para usar Escaparates Pro.', null);
            return;
        }

        try {
            var data = await request('/v1/auth/me', { method: 'GET' });
            state.user = data.user;
            setStatus('Sesion activa: ' + state.user.email, 'ok');
            await refreshBilling();
        } catch (err) {
            clearSession();
            setStatus('Sesion caducada o invalida. Vuelve a entrar.', 'error');
            render();
        }
    }

    async function refreshBilling() {
        if (!state.user) {
            render();
            return;
        }

        try {
            state.billing = await request('/v1/billing/status', { method: 'GET' });
            await refreshEntitlements();
        } catch (err) {
            state.billing = null;
            setStatus('Login correcto, pero no se pudo leer billing: ' + err.message, 'error');
        }
        syncPlanGate();
        render();
    }

    async function refreshEntitlements() {
        if (!state.user) return;
        try {
            var data = await request('/v1/entitlements', { method: 'GET' });
            if (data && data.entitlements) {
                state.billing = Object.assign({}, state.billing || {}, {
                    entitlements: data.entitlements,
                    plan: data.entitlements.plan,
                    billingStatus: data.entitlements.billingStatus
                });
            }
        } catch (err) {
            setStatus('Login correcto, pero no se pudo leer entitlements: ' + err.message, 'error');
        }
    }

    async function login() {
        var credentials = getCredentials();
        setBusy(true);
        try {
            var data = await request('/v1/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password
                })
            });
            rememberSession(data);
            setStatus('Login correcto: ' + state.user.email, 'ok');
            await refreshBilling();
            closePanel();
        } catch (err) {
            setStatus(err.message, 'error');
        } finally {
            setBusy(false);
            render();
        }
    }

    async function register() {
        var credentials = getCredentials();
        if (!credentials.termsAccepted) {
            setStatus('Debes aceptar Terminos y Politica de privacidad para crear la cuenta.', 'error');
            return;
        }
        setBusy(true);
        try {
            var data = await request('/v1/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password,
                    name: credentials.name || undefined,
                    termsAccepted: true
                })
            });
            rememberSession(data);
            setStatus('Cuenta creada: ' + state.user.email, 'ok');
            await refreshBilling();
            closePanel();
        } catch (err) {
            setStatus(err.message, 'error');
        } finally {
            setBusy(false);
            render();
        }
    }

    async function logout() {
        if (!state.token) return;
        setBusy(true);
        try {
            await request('/v1/auth/logout', {
                method: 'POST',
                body: '{}'
            });
            clearSession();
            setStatus('Sesion cerrada.', 'ok');
        } catch (err) {
            clearSession();
            setStatus('Sesion local cerrada. API: ' + err.message, 'error');
        } finally {
            setBusy(false);
            render();
        }
    }

    async function upgrade() {
        if (!state.user) return;
        setBusy(true);
        try {
            var data = await request('/v1/billing/checkout', {
                method: 'POST',
                body: JSON.stringify({
                    plan: 'pro',
                    successUrl: window.location.origin + window.location.pathname + '?billing=success',
                    cancelUrl: window.location.origin + window.location.pathname + '?billing=cancelled'
                })
            });
            window.location.href = data.checkoutUrl;
        } catch (err) {
            setStatus(err.message, 'error');
        } finally {
            setBusy(false);
            render();
        }
    }

    function openPanel() {
        state.isOpen = true;
        var panel = $('auth-panel');
        if (panel) {
            panel.classList.add('open');
            panel.setAttribute('aria-hidden', 'false');
        }
        render();
    }

    function closePanel() {
        if (!state.user) {
            openPanel();
            setStatus('Login obligatorio: no puedes cerrar esta pantalla sin una sesion valida.', 'error');
            return;
        }
        state.isOpen = false;
        var panel = $('auth-panel');
        if (panel) {
            panel.classList.remove('open');
            panel.setAttribute('aria-hidden', 'true');
        }
    }

    function bind() {
        var accountBtn = $('btn-account');
        var closeBtn = $('auth-close');
        var loginBtn = $('auth-login');
        var registerBtn = $('auth-register');
        var logoutBtn = $('auth-logout');
        var upgradeBtn = $('auth-upgrade');
        var panel = $('auth-panel');

        if (accountBtn) accountBtn.addEventListener('click', openPanel);
        if (closeBtn) closeBtn.addEventListener('click', closePanel);
        if (loginBtn) loginBtn.addEventListener('click', login);
        if (registerBtn) registerBtn.addEventListener('click', register);
        if (logoutBtn) logoutBtn.addEventListener('click', logout);
        if (upgradeBtn) upgradeBtn.addEventListener('click', upgrade);
        if (panel) {
            panel.addEventListener('click', function(event) {
                if (event.target === panel && state.user) closePanel();
            });
        }
    }

    function init() {
        state.token = localStorage.getItem(TOKEN_KEY);
        bind();
        syncPlanGate();
        render();
        refreshMe();
    }

    window.EP.AuthClient = {
        init: init,
        refreshMe: refreshMe,
        open: openPanel,
        isAuthenticated: function() {
            return Boolean(state.user);
        },
        apiBase: apiBase,
        getState: function() {
            return {
                token: state.token,
                user: state.user,
                billing: state.billing
            };
        }
    };
})();
