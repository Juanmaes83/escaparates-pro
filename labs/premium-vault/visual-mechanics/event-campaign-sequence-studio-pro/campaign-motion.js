(function(){
  function framePath(sequence, index){
    var n = String(index).padStart(3, '0');
    return sequence.baseUrl.replace(/\/$/, '') + '/' + sequence.pattern.replace('{###}', n);
  }
  function preload(sequence, onProgress){
    var total = Math.max(1, Math.min(sequence.preloadCount || 24, sequence.frameCount || 1));
    var loaded = 0;
    for (var i = 1; i <= total; i++) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = img.onerror = function(){
        loaded += 1;
        if (onProgress) onProgress(Math.round((loaded / total) * 100));
      };
      img.src = framePath(sequence, i);
    }
  }
  function bind(state, refs){
    var canvas = refs.canvas;
    var ctx = canvas.getContext('2d');
    var current = 1;
    var lastSrc = '';
    var img = new Image();
    img.crossOrigin = 'anonymous';
    function resize(){
      canvas.width = Math.max(1, canvas.clientWidth * window.devicePixelRatio);
      canvas.height = Math.max(1, canvas.clientHeight * window.devicePixelRatio);
      draw(current);
    }
    function draw(frame){
      current = Math.max(1, Math.min(state.sequence.frameCount, Math.round(frame)));
      var src = framePath(state.sequence, current);
      if (src === lastSrc && img.complete) return paint();
      lastSrc = src;
      img.onload = paint;
      img.onerror = function(){ refs.stage.classList.add('has-video-fallback'); };
      img.src = src;
    }
    function paint(){
      if (!img.naturalWidth) return;
      refs.stage.classList.remove('has-video-fallback');
      var cw = canvas.width, ch = canvas.height;
      var iw = img.naturalWidth, ih = img.naturalHeight;
      var scale = Math.max(cw / iw, ch / ih);
      var w = iw * scale, h = ih * scale;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    }
    function update(){
      var rect = refs.scroller.getBoundingClientRect();
      var total = Math.max(1, refs.scroller.offsetHeight - window.innerHeight);
      var progress = Math.min(1, Math.max(0, -rect.top / total));
      var frame = 1 + progress * (state.sequence.frameCount - 1);
      draw(frame);
      if (refs.progress) refs.progress.style.width = (progress * 100).toFixed(2) + '%';
      if (refs.moment) {
        var active = state.moments[0];
        state.moments.forEach(function(m){ if (progress >= m.at) active = m; });
        refs.moment.innerHTML = '<span>'+active.label+'</span><strong>'+active.title+'</strong><p>'+active.text+'</p>';
      }
      if (refs.counter) refs.counter.textContent = String(current).padStart(3,'0') + ' / ' + state.sequence.frameCount;
    }
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', update, {passive:true});
    resize(); update();
    return { update:update, draw:draw, destroy:function(){ window.removeEventListener('resize', resize); window.removeEventListener('scroll', update); } };
  }
  window.EventCampaignMotion = { bind:bind, preload:preload, framePath:framePath };
})();
