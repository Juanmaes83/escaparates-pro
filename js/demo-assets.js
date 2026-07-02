EP.DemoAssets = (function() {
    var ASSETS = {
        'Inmobiliaria': [
            { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&q=80', name: 'Casa exterior' },
            { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80', name: 'Fachada moderna' },
            { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500&q=80', name: 'Interior sala' },
            { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&q=80', name: 'Villa premium' },
            { url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&q=80', name: 'Casa jardín' },
            { url: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=500&q=80', name: 'Exterior piscina' }
        ],
        'Lifestyle': [
            { url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&q=80', name: 'Retrato mujer' },
            { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80', name: 'Retrato hombre' },
            { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80', name: 'Retrato sonrisa' },
            { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&q=80', name: 'Lifestyle urbano' },
            { url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&q=80', name: 'Moda exterior' },
            { url: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=500&q=80', name: 'Lifestyle fitness' }
        ],
        'Producto': [
            { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', name: 'Reloj premium' },
            { url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&q=80', name: 'Zapatillas' },
            { url: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500&q=80', name: 'Cosmética' },
            { url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&q=80', name: 'Sneakers' },
            { url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80', name: 'Moda tienda' },
            { url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80', name: 'Cámara retro' }
        ],
        'Arquitectura': [
            { url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=500&q=80', name: 'Edificio urbano' },
            { url: 'https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?w=500&q=80', name: 'Interior minimalista' },
            { url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=500&q=80', name: 'Oficina moderna' },
            { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80', name: 'Sala diseño' },
            { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80', name: 'Espacio abierto' },
            { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80', name: 'Cocina premium' }
        ]
    };

    var modal = null;
    var activeCategory = 'Inmobiliaria';

    function init() {
        var btn = document.getElementById('btn-demo-assets');
        if (!btn) return;
        btn.addEventListener('click', open);
        buildModal();
    }

    function buildModal() {
        modal = document.createElement('div');
        modal.id = 'demo-assets-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML =
            '<div class="modal-box demo-assets-box">' +
                '<div class="modal-header">' +
                    '<div>' +
                        '<h3>Assets de demostración</h3>' +
                        '<p class="modal-sub">Haz clic en una imagen para cargarla en el siguiente slot disponible</p>' +
                    '</div>' +
                    '<button class="modal-close" id="demo-assets-close">✕</button>' +
                '</div>' +
                '<div class="da-tabs" id="da-tabs"></div>' +
                '<div class="da-grid" id="da-grid"></div>' +
                '<div class="da-footer">' +
                    '<button id="da-load-all" class="btn-primary-sm">Cargar categoría completa</button>' +
                    '<span class="da-hint">O sube tus propias imágenes haciendo clic en los slots</span>' +
                '</div>' +
            '</div>';
        document.body.appendChild(modal);

        document.getElementById('demo-assets-close').addEventListener('click', close);
        modal.addEventListener('click', function(e) { if (e.target === modal) close(); });

        buildTabs();
        renderGrid(activeCategory);

        document.getElementById('da-load-all').addEventListener('click', function() {
            var items = ASSETS[activeCategory];
            items.forEach(function(item) { EP.Media.loadFromUrl(item.url, item.name); });
            close();
        });
    }

    function buildTabs() {
        var container = document.getElementById('da-tabs');
        Object.keys(ASSETS).forEach(function(cat) {
            var btn = document.createElement('button');
            btn.className = 'da-tab' + (cat === activeCategory ? ' active' : '');
            btn.textContent = cat;
            btn.addEventListener('click', function() {
                activeCategory = cat;
                document.querySelectorAll('.da-tab').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                renderGrid(cat);
            });
            container.appendChild(btn);
        });
    }

    function renderGrid(category) {
        var grid = document.getElementById('da-grid');
        grid.innerHTML = '';
        ASSETS[category].forEach(function(item) {
            var card = document.createElement('div');
            card.className = 'da-card';
            var img = document.createElement('img');
            img.src = item.url;
            img.alt = item.name;
            img.loading = 'lazy';
            var label = document.createElement('span');
            label.className = 'da-card-label';
            label.textContent = item.name;
            card.appendChild(img);
            card.appendChild(label);
            card.addEventListener('click', function() {
                EP.Media.loadFromUrl(item.url, item.name);
            });
            grid.appendChild(card);
        });
    }

    function open() {
        if (modal) modal.classList.add('open');
    }

    function close() {
        if (modal) modal.classList.remove('open');
    }

    return { init: init };
})();
