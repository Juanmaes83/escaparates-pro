class ScrollPhysics {
  constructor() {
    this.parts = [];
    this.scrollProgress = 0;
    this.animProgress = 0;
    this.lerpedProgress = 0;
    this.noiseOffset = Math.random() * 1000;
    this.lastScrollY = window.scrollY;
    this.ANIMATION_END_RAW = 0.62;
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
        offsetY: -window.innerHeight,
        rotation: -15,
        targetX: 0,
        targetY: 0,
        scale: 1,
        startScroll: 0.15,
        endScroll: 0.70
      };

      if (el.id === 'part-helmet') {
        part.offsetX = 0;
        part.offsetY = -window.innerHeight;
        part.rotation = -15;
        part.targetX = 0;
        part.targetY = -80;
        part.scale = 0.85;
        part.startScroll = 0.15;
        part.endScroll = 0.70;
      }

      if (el.id === 'part-body') {
        part.offsetX = 0;
        part.offsetY = window.innerHeight;
        part.rotation = 0;
        part.targetX = 0;
        part.targetY = 330;
        part.scale = 1.25;
        part.startScroll = 0.15;
        part.endScroll = 0.70;
      }

      if (el.id === 'part-left-arm') {
        part.offsetX = window.innerWidth * 1.5;
        part.offsetY = 100;
        part.rotation = 15;
        part.targetX = 150;
        part.targetY = 280;
        part.scale = 0.85;
        part.startScroll = 0.15;
        part.endScroll = 0.70;
      }

      if (el.id === 'part-right-arm') {
        part.offsetX = -window.innerWidth * 1.5;
        part.offsetY = 100;
        part.rotation = -15;
        part.targetX = -100;
        part.targetY = 360;
        part.scale = 0.85;
        part.startScroll = 0.15;
        part.endScroll = 0.70;
      }

      if (el.id === 'part-shoulders') {
        part.offsetX = 0;
        part.offsetY = -window.innerHeight;
        part.rotation = -12;
        part.targetX = 0;
        part.targetY = 80;
        part.scale = 0.95;
        part.startScroll = 0.15;
        part.endScroll = 0.70;
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
      if (part.id === 'part-left-arm') part.offsetX = window.innerWidth * 1.5;
      if (part.id === 'part-right-arm') part.offsetX = -window.innerWidth * 1.5;
      if (part.id === 'part-helmet' || part.id === 'part-shoulders') part.offsetY = -window.innerHeight;
      if (part.id === 'part-body') part.offsetY = window.innerHeight;
    });
  }

  update() {
    const target = this.animProgress;
    const raw = this.scrollProgress;
    const isFinalHold = raw >= this.ANIMATION_END_RAW;

    // Faster tracking in the final phase so the reveal cannot arrive late
    // while the sticky hero is already leaving the viewport.
    const lerp = isFinalHold ? 0.32 : 0.16;
    this.lerpedProgress += (target - this.lerpedProgress) * lerp;
    if (isFinalHold) this.lerpedProgress = Math.max(this.lerpedProgress, 0.985);

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

    const titleP = this.clamp(p / 0.25, 0, 1);
    if (overlay) {
      overlay.style.opacity = String(1 - titleP);
      overlay.style.transform = `translate(-50%, calc(-50% + ${titleP * 180}px))`;
    }

    // Prompt-faithful internal timeline:
    // 85%–100% of the visual animation crossfades to samurai2.
    // The full visual animation is completed by 62% of physical scroll,
    // leaving the remaining scroll as a real final hold.
    const transStart = 0.85;
    const transEnd = 1.0;
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
      const snapRelative = this.clamp((p - 0.70) / 0.15, 0, 1);
      const attraction = this.magneticPull(relative, p);
      const snap = this.cubicBezier(snapRelative);
      const force = this.clamp(attraction + snap * 0.15, 0, 1);

      const floatPhase = this.clamp(p / 0.15, 0, 1);
      const floatNoise = p < 0.15 ? Math.sin(this.noiseOffset + performance.now() * 0.0015 + part.targetY * 0.01) * 18 * (1 - floatPhase) : 0;

      let currentX = part.offsetX * (1 - force) + part.targetX * force;
      let currentY = part.offsetY * (1 - force) + part.targetY * force + floatNoise;
      let currentRot = part.rotation * (1 - force);
      let currentOpacity = p < 0.02 ? 0 : this.clamp((p - 0.02) / 0.13, 0, 1);

      if (p >= 0.70) {
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
    const gravity = this.clamp((globalProgress - 0.15) / 0.55, 0, 1);
    return this.clamp(eased * (0.55 + gravity * 0.45), 0, 1);
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