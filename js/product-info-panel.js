(function() {
    'use strict';

    window.EP = window.EP || {};

    function $(id) {
        return document.getElementById(id);
    }

    function authState() {
        if (!window.EP.AuthClient || typeof EP.AuthClient.getState !== 'function') {
            return {};
        }
        return EP.AuthClient.getState() || {};
    }

    function price(value, suffix) {
        if (value === null || typeof value === 'undefined') return 'Custom';
        if (value === 0) return '0 EUR';
        return value + ' EUR' + (suffix || '');
    }

    function approvedFallbackCatalog() {
        return {
            plans: [
                {
                    id: 'free',
                    name: 'Free',
                    monthly: 0,
                    yearly: 0,
                    audience: 'Prueba, efectos basicos y descargas limitadas.',
                    stripeConfigured: { monthly: true, yearly: true }
                },
                {
                    id: 'pro',
                    name: 'Pro',
                    monthly: 49,
                    yearly: 490,
                    audience: 'Freelance, comercios pequenos y creadores.',
                    stripeConfigured: { monthly: false, yearly: false }
                },
                {
                    id: 'studio',
                    name: 'Studio',
                    monthly: 99,
                    yearly: 990,
                    audience: 'Agencias, estudios y marcas con volumen.',
                    stripeConfigured: { monthly: false, yearly: false }
                },
                {
                    id: 'enterprise',
                    name: 'Enterprise',
                    monthly: null,
                    yearly: null,
                    audience: 'Retail, eventos, instalaciones e integraciones.',
                    stripeConfigured: { monthly: false, yearly: false }
                }
            ],
            creditPacks: [
                {
                    id: 'credits_29',
                    name: 'Pack de creditos',
                    price: 29,
                    credits: 100,
                    stripeConfigured: false
                }
            ]
        };
    }

    function planBullets(planId) {
        var map = {
            free: [
                'Acceso de prueba al editor.',
                'Efectos basicos y comunes.',
                'Descargas limitadas.'
            ],
            pro: [
                'Mas exportaciones y assets.',
                'Efectos premium seleccionados.',
                'Uso ideal para comercios y creadores.'
            ],
            studio: [
                'Volumen superior de descargas.',
                'Acceso a contenidos mas premium.',
                'Pensado para agencias y marcas recurrentes.'
            ],
            enterprise: [
                'Precio y limites a medida.',
                'Soporte para activaciones, retail e instalaciones.',
                'Integraciones, privacidad y despliegue consultivo.'
            ]
        };
        return map[planId] || [];
    }

    function renderPlans() {
        var state = authState();
        var catalog = state.catalog || approvedFallbackCatalog();
        var plans = catalog.plans || approvedFallbackCatalog().plans;
        var creditPack = catalog.creditPacks && catalog.creditPacks[0] ? catalog.creditPacks[0] : approvedFallbackCatalog().creditPacks[0];

        var cards = plans.map(function(plan) {
            var configured = plan.id === 'free' || (plan.stripeConfigured && (plan.stripeConfigured.monthly || plan.stripeConfigured.yearly));
            var stateText = plan.id === 'enterprise'
                ? 'Venta consultiva'
                : configured
                    ? 'Disponible'
                    : 'Stripe pendiente';
            return '<article class="platform-info-cardlet' + (plan.id === 'pro' ? ' is-featured' : '') + '">' +
                '<h3>' + plan.name + '</h3>' +
                '<div class="platform-info-price">' + price(plan.monthly, plan.monthly === null ? '' : '/mes') + '</div>' +
                '<p>Anual: ' + price(plan.yearly, plan.yearly === null ? '' : '/ano') + '</p>' +
                '<p>' + plan.audience + '</p>' +
                '<ul>' + planBullets(plan.id).map(function(item) { return '<li>' + item + '</li>'; }).join('') + '</ul>' +
                '<span class="auth-price-state' + (configured ? ' is-ready' : '') + '">' + stateText + '</span>' +
            '</article>';
        }).join('');

        return '<p class="platform-info-lead">Planes aprobados para convertir Escaparates Pro en una plataforma SaaS mixta: suscripcion mensual o anual, limites por plan y creditos extra para exportaciones, IA, renders y campanas. Esta pantalla existe dentro del producto para claridad y confianza, no como landing publica.</p>' +
            '<div class="platform-info-grid">' + cards + '</div>' +
            '<div class="platform-info-band">' +
                '<div>' +
                    '<h3>Creditos extra</h3>' +
                    '<p>' + creditPack.name + ' desde ' + creditPack.price + ' EUR. Sirven para ampliar uso sin obligar siempre a cambiar de plan: mas exportaciones, IA, renders, campanas y acciones de alto consumo.</p>' +
                '</div>' +
                '<div class="platform-info-actions">' +
                    '<button type="button" data-platform-open-account>Gestionar cuenta</button>' +
                    '<button type="button" data-platform-open-account>Comprar desde cuenta</button>' +
                '</div>' +
            '</div>' +
            '<section class="platform-info-section">' +
                '<h3>Regla de negocio</h3>' +
                '<p>El frontend puede explicar y bloquear botones, pero la autoridad final debe estar en backend: plan, limites, creditos, publicaciones, exportaciones y acceso premium se validan desde API y entitlements.</p>' +
            '</section>';
    }

    function renderLegal() {
        var links = [
            ['legal/index.html', 'Centro legal', 'Indice de documentos y estado legal provisional.'],
            ['legal/terms.html', 'Terminos SaaS', 'Uso del servicio, cuenta, planes, limites y responsabilidades.'],
            ['legal/privacy.html', 'Privacidad', 'Datos, finalidades, proveedores y derechos.'],
            ['legal/cookies.html', 'Cookies', 'Consentimiento y preferencias.'],
            ['legal/refunds.html', 'Cancelaciones', 'Contratacion, renovaciones, creditos y reembolsos.'],
            ['legal/dpa.html', 'DPA', 'Tratamiento de datos para clientes profesionales.'],
            ['legal/subprocessors.html', 'Subencargados', 'Railway, Stripe, storage, analitica e IA cuando aplique.'],
            ['legal/acceptable-use.html', 'Uso aceptable', 'Limites contra abuso, contenido ilegal y derechos de terceros.'],
            ['legal/ai-policy.html', 'Politica de IA', 'Prompts, assets, resultados y revision humana.'],
            ['legal/ip-takedown.html', 'Retirada IP', 'Canal de retirada por copyright, marca o imagen.']
        ];

        return '<p class="platform-info-lead">Legal y confianza deben existir siempre dentro de la plataforma: visible, accesible y versionado. Esta capa no sustituye revision de abogados, pero evita operar a ciegas antes de cobros reales, publicaciones y uso empresarial.</p>' +
            '<section class="platform-info-section">' +
                '<h3>Estado actual</h3>' +
                '<p>Documentacion provisional para staging y beta privada. Antes de cobro publico real faltan revision juridica, datos fiscales definitivos, consentimiento de cookies completo, fiscalidad/IVA y aprobacion de textos finales.</p>' +
            '</section>' +
            '<div class="platform-info-legal-list">' +
                links.map(function(link) {
                    return '<a href="' + link[0] + '" target="_blank" rel="noopener">' + link[1] + '<span>' + link[2] + '</span></a>';
                }).join('') +
            '</div>' +
            '<div class="platform-info-band">' +
                '<div>' +
                    '<h3>Gate antes de cobros reales</h3>' +
                    '<p>No activar pagos publicos hasta cerrar Stripe webhooks, entitlements server-side, sesiones seguras, persistencia, storage, legal, privacidad, fiscalidad y licencias de modulos/assets.</p>' +
                '</div>' +
                '<div class="platform-info-actions">' +
                    '<a href="docs/LEGAL_TRUST_CENTER.md" target="_blank" rel="noopener">Guia legal</a>' +
                    '<a href="docs/PRICING_AND_MONETIZATION.md" target="_blank" rel="noopener">Guia pricing</a>' +
                '</div>' +
            '</div>';
    }

    function open(kind) {
        var panel = $('platform-info-panel');
        var title = $('platform-info-title');
        var kicker = $('platform-info-kicker');
        var body = $('platform-info-body');
        if (!panel || !title || !body) return;

        if (kind === 'legal') {
            title.textContent = 'Legal y confianza';
            if (kicker) kicker.textContent = 'Trust Center';
            body.innerHTML = renderLegal();
        } else {
            title.textContent = 'Planes y creditos';
            if (kicker) kicker.textContent = 'Pricing aprobado';
            body.innerHTML = renderPlans();
        }

        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
    }

    function close() {
        var panel = $('platform-info-panel');
        if (!panel) return;
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
    }

    function bind() {
        if (bind.bound) return;
        bind.bound = true;

        var pricingBtn = $('btn-pricing-info');
        var legalBtn = $('btn-legal-info');
        var closeBtn = $('platform-info-close');
        var panel = $('platform-info-panel');

        if (pricingBtn) pricingBtn.addEventListener('click', function() { open('pricing'); });
        if (legalBtn) legalBtn.addEventListener('click', function() { open('legal'); });
        Array.prototype.forEach.call(document.querySelectorAll('[data-platform-info]'), function(btn) {
            btn.addEventListener('click', function() {
                open(btn.dataset.platformInfo);
            });
        });
        if (closeBtn) closeBtn.addEventListener('click', close);
        if (panel) {
            panel.addEventListener('click', function(event) {
                if (event.target === panel) close();
                if (event.target && event.target.dataset && event.target.dataset.platformOpenAccount) {
                    close();
                    if (window.EP.AuthClient && typeof EP.AuthClient.open === 'function') {
                        EP.AuthClient.open();
                    }
                }
            });
        }
    }

    window.EP.PlatformInfo = {
        init: bind,
        open: open,
        close: close
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind, { once: true });
    } else {
        bind();
    }
})();
