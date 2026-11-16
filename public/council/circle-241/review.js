import { LivingFrame239 } from '../circle-239/living-frame.js';

async function renderReview() {
  const response = await fetch('./catalogue.json');
  if (!response.ok) throw new Error('Catalogue unavailable');
  const { question, companions, front, reverse } = await response.json();

  class Circle241PreviewFrame extends LivingFrame239 {
    async loadReverse() {
      return { ...reverse, alt: 'Reverse folio placeholder for ' + this.getAttribute('label') };
    }

    appendLibraryLinks() {
      // Link verified destinations when the edition is activated.
    }
  }

  customElements.define('circle-241-preview-frame', Circle241PreviewFrame);
  document.querySelector('#question').textContent = question;
  const list = document.querySelector('#companions');
  for (const companion of companions) {
    const item = document.createElement('li');
    const heading = document.createElement('h2');
    heading.textContent = companion.label;
    const detail = document.createElement('p');
    detail.textContent = companion.author ? companion.kind + ' · ' + companion.author : companion.kind;
    const frame = document.createElement('circle-241-preview-frame');
    frame.setAttribute('label', companion.label);
    frame.setAttribute('companion-key', companion.key);
    frame.setAttribute('front', front.artwork);
    frame.setAttribute('front-alt', 'Front portrait placeholder for ' + companion.label);
    item.append(heading, detail, frame);
    list.append(item);
  }
}

renderReview().catch(() => {
  document.querySelector('#notice').textContent = 'Circle 241 framework unavailable.';
});
