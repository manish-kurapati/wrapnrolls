(() => {
  const video = document.querySelector('.wrap-hero-film video');
  const frame = document.querySelector('.landing-frame');
  if (!video || !frame) return;
  const matchFallbackBackground = () => {
    if (new URL(video.currentSrc || video.querySelector('source')?.src || '', location.href).pathname.endsWith('.mp4')) {
      frame.style.backgroundColor = '#c22f28';
    }
  };
  video.addEventListener('loadedmetadata', matchFallbackBackground);
  if (video.readyState >= 1) matchFallbackBackground();
})();
