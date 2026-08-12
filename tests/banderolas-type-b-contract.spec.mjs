import fs from 'node:fs';

function must(file, needles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) throw new Error(`${file}: missing ${needle}`);
  }
}
function mustNot(file, needles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (text.includes(needle)) throw new Error(`${file}: forbidden ${needle}`);
  }
}

must('js/advanced-tools/registry.js', [
  "id:'banderolas-studio-pro'",
  "repository:'Juanmaes83/BANDEROLAS-DINAMICAS'",
  "branch:'preview-output-v2'",
  "commit:'538146f7ec2ddbd056b55da0ed0eb8a1cf96ef83'",
  "wrapperBlob:'4cb27137abba038d87d025db48b4967ba1185a84'",
  "enhancerBlob:'e496e414b5ae7d77c82583ad1a071c1ee42c52f5'",
  "url:'labs/immersive-worlds/shared-capabilities/flexible-media/banderolas/source/index-output-v2.html'",
  "family:'Immersive Worlds / Shared Capabilities'",
  "htmlExport:true",
  "embedExport:true"
]);

must('js/rubik-tools-ui.js', [
  "id: 'banderolas-studio-pro'",
  "src: 'banderolas-tool.html'",
  "integrationType: 'type-b'"
]);

must('banderolas-tool.html', [
  'Subir imagen / vídeo',
  'Crear versión',
  'Grabar WEBM',
  'Standalone HTML',
  'Project JSON',
  'Preview Clean'
]);

must('js/advanced-tools/banderolas-host.js', [
  "getElementById('appFrame')",
  "getElementById('outputStatus')",
  "getElementById('mediaScale')",
  "getElementById('downloadHtml')",
  'DataTransfer',
  'captureStream',
  'ProjectStoreLocal',
  'ProjectVersioning',
  "delegate('downloadHtml')",
  "delegate('copyEmbed')"
]);

mustNot('js/advanced-tools/banderolas-host.js', [
  'frame.srcdoc',
  'raw.githubusercontent.com',
  'cdn.jsdelivr.net',
  'bridgeSource()',
  '__epBandDrawPatched',
  'String.raw`'
]);

console.log('Banderolas preserved Output V2 Type B contract OK');
