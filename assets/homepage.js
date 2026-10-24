(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const stage=document.querySelector('.closing-stage');
 const foods=[...document.querySelectorAll('.closing-food')];
 const angles=[-14,13,-10,13],drift=[-75,80,-40,45];
 let visible=false,animations=[];
 function buildFlights(){
  animations.forEach(a=>a.cancel());animations=[];
  foods.forEach((node,i)=>{
   node.style.opacity=reduce.matches?'1':'';
   node.style.transform=reduce.matches?'rotate('+angles[i]+'deg)':'';
   if(reduce.matches)return;
   const bottom=innerHeight+node.offsetHeight;
   const transform=(x,y,r,scale)=>'translate3d('+x+'px,'+y+'px,0) rotate('+r+'deg) scale('+scale+')';
   const animation=node.animate([
    {offset:0,opacity:0,transform:transform(drift[i],bottom,angles[i]-28,.85),easing:'cubic-bezier(.12,.6,.3,1)'},
    {offset:.1,opacity:1,transform:transform(drift[i]*.65,bottom*.55,angles[i]-16,.92),easing:'cubic-bezier(.16,1,.3,1)'},
    {offset:.43,opacity:1,transform:transform(-drift[i]*.3,-48,angles[i]+6,1.03),easing:'cubic-bezier(.55,0,.85,.45)'},
    {offset:.88,opacity:1,transform:transform(-drift[i],bottom*.85,angles[i]+35,.9),easing:'ease-in'},
    {offset:.94,opacity:0,transform:transform(-drift[i],bottom,angles[i]+42,.85)},
    {offset:1,opacity:0,transform:transform(-drift[i],bottom,angles[i]+42,.85)}
   ],{duration:4600,delay:i*380,iterations:Infinity,fill:'both'});
   if(!visible)animation.pause();
   animations.push(animation);
  });
 }
 if(stage){
  new IntersectionObserver(entries=>{
   visible=entries[0].isIntersecting;
   animations.forEach(a=>visible?a.play():a.pause());
  },{threshold:.1}).observe(stage);
  reduce.addEventListener('change',buildFlights);
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
