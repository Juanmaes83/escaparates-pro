import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
mkdirSync(dir, { recursive: true });

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+X0Y6WQAAAABJRU5ErkJggg==', 'base64');
const imagePath = path.join(dir, 'qa-image.png');
const videoPath = path.join(dir, 'qa-video.mp4');
writeFileSync(imagePath, png);

execFileSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'lavfi', '-i', 'color=c=black:s=320x180:d=1',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  videoPath
], { stdio: 'inherit' });

if (statSync(imagePath).size < 60 || statSync(videoPath).size < 500) {
  throw new Error('QA fixtures were not generated correctly');
}

console.log(JSON.stringify({ imageBytes: statSync(imagePath).size, videoBytes: statSync(videoPath).size }));