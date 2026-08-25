window.CinematicFrameMotion = (function(){
  function pad(n){ return String(Math.max(1, Math.floor(n))).padStart(3,'0'); }
  function urlFor(sequence, index){ return sequence.baseUrl + sequence.pattern.replace('###', pad(index)); }
  function preload(sequence, cb){
    var total = Math.min(sequence.preloadCount || 20, sequence.frameCount || 1);
    var loaded = 0;
    for(var i=1;i<=total;i++){
      var img = new Image();
      img.onload = img.onerror = function(){ loaded++; if(cb) cb(Math.round((loaded/total)*100)); };
      img.src = urlFor(sequence, i);
    }
  }
  function bind(state, els){
    var ticking = false;
    var current = -1;
    function chooseFrame(progress){
      var total = Math.max(1, Number(state.sequence.frameCount) || 1);
      var step = window.matchMedia('(max-width: 760px)').matches ? Math.max(1, Number(state.sequence.mobileFrameStep) || 1) : 1;
      var raw = 1 + Math.floor(progress * (total - 1));
      return Math.max(1, Math.min(total, Math.round(raw / step) * step));
    }
    function update(){
      ticking = false;
      var rect = els.scroller.getBoundingClientRect();
      var travel = rect.height - window.innerHeight;
      var progress = travel <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / travel));
      var frame = chooseFrame(progress);
      if(frame !== current){
        current = frame;
        els.image.src = urlFor(state.sequence, frame);
        if(els.counter) els.counter.textContent = 'FRAME ' + String(frame).padStart(3,'0') + ' / ' + state.sequence.frameCount;
      }
      if(els.progress) els.progress.style.transform = 'scaleX(' + progress + ')';
      if(els.beat){
        var beat = state.beats.reduce(function(best,b){ return Math.abs(b.at-progress) < Math.abs(best.at-progress) ? b : best; }, state.beats[0]);
        els.beat.innerHTML = '<span>'+beat.label+'</span><h3>'+beat.title+'</h3><p>'+beat.text+'</p>';
      }
    }
    function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
    update();
    return { destroy:function(){ window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); } };
  }
  return { bind:bind, preload:preload, urlFor:urlFor };
})();
