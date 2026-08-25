class ScrollPhysics {
  constructor() {
    this.parts = [];
    this.scrollProgress = 0;
    this.animProgress = 0;
    this.lerpedProgress = 0;
    this.noiseOffset = Math.random() * 1000;
    this.lastScrollY = window.scrollY;

    // Physical-scroll landmarks. The user should feel movement almost immediately.
    // Full armor motion now completes in the first half of the sticky hero,
    // leaving a long clean final lock for samurai2.
    this.ANIMATION_END_RAW = 0.48;
    this.FINAL_LOCK_RAW = 0.50;
    this.init();
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
        offsetY: -window.innerHeight * 0.55,
        rotation: -15,
        targetX: 0,
        targetY: 0,
        scale: 1,
        startScroll: 0.02,
        endScroll: 0.42
      };

      if (el.id === 'part-helmet') {
        part.offsetX = 0;
        part.offsetY = -window.innerHeight * 0.58;
        part.rotation = -12;
        part.targetX = 0;
        part.targetY = -80;
        part.scale = 0.85;
        part.startScroll = 0.02;
        part.endScroll = 0.36;
      }

      if (el.id === 'part-body') {
        part.offsetX = 0;
        part.offsetY = window.innerHeight * 0.62;
        part.rotation = 0;
        part.targetX = 0;
        part.targetY = 330;
        part.scale = 1.25;
        part.startScroll = 0.03;
        part.endScroll = 0.38;
      }

      if (el.id === 'part-left-arm') {
        part.offsetX = window.innerWidth * 0.78;
        part.offsetY = window.innerHeight * 0.16;
        part.rotation = 14;
        part.targetX = 150;
        part.targetY = 280;
        part.scale = 0.85;
        part.startScroll = 0.04;
        part.endScroll = 0.42;
      }

      if (el.id === 'part-right-arm') {
        part.offsetX = -window.innerWidth * 0.78;
        part.offsetY = window.innerHeight * 0.16;
        part.rotation = -14;
        part.targetX = -100;
        part.targetY = 360;
        part.scale = 0.85;
        part.startScroll = 0.04;
        part.endScroll = 0.42;
      }

      if (el.id === 'part-shoulders') {
        part.offsetX = 0;
        part.offsetY = -window.innerHeight * 0.52;
        part.rotation = -10;
        part.targetX = 0;
        part.targetY = 80;
        part.scale = 0.95;
        part.startScroll = 0.025;
        part.endScroll = 0.39;
      }

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
  }

  recalculateResponsiveOffsets() {
    this.parts.forEach((part) => {
      if (part.id === 'part-left-arm') {
        part.offsetX = window.innerWidth * 0.78;
        part.offsetY = window.innerHeight * 0.16;
      }
      if (part.id === 'part-right-arm') {
        part.offsetX = -window.innerWidth * 0.78;
        part.offsetY = window.innerHeight * 0.16;
      }
      if (part.id === 'part-helmet') part.offsetY = -window.innerHeight * 0.58;
      if (part.id === 'part-shoulders') part.offsetY = -window.innerHeight * 0.52;
      if (part.id === 'part-body') part.offsetY = window.innerHeight * 0.62;
    });
  }

  update() {
    const target = this.animProgress;
    const raw = this.scrollProgress;
    const isFinalHold = raw >= this.FINAL_LOCK_RAW;

    // Tight scroll coupling: the pieces must react to the user's scroll, not lag behind it.
    const lerp = isFinalHold ? 0.65 : 0.38;
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

    if (frame) frame.classList.toggle('is-final-hold', isFinalHold);
    if (meter) meter.style.width = `${rawProgress * 100}%`;

    const titleP = this.clamp(p / 0.16, 0, 1);
    if (overlay) {
      overlay.style.opacity = String(1 - titleP);
      overlay.style.transform = `translate(-50%, calc(-50% + ${titleP * 90}px))`;
    }

    // Earlier reveal: the armor assembly should be complete well before the final lock.
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
      const snapRelative = this.clamp((p - 0.42) / 0.16, 0, 1);
      const attraction = this.magneticPull(relative, p);
      const snap = this.cubicBezier(snapRelative);
      const force = this.clamp(attraction * 0.90 + snap * 0.22, 0, 1);

      const floatPhase = this.clamp(p / 0.08, 0, 1);
      const floatNoise = p < 0.08 ? Math.sin(this.noiseOffset + performance.now() * 0.0015 + part.targetY * 0.01) * 12 * (1 - floatPhase) : 0;

      let currentX = part.offsetX * (1 - force) + part.targetX * force;
      let currentY = part.offsetY * (1 - force) + part.targetY * force + floatNoise;
      let currentRot = part.rotation * (1 - force);
      let currentOpacity = p < 0.005 ? 0 : this.clamp((p - 0.005) / 0.055, 0, 1);

      if (p >= 0.42) {
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
    return this.clamp(eased * (0.50 + gravity * 0.70), 0, 1);
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