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
        catalog: null,
        credits: null,
        selectedInterval: 'monthly',
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
        var ids = ['auth-login', 'auth-register', 'auth-logout', 'auth-portal', 'auth-buy-credits'];
        ids.forEach(function(id) {
            var el = $(id);
            if (el) el.dataset.busy = isBusy ? '1' : '0';
        });

        Array.prototype.forEach.call(document.querySelectorAll('[data-plan-checkout]'), function(btn) {
            btn.dataset.busy = isBusy ? '1' : '0';
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
        state.credits = null;
        state.token = null;
        localStorage.removeItem(TOKEN_KEY);
        syncPlanGate();
        render();
        // After logout or an expired session the visitor returns to the public
        // catalog as a guest; the login panel opens only on demand.
    }

    function syncPlanGate() {
        if (window.EP && EP.PlanGate && typeof EP.PlanGate.setAuthState === 'function') {
            EP.PlanGate.setAuthState(state.user, state.billing);
        }
    }

    function formatPrice(value, suffix) {
        if (value === null || typeof value === 'undefined') return 'Custom';
        if (value === 0) return '0 EUR';
        return value + ' EUR' + (suffix || '');
    }

    function planPrice(plan) {
        if (state.selectedInterval === 'yearly') {
            return formatPrice(plan.yearly, '/ano');
        }
        return formatPrice(plan.monthly, '/mes');
    }

    function planIsCheckoutEnabled(plan) {
        if (!state.user) return false;
        if (plan.id === 'free' || plan.id === 'enterprise') return false;
        if (!plan.stripeConfigured) return false;
        return Boolean(plan.stripeConfigured[state.selectedInterval]);
    }

    function renderPricing() {
        var grid = $('auth-pricing-grid');
        if (!grid) return;

        if (!state.catalog || !state.catalog.plans) {
            grid.innerHTML = '<div class="auth-price-card"><h3>Cargando pricing</h3><p>Consultando catalogo publico del backend.</p></div>';
            return;
        }

        grid.innerHTML = state.catalog.plans.map(function(plan) {
            var isPaid = plan.id === 'pro' || plan.id === 'studio';
            var ready = planIsCheckoutEnabled(plan);
            var stateText = plan.id === 'free'
                ? 'Incluido'
                : plan.id === 'enterprise'
                    ? 'Venta consultiva'
                    : ready
                        ? 'Stripe listo'
                        : 'Price ID pendiente';
            var buttonText = plan.id === 'free'
                ? 'Plan actual base'
                : plan.id === 'enterprise'
                    ? 'Contactar'
                    : plan.cta;
            var disabled = ready ? '' : ' disabled';
            var featured = plan.id === 'pro' ? ' is-featured' : '';

            return '<article class="auth-price-card' + featured + '">' +
                '<h3>' + plan.name + '</h3>' +
                '<div class="auth-price-value">' + planPrice(plan) + '</div>' +
                '<p>' + plan.audience + '</p>' +
                '<span class="auth-price-state' + (ready || plan.id === 'free' ? ' is-ready' : '') + '">' + stateText + '</span>' +
                '<button class="' + (isPaid ? 'auth-primary' : 'auth-secondary') + '" data-plan-checkout="' + plan.id + '"' + disabled + '>' + buttonText + '</button>' +
            '</article>';
        }).join('');
    }

    function renderCredits() {
        var label = $('auth-credits-label');
        var copy = $('auth-credits-copy');
        var button = $('auth-buy-credits');
        var pack = state.catalog && state.catalog.creditPacks && state.catalog.creditPacks[0];
        var balance = state.credits ? state.credits.balance : 0;

        if (pack && label) {
            label.textContent = pack.name + ': ' + pack.price + ' EUR / ' + pack.credits + ' creditos';
        }
        if (copy) {
            copy.textContent = state.user
                ? 'Saldo actual: ' + balance + ' creditos. Para mas exportaciones, IA, renders y campanas.'
                : 'Login obligatorio para comprar y usar creditos.';
        }
        if (button) {
            button.disabled = !state.user || !pack || !pack.stripeConfigured;
            button.textContent = pack && pack.stripeConfigured ? 'Comprar creditos' : 'Creditos pendientes Stripe';
        }
    }

    function render() {
        var accountBtn = $('btn-account');
        var logoutBtn = $('auth-logout');
        var portalBtn = $('auth-portal');
        var planLabel = $('auth-plan-label');
        var planCopy = $('auth-plan-copy');
        var closeBtn = $('auth-close');
        var requiresAuth = !state.user;

        // 'auth-required' used to blur the whole catalog and force the auth panel
        // open. The public catalog must stay browsable without a session, so the app
        // is no longer gated at load; the panel opens on demand and the backend keeps
        // enforcing authorization on every persistent action.
        document.body.classList.remove('auth-required');
        document.body.classList.toggle('auth-connected', Boolean(state.user));

        if (accountBtn) {
            accountBtn.textContent = state.user ? state.user.email : 'Login';
            accountBtn.classList.toggle('auth-connected', Boolean(state.user));
        }

        if (logoutBtn) logoutBtn.disabled = !state.user;
        if (portalBtn) portalBtn.disabled = !state.user || !state.billing || !state.billing.stripeCustomerLinked;
        if (closeBtn) {
            // The panel is a dismissible dialog for everyone: anonymous visitors
            // must be able to close it and keep browsing the public catalog.
            closeBtn.disabled = false;
            closeBtn.setAttribute('aria-hidden', 'false');
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
                planCopy.textContent = 'Cuenta activa. Billing conectado al backend real. Los derechos se leen desde /v1/entitlements.';
            }
        }

        renderPricing();
        renderCredits();

        // The auth panel is opened on demand (Login button or a protected action),
        // never forced open on load. The public catalog stays reachable without a session.
    }

    async function refreshCatalog() {
        try {
            state.catalog = await request('/v1/billing/catalog', { method: 'GET' });
        } catch (err) {
            state.catalog = null;
            setStatus('No se pudo leer pricing: ' + err.message, 'error');
        }
        render();
    }

    async function refreshMe() {
        if (!state.token) {
            // Anonymous visitor: guest/demo plan, free to explore the catalog.
            // Authentication is requested only when a protected action needs it.
            syncPlanGate();
            render();
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
            await refreshCredits();
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

    async function refreshCredits() {
        if (!state.user) return;
        try {
            state.credits = await request('/v1/billing/credits', { method: 'GET' });
        } catch (_err) {
            state.credits = null;
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

    async function checkoutPlan(plan) {
        if (!state.user || plan === 'free' || plan === 'enterprise') return;
        setBusy(true);
        try {
            var data = await request('/v1/billing/checkout', {
                method: 'POST',
                body: JSON.stringify({
                    kind: 'subscription',
                    plan: plan,
                    interval: state.selectedInterval,
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

    async function buyCredits() {
        if (!state.user) return;
        setBusy(true);
        try {
            var data = await request('/v1/billing/checkout', {
                method: 'POST',
                body: JSON.stringify({
                    kind: 'credits',
                    creditPack: 'credits_29',
                    successUrl: window.location.origin + window.location.pathname + '?credits=success',
                    cancelUrl: window.location.origin + window.location.pathname + '?credits=cancelled'
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

    async function openCustomerPortal() {
        if (!state.user) return;
        setBusy(true);
        try {
            var data = await request('/v1/billing/portal', {
                method: 'POST',
                body: '{}'
            });
            window.location.href = data.portalUrl;
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
        // Always dismissible. Protected actions re-open it on demand; the backend
        // remains the real authorization boundary for every persistent operation.
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
        var portalBtn = $('auth-portal');
        var creditsBtn = $('auth-buy-credits');
        var panel = $('auth-panel');

        if (accountBtn) accountBtn.addEventListener('click', openPanel);
        if (closeBtn) closeBtn.addEventListener('click', closePanel);
        if (loginBtn) loginBtn.addEventListener('click', login);
        if (registerBtn) registerBtn.addEventListener('click', register);
        if (logoutBtn) logoutBtn.addEventListener('click', logout);
        if (portalBtn) portalBtn.addEventListener('click', openCustomerPortal);
        if (creditsBtn) creditsBtn.addEventListener('click', buyCredits);
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && state.isOpen) closePanel();
        });

        if (panel) {
            panel.addEventListener('click', function(event) {
                // Backdrop click (never a click inside the card) dismisses the panel.
                if (event.target === panel) closePanel();
                if (event.target && event.target.dataset && event.target.dataset.planCheckout) {
                    checkoutPlan(event.target.dataset.planCheckout);
                }
                if (event.target && event.target.dataset && event.target.dataset.billingInterval) {
                    state.selectedInterval = event.target.dataset.billingInterval;
                    Array.prototype.forEach.call(document.querySelectorAll('[data-billing-interval]'), function(btn) {
                        btn.classList.toggle('active', btn.dataset.billingInterval === state.selectedInterval);
                    });
                    render();
                }
            });
        }
    }

    function init() {
        state.token = localStorage.getItem(TOKEN_KEY);
        bind();
        syncPlanGate();
        render();
        refreshCatalog();
        refreshMe();
    }

    window.EP.AuthClient = {
        init: init,
        refreshMe: refreshMe,
        refreshBilling: refreshBilling,
        open: openPanel,
        isAuthenticated: function() {
            return Boolean(state.user);
        },
        apiBase: apiBase,
        getState: function() {
            return {
                token: state.token,
                user: state.user,
                billing: state.billing,
                catalog: state.catalog,
                credits: state.credits
            };
        }
    };
})();
