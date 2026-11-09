import { LivingFrame239 } from '/council/circle-239/living-frame.js';
import { appendCouncilLibraryLinks } from '/council/library-links.js';
import { loadEdition } from './edition.js';

let catalogue;
class CirclePreviewFrame extends LivingFrame239 {
  loadReverse(key) {
    catalogue ||= loadEdition();
    return catalogue.then(data => data.companions.find(item => item.key === key)?.reverse ?? null);
  }
  appendLibraryLinks(container, key) { appendCouncilLibraryLinks(container, 240, key); }
}
if (!customElements.get('council-preview-frame')) customElements.define('council-preview-frame', CirclePreviewFrame);
