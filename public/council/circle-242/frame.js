import { LivingFrame239 } from '../circle-239/living-frame.js';
import { loadEdition } from './edition.js';
import { appendLearningNotes } from './learning-notes.js';
let edition;
class Circle242Frame extends LivingFrame239 {
 loadReverse(key) { edition ||= loadEdition(); return edition.then(data => data.companions.find(item=>item.key===key)?.reverse); }
 appendLibraryLinks(container,key) { (edition ||= loadEdition()).then(data=>appendLearningNotes(container,data.companions.find(item=>item.key===key))).catch(()=>{}); }
}
customElements.define('council-242-frame', Circle242Frame);
