window.RealEstateStoryMotion=(function(){
  var raf=0,target=0,current=0,video=null,state=null,phaseCb=null;
  function reduced(){return state&&(state.motion.reduced==='on'||(state.motion.reduced==='auto'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches));}
  function progress(){var max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);return Math.min(1,Math.max(0,window.scrollY/max));}
  function mapVideo(p,d){if(!state||!d)return 0;var mode=state.motion.mode;if(mode==='forward')return p*d;if(mode==='loop')return (p*d*1.8)%d;return (p<=.5?p*2:(1-p)*2)*d;}
  function tick(){if(!state)return;var p=progress(),phases=(state.phases.items||[]).filter(function(x){return x.enabled!==false;});var idx=Math.min(phases.length-1,Math.floor(p*phases.length));if(phaseCb)phaseCb(Math.max(0,idx),p);
    if(video&&!reduced()&&video.duration){target=mapVideo(p,video.duration-.05);current+= (target-current)*(Number(state.motion.smoothing)||.08);try{if(!video.seeking&&Math.abs(video.currentTime-current)>.01)video.currentTime=current;}catch(e){}}
    raf=requestAnimationFrame(tick);
  }
  function init(nextState,onPhase){state=nextState;phaseCb=onPhase;cancelAnimationFrame(raf);var root=document.getElementById('story-scroll');if(root)root.style.height=(Number(state.motion.scrollVh)||600)+'vh';var overlay=document.querySelector('.story-overlay');if(overlay)overlay.style.background='linear-gradient(to bottom,rgba(0,0,0,'+state.video.overlay+'),rgba(0,0,0,.1),rgba(0,0,0,.82))';video=document.querySelector('[data-story-video]');current=0;target=0;if(video){video.addEventListener('loadedmetadata',function(){document.body.classList.add('video-ready');try{video.pause();}catch(e){}},{once:true});video.addEventListener('error',function(){document.body.classList.add('video-error');});}
    if(reduced()){document.body.classList.add('reduced-motion');if(phaseCb)phaseCb(0,0);return;}document.body.classList.remove('reduced-motion');tick();}
  return{init:init};
})();
