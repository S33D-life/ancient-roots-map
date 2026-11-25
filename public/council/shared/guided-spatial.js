import { destination,selection,surfaceLink,navigationControls,installNavigationStyle,focusNavigation,validateCompanions } from './companion-navigation.js';
export function installSpatialNavigation(D, circle, go, setSheet) {
  const items=validateCompanions(circle,D.circleFrameCompanions);installNavigationStyle();let action;
  function choose(item,key){action=key;history.pushState(null,'',destination(location.href,circle,item,'front',true));go(item?.id||'croom',{push:false});}
  function decorate(id){
    const panel=document.querySelector('#panel .pbody'),item=items.find(c=>c.id===id);
    if(!panel||(!item&&!['croom','c'+circle].includes(id)))return;
    // Scene selections use the original go()/camera. Align only companion URL state.
    const selected=selection(new URL(location.href),items,true);
    history.replaceState(null,'',destination(location.href,circle,item,selected.side,true));
    const heading=panel.querySelector('h2');heading.id='pname';heading.tabIndex=-1;heading.dataset.canopyHeading='';
    const nav=navigationControls(circle,items,item,choose);heading.after(nav);
    const link=panel.querySelector('a[href*="/council/circle-"]');if(link){link.textContent='Continue in 2D Council';link.href=surfaceLink(location.href,circle,items,true).href;}
    const exit=document.getElementById('council-return');if(exit){exit.href=surfaceLink(location.href,circle,items,true).href;exit.textContent='2D Council';}
    const grab=document.querySelector('#grab');grab?.setAttribute('aria-label',item?`Companion ${items.indexOf(item)+1} of ${items.length} · resize panel`:'Meet the companions · resize panel');
  }
  function afterNavigation(id,previous,focus){
    const item=items.find(c=>c.id===id),was=items.some(c=>c.id===previous);
    if(!item&&!((id==='croom'||id==='c'+circle)&&was)){action=undefined;return;}
    // #127 behavior: open the existing sheet, preserve step-button focus; never replace gestures.
    setSheet('mid');
    if(focus)focusNavigation(document.querySelector('#panel'),action||'history',document.querySelector('#pname'));
    action=undefined;
  }
  document.addEventListener('council-frame-turn',()=>queueMicrotask(()=>{const link=document.querySelector('#panel .pbody a[href*="/council/"]');if(link)link.href=surfaceLink(location.href,circle,items,true).href;const exit=document.getElementById('council-return');if(exit)exit.href=surfaceLink(location.href,circle,items,true).href;}));
  return {decorate,afterNavigation};
}
