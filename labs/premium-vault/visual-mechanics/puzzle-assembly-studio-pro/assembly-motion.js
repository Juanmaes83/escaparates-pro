(function(){
  'use strict';

  function clamp(v,min,max){ return Math.min(max, Math.max(min, v)); }
  function smooth(t){ return t * t * (3 - 2 * t); }
  function stronger(t){ return 1 - Math.pow(1 - clamp(t,0,1), 3); }
  function pieceProgress(global, piece){
    var rel = (global - piece.start) / Math.max(1, (piece.end - piece.start));
    return clamp(rel, 0, 1);
  }
  function snapCurve(raw, motion){
    var attraction = stronger(raw);
    var snapStart = 0.76;
    var snap = clamp((raw - snapStart) / (1 - snapStart), 0, 1);
    var snapBoost = smooth(snap) * (motion.snapStrength || 0.8) * 0.08;
    return clamp(attraction + snapBoost, 0, 1);
  }
  function floatFor(piece, progress, motion){
    var amount = Number(motion.floatAmount || 0);
    if (progress > 70) amount *= clamp(1 - ((progress - 70) / 15), 0, 1);
    var s = Number(piece.floatSeed || 1);
    var t = progress / 100;
    return {
      x: Math.sin(t * 12 + s * 4.7) * amount,
      y: Math.cos(t * 10 + s * 3.1) * amount * 0.55,
      r: Math.sin(t * 8 + s * 2.2) * amount * 0.08
    };
  }
  function transformFor(piece, progress, motion){
    var raw = pieceProgress(progress, piece);
    var p = snapCurve(raw, motion);
    var float = floatFor(piece, progress, motion);
    var x = piece.fromX + (piece.x - piece.fromX) * p + float.x * (1 - p);
    var y = piece.fromY + (piece.y - piece.fromY) * p + float.y * (1 - p);
    var r = piece.fromRot + ((piece.rotation || 0) - piece.fromRot) * p + float.r * (1 - p);
    var opacity = progress < piece.start ? clamp(progress / Math.max(1, piece.start), 0, 0.45) : clamp(raw * 1.7, 0, 1);
    var settled = progress >= motion.snapEnd && raw > 0.96;
    return { x:x, y:y, rotation:r, opacity:opacity, scale:piece.scale, settled:settled, raw:raw };
  }
  function finalOpacity(progress, start){ return smooth(clamp((progress - start) / Math.max(1, 100 - start), 0, 1)); }
  function baseFade(progress, start){ return 1 - finalOpacity(progress, start); }

  window.AssemblyMotion = { clamp:clamp, transformFor:transformFor, finalOpacity:finalOpacity, baseFade:baseFade };
})();
