(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const stage=document.querySelector('.closing-stage');
 const foods=[...document.querySelectorAll('.closing-food')];
 const angles=[-14,13,-10,13];
 let active=false, flights=[];
 function buildFlights(){
  flights.forEach(flight=>flight.cancel());
  flights=[];
  foods.forEach((node,i)=>{
   if(reduce.matches){node.style.opacity='1';node.style.transform=`rotate(${angles[i]}deg)`;return;}
   node.style.opacity='';
   node.style.transform='';
   // The ingredient rises out of the footer, hangs briefly, then falls below it again.
   const distance=stage.clientHeight-node.offsetTop+node.offsetHeight+40;
   const x=(i%2===0?-1:1)*Math.min(stage.clientWidth*.08,85);
   const at=(shift,y,angle,scale)=>`translate3d(${shift}px,${y}px,0) rotate(${angle}deg) scale(${scale})`;
   const flight=node.animate([
    {offset:0,transform:at(x,distance,angles[i]-28,.72),opacity:0},
    {offset:.18,transform:at(x*.45,distance*.48,angles[i]-12,.9),opacity:1},
    {offset:.38,transform:at(0,0,angles[i],1),opacity:1},
    {offset:.5,transform:at(-x*.12,-22,angles[i]+6,1.04),opacity:1},
    {offset:.62,transform:at(0,0,angles[i],1),opacity:1},
    {offset:.82,transform:at(x*.45,distance*.48,angles[i]+12,.9),opacity:1},
    {offset:1,transform:at(x,distance,angles[i]+28,.72),opacity:0}
   ],{duration:5300+i*300,delay:i*440,iterations:Infinity,fill:'both',easing:'ease-in-out'});
   if(!active)flight.pause();
   flights.push(flight);
  });
 }
 if(stage){
  new IntersectionObserver(entries=>{
   active=entries[0].isIntersecting;
   flights.forEach(flight=>active?flight.play():flight.pause());
  },{threshold:.1}).observe(stage);
  reduce.addEventListener('change',buildFlights);
  addEventListener('resize',buildFlights);
  buildFlights();
 }
 const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target);}}),{threshold:.12});
 document.querySelectorAll('.home-reveal').forEach(node=>reveal.observe(node));
})();

// Section entrances and scroll-linked depth, separate from the opening animation.
(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const headings=[...document.querySelectorAll('.home-section-title')];
 headings.forEach(heading=>{
  heading.classList.add('scroll-heading');
  const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  let index=0;
  nodes.forEach(node=>{
   const fragment=document.createDocumentFragment();
   node.textContent.split(/(\s+)/).forEach(word=>{
    if(!word.trim()){fragment.append(document.createTextNode(word));return;}
    const span=document.createElement('span');span.className='scroll-word';span.textContent=word;span.style.setProperty('--word-delay',`${index++ * 45}ms`);fragment.append(span);
   });
   node.replaceWith(fragment);
  });
 });
 const entrances=[...document.querySelectorAll('.flavour-shot,.home-more-art')];
 entrances.forEach((node,i)=>{node.classList.add('scroll-pop');node.style.setProperty('--pop-delay',`${node.matches('.flavour-shot')?i*100:0}ms`)});
 const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add('scroll-in');reveal.unobserve(entry.target)}
 }),{threshold:.12});
 [...headings,...entrances].forEach(node=>reveal.observe(node));
 const depth=[
  [document.querySelector('.belief-photo'),28],
  [document.querySelector('.hero-wordmark'),-30],
  [document.querySelector('.more-burger'),-35],
  [document.querySelector('.more-fries'),40]
 ].filter(([node])=>node);
 const visible=new Set();
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>entry.isIntersecting?visible.add(entry.target):visible.delete(entry.target));schedule()},{rootMargin:'120px'});
 depth.forEach(([node])=>observer.observe(node));
 const heroCopy=document.querySelector('.hero-copy');
 let frame=0;
 function update(){
  frame=0;
  if(reduce.matches){depth.forEach(([node])=>node.style.removeProperty('--scroll-shift'));heroCopy?.style.removeProperty('--scroll-shift');return;}
  depth.forEach(([node,speed])=>{
   if(!visible.has(node))return;
   const rect=node.getBoundingClientRect();
   const progress=Math.max(-1,Math.min(1,(innerHeight*.5-rect.top-rect.height*.5)/innerHeight));
   node.style.setProperty('--scroll-shift',`${(progress*speed).toFixed(2)}px`);
  });
  heroCopy?.style.setProperty('--scroll-shift',`${-Math.min(65,Math.max(0,scrollY)*.09)}px`);
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update)}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
 reduce.addEventListener('change',()=>{if(reduce.matches)[...headings,...entrances].forEach(node=>node.classList.add('scroll-in'));schedule()});
 if(reduce.matches)[...headings,...entrances].forEach(node=>node.classList.add('scroll-in'));
 schedule();
})();
