import { StudioShell } from './studio-shell.js';

let installed = false;

export function installMuseumPhase2LayoutFix() {
  if (installed) return;
  installed = true;

  const original = StudioShell.prototype._secondColumn;
  StudioShell.prototype._secondColumn = function phase2UnifiedSecondColumn() {
    const html = original.call(this);
    if (this.domain !== 'content' && this.domain !== 'experience') return html;
    return `<div class="st-tree p2-unified-workspace" data-p2-unified="${this.domain}">${html}</div>`;
  };

  const studio = window.__IW_STUDIO;
  if (studio) studio.render();
}
