/** Issue #97 only: opt-in review adapter. No live Circle registry or backend writes. */
export async function installAfcPreview(D, circle, number) {
  const response = await fetch('/review/afc-folios.json');
  if (!response.ok) throw new Error('Folio study unavailable');
  const all = await response.json();
  const folio = number === 236 ? all.ely : all.noku;
  if (!folio.circles.includes(number)) throw new Error('Unregistered Council appearance');
  const state = number === 237 ? 'PREPARING · planned' : number === 234 ? 'Remembered appearance' : 'OPEN · historical appearance';
  const context = { route:'council', realm:'canopy', contextId:`council-of-life/circle-${number}`, appearanceId:folio.companionId, focusTarget:folio.companionId, mode:'spatial' };
  const href = `/review/ancient-friends/${folio.key}?` + new URLSearchParams({recordReturn:JSON.stringify(context)});
  const existingFrame = circle.companions.find(c => c.id === folio.companionId);
  const candidates = [{id:folio.companionId,label:folio.name,kind:'Individual tree',artwork:folio.artwork,presence:existingFrame?.presence || {form:'sapling',bark:0x8c7861}}];
  const canvas = document.createElement('canvas');canvas.width=768;canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle='#eee5cc';ctx.fillRect(0,0,768,512);ctx.fillStyle='#304237';ctx.textAlign='center';ctx.font='64px Georgia';ctx.fillText('Noku',384,230);ctx.font='24px Georgia';ctx.fillText('Typographic study · not documentary imagery',384,300);
  const companions = candidates.map((c,i) => {
    const existing = D.nodes[c.id] || D.nodes['ely-plane-companion'];
    D.nodes[c.id] = {...existing,name:c.label,sub:`${c.kind} · review study`,circle:number,parent:'croom',part:`${c.kind} · ${c.id===folio.companionId?folio.species:'existing companion'} · review study`,practical:'Symbolic presence and illustration, not documentary evidence.',purpose:'Read-only folio study; no promotion or attendance implied.',statusNote:'Review study only.',sources:[],location:'Council relationship study; location withheld.',stateShort:state,lives:[],actions:[],relations:[{to:'croom',dim:'place',text:'Return to this Council study'}]};
    return { id:c.id,kind:c.kind,seat:Math.PI/2+i*Math.PI/6,repr:{form:'circleFrame',artwork:c.artwork||canvas.toDataURL(),presence:c.presence}};
  });
  D.council.circles[number] = {...D.council.circles[236],number,status:number===237?'preparing':'review',companions,node:'c236'};
  if (number !== 236) delete D.council.circles[236];
  D.council.active=number;D.council.current='c236';
  D.nodes.c236={...D.nodes.c236,name:`Circle ${number} · folio study`,sub:state,theme:'',question:'',stateShort:state,purpose:'Isolated relationship preview. No weekly question or Fire is supplied by this study.'};
  D.nodes.croom={...D.nodes.croom,name:`Circle ${number} · folio study`,sub:state,theme:'',question:'',purpose:'Existing room · isolated folio study',relations:candidates.map(c=>({to:c.id,dim:'place',text:c.label}))};
  D.circleFrameCompanions=candidates;
  const back=document.getElementById('council-return');if(back){back.href=`/review/afc/council/${number}?mode=spatial&returned=1&companion=${folio.companionId}`;back.textContent=`Return to Circle ${number} study`;}
  const style=document.createElement('style');document.title=`Circle ${number} · folio review`;
  style.textContent='body.grace-p.g-still:not(.g-reading) aside#panel{opacity:1!important;pointer-events:auto!important}#brandline{display:none!important}body.phone #council-return{top:128px!important;bottom:auto!important}body.phone #panel [data-afc-open]{min-height:48px;display:flex;align-items:center}';document.head.append(style);
  // Touch release moves the sheet before the compatibility click is hit-tested.
  // Consume only that handle sequence's click, not later taps or keyboard activation.
  let grabTouch = null, suppressGrabClick = false;
  document.addEventListener('pointerdown', e => {
    suppressGrabClick = false;
    grabTouch = e.pointerType === 'touch' && e.target.closest?.('#grab') ? e.pointerId : null;
  }, true);
  document.addEventListener('pointerup', e => {
    if (grabTouch === e.pointerId) suppressGrabClick = true;
    grabTouch = null;
  }, true);
  document.addEventListener('pointercancel', () => { grabTouch = null; suppressGrabClick = false; }, true);
  document.addEventListener('click', e => {
    if (!suppressGrabClick) return;
    suppressGrabClick = false;
    if (e.detail === 0) return;
    e.preventDefault(); e.stopImmediatePropagation();
  }, true);
  D.afcPreview = { circleNumber:number, panel(id,esc) {
    const c=candidates.find(c=>c.id===id);if(!c && id!=='croom' && id!=='c236')return null;
    return `<button type="button" id="grab" class="grab" aria-label="Show more about this place"><i></i></button><div class="pbody"><h2 class="pname">${esc(c?c.label:`Circle ${number} · folio study`)}</h2><p class="psub">${esc(state)} · review only</p>${c?.id===folio.companionId?`<p>${esc(folio.identityNote)}</p><a class="act" data-afc-open href="${esc(href)}" target="_top">Open ${esc(folio.shortName)}’s living folio →</a>`:c?'<p>This companion’s existing journey remains in the original Circle.</p>':candidates.map(c=>`<button class="act" data-go="${c.id}">${esc(c.label)}</button>`).join('')}<button class="act" data-go="croom">Return to this Council study</button></div>`;
  }};
  // The original header observer enforces 236; use an explicit review banner instead.
  const banner=document.createElement('div');banner.textContent=`Circle ${number} · ${state} · folio study`;banner.setAttribute('role','status');banner.style.cssText='position:fixed;top:96px;left:12px;right:12px;z-index:80;background:#eee5cc;color:#304237;padding:5px;text-align:center;font:13px Georgia;pointer-events:none';document.body.append(banner);
}
