(function(){
  const PLAY_URL = 'https://slowroads.io';
  const btnPlay = document.getElementById('btnPlay');
  const btnNewTab = document.getElementById('btnNewTab');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const gameContainer = document.querySelector('.game-frame');
  const skeleton = document.getElementById('gameSkeleton');
  const overlay = document.getElementById('frameOverlay');
  const overlayOpen = document.getElementById('overlayOpen');
  const frameStart = document.getElementById('frameStart');
  const btnStartInFrame = document.getElementById('btnStartInFrame');
  const framePreview = document.getElementById('framePreview');

  // Force 4:3 aspect ratio for the game frame
  if (gameContainer) {
    gameContainer.style.aspectRatio = '16 / 9';
  }

  // Register SW (best-effort)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
    });
  }

  function openNewTabFallback() {
    const w = window.open(PLAY_URL, '_blank', 'noopener');
    if (!w) {
      alert('Popup was blocked. Please allow popups or click "Open in New Tab".');
    }
  }

  function tryEmbedInFrame(){
    if (!gameContainer) return false;

    // Create iframe lazily
    let iframe = document.getElementById('gameIframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'gameIframe';
      iframe.title = 'Slow Roads';
      iframe.allow = 'fullscreen; gamepad; xr-spatial-tracking; autoplay';
      iframe.referrerPolicy = 'no-referrer';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = '0';
      gameContainer.appendChild(iframe);
    }

    let loaded = false;
    const onload = ()=>{
      loaded = true;
      if (skeleton) skeleton.style.display = 'none';
      // enable fullscreen button
      if (btnFullscreen){
        btnFullscreen.removeAttribute('disabled');
        btnFullscreen.setAttribute('aria-disabled','false');
        btnFullscreen.classList.add('enabled');
      }
    };
    iframe.addEventListener('load', onload, { once: true });

    if (skeleton) skeleton.style.display = 'block';
    iframe.src = PLAY_URL;

    // If CSP/XFO blocks embedding, load won't fire; fallback after timeout
    setTimeout(()=>{
      if (!loaded) {
        try { iframe.remove(); } catch {}
        if (skeleton) skeleton.style.display = 'block';
        if (overlay) overlay.style.display = 'flex';
      }
    }, 3500);

    return true;
  }

  // Do NOT auto-embed. Show preview + start overlay until user clicks.

  // Optional manual trigger (kept for safety if the button is shown later)
  btnPlay?.addEventListener('click', ()=>{
    const started = tryEmbedInFrame();
    if (!started && overlay) overlay.style.display = 'flex';
  });

  btnStartInFrame?.addEventListener('click', ()=>{
    frameStart && (frameStart.style.display = 'none');
    framePreview && (framePreview.style.display = 'none');
    const started = tryEmbedInFrame();
    if (!started && overlay) overlay.style.display = 'flex';
  });

  // Fullscreen toggling for the container (not controlling the game itself)
  btnFullscreen?.addEventListener('click', ()=>{
    if (!gameContainer) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(()=>{});
    } else {
      gameContainer.requestFullscreen?.().catch(()=>{});
    }
  });

  // PWA install prompt (soft prompt)
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    console.log('PWA install available');
  });

})();


