(() => {
 const stage=document.querySelector('.category-build-stage');
 if(!stage)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let animations=[],visible=true;
 const duration=stage.querySelector('.burger-making-art')?8500:11000;
 function build(){
  animations.forEach(a=>a.cancel());animations=[];
  stage.classList.toggle('is-still',reduce.matches);
  if(reduce.matches)return;
  stage.querySelectorAll('[data-build]').forEach((node,i)=>{
   const t=Number(node.dataset.build);
   const base=t===0;
   const frames=base?[
    {offset:0,opacity:0,transform:'translateY(20px)'},
    {offset:.035,opacity:1,transform:'translateY(0)'},
    {offset:.94,opacity:1,transform:'translateY(0)'},
    {offset:1,opacity:1,transform:'translateY(0)'}
   ]:[
    {offset:0,opacity:0,transform:'translateY(-440px)'},
    {offset:t,opacity:0,transform:'translateY(-440px)'},
    {offset:t+.05,opacity:1,transform:'translateY(7px)'},
    {offset:t+.07,opacity:1,transform:'translateY(-4px)'},
    {offset:t+.09,opacity:1,transform:'translateY(0)'},
    {offset:.94,opacity:1,transform:'translateY(0)'},
    {offset:1,opacity:1,transform:'translateY(0)'}
   ];
   animations.push(node.animate(frames,{duration,iterations:1,fill:'forwards',easing:'linear'}));
  });
  stage.querySelectorAll('.build-sparkles').forEach(node=>animations.push(node.animate([
   {offset:0,opacity:0},{offset:.79,opacity:0},{offset:.83,opacity:1},{offset:.9,opacity:.5},{offset:.94,opacity:1},{offset:1,opacity:1}
  ],{duration,iterations:1,fill:'forwards'})));
  const start=document.timeline.currentTime;animations.forEach(a=>{a.startTime=start;if(!visible)a.pause();});
 }
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;animations.forEach(a=>{if(a.playState==='finished')return;visible?a.play():a.pause();});},{threshold:.05}).observe(stage);
 reduce.addEventListener('change',build);build();
})();
