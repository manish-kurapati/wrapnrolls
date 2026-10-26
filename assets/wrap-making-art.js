(() => {
 const stage=document.querySelector('.wrap-element-stage');
 if(!stage)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const duration=12000;
 let animations=[],visible=true;
 const key=(offset,opacity,transform)=>({offset,opacity,...(transform?{transform}:{})});
 function animate(selector,frames,extra={}){
  stage.querySelectorAll(selector).forEach(node=>{
   animations.push(node.animate(frames,{duration,iterations:1,fill:'forwards',easing:'linear',...extra}));
  });
 }
 function build(){
  animations.forEach(a=>a.cancel());animations=[];
  stage.classList.toggle('is-still',reduce.matches);
  if(reduce.matches)return;
  animate('.wrap-tortilla',[key(0,0,'translateY(35px) scale(.9)'),key(.05,1,'translateY(0) scale(1)'),key(1,1,'translateY(0) scale(1)')]);
  stage.querySelectorAll('.wrap-drop').forEach(node=>{
   const t=Number(node.dataset.land);
   animations.push(node.animate([
    key(0,0,'translateY(-450px) rotate(-15deg)'),
    key(t,0,'translateY(-450px) rotate(-15deg)'),
    key(t+.055,1,'translateY(9px) rotate(2deg)'),
    key(t+.075,1,'translateY(-5px) rotate(-1deg)'),
    key(t+.09,1,'translateY(0) rotate(0deg)'),
    key(1,1,'translateY(0) rotate(0deg)')
   ],{duration,iterations:1,fill:'forwards',easing:'linear'}));
  });
  animate('.wrap-sauce',[key(0,0),key(.53,0),key(.545,1),key(.61,1),key(.625,0),key(1,0)]);
  animate('.sauce-bottle',[key(0,0),key(.53,0),key(.55,1),key(.6,1),key(.625,0),key(1,0)]);
  // Animate the bottle's wrapper to preserve its illustration placement.
  animate('.sauce-line',[{offset:0,strokeDashoffset:1},{offset:.55,strokeDashoffset:1},{offset:.605,strokeDashoffset:0},{offset:1,strokeDashoffset:0}]);
  animate('.wrap-fold',[key(0,0,'translateY(22px)'),key(.605,0,'translateY(22px)'),key(.64,1,'translateY(0)'),key(1,1,'translateY(0)')]);
  animate('.wrap-flat-scene',[key(0,1,'scale(1)'),key(.635,1,'scale(1)'),key(.675,0,'scale(.88,.6)'),key(1,0,'scale(.88,.6)')]);
  animate('.wrap-rolled-scene',[key(0,0),key(.64,0),key(.675,1),key(.755,1),key(.79,0),key(1,0)]);
  animate('.wrap-knife',[key(0,0,'translate(329px,165px) rotate(-24deg)'),key(.695,0,'translate(329px,165px) rotate(-24deg)'),key(.71,1,'translate(329px,245px) rotate(-24deg)'),key(.75,1,'translate(329px,440px) rotate(-24deg)'),key(.78,0,'translate(329px,470px) rotate(-24deg)'),key(1,0)]);
  animate('.wrap-finished-scene',[key(0,0,'translateY(30px) scale(.8)'),key(.765,0,'translateY(30px) scale(.8)'),key(.82,1,'translateY(0) scale(1)'),key(.96,1,'translateY(-5px) scale(1)'),key(1,1,'translateY(-5px) scale(1)')]);
  animate('.wrap-sparkles',[key(0,0),key(.815,0),key(.84,1),key(.91,.4),key(.96,1),key(1,1)]);
  const start=document.timeline.currentTime;
  animations.forEach(a=>{a.startTime=start;if(!visible)a.pause();});
 }
 new IntersectionObserver(entries=>{
  visible=entries[0].isIntersecting;
  animations.forEach(a=>{if(a.playState==='finished')return;visible?a.play():a.pause();});
 },{threshold:.05}).observe(stage);
 reduce.addEventListener('change',build);
 build();
})();
