window.LuxuryRealEstateMotion = (function(){
  var raf = 0, current = 0, target = 0, video = null, hero = null, reduced = false;
  function num(v, fallback){ v = Number(v); return Number.isFinite(v) ? v : fallback; }
  function prefersReduced(){ return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function init(config){
    stop();
    hero = document.querySelector('.hero');
    video = document.querySelector('[data-hero-video]');
    reduced = prefersReduced() || (config.motion && config.motion.reducedMode === 'still');
    document.documentElement.style.setProperty('--overlay-strength', (num(config.motion.overlayStrength,62)/100).toString());
    document.documentElement.style.setProperty('--video-scale', (num(config.motion.videoScale,135)/100).toString());
    document.documentElement.style.setProperty('--glass-blur', num(config.motion.glassBlur,72)+'px');
    document.documentElement.style.setProperty('--glass-opacity', (num(config.motion.glassOpacity,24)/100).toString());
    bindProgress(config);
    bindMouse(config);
    if (!reduced) loop(config);
  }
  function bindProgress(config){
    window.removeEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  function onScroll(){
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    target = Math.max(0, Math.min(1, window.scrollY / max));
    var bar = document.querySelector('.page-progress');
    if (bar) bar.style.width = (target*100).toFixed(2)+'%';
  }
  function loop(config){
    var smoothing = Math.max(1, Math.min(24, num(config.motion.smoothing,8))) / 100;
    current += (target - current) * smoothing;
    if (video && video.duration && config.motion.scrubMode === 'progress' && !video.seeking) {
      var desired = Math.max(0, Math.min(video.duration - 0.05, current * (video.duration - 0.05)));
      if (Math.abs(video.currentTime - desired) > 0.035) {
        try { video.currentTime = desired; } catch(e) {}
      }
    }
    document.querySelectorAll('[data-reveal]').forEach(function(el){
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.86) el.classList.add('revealed');
    });
    raf = requestAnimationFrame(function(){ loop(config); });
  }
  function bindMouse(config){
    window.onmousemove = null;
    if (!config.motion || config.motion.mouseParallax !== 'true' || reduced) return;
    window.onmousemove = function(e){
      var panel = document.querySelector('[data-glass-panel]');
      var media = document.querySelector('.hero-media');
      var x = (e.clientX / window.innerWidth - .5);
      var y = (e.clientY / window.innerHeight - .5);
      if (panel) panel.style.transform = 'translate3d('+(x*22)+'px,'+(y*18)+'px,0) rotateX('+(-y*4)+'deg) rotateY('+(x*5)+'deg)';
      if (media) media.style.transform = 'scale(var(--video-scale)) translate3d('+(x*20)+'px,'+(y*16)+'px,0)';
    };
  }
  function stop(){ if (raf) cancelAnimationFrame(raf); raf = 0; window.removeEventListener('scroll', onScroll); }
  return { init: init, stop: stop };
})();
