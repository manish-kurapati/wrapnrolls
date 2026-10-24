(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const closing=document.querySelector('.home-closing');
 const foods=[...document.querySelectorAll('.closing-food')];
 const hero=document.querySelector('.home-hero');
 const heroDrift=document.querySelector('.hero-food-drift');
 const flights=[[-650,-360,-35], [650,-420,30], [-600,380,-40], [650,350,40]];
 const finalAngles=[-14,13,-10,13];
 let current=0,target=0,active=false,raf=0;
 const clamp=n=>Math.max(0,Math.min(1,n));
 function read(){
  const rect=closing.getBoundingClientRect();
  target=clamp((-rect.top+innerHeight*.22)/(closing.offsetHeight-innerHeight+innerHeight*.22));
  if(!reduce.matches&&heroDrift)heroDrift.style.setProperty('--hero-lift',Math.min(65,Math.max(0,-hero.getBoundingClientRect().top*.07))+'px');
 }
 function render(value){
  const ease=1-Math.pow(1-clamp(value*1.35),3);
  foods.forEach((node,i)=>{
   const [x,y,rotation]=flights[i];
   node.style.transform=`translate3d(${x*(1-ease)}px,${y*(1-ease)}px,0) rotate(${rotation*(1-ease)+finalAngles[i]*ease}deg) scale(${.65+.35*ease})`;
   node.style.opacity=String(clamp(ease*1.6));
  });
 }
 function tick(){raf=0;if(!active||reduce.matches)return;current+=(target-current)*.11;if(Math.abs(target-current)<.0001)current=target;render(current);raf=requestAnimationFrame(tick);}
 const observer=new IntersectionObserver(entries=>{active=entries[0].isIntersecting;if(active&&!reduce.matches){read();if(!raf)raf=requestAnimationFrame(tick)}},{rootMargin:'150px'});observer.observe(closing);
 function applyMotion(){if(reduce.matches){render(1);heroDrift?.style.removeProperty('--hero-lift')}else{read();render(current);if(active&&!raf)raf=requestAnimationFrame(tick)}}
 addEventListener('scroll',read,{passive:true});addEventListener('resize',read);reduce.addEventListener('change',applyMotion);applyMotion();
 const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target)}}),{threshold:.12});document.querySelectorAll('.home-reveal').forEach(node=>reveal.observe(node));
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
