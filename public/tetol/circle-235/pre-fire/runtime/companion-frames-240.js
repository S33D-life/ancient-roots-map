import '/council/circle-240/frame.js';
import { loadEdition, root } from '/council/circle-240/edition.js';
import { connectLivingScene, spatialSide } from '/council/circle-239/living-frame.js';

export function connectLivingFrames(scene) {
  connectLivingScene(scene, {element:'council-240-frame', reverseRoot:root+'reverses/', extension:'webp'});
}

export async function installCompanionFrames(D) {
  const circle = await loadEdition();
  const companions = circle.companions;
  D.nodes.c240 = {...D.nodes.c233, name:'Circle 240', circle:240, parent:'croom', question:circle.question, actions:[], relations:[], lives:[]};
  D.council.circles[240] = {node:'c240', number:240, status:'open', companions:companions.map((item, index) => {
    D.nodes[item.id] = {...D.nodes.yewc233, name:item.label, sub:item.kind, circle:240, parent:'croom',
      purpose:'Circle 240 companion', actions:[], relations:[], lives:[]};
    return {id:item.id, kind:item.kind, seat:Math.PI/2+index*Math.PI/5,
      repr:{form:'circleFrame', artwork:item.artwork, width:1536, height:1024, frameFamily:'hornbeam'}};
  })};
  D.council.active = 240;
  D.council.current = 'c240';
  D.circleFrameCompanions = companions;
  Object.assign(D.council.place, {name:'Circle 240 Fire', sub:'No scheduled gathering'});
  Object.assign(D.nodes.live_fire, {circle:240, parent:'croom', name:'The Fire · Circle 240', sub:'No scheduled Fire', question:null, actions:[], lives:[], where:[], relations:[]});
  Object.assign(D.nodes.seat_you, {circle:240, parent:'croom', name:'A place to pause', actions:[], relations:[]});
  Object.assign(D.nodes.croom, {question:circle.question, purpose:'No scheduled Fire.', actions:[], lives:[],
    relations:companions.map(item => ({to:item.id, dim:'place', text:item.label}))});
}

export function companionPanel(D, id, esc) {
  const items = D.circleFrameCompanions;
  const item = items.find(entry => entry.id === id);
  if (!item && !['croom','c240','live_fire','seat_you'].includes(id)) return null;
  const button = (target, label) => `<button type="button" class="act" data-go="${esc(target)}">${esc(label)}</button>`;
  const content = item
    ? `<council-240-frame context="spatial" companion-key="${esc(item.key)}" label="${esc(item.label)}" front="${esc(item.artwork)}" front-alt="${esc(item.alt)}" side="${spatialSide(item.key)}"></council-240-frame>${button('croom','Return to the Council Deck')}`
    : id === 'live_fire' ? '<circle240-hearth></circle240-hearth>'+button('croom','Return to the Council Deck') : id === 'seat_you' ? button('croom','Return to the Council Deck') : button('live_fire','Visit the Fire')+items.map(entry => button(entry.id, entry.label)).join('');
  return `<button type="button" class="grab" id="grab" aria-expanded="false" aria-label="Explore Circle 240"><i></i></button>
    <div class="pbody"><h2 class="pname">${esc(item?.label ?? 'Circle 240')}</h2>
    <p class="psub">No scheduled Fire</p>
    ${D.nodes.c240.question && !item ? `<p>${esc(D.nodes.c240.question)}</p>` : ''}${item?.scientificName ? `<p><i>${esc(item.scientificName)}</i></p>` : ''}${content}
    <a href="/council/240${item ? '?companion='+encodeURIComponent(item.key) : ''}" class="act">Visit the 2D Circle 240</a></div>`;
}

export function buildCompanionPresence() { return null; }
