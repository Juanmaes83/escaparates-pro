(function(){
  'use strict';

  function clamp(v,min,max){ return Math.min(max, Math.max(min, v)); }
  function ease(t){ return t * t * (3 - 2 * t); }
  function snapEase(t, strength){
    var e = ease(t);
    var snap = Math.pow(t, 6) * (strength || 0);
    return clamp(e + snap * (1 - e), 0, 1);
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
    var p = stepped(snapEase(pieceProgress(progress, piece), motion.snapStrength), motion.stopMotion);
    var x = piece.fromX + (piece.x - piece.fromX) * p;
    var y = piece.fromY + (piece.y - piece.fromY) * p;
    var r = piece.fromRot + ((piece.rotation || 0) - piece.fromRot) * p;
    var opacity = clamp(p * 1.4, 0, 1);
    return { x:x, y:y, rotation:r, opacity:opacity, scale:piece.scale };
  }
  function finalOpacity(progress, start){ return clamp((progress - start) / Math.max(1, 100 - start), 0, 1); }

  window.AssemblyMotion = { clamp:clamp, transformFor:transformFor, finalOpacity:finalOpacity };
})();
