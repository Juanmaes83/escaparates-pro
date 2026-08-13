(function(){
  'use strict';
  window.EP=window.EP||{};
  function assertMethod(target,name){if(!target||typeof target[name]!=='function')throw new Error('Render adapter missing '+name);}
  function create(bridge){
    ['getCanvas','render','pause','resume','resize','dispose'].forEach(function(name){assertMethod(bridge,name);});
    return {
      getCanvas:function(){return bridge.getCanvas();},
      getRenderer:function(){return bridge.getRenderer?bridge.getRenderer():null;},
      getScene:function(){return bridge.getScene?bridge.getScene():null;},
      getCamera:function(){return bridge.getCamera?bridge.getCamera():null;},
      render:function(){return bridge.render();},
      pause:function(){return bridge.pause();},
      resume:function(){return bridge.resume();},
      seek:function(value){return bridge.seek?bridge.seek(value):false;},
      resize:function(){return bridge.resize();},
      dispose:function(){return bridge.dispose();},
      capturePng:function(){var canvas=bridge.getCanvas();if(!canvas)throw new Error('Canvas unavailable');return canvas.toDataURL('image/png');},
      captureStream:function(fps){var canvas=bridge.getCanvas();if(!canvas||!canvas.captureStream)throw new Error('captureStream unavailable');return canvas.captureStream(fps||30);}
    };
  }
  EP.AdvancedToolRenderAdapter={create:create};
})();
