/**
 * A6 — camera containment.
 *
 * A shot can aim perfectly and still be impossible: the contemplation beat at the
 * plinth measured 0.02 m of drift while standing outside the building. Aim and
 * legality are different questions, and this asks the second one.
 *
 * Reads the poses the capture already recorded, so it needs no browser.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const world = JSON.parse(await fs.readFile(path.join(ROOT, 'worlds', 'museum-v1.world.json'), 'utf8'));
const report = JSON.parse(await fs.readFile(path.join(HERE, '..', 'evidence-grammar', 'current', 'audit.json'), 'utf8'));

const spaces = new Map(world.spaces.map((s) => [s.id, s.bounds]));
// A camera may sit a little inside a doorway or against the glass of a threshold
// without being wrong; a metre of tolerance separates that from being in the void.
const SLACK = 1.0;

const rows = [];
for (const beat of report.beats) {
  const bounds = spaces.get(beat.spaceId);
  if (!bounds) { rows.push({ ...beat, inside: null, why: 'espacio desconocido' }); continue; }
  const [w, h, d] = bounds.size;
  const [ox, oy, oz] = bounds.origin;
  const [x, y, z] = beat.position;
  const limits = {
    x: [ox - w / 2 - SLACK, ox + w / 2 + SLACK],
    y: [oy - 0.2, oy + h + 0.5],
    z: [oz - d / 2 - SLACK, oz + d / 2 + SLACK]
  };
  const fails = [];
  if (x < limits.x[0] || x > limits.x[1]) fails.push(`x ${x} fuera de [${limits.x[0].toFixed(1)}, ${limits.x[1].toFixed(1)}]`);
  if (y < limits.y[0] || y > limits.y[1]) fails.push(`y ${y} fuera de [${limits.y[0].toFixed(1)}, ${limits.y[1].toFixed(1)}]`);
  if (z < limits.z[0] || z > limits.z[1]) fails.push(`z ${z} fuera de [${limits.z[0].toFixed(1)}, ${limits.z[1].toFixed(1)}]`);
  rows.push({ beatId: beat.beatId, tourOrder: beat.tourOrder, role: beat.role, space: beat.spaceId,
    position: beat.position, inside: fails.length === 0, why: fails.join(' · ') });
}

const bad = rows.filter((r) => r.inside !== true);
for (const r of rows) {
  console.log(`  ${r.inside ? 'ok' : '!!'} ${String(r.tourOrder).padStart(2, '0')} ${String(r.role).padEnd(10)} ${r.beatId.padEnd(34)} ${r.position.join(', ')}${r.why ? '   ' + r.why : ''}`);
}
console.log(`\n  cameraInsideRoom: ${rows.length - bad.length}/${rows.length}${bad.length ? '  BLOQUEANTE' : '  todas dentro'}`);
await fs.writeFile(path.join(HERE, '..', 'evidence-grammar', 'current', 'containment.json'),
  JSON.stringify({ slack: SLACK, rows }, null, 1));
process.exitCode = bad.length ? 1 : 0;
