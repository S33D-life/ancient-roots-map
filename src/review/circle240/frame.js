import { LivingFrame239 } from '/council/circle-239/living-frame.js';
import { appendCouncilLibraryLinks } from '/council/library-links.js';
import { loadEdition } from './edition.js';

let catalogue;
class CirclePreviewFrame extends LivingFrame239 {
  loadReverse(key) {
    catalogue ||= loadEdition();
    return catalogue.then(data => data.companions.find(item => item.key === key)?.reverse ?? null);
  }
  appendLibraryLinks(container, key) {
    appendCouncilLibraryLinks(container, 240, key);
    if (key === 'rokeby-ginkgo') {
      const link = document.createElement('a');
      link.href = '/tree/818d9e17-a75f-4c17-a6c6-c75689d47bd0';
      link.textContent = 'Meet this Ginkgo in the Ancient Friends Atlas';
      container.append(link);
    }
  }
}
if (!customElements.get('council-preview-frame')) customElements.define('council-preview-frame', CirclePreviewFrame);
