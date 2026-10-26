(() => {
 const reduce = matchMedia('(prefers-reduced-motion: reduce)');
 const key = 'wrap-page-wave';
 let busy = false;
 const path = 'M0 90C240 210 400-35 680 75S1100 215 1440 60V220H0Z';
 function overlay(covered) {
  const root=document.createElement('div');root.className='route-wave-overlay';root.setAttribute('aria-hidden','true');
  const layers=['#f5b106','#42191f','#d13e26'].map(colour=>{
   const layer=document.createElement('div');layer.className='route-wave-layer';layer.style.setProperty('--wave-colour',colour);
   layer.innerHTML=`<svg viewBox="0 0 1440 220" preserveAspectRatio="none"><path d="${path}"/></svg><svg class="route-wave-tail" viewBox="0 0 1440 220" preserveAspectRatio="none"><path d="${path}"/></svg>`;
   if(covered)layer.style.transform='translateY(0)';root.append(layer);return layer;
  });
  document.body.append(root);return {root,layers};
 }
 function clearFlag(){try{sessionStorage.removeItem(key);}catch{}}
 let entering=false;try{entering=!!sessionStorage.getItem(key);}catch{}
 clearFlag();
 if(entering&&!reduce.matches){
  // Continue from the outgoing wave's covered position, never replay a full
  // entrance after the destination has already appeared.
  const {root,layers}=overlay(true);
  const animations=layers.map((layer,i)=>layer.animate([{transform:'translateY(0)'},{transform:'translateY(-125%)'}],{duration:340,delay:i*20,easing:'cubic-bezier(.35,0,.25,1)',fill:'forwards'}));
  document.documentElement.classList.remove('route-wave-pending');
  Promise.all(animations.map(a=>a.finished)).then(()=>root.remove());
 }else document.documentElement.classList.remove('route-wave-pending');
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin||!url.pathname.endsWith('.html')||url.pathname===location.pathname||reduce.matches)return;
  event.preventDefault();if(busy)return;busy=true;
  warmPage(url.href);
  const {layers}=overlay(false);
  const animations=layers.map((layer,i)=>layer.animate([{transform:'translateY(110%)'},{transform:'translateY(0)'}],{duration:300,delay:i*20,easing:'cubic-bezier(.65,0,.3,1)',fill:'forwards'}));
  Promise.all(animations.map(a=>a.finished)).then(()=>{
   try{sessionStorage.setItem(key,'1');}catch{}
   location.assign(url.href);
  });
 });
 const warmed=new Set();
 function warmPage(href){
  if(warmed.has(href))return;warmed.add(href);
  const hint=document.createElement('link');hint.rel='prefetch';hint.href=href;hint.as='document';document.head.append(hint);
 }
 function warmLink(event){const link=event.target.closest('a[href]');if(!link)return;const url=new URL(link.href,location.href);if(url.origin===location.origin&&url.pathname.endsWith('.html')&&url.pathname!==location.pathname)warmPage(url.href);}
 document.addEventListener('pointerover',warmLink,{passive:true});document.addEventListener('focusin',warmLink);
 // A back/forward cache restoration must never keep the covering overlay.
 addEventListener('pageshow',event=>{if(event.persisted){document.querySelectorAll('.route-wave-overlay').forEach(node=>node.remove());document.documentElement.classList.remove('route-wave-pending');clearFlag();busy=false;}});
})();
