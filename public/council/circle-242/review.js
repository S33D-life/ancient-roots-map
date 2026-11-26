import { LivingFrame239 } from '../circle-239/living-frame.js';
import { appendLearningNotes } from './learning-notes.js';

async function renderReview() {
  const response = await fetch('./catalogue.json');
  if (!response.ok) throw new Error('Catalogue unavailable');
  const { question, companions } = await response.json();

  class Circle242PreviewFrame extends LivingFrame239 {
    async loadReverse(key) {
      return companions.find(item => item.key === key)?.reverse;
    }

    appendLibraryLinks(container, key) { appendLearningNotes(container, companions.find(item => item.key === key)); }
  }

  customElements.define('circle-242-preview-frame', Circle242PreviewFrame);
  document.querySelector('#question').textContent = question || 'Weekly inquiry awaiting curatorial approval.';
  document.querySelector('#notice').textContent = 'The Keepers of Winter’s Threshold. Individual folio prompts are companion invitations, not separate weekly inquiries.';
  const list = document.querySelector('#companions');
  for (const companion of companions) {
    const item = document.createElement('li');
    const heading = document.createElement('h2');
    heading.textContent = companion.label;
    const detail = document.createElement('p');
    detail.textContent = companion.author ? companion.kind + ' · ' + companion.author : companion.kind;
    if (!companion.artwork) { const pending=document.createElement('p');pending.textContent='Artwork and transcript awaiting public-use clearance.';item.append(heading,detail,pending);list.append(item);continue; }
    const frame = document.createElement('circle-242-preview-frame');
    frame.setAttribute('label', companion.label);
    frame.setAttribute('companion-key', companion.key);
    frame.setAttribute('front', companion.artwork);
    frame.setAttribute('front-alt', companion.alt);
    item.append(heading, detail, frame);
    list.append(item);
  }
}

renderReview().catch(() => {
  document.querySelector('#notice').textContent = 'Circle 242 framework unavailable.';
});
