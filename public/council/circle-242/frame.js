import { LivingFrame239 } from '../circle-239/living-frame.js';
import { loadEdition } from './edition.js';
let edition;
class Circle242Frame extends LivingFrame239 {
 loadReverse(key) { edition ||= loadEdition(); return edition.then(data => data.companions.find(item=>item.key===key)?.reverse); }
 appendLibraryLinks() {}
}
customElements.define('council-242-frame', Circle242Frame);
