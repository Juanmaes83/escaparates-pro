/**
 * Museum Scene Kit — generated textures
 *
 * Every surface and every artwork in this prototype is generated at runtime
 * from a deterministic seed. Nothing is fetched, nothing is bundled, and there
 * is no third-party image anywhere in the module.
 *
 * That is a licensing decision as much as a technical one: Constitution §29.1
 * requires the prototype's content to be controlled/fictitious/owned, and
 * IW-DEC-016 blocks copying assets whose rights are unverified. Generated
 * plates sidestep the question entirely — the collection of the fictitious
 * Fundación Arenas is ours.
 *
 * Honest status: these are *placeholder plates at blockout fidelity*, art
 * directed to read as a plausible modernist collection rather than as generic
 * AI texture. They are not a claim of final visual quality.
 */

import { THREE } from '../../render/render-host.js';

/* == surfaces =============================================================== */

/**
 * Fine plaster/paper grain. Flat matte surfaces are an Unslop reject
 * (Constitution §24, "flat material treatment"), and a plain colour reads as
 * plastic under a spotlight. This is subtle by design: it should never be
 * legible as "a texture", only as "not perfectly uniform".
 */
export function plasterTexture(rng, { size = 256, contrast = 10 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);

  for (let i = 0; i < image.data.length; i += 4) {
    const grain = 128 + (rng.next() - 0.5) * contrast * 2;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = grain;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  // A few broad trowel passes so the grain is not statistically uniform.
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 18; i += 1) {
    const w = rng.range(size * 0.2, size * 0.9);
    const h = rng.range(size * 0.02, size * 0.08);
    ctx.fillStyle = rng.next() > 0.5 ? '#ffffff' : '#000000';
    ctx.save();
    ctx.translate(rng.range(0, size), rng.range(0, size));
    ctx.rotate(rng.range(-0.4, 0.4));
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/** Directional grain for a timber or troweled-concrete floor. */
export function floorTexture(rng, { size = 512, planks = 0 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < size * 3; i += 1) {
    const y = rng.range(0, size);
    ctx.globalAlpha = rng.range(0.01, 0.05);
    ctx.strokeStyle = rng.next() > 0.5 ? '#ffffff' : '#000000';
    ctx.lineWidth = rng.range(0.4, 2.2);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y + rng.range(-3, 3), size * 0.7, y + rng.range(-3, 3), size, y + rng.range(-2, 2));
    ctx.stroke();
  }

  if (planks > 0) {
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.2;
    const pitch = size / planks;
    for (let i = 0; i <= planks; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, i * pitch);
      ctx.lineTo(size, i * pitch);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/* == artworks =============================================================== */

/**
 * Palettes drawn from pigments rather than from a UI colour system. No cyan,
 * no magenta, no neon — Constitution §24 rejects exactly that vocabulary.
 */
const PALETTES = {
  umber: ['#241c14', '#5d4127', '#9a7048', '#c8b394', '#e3d8c4'],
  prussian: ['#0e1720', '#1c3040', '#3a5568', '#7d939e', '#c6ccca'],
  ochre: ['#332715', '#7a5a1a', '#b08a3e', '#d4bd8c', '#e8e0cc'],
  oxblood: ['#1e100e', '#54231d', '#87473a', '#b08573', '#ddcfc0'],
  slate: ['#15171a', '#2c3135', '#525a5f', '#909799', '#cfd1cf'],
  verdigris: ['#131b16', '#243428', '#4a6350', '#8b9d8d', '#d2d6cd']
};

/**
 * @param {import('../../engine/core/rng.js').DeterministicRNG} rng
 * @param {{composition:string, palette:string, aspect:number, resolution:number}} spec
 * @returns {THREE.CanvasTexture}
 */
export function artworkTexture(rng, spec) {
  const { composition = 'field', palette = 'umber', aspect = 1, resolution = 768 } = spec;
  const colors = PALETTES[palette] || PALETTES.umber;

  const width = aspect >= 1 ? resolution : Math.round(resolution * aspect);
  const height = aspect >= 1 ? Math.round(resolution / aspect) : resolution;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ground(ctx, width, height, colors, rng);

  switch (composition) {
    case 'horizon-bands': horizonBands(ctx, width, height, colors, rng); break;
    case 'hard-edge': hardEdge(ctx, width, height, colors, rng); break;
    case 'graphite-study': graphiteStudy(ctx, width, height, colors, rng); break;
    case 'photogravure': photogravure(ctx, width, height, colors, rng); break;
    case 'field':
    default: colourField(ctx, width, height, colors, rng); break;
  }

  surfaceTooth(ctx, width, height, rng, composition);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function ground(ctx, w, h, colors, rng) {
  ctx.fillStyle = colors[4];
  ctx.fillRect(0, 0, w, h);
  // Uneven priming, so the ground is never a flat digital fill.
  ctx.globalAlpha = 0.09;
  for (let i = 0; i < 60; i += 1) {
    ctx.fillStyle = rng.pick(colors);
    ctx.beginPath();
    ctx.ellipse(rng.range(0, w), rng.range(0, h), rng.range(w * 0.1, w * 0.5), rng.range(h * 0.08, h * 0.4), rng.range(0, Math.PI), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * Asymmetric stacked fields — a landscape reduced to weight and interval.
 * Each band carries its own vertical gradient and a hand-drawn horizon, because
 * a stack of flat rectangles is a chart, not a painting.
 */
function horizonBands(ctx, w, h, colors, rng) {
  const bands = rng.int(3, 5);
  const weights = Array.from({ length: bands }, () => rng.range(0.5, 2));
  const total = weights.reduce((a, b) => a + b, 0);
  const order = [3, 2, 1, 0, 2].slice(0, bands);

  let y = 0;
  for (let i = 0; i < bands; i += 1) {
    const bandHeight = (weights[i] / total) * h;
    const base = colors[order[i]];
    const gradient = ctx.createLinearGradient(0, y, 0, y + bandHeight);
    gradient.addColorStop(0, shade(base, i === bands - 1 ? -0.06 : 0.08));
    gradient.addColorStop(1, shade(base, -0.1));
    ctx.fillStyle = gradient;

    // The horizon wavers by a few millimetres, as a brush does.
    const drift = h * 0.006;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += w / 8) {
      ctx.lineTo(x, y + Math.sin((x / w) * Math.PI * rng.range(1.2, 2.6) + i) * drift);
    }
    ctx.lineTo(w, y + bandHeight + 2);
    ctx.lineTo(0, y + bandHeight + 2);
    ctx.closePath();
    ctx.fill();

    y += bandHeight;
  }
}

/**
 * A single dominant field holding one displaced, breathing rectangle.
 * Off-centre on both axes: a centred glowing rectangle is the exact composition
 * Constitution §24 rejects.
 */
function colourField(ctx, w, h, colors, rng) {
  const ground = ctx.createLinearGradient(0, 0, w * 0.3, h);
  ground.addColorStop(0, shade(colors[1], 0.06));
  ground.addColorStop(1, shade(colors[1], -0.12));
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, w, h);

  // The field nearly fills the support: the ground should read as a margin the
  // painter left, not as a frame drawn around a card.
  const rect = {
    w: w * rng.range(0.84, 0.9),
    h: h * rng.range(0.8, 0.87)
  };
  rect.x = w * rng.range(0.05, 0.09);
  rect.y = h * rng.range(0.06, 0.11);

  const field = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w * 0.4, rect.y + rect.h);
  field.addColorStop(0, colors[3]);
  field.addColorStop(0.65, colors[2]);
  field.addColorStop(1, shade(colors[2], -0.14));
  ctx.fillStyle = field;

  // Soft edge, not a halo: the blur is a fraction of the shorter side.
  ctx.filter = `blur(${Math.max(2, Math.round(Math.min(w, h) * 0.008))}px)`;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.filter = 'none';

  // A second, much quieter mass anchors the lower right.
  ctx.globalAlpha = 0.32;
  ctx.filter = `blur(${Math.max(3, Math.round(Math.min(w, h) * 0.03))}px)`;
  ctx.fillStyle = shade(colors[1], 0.05);
  ctx.fillRect(w * 0.44, h * 0.62, w * 0.44, h * 0.26);
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
}

/** Lighten (t > 0) or darken (t < 0) a hex colour. */
function shade(hex, t) {
  const value = parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((c) =>
    Math.max(0, Math.min(255, Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t))))
  );
  return `rgb(${channels.join(',')})`;
}

/** Hard-edge geometric abstraction — flat, deliberate, slightly off-axis. */
function hardEdge(ctx, w, h, colors, rng) {
  ctx.fillStyle = colors[4];
  ctx.fillRect(0, 0, w, h);
  const divisions = rng.int(2, 3);
  let x = 0;
  for (let i = 0; i < divisions; i += 1) {
    const width = w * rng.range(0.18, 0.42);
    ctx.save();
    ctx.translate(x, 0);
    ctx.rotate(rng.range(-0.012, 0.012));
    ctx.fillStyle = colors[rng.int(0, 3)];
    ctx.fillRect(0, h * rng.range(-0.05, 0.12), width, h * rng.range(0.7, 1.1));
    ctx.restore();
    x += width + w * rng.range(0.02, 0.09);
  }
}

/** Works on paper: hatching that accumulates into a form. */
function graphiteStudy(ctx, w, h, colors, rng) {
  ctx.fillStyle = colors[4];
  ctx.fillRect(0, 0, w, h);
  const cx = w * rng.range(0.38, 0.6);
  const cy = h * rng.range(0.42, 0.6);
  const radius = Math.min(w, h) * rng.range(0.22, 0.34);

  ctx.strokeStyle = colors[0];
  for (let i = 0; i < 900; i += 1) {
    const angle = rng.range(0, Math.PI * 2);
    const distance = radius * Math.sqrt(rng.next());
    const px = cx + Math.cos(angle) * distance * rng.range(0.9, 1.35);
    const py = cy + Math.sin(angle) * distance;
    const length = rng.range(4, 26);
    ctx.globalAlpha = (1 - distance / radius) * rng.range(0.04, 0.16);
    ctx.lineWidth = rng.range(0.4, 1.4);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + length * 0.7, py + length * rng.range(0.4, 1.1));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Photographic plate: tonal, grainy, one soft mass against a swept ground. */
function photogravure(ctx, w, h, colors, rng) {
  const gradient = ctx.createLinearGradient(0, 0, w * 0.4, h);
  gradient.addColorStop(0, colors[3]);
  gradient.addColorStop(1, colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.filter = `blur(${Math.round(Math.min(w, h) * 0.03)}px)`;
  ctx.fillStyle = colors[0];
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.ellipse(w * rng.range(0.35, 0.62), h * rng.range(0.55, 0.78), w * rng.range(0.16, 0.3), h * rng.range(0.2, 0.36), rng.range(-0.3, 0.3), 0, Math.PI * 2);
  ctx.fill();
  ctx.filter = 'none';
  ctx.globalAlpha = 1;

  const image = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < image.data.length; i += 4) {
    const grain = (rng.next() - 0.5) * 26;
    image.data[i] += grain;
    image.data[i + 1] += grain;
    image.data[i + 2] += grain;
  }
  ctx.putImageData(image, 0, 0);
}

/**
 * Canvas weave / paper tooth, plus the darkening every real surface carries at
 * its edges. Kept close to the threshold of visibility: a legible grid reads as
 * a screen door, not as linen.
 */
function surfaceTooth(ctx, w, h, rng, composition) {
  const paper = composition === 'graphite-study' || composition === 'photogravure';

  // Irregular thread pitch — real weave is not on a grid.
  ctx.globalAlpha = paper ? 0.022 : 0.038;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 0.7;
  const pitch = Math.max(2, Math.round(Math.min(w, h) / (paper ? 260 : 190)));
  for (let x = 0; x < w; x += pitch + (rng.next() > 0.7 ? 1 : 0)) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += pitch + (rng.next() > 0.7 ? 1 : 0)) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const vignette = ctx.createRadialGradient(
    w * 0.44, h * 0.42, Math.min(w, h) * 0.3,
    w * 0.5, h * 0.5, Math.max(w, h) * 0.78
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, `rgba(0,0,0,${paper ? 0.12 : 0.2})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

/* == labels ================================================================= */

/**
 * Curatorial wall label. Rendered as a texture rather than as DOM so it lives
 * in the room at the right scale — but the same text is also published to the
 * accessibility layer outside the canvas (Constitution §22).
 */
export function labelTexture(content, { width = 512, dark = false } = {}) {
  const height = Math.round(width * 0.62);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = dark ? '#1a1817' : '#f4f1ea';
  ctx.fillRect(0, 0, width, height);

  const ink = dark ? '#d8d2c6' : '#2a2621';
  const dim = dark ? '#8d867c' : '#6d675e';
  const pad = width * 0.09;
  let y = pad + width * 0.055;

  ctx.fillStyle = ink;
  ctx.font = `600 ${Math.round(width * 0.062)}px Georgia, 'Times New Roman', serif`;
  for (const line of wrap(ctx, content.title || '', width - pad * 2).slice(0, 2)) {
    ctx.fillText(line, pad, y);
    y += width * 0.075;
  }

  ctx.fillStyle = dim;
  ctx.font = `italic ${Math.round(width * 0.05)}px Georgia, 'Times New Roman', serif`;
  ctx.fillText(`${content.creator || ''}${content.year ? `, ${content.year}` : ''}`, pad, y + width * 0.012);
  y += width * 0.078;

  ctx.font = `${Math.round(width * 0.042)}px 'Helvetica Neue', Arial, sans-serif`;
  ctx.fillStyle = dim;
  ctx.fillText(content.medium || '', pad, y);

  ctx.strokeStyle = dark ? '#38332d' : '#d5cec2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, height - pad * 0.75);
  ctx.lineTo(width - pad, height - pad * 0.75);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * The single moving image in the world: a slow tonal drift, generated per frame
 * into a small canvas. A video file would be an asset-rights question we do not
 * need to open at this milestone.
 */
export function createGeneratedVideoTexture(rng, { size = 256 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = Math.round(size * 0.5625);
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const bands = Array.from({ length: 5 }, () => ({
    offset: rng.range(0, 1),
    speed: rng.range(0.012, 0.05),
    tone: rng.range(0.1, 0.6)
  }));

  return {
    texture,
    update(elapsed) {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0d0c0b';
      ctx.fillRect(0, 0, w, h);
      for (const band of bands) {
        const y = ((band.offset + elapsed * band.speed) % 1.4 - 0.2) * h;
        const gradient = ctx.createLinearGradient(0, y - h * 0.3, 0, y + h * 0.3);
        const tone = Math.round(band.tone * 255);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.5, `rgba(${tone},${Math.round(tone * 0.93)},${Math.round(tone * 0.82)},0.5)`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, y - h * 0.3, w, h * 0.6);
      }
      texture.needsUpdate = true;
    },
    dispose() {
      texture.dispose();
    }
  };
}
