const ribbonMotion = matchMedia('(prefers-reduced-motion: reduce)');
function updateRibbonMotion() {
 const svg = document.querySelector('.ribbon-svg');
 if (ribbonMotion.matches) { svg.pauseAnimations(); svg.setCurrentTime(0); }
 else svg.unpauseAnimations();
}
ribbonMotion.addEventListener('change', updateRibbonMotion);
updateRibbonMotion();
