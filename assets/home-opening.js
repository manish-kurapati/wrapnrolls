const loader = document.getElementById('loader');
const video = loader.querySelector('.intro-wrap-video');
const progress = loader.querySelector('#progress');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let timeout;
let finished = false;

function reveal() {
  if (finished) return;
  finished = true;
  clearTimeout(timeout);
  video.pause();
  document.querySelectorAll('header, main, footer').forEach(node => { node.inert = false; });
  loader.hidden = true;
  document.body.classList.remove('loading');
  document.body.classList.add('after-intro');
}

function finish() {
  if (finished) return;
  if (window.WrapPageTransition && !reduceMotion.matches) {
    window.WrapPageTransition.reveal(reveal).catch(reveal);
  } else reveal();
}

function start() {
  if (reduceMotion.matches) { reveal(); return; }
  document.querySelectorAll('header, main, footer').forEach(node => { node.inert = true; });
  loader.hidden = false;
  video.currentTime = 0;
  video.play().catch(reveal);
  timeout = setTimeout(finish, 12000);
}

video.addEventListener('timeupdate', () => {
  if (video.duration) progress.style.transform = `scaleX(${Math.min(1, video.currentTime / video.duration)})`;
});
video.addEventListener('ended', finish);
video.addEventListener('error', reveal);
loader.querySelector('#skip').addEventListener('click', finish);
document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });

let arrivingFromAnotherPage = false;
try { arrivingFromAnotherPage = !!sessionStorage.getItem('wrap-page-wave'); } catch {}
if (arrivingFromAnotherPage) reveal();
else start();
