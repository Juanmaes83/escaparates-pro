(() => {
  const ACTIVE = [];

  function waitForImages(scope){
    const imgs = [...scope.querySelectorAll('img')].filter(i => !i.complete);
    if (!imgs.length) return Promise.resolve();
    return Promise.all(imgs.map(img => new Promise(res => {
      img.addEventListener('load', res, { once:true });
      img.addEventListener('error', res, { once:true });
    })));
  }

  function computeRadiusPx(section, items){
    const rect = section.getBoundingClientRect();
    const half = Math.min(rect.width, rect.height) / 2;

    const raw = (section.dataset.radius || '38').toString().trim().toLowerCase();
    if (raw === 'auto') {
      const widths = items.map(el => el.getBoundingClientRect().width || 100);
      const avgW = widths.reduce((a,b)=>a+b,0) / Math.max(1,widths.length);
      const gapGuess = avgW * 0.15;
      const C = items.length * (avgW + gapGuess);
      const r = C / (2 * Math.PI);
      return Math.min(r, half * 0.92);
    }
    const pct = Number(raw);
    return (isFinite(pct) ? pct : 38) / 100 * half;
  }

  function createWheel(section){
    const wheel = section.querySelector('.wheel');
    const items = [...wheel.querySelectorAll('.wheel-item')];
    const uprights = items.map(it => it.querySelector('.upright'));

    // === Default speed: 0.25 deg/sec (precise + gentle) ===
    // Safe parse so data-speed="0" is allowed (no unintended fallback).
    const parsed = parseFloat(section.dataset.speed);
    let speedDeg = Number.isFinite(parsed) ? parsed : 0.25;  // deg/sec

    // Direction (right = cw, left = ccw)
    let dirAttr = String(section.dataset.direction || 'right').toLowerCase();
    let dir = (dirAttr === 'left') ? -1 : 1;

    let radius = 0;
    let angles = [];
    let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let paused = false;

    function layout(init=false){
      const rect = section.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      radius = computeRadiusPx(section, items);

      const n = items.length;
      if (init || angles.length !== n) {
        angles = Array.from({length:n}, (_,i) => (360/n)*i);
      }

      for (let i = 0; i < n; i++){
        const deg = angles[i];
        const rad = deg * Math.PI / 180;
        const x = cx + radius * Math.cos(rad);
        const y = cy + radius * Math.sin(rad);

        gsap.set(items[i], {
          position: 'absolute',
          left: 0, top: 0,
          x, y, xPercent: -50, yPercent: -50
        });

        // Always upright
        gsap.set(uprights[i], { rotation: 0 });
      }
    }

    function tick(dt){
      if (reduced || paused) return;
      const step = dir * speedDeg * dt; // deg per second
      for (let i = 0; i < angles.length; i++){
        angles[i] = (angles[i] + step) % 360;
      }
      layout(false);
    }

    function bindUI(){
      // Pause/resume on hover and focus (a11y)
      section.addEventListener('mouseenter', () => { paused = true; });
      section.addEventListener('mouseleave', () => { paused = false; });
      section.addEventListener('focusin', () => { paused = true; });
      section.addEventListener('focusout', () => { paused = false; });

      // Per-instance ticker
      const stepper = () => {
        const dt = gsap.ticker.deltaRatio(60);
        tick(dt);
      };
      gsap.ticker.add(stepper);
      section._wheelStepper = stepper;
    }

    function onResize(){ layout(false); }

    return {
      async init(){
        await waitForImages(section);
        layout(true);
        bindUI();
      },
      destroy(){
        if (section._wheelStepper) gsap.ticker.remove(section._wheelStepper);
      },
      onResize
    };
  }

  async function initAll(root = document){
    const sections = [...root.querySelectorAll('.logo-wheel')];
    if (!sections.length) return;
    for (const sec of sections){
      const inst = createWheel(sec);
      await inst.init();
      ACTIVE.push(inst);
    }
  }

  // Debounced resize
  (() => {
    let to;
    window.addEventListener('resize', () => {
      clearTimeout(to);
      to = setTimeout(() => ACTIVE.forEach(i => i.onResize()), 120);
    });
  })();

  // Public API for Barba/AJAX
  window.initLogoWheel = (scope = document) => {
    const node = (typeof scope === 'string')
      ? document.querySelector(scope) || document
      : scope;
    return initAll(node);
  };

  // boot
  window.initLogoWheel(document);
})();