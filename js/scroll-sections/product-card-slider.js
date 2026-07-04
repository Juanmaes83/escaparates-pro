// Product Card Slider — adapted from the CodePen gist "Star Wars Imperial
// Army's Product Slider" (source read & understood: a Swiper.js fade-effect
// carousel of product cards — title, price, a feature/size radio group, a
// circular "durability" stat, add-to-cart and add-to-wishlist buttons — kept
// in sync with a full-bleed background image stack that crossfades to match
// the active slide via a shared data-target id; prev/next buttons disable at
// the ends. Recreated for real-estate reference cards — price, room-count
// selector, a circular "valoración" stat, "Solicitar visita" and a
// save-to-favourites heart toggle — with vanilla JS replacing the source's
// jQuery glue code (Swiper itself never needed jQuery)).
(function() {
    var SWIPER_CSS = 'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css';
    var SWIPER_JS = 'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js';
    var ROOM_OPTIONS = ['1', '2', '3', '4+'];

    function imgMarkup(media, i) {
        var inner = media.type === 'video'
            ? '<video src="' + media.url + '" autoplay muted loop playsinline></video>'
            : '<img src="' + media.url + '" alt="">';
        return '<div class="product-img__item' + (i === 0 ? ' active' : '') + '" id="img' + i + '">' + inner + '</div>';
    }

    function cardMarkup(media, i, defaultRoom) {
        var label = media.name || ('Referencia ' + (i + 1));
        var price = (1200 + i * 350) + ' €/mes';
        var pct = 70 + (i * 7) % 25;
        var dash = Math.round((pct / 100) * 300);
        var rooms = ROOM_OPTIONS.map(function(r, ri) {
            return '<label class="product-labels__item"><input type="radio" class="product-labels__checkbox" name="rooms' + i + '"' + (ri === defaultRoom ? ' checked' : '') + '><span class="product-labels__txt">' + r + '</span></label>';
        }).join('');
        return '' +
'<div class="product-slider__item swiper-slide" data-target="img' + i + '">\n' +
'  <div class="product-slider__card">\n' +
'    <div class="product-slider__content">\n' +
'      <h1 class="product-slider__title">' + label + '</h1>\n' +
'      <span class="product-slider__price">' + price + '</span>\n' +
'      <div class="product-ctr">\n' +
'        <div class="product-labels">\n' +
'          <div class="product-labels__title">HABITACIONES</div>\n' +
'          <div class="product-labels__group">' + rooms + '</div>\n' +
'        </div>\n' +
'        <span class="hr-vertical"></span>\n' +
'        <div class="product-inf">\n' +
'          <div class="product-inf__percent">\n' +
'            <div class="product-inf__percent-circle">\n' +
'              <svg width="70" height="70" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" stroke-dasharray="' + dash + ', 300" stroke="#ff5a3c" stroke-width="4" fill="none"/></svg>\n' +
'            </div>\n' +
'            <div class="product-inf__percent-txt">' + pct + '%</div>\n' +
'          </div>\n' +
'          <span class="product-inf__title">VALORACIÓN</span>\n' +
'        </div>\n' +
'      </div>\n' +
'      <div class="product-slider__bottom">\n' +
'        <button class="product-slider__cart">SOLICITAR VISITA</button>\n' +
'        <button class="product-slider__fav js-fav"><span class="heart"></span> GUARDAR EN FAVORITOS</button>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>';
    }

    function build(mediaList, opts) {
        opts = opts || {};
        var title = opts.title || 'Escaparate';
        var itemCount = opts.itemCount || 4;
        var media = EP.ScrollSections.fillMedia(mediaList, itemCount);
        var imgsHTML = media.map(imgMarkup).join('\n      ');
        var cardsHTML = media.map(function(m, i) { return cardMarkup(m, i, i % 4); }).join('\n      ');

        return '' +
'<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + title + ' — Product Card Slider</title>\n' +
'<link rel="stylesheet" href="' + SWIPER_CSS + '">\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0;}\n' +
'img,video{width:100%;height:100%;object-fit:cover;display:block;}\n' +
'body{font-family:Arial,Helvetica,sans-serif;background:#0a0a0c;color:#fff;overflow:hidden;}\n' +
'.wrapper{position:relative;width:100%;height:100vh;}\n' +
'.brand{position:fixed;top:1.6rem;left:50%;transform:translateX(-50%);z-index:10;font-size:0.85rem;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;}\n' +
'.product-img{position:absolute;inset:0;}\n' +
'.product-img__item{position:absolute;inset:0;opacity:0;transition:opacity 0.6s ease;}\n' +
'.product-img__item.active{opacity:1;}\n' +
'.product-img__item::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.2) 55%,rgba(0,0,0,0.5) 100%);}\n' +
'.product-slider{position:absolute;bottom:0;left:0;width:100%;max-width:560px;padding:3rem;z-index:5;}\n' +
'.product-slider__title{font-size:clamp(1.6rem,3.5vw,2.6rem);font-weight:800;text-transform:uppercase;letter-spacing:0.02em;line-height:1.1;}\n' +
'.product-slider__price{display:block;margin-top:0.6rem;font-size:1.4rem;font-weight:700;color:#ff5a3c;}\n' +
'.product-ctr{display:flex;align-items:center;gap:1.4rem;margin-top:1.6rem;}\n' +
'.product-labels__title{font-size:0.7rem;letter-spacing:0.08em;opacity:0.6;margin-bottom:0.5rem;text-transform:uppercase;}\n' +
'.product-labels__group{display:flex;gap:0.4rem;}\n' +
'.product-labels__item{position:relative;}\n' +
'.product-labels__checkbox{position:absolute;opacity:0;width:100%;height:100%;cursor:pointer;margin:0;}\n' +
'.product-labels__txt{display:flex;align-items:center;justify-content:center;width:2.2rem;height:2.2rem;border:1px solid rgba(255,255,255,0.3);border-radius:6px;font-size:0.8rem;transition:all 0.2s;}\n' +
'.product-labels__checkbox:checked + .product-labels__txt{background:#fff;color:#0a0a0c;border-color:#fff;}\n' +
'.hr-vertical{width:1px;height:2.6rem;background:rgba(255,255,255,0.2);}\n' +
'.product-inf{display:flex;flex-direction:column;align-items:center;gap:0.3rem;}\n' +
'.product-inf__percent{position:relative;width:70px;height:70px;display:flex;align-items:center;justify-content:center;}\n' +
'.product-inf__percent-circle{position:absolute;inset:0;transform:rotate(-90deg);}\n' +
'.product-inf__percent-txt{font-size:0.85rem;font-weight:700;}\n' +
'.product-inf__title{font-size:0.6rem;letter-spacing:0.06em;opacity:0.6;text-transform:uppercase;}\n' +
'.product-slider__bottom{display:flex;flex-direction:column;gap:0.6rem;margin-top:1.8rem;max-width:280px;}\n' +
'.product-slider__cart{padding:0.8rem;background:#ff5a3c;color:#fff;border:none;border-radius:6px;font-weight:700;letter-spacing:0.05em;cursor:pointer;font-family:inherit;}\n' +
'.product-slider__fav{display:flex;align-items:center;justify-content:center;gap:0.5rem;padding:0.6rem;background:transparent;border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:6px;font-size:0.75rem;letter-spacing:0.05em;cursor:pointer;font-family:inherit;}\n' +
'.heart{width:14px;height:14px;border-radius:50%;border:1.5px solid #fff;display:inline-block;}\n' +
'.heart.is-active{background:#ff5a3c;border-color:#ff5a3c;}\n' +
'.nav-btn{position:fixed;top:50%;transform:translateY(-50%);z-index:10;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);color:#fff;cursor:pointer;font-size:1.2rem;}\n' +
'.nav-btn.prev{left:1.5rem;} .nav-btn.next{right:1.5rem;}\n' +
'.nav-btn.disabled{opacity:0.25;pointer-events:none;}\n' +
'@media (max-width:768px){.product-slider{padding:1.5rem;max-width:100%;} .product-ctr{flex-wrap:wrap;gap:1rem;}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="brand">' + title + '</div>\n' +
'<div class="wrapper">\n' +
'  <div class="product-img">\n' +
'      ' + imgsHTML + '\n' +
'  </div>\n' +
'  <button class="nav-btn prev disabled">‹</button>\n' +
'  <button class="nav-btn next">›</button>\n' +
'  <div class="product-slider swiper">\n' +
'    <div class="swiper-wrapper">\n' +
'      ' + cardsHTML + '\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'<script src="' + SWIPER_JS + '"></script>\n' +
'<script>\n' +
'(function(){\n' +
'  function setActiveImage(target) {\n' +
'    document.querySelectorAll(".product-img__item").forEach(function(el) { el.classList.remove("active"); });\n' +
'    var el = document.getElementById(target);\n' +
'    if (el) el.classList.add("active");\n' +
'  }\n' +
'\n' +
'  var prevBtn = document.querySelector(".nav-btn.prev");\n' +
'  var nextBtn = document.querySelector(".nav-btn.next");\n' +
'\n' +
'  var swiper = new Swiper(".product-slider", {\n' +
'    effect: "fade", loop: false,\n' +
'    navigation: { nextEl: ".nav-btn.next", prevEl: ".nav-btn.prev" },\n' +
'    on: {\n' +
'      init: function() {\n' +
'        var slide = this.slides[this.activeIndex];\n' +
'        setActiveImage(slide.getAttribute("data-target"));\n' +
'      }\n' +
'    }\n' +
'  });\n' +
'\n' +
'  swiper.on("slideChange", function() {\n' +
'    var slide = swiper.slides[swiper.activeIndex];\n' +
'    setActiveImage(slide.getAttribute("data-target"));\n' +
'    prevBtn.classList.toggle("disabled", swiper.isBeginning);\n' +
'    nextBtn.classList.toggle("disabled", swiper.isEnd);\n' +
'  });\n' +
'\n' +
'  document.querySelectorAll(".js-fav").forEach(function(btn) {\n' +
'    btn.addEventListener("click", function() {\n' +
'      btn.querySelector(".heart").classList.toggle("is-active");\n' +
'    });\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'</body>\n' +
'</html>\n';
    }

    EP.ScrollSections.register({
        badge: 'original-top',
        id: 'product-card-slider',
        name: 'Product Card Slider',
        icon: '🛒',
        description: 'Carrusel fade de fichas de referencia (Swiper.js) — precio, selector de habitaciones, indicador circular de valoración, botón de visita y favoritos; imagen de fondo a pantalla completa sincronizada con la ficha activa',
        sourceUrl: 'https://gist.github.com/Juanmaes83/f62b759eb84c33e6e31ab506fe4a20f7',
        build: build
    });
})();
