(function(){
  'use strict';

  function clamp(v,min,max){ return Math.min(max, Math.max(min, v)); }
  function ease(t){ return t * t * (3 - 2 * t); }
  function magnetic(t, strength){
    var e = ease(t);
    var s = strength || 0;
    var snapZone = clamp((t - 0.78) / 0.22, 0, 1);
    var overshoot = Math.sin(snapZone * Math.PI) * 0.018 * s;
    return clamp(e + overshoot + Math.pow(t, 9) * 0.035 * s, 0, 1);
  }
  function stepped(value, amount){
    if (!amount) return value;
    var steps = Math.max(1, Math.round(1 / amount));
    return Math.round(value * steps) / steps;
  }
  function pieceProgress(global, piece){
    var rel = (global - piece.start) / Math.max(1, (piece.end - piece.start));
    return clamp(rel, 0, 1);
  }
  function transformFor(piece, progress, motion){
    var raw = pieceProgress(progress, piece);
    var p = stepped(magnetic(raw, motion.snapStrength), motion.stopMotion);
    var x = piece.fromX + (piece.x - piece.fromX) * p;
    var y = piece.fromY + (piece.y - piece.fromY) * p;
    var r = piece.fromRot + ((piece.rotation || 0) - piece.fromRot) * p;
    var opacity = progress < piece.start ? 0 : clamp(raw * 1.8, 0, 1);
    var settled = raw >= 0.985;
    return { x:x, y:y, rotation:r, opacity:opacity, scale:piece.scale, settled:settled, raw:raw };
  }
  function finalOpacity(progress, start){ return clamp((progress - start) / Math.max(1, 100 - start), 0, 1); }

  window.AssemblyMotion = { clamp:clamp, transformFor:transformFor, finalOpacity:finalOpacity };
})();
