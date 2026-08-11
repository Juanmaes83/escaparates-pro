import { BrandMediaManager } from './enhancements.js';

// V1.1 authoring hotfix. It deliberately wraps ONLY the Brand/Panel layer.
// Portal, cameras, render target, frameCorners and world transition remain untouched.

let manager = null;
const original = {
  reset: BrandMediaManager.prototype.reset,
  image: BrandMediaManager.prototype.applyImage,
  video: BrandMediaManager.prototype.applyVideo,
  text: BrandMediaManager.prototype.applyText
};

// Capture the manager instance during the V1.1 boot sequence without touching App/core.
BrandMediaManager.prototype.reset = function (...args) {
  manager = this;
  return original.reset.apply(this, args);
};

function el(tag, attrs = {}, html = '') {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') node.className = value;
    else if (key === 'id') node.id = value;
    else node.setAttribute(key, value);
  });
  if (html) node.innerHTML = html;
  return node;
}

function injectStyles() {
  const style = el('style');
  style.textContent = `
    .brand-authoring-status{margin:10px 0 12px;padding:11px 12px;border:1px solid rgba(255,255,255,.11);border-radius:9px;background:rgba(255,255,255,.045)}
    .brand-authoring-status .status-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
    .brand-authoring-status .status-dot{width:7px;height:7px;border-radius:50%;background:#6d7780;box-shadow:0 0 0 4px rgba(255,255,255,.035)}
    .brand-authoring-status[data-state="loaded"] .status-dot{background:#e5bd67}.brand-authoring-status[data-state="saved"] .status-dot{background:#87bdf0}.brand-authoring-status[data-state="applied"] .status-dot{background:#84d69a}.brand-authoring-status[data-state="error"] .status-dot{background:#e77a72}
    .brand-authoring-status strong{font:800 9px Inter,sans-serif;letter-spacing:.12em}.brand-authoring-status p{margin:0;color:rgba(255,255,255,.58);font:600 9px/1.45 Inter,sans-serif}
    .brand-action-grid{display:grid;grid-template-columns:1fr 1.25fr;gap:7px;margin-top:9px}.brand-action-grid button{margin:0}
    .brand-action-grid .apply-experience{background:#eef4ef;color:#07100b;border-color:#eef4ef}
    .file-loaded{border-color:rgba(229,189,103,.55)!important;box-shadow:0 0 0 1px rgba(229,189,103,.12) inset}
    .panel-minimize{border:0!important;background:none!important;color:#fff!important;font-size:21px!important;line-height:1!important;cursor:pointer!important;opacity:.62!important;padding:0 5px!important}
    .panel-head-actions{display:flex;align-items:center;gap:5px}
    #restoreCustomize{position:fixed;z-index:13;right:22px;bottom:22px;display:none;align-items:center;gap:9px;padding:11px 14px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(8,11,14,.78);backdrop-filter:blur(18px);color:#fff;font:800 9px Inter,sans-serif;letter-spacing:.11em;cursor:pointer;box-shadow:0 12px 35px rgba(0,0,0,.28)}
    #restoreCustomize.show{display:flex}#restoreCustomize span{width:7px;height:7px;border-radius:50%;background:#84d69a;box-shadow:0 0 12px rgba(132,214,154,.65)}
    .panel.authoring-minimized{transform:translateX(102%)!important}
    .authoring-note{font:600 8px/1.45 Inter,sans-serif;color:rgba(255,255,255,.42);margin:7px 0 0}
    @media(max-width:760px){#restoreCustomize{right:14px;bottom:14px}}
  `;
  document.head.appendChild(style);
}

function moveBrandStages() {
  if (!manager) return;
  const city = manager.getSlot('city');
  const nature = manager.getSlot('nature');
  if (city?.parent) {
    city.parent.position.set(-13.2, 1.8, 5.2);
    city.parent.rotation.set(0, .14, 0);
    city.parent.scale.set(1.05, 1.05, 1.05);
    city.renderOrder = 3;
  }
  if (nature?.parent) {
    nature.parent.position.set(12.7, -.2, 5.4);
    nature.parent.rotation.set(0, -.16, 0);
    nature.parent.scale.set(1.06, 1.06, 1.06);
    nature.renderOrder = 3;
  }
}

function initAuthoringFix() {
  injectStyles();
  if (!manager) {
    console.error('[Infinite Worlds] BrandMediaManager was not captured.');
    return;
  }

  moveBrandStages();

  const $ = id => document.getElementById(id);
  const panel = $('customizePanel');
  const brandSection = $('brandWorld')?.closest('section');
  if (!panel || !brandSection) return;

  const head = panel.querySelector('.panel-head');
  const close = $('closePanel');
  const actions = el('div', { class: 'panel-head-actions' });
  const minimize = el('button', { id: 'minimizePanel', class: 'panel-minimize', type: 'button', title: 'Minimize customization' }, '−');
  if (close) {
    close.parentNode.removeChild(close);
    actions.append(minimize, close);
    head.appendChild(actions);
  } else actions.appendChild(minimize);

  const restore = el('button', { id: 'restoreCustomize', type: 'button' }, '<span></span>RESTORE CUSTOMIZATION');
  document.body.appendChild(restore);

  const status = el('div', { id: 'brandAuthoringStatus', class: 'brand-authoring-status', 'data-state': 'idle' }, `
    <div class="status-row"><span class="status-dot"></span><strong id="brandStatusTitle">WAITING FOR CONTENT</strong></div>
    <p id="brandStatusDetail">Choose a world and load an image, video, logo or text.</p>
  `);
  const actionGrid = el('div', { class: 'brand-action-grid' });
  const saveButton = el('button', { id: 'saveBrandContent', class: 'panel-button secondary', type: 'button', disabled: 'disabled' }, 'SAVE');
  const applyButton = el('button', { id: 'applyBrandExperience', class: 'panel-button apply-experience', type: 'button', disabled: 'disabled' }, 'APPLY & EXPERIENCE');
  actionGrid.append(saveButton, applyButton);
  const note = el('p', { class: 'authoring-note' }, 'Files stay in this browser session. SAVE prepares the selected asset; APPLY places it in the chosen world and minimizes this panel.');

  const applyTextButton = $('applyText');
  if (applyTextButton) applyTextButton.textContent = 'LOAD TEXT';
  const resetBrand = $('resetBrand');
  brandSection.insertBefore(status, applyTextButton || resetBrand);
  if (resetBrand) brandSection.insertBefore(actionGrid, resetBrand);
  else brandSection.appendChild(actionGrid);
  actionGrid.insertAdjacentElement('afterend', note);

  let staged = null;
  const saved = { city: null, nature: null };

  function setState(state, title, detail) {
    status.dataset.state = state;
    $('brandStatusTitle').textContent = title;
    $('brandStatusDetail').textContent = detail;
    saveButton.disabled = !staged;
    const world = $('brandWorld').value;
    applyButton.disabled = !saved[world];
  }

  function clearFileHighlights() {
    ['imageUpload', 'videoUpload', 'logoUpload'].forEach(id => $(id)?.classList.remove('file-loaded'));
  }

  function stageFile(type, file, input) {
    if (!file) return;
    clearFileHighlights();
    input.classList.add('file-loaded');
    staged = { type, file, world: $('brandWorld').value, label: file.name };
    setState('loaded', 'LOADED', `${type.toUpperCase()} · ${file.name} · ${staged.world === 'city' ? 'The Grey City' : 'The Living Valley'}`);
  }

  function stageText() {
    const title = $('headlineInput').value.trim();
    const subtitle = $('subheadlineInput').value.trim();
    if (!title && !subtitle) {
      setState('error', 'NOTHING TO LOAD', 'Write a headline or subheadline first.');
      return;
    }
    clearFileHighlights();
    staged = { type: 'text', title, subtitle, world: $('brandWorld').value, label: title || subtitle };
    setState('loaded', 'TEXT LOADED', `${staged.world === 'city' ? 'The Grey City' : 'The Living Valley'} · ready to save.`);
  }

  // Replace V1.1 immediate-apply handlers: selection now stages only.
  $('imageUpload').onchange = e => stageFile('image', e.target.files?.[0], e.target);
  $('logoUpload').onchange = e => stageFile('logo', e.target.files?.[0], e.target);
  $('videoUpload').onchange = e => stageFile('video', e.target.files?.[0], e.target);
  if (applyTextButton) applyTextButton.onclick = stageText;

  $('brandWorld').addEventListener('change', () => {
    const world = $('brandWorld').value;
    staged = null;
    clearFileHighlights();
    if (saved[world]) setState('saved', 'SAVED', `${saved[world].type.toUpperCase()} ready for ${world === 'city' ? 'The Grey City' : 'The Living Valley'}.`);
    else setState('idle', 'WAITING FOR CONTENT', 'Load content for this world, then SAVE and APPLY.');
  });

  saveButton.onclick = () => {
    if (!staged) return;
    saved[staged.world] = { ...staged };
    setState('saved', 'SAVED', `${staged.type.toUpperCase()} saved for ${staged.world === 'city' ? 'The Grey City' : 'The Living Valley'}. Now apply it to the experience.`);
  };

  applyButton.onclick = async () => {
    const world = $('brandWorld').value;
    const item = saved[world];
    if (!item) return;
    applyButton.disabled = true;
    applyButton.textContent = 'APPLYING…';
    try {
      if (item.type === 'image' || item.type === 'logo') await original.image.call(manager, world, item.file);
      else if (item.type === 'video') original.video.call(manager, world, item.file);
      else if (item.type === 'text') original.text.call(manager, world, item.title, item.subtitle);
      setState('applied', 'APPLIED', `${item.type.toUpperCase()} is now visible inside ${world === 'city' ? 'The Grey City' : 'The Living Valley'}.`);
      applyButton.textContent = 'APPLIED ✓';
      setTimeout(() => minimizePanel(), 450);
    } catch (error) {
      console.error('[Infinite Worlds] Brand apply failed:', error);
      setState('error', 'COULD NOT APPLY', error?.message || 'The browser could not prepare this asset. Try another file.');
      applyButton.textContent = 'APPLY & EXPERIENCE';
      applyButton.disabled = false;
    }
  };

  function minimizePanel() {
    panel.classList.remove('open');
    panel.classList.add('authoring-minimized');
    restore.classList.add('show');
  }
  function restorePanel() {
    panel.classList.remove('authoring-minimized');
    panel.classList.add('open');
    restore.classList.remove('show');
  }
  minimize.onclick = minimizePanel;
  restore.onclick = restorePanel;
  $('customizeToggle').addEventListener('click', () => {
    panel.classList.remove('authoring-minimized');
    restore.classList.remove('show');
  });

  if (close) close.onclick = () => {
    panel.classList.remove('open', 'authoring-minimized');
    restore.classList.remove('show');
  };

  if (resetBrand) resetBrand.onclick = () => {
    original.reset.call(manager, 'city');
    original.reset.call(manager, 'nature');
    saved.city = saved.nature = null;
    staged = null;
    ['imageUpload', 'videoUpload', 'logoUpload'].forEach(id => { if ($(id)) $(id).value = ''; });
    $('headlineInput').value = '';
    $('subheadlineInput').value = '';
    clearFileHighlights();
    setState('idle', 'RESET COMPLETE', 'Both worlds are back to their default brand surfaces.');
  };

  setState('idle', 'WAITING FOR CONTENT', 'Choose a world and load an image, video, logo or text.');
}

document.addEventListener('DOMContentLoaded', initAuthoringFix);
