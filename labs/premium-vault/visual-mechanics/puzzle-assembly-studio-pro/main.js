class ScrollPhysics {
  constructor() {
    this.parts = [];
    this.scrollProgress = 0;
    this.animProgress = 0;
    this.lerpedProgress = 0;
    this.noiseOffset = Math.random() * 1000;
    this.lastScrollY = window.scrollY;
    this.afterHero = false;

    // Physical-scroll landmarks. Motion begins almost immediately,
    // assembles quickly, then leaves a long clean final lock for samurai2.
    this.ANIMATION_END_RAW = 0.48;
    this.FINAL_LOCK_RAW = 0.50;
    this.init();
  }

  getScale() {
    return window.innerWidth <= 768 ? 0.78 : 1;
  }

  applyCloseGeometry(part) {
    const s = this.getScale();

    // Close-orbit geometry: pieces must start inside the visual field,
    // not outside the viewport. Values are intentionally px-based so they
    // do not explode on wide screens.
    const geometry = {
      'part-helmet': {
        offsetX: 0,
        offsetY: -160,
        rotation: -10,
        targetX: 0,
        targetY: -45,
        scale: 0.82,
        startScroll: 0.02,
        endScroll: 0.32
      },
      'part-body': {
        offsetX: 0,
        offsetY: 170,
        rotation: 0,
        targetX: 0,
        targetY: 155,
        scale: 1.05,
        startScroll: 0.025,
        endScroll: 0.34
      },
      'part-left-arm': {
        offsetX: 210,
        offsetY: 60,
        rotation: 12,
        targetX: 75,
        targetY: 140,
        scale: 0.82,
        startScroll: 0.035,
        endScroll: 0.38
      },
      'part-right-arm': {
        offsetX: -210,
        offsetY: 70,
        rotation: -12,
        targetX: -55,
        targetY: 165,
        scale: 0.82,
        startScroll: 0.035,
        endScroll: 0.38
      },
      'part-shoulders': {
        offsetX: 0,
        offsetY: -120,
        rotation: -8,
        targetX: 0,
        targetY: 45,
        scale: 0.92,
        startScroll: 0.025,
        endScroll: 0.35
      }
    };

    const g = geometry[part.id];
    if (!g) return;

    part.offsetX = g.offsetX * s;
    part.offsetY = g.offsetY * s;
    part.rotation = g.rotation;
    part.targetX = g.targetX * s;
    part.targetY = g.targetY * s;
    part.scale = g.scale;
    part.startScroll = g.startScroll;
    part.endScroll = g.endScroll;
  }

  init() {
    const partElements = document.querySelectorAll('.armor-part');
    partElements.forEach((el) => {
      const part = {
        el,
        id: el.id,
        mass: 0.72,
        damping: 0.92,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        targetX: 0,
        targetY: 0,
        scale: 1,
        startScroll: 0.02,
        endScroll: 0.38
      };

      this.applyCloseGeometry(part);
      this.parts.push(part);
    });

    this.bindEvents();
    this.updateScrollProgress();
    this.update();
  }

  bindEvents() {
    window.addEventListener('scroll', () => this.updateScrollProgress(), { passive: true });
    window.addEventListener('resize', () => this.recalculateResponsiveOffsets(), { passive: true });
  }

  updateScrollProgress() {
    const hero = document.getElementById('hero');
    const max = Math.max(1, hero.offsetHeight - window.innerHeight);
    const rect = hero.getBoundingClientRect();
    this.scrollProgress = this.clamp(-rect.top / max, 0, 1);
    this.animProgress = this.clamp(this.scrollProgress / this.ANIMATION_END_RAW, 0, 1);
    this.afterHero = rect.bottom <= 0;
  }

  recalculateResponsiveOffsets() {
    this.parts.forEach((part) => this.applyCloseGeometry(part));
  }

  update() {
    const target = this.animProgress;
    const raw = this.scrollProgress;
    const isFinalHold = raw >= this.FINAL_LOCK_RAW;

    // Tight scroll coupling: the pieces must react to the user's scroll,
    // but without overshooting or feeling detached.
    const lerp = isFinalHold ? 0.65 : 0.44;
    this.lerpedProgress += (target - this.lerpedProgress) * lerp;
    if (isFinalHold) this.lerpedProgress = 1;

    this.animateScene(raw, isFinalHold);
    this.handleSectionAnimations();
    this.handleNavbar();
    requestAnimationFrame(() => this.update());
  }

  animateScene(rawProgress, isFinalHold) {
    const p = this.clamp(this.lerpedProgress, 0, 1);
    const s1 = document.getElementById('samurai1');
    const s2 = document.getElementById('samurai2');
    const overlay = document.getElementById('hero-overlay');
    const meter = document.getElementById('scroll-meter-bar');
    const frame = document.querySelector('.sticky-frame');

    if (frame) {
      frame.classList.toggle('is-final-hold', isFinalHold);
      frame.classList.toggle('is-after-hero', this.afterHero);
    }
    if (meter) meter.style.width = `${rawProgress * 100}%`;

    const titleP = this.clamp(p / 0.16, 0, 1);
    if (overlay) {
      overlay.style.opacity = String(1 - titleP);
      overlay.style.transform = `translate(-50%, calc(-50% + ${titleP * 90}px))`;
    }

    const transStart = 0.68;
    const transEnd = 0.86;
    const transP = this.clamp((p - transStart) / (transEnd - transStart), 0, 1);
    const revealP = isFinalHold ? 1 : this.cubicBezier(transP);

    if (s1 && s2) {
      s1.style.opacity = String(1 - revealP);
      s2.style.opacity = String(revealP);
      const finalScale = 1 + 0.05 * revealP;
      s1.style.transform = 'translate(-50%, -50%) scale(1)';
      s2.style.transform = `translate(-50%, -50%) scale(${finalScale})`;
    }

    this.parts.forEach((part) => {
      const relative = this.clamp((p - part.startScroll) / (part.endScroll - part.startScroll), 0, 1);
      const snapRelative = this.clamp((p - 0.40) / 0.16, 0, 1);
      const attraction = this.magneticPull(relative, p);
      const snap = this.cubicBezier(snapRelative);
      const force = this.clamp(attraction * 0.88 + snap * 0.24, 0, 1);

      const floatPhase = this.clamp(p / 0.08, 0, 1);
      const floatNoise = p < 0.08 ? Math.sin(this.noiseOffset + performance.now() * 0.0015 + part.targetY * 0.01) * 8 * (1 - floatPhase) : 0;

      let currentX = part.offsetX * (1 - force) + part.targetX * force;
      let currentY = part.offsetY * (1 - force) + part.targetY * force + floatNoise;
      let currentRot = part.rotation * (1 - force);
      const currentOpacity = p < 0.005 ? 0 : this.clamp((p - 0.005) / 0.045, 0, 1);

      if (p >= 0.40) {
        currentX = currentX * (1 - snap) + part.targetX * snap;
        currentY = currentY * (1 - snap) + part.targetY * snap;
        currentRot = currentRot * (1 - snap);
      }

      const finalOpacity = isFinalHold ? 0 : currentOpacity * (1 - revealP);
      part.el.style.opacity = String(finalOpacity);
      part.el.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px)) rotate(${currentRot}deg) scale(${part.scale})`;
    });
  }

  handleSectionAnimations() {
    document.querySelectorAll('.reveal-mask').forEach((mask) => {
      const rect = mask.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.82) mask.classList.add('active');
    });
  }

  handleNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    const y = window.scrollY;
    if (y > this.lastScrollY && y > 100) navbar.classList.add('navbar--hidden');
    else navbar.classList.remove('navbar--hidden');
    this.lastScrollY = y;
  }

  magneticPull(t, globalProgress) {
    const eased = this.cubicBezier(t);
    const gravity = this.clamp((globalProgress - 0.04) / 0.34, 0, 1);
    return this.clamp(eased * (0.52 + gravity * 0.68), 0, 1);
  }

  cubicBezier(t) {
    return t * t * (3 - 2 * t);
  }

  clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new ScrollPhysics();
});