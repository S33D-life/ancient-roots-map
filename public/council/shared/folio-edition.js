import { LivingFrame239 } from '../circle-239/living-frame.js';
import { appendCouncilLibraryLinks } from '../library-links.js';
import { validateCompanions } from './companion-navigation.js';
export async function loadFolioEdition(number) {
  const treeResponse=await fetch('/council/time-tree.json',{cache:'no-store'});
  if(!treeResponse.ok)throw Error('Published Council index unavailable');
  const tree=await treeResponse.json();
  const published=tree.editions?.find(e=>e.number===number);
  if(!Number.isSafeInteger(number)||number<241||!published)throw Error('Unpublished Council');
  if(typeof published.canopy!=='string' || !published.canopy.startsWith('/council/') || published.canopy.includes('..') || published.canopy.includes('\\') || published.canopy.includes('#'))throw Error('Invalid Council return route');
  const response=await fetch(`/council/circle-${number}/catalogue.json`,{cache:'no-store'});
  if(!response.ok)throw Error('Council catalogue unavailable');
  const data=await response.json();
  // 241 is the historical pre-approval-field contract. New editions must explicitly opt in.
  if(typeof data.question!=='string' || !data.question.trim() || data.fire!==null || data.number!==number || (data.publicationApproved!==true && !(number===241 && data.publicationApproved===undefined)))throw Error('Council not approved');
  validateCompanions(number,data.companions);return {...data,canopy:published.canopy};
}
const editions=new Map();
export function registerFolioFrame(edition) {
  editions.set(edition.number,edition);
  const name='canopy-folio-frame';
  // One class, multiple editions. Attributes scope identity; no global current-edition cache.
  if(!customElements.get(name))customElements.define(name,class extends LivingFrame239 {
    get edition(){return editions.get(Number(this.getAttribute('circle')));}
    async loadReverse(key){return this.edition.companions.find(c=>c.key===key)?.reverse;}
    appendLibraryLinks(container,key){
      appendCouncilLibraryLinks(container,this.edition.number,key);
      const item=this.edition.companions.find(c=>c.key===key);
      for(const text of [item?.learningNote ? 'Learning note — '+item.learningNote : null,item?.invitationNote])if(text){const p=document.createElement('p');p.textContent=text;container.append(p);}
      if(item?.correctedReading && item.correctedReading!==item.reverse.readableText){const details=document.createElement('details'),summary=document.createElement('summary'),pre=document.createElement('pre');summary.textContent='Read the editorially corrected text';pre.textContent=item.correctedReading;details.append(summary,pre);container.append(details);}
    }
  });
  return () => {const frame=document.createElement(name);frame.setAttribute('circle',String(edition.number));return frame;};
}
