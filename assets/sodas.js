(() => {
 const hero=document.querySelector('.soda-hero');
 const field=document.querySelector('.ice-field');
 const glasses=[...document.querySelectorAll('.soda-glass')];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0;
 function update(){
  frame=0;
  const y=Math.max(0,-hero.getBoundingClientRect().top);
  field.style.setProperty('--ice-scroll',reduce.matches?'0px':`${Math.min(95,y*.12)}px`);
  glasses.forEach((glass,i)=>glass.style.setProperty('--glass-scroll',reduce.matches?'0px':`${-Math.min(60,y*(i?.075:.045))}px`));
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update)}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);reduce.addEventListener('change',()=>{glasses.forEach(g=>g.style.removeProperty('--pointer-angle'));schedule()});
 hero.addEventListener('pointermove',event=>{
  if(reduce.matches||event.pointerType==='touch')return;
  const rect=hero.getBoundingClientRect();const angle=((event.clientX-rect.left)/rect.width-.5)*5;
  glasses.forEach(g=>g.style.setProperty('--pointer-angle',`${angle.toFixed(2)}deg`));
 });
 hero.addEventListener('pointerleave',()=>glasses.forEach(g=>g.style.removeProperty('--pointer-angle')));
 schedule();
})();
