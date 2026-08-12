import fs from 'node:fs';

function must(file, needles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) throw new Error(`${file}: missing ${needle}`);
  }
}

must('js/advanced-tools/registry.js', [
  "id:'banderolas-studio-pro'",
  "repository:'Juanmaes83/BANDEROLAS-DINAMICAS'",
  "branch:'preview-output-v2'",
  "commit:'538146f7ec2ddbd056b55da0ed0eb8a1cf96ef83'",
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
  'BanderolasTypeB',
  '__epBandDrawPatched',
  'platformState.mediaElement',
  'captureStream',
  'ProjectStoreLocal',
  'ProjectVersioning',
  'standalone',
  "sourceCommit:'538146f7ec2ddbd056b55da0ed0eb8a1cf96ef83'"
]);

console.log('Banderolas Type B contract OK');
