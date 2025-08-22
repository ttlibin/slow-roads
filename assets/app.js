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
  const btnInstallPWA = document.getElementById('btnInstallPWA');
  const framePreview = document.getElementById('framePreview');
  
  // PWA variables
  let deferredPrompt;

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
        console.log('Fullscreen button enabled after game load');
      } else {
        console.log('Fullscreen button not found');
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
  
  // Show install button if PWA is available
  if (deferredPrompt && btnInstallPWA) {
    btnInstallPWA.style.display = 'inline-flex';
    btnInstallPWA.addEventListener('click', ()=>{
      showInstallPrompt();
    });
  }

  // Fullscreen toggling for the container (not controlling the game itself)
  btnFullscreen?.addEventListener('click', ()=>{
    console.log('Fullscreen button clicked');
    if (!gameContainer) {
      console.log('No game container found');
      return;
    }
    if (document.fullscreenElement) {
      console.log('Exiting fullscreen');
      document.exitFullscreen().catch((err)=>{
        console.error('Error exiting fullscreen:', err);
      });
    } else {
      console.log('Entering fullscreen');
      gameContainer.requestFullscreen?.().catch((err)=>{
        console.error('Error entering fullscreen:', err);
      });
    }
  });

  // PWA install prompt and management
  let isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches;
  
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
  });
  
  function showInstallPrompt() {
    if (isPWAInstalled) return;
    
    // Create install prompt UI
    const prompt = document.createElement('div');
    prompt.className = 'install-prompt';
    prompt.innerHTML = `
      <div class="install-card">
        <h4>Install Slow Roads</h4>
        <p>Get the best experience with our app</p>
        <div class="install-actions">
          <button id="installBtn" class="btn btn-primary">Install</button>
          <button id="dismissBtn" class="btn btn-ghost">Not now</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(prompt);
    
    // Install button handler
    document.getElementById('installBtn')?.addEventListener('click', async ()=>{
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('PWA installed');
          isPWAInstalled = true;
        }
        deferredPrompt = null;
      }
      prompt.remove();
    });
    
    // Dismiss button handler
    document.getElementById('dismissBtn')?.addEventListener('click', ()=>{
      prompt.remove();
    });
  }
  
  // Check if running in PWA mode
  if (isPWAInstalled) {
    // If in PWA, redirect to game after a brief delay
    setTimeout(() => {
      window.location.href = PLAY_URL;
    }, 2000);
  }

})();


