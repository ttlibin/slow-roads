(function(){
  const PLAY_URL = 'https://slowroads.io';
  const btnPlay = document.getElementById('btnPlay');
  const btnNewTab = document.getElementById('btnNewTab');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const gameContainer = document.querySelector('.game-frame');
  const skeleton = document.getElementById('gameSkeleton');
  const overlay = document.getElementById('frameOverlay');
  const overlayOpen = document.getElementById('overlayOpen');
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
      navigator.serviceWorker.register('./slow-roads-sw.js').catch(()=>{});
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

  // Auto-embed the game when page loads
  window.addEventListener('load', ()=>{
    // Hide the preview image and show skeleton
    if (framePreview) framePreview.style.display = 'none';
    if (skeleton) skeleton.style.display = 'block';
    
    // Start loading the game
    const started = tryEmbedInFrame();
    if (!started && overlay) overlay.style.display = 'flex';
  });

  // Optional manual trigger (kept for safety if the button is shown later)
  btnPlay?.addEventListener('click', ()=>{
    const started = tryEmbedInFrame();
    if (!started && overlay) overlay.style.display = 'flex';
  });
  
  // PWA install functionality is handled in showInstallPrompt()

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

  // Theme switching functionality
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  
  // Available themes
  const themes = [
    { name: 'dark', label: 'Dark', icon: '🌙' },
    { name: 'sunset', label: 'Sunset', icon: '🌅' },
    { name: 'light', label: 'Light', icon: '☀️' }
  ];
  
  // Get current theme from localStorage or default to dark
  let currentThemeIndex = parseInt(localStorage.getItem('themeIndex') || '0');
  
  // Apply saved theme on page load
  applyTheme(currentThemeIndex);
  
  // Theme toggle event listener
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      currentThemeIndex = (currentThemeIndex + 1) % themes.length;
      applyTheme(currentThemeIndex);
      localStorage.setItem('themeIndex', currentThemeIndex.toString());
    });
  }
  
  function applyTheme(themeIndex) {
    const theme = themes[themeIndex];
    const root = document.documentElement;
    
    // Remove all theme attributes
    root.removeAttribute('data-theme');
    
    // Apply new theme
    if (theme.name !== 'dark') {
      root.setAttribute('data-theme', theme.name);
    }
    
    // Update button label
    if (themeLabel) {
      themeLabel.textContent = theme.label;
    }
    
    // Update button icon
    const iconPath = themeToggle?.querySelector('svg path');
    if (iconPath) {
      // Update SVG path based on theme
      const iconPaths = {
        dark: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z',
        sunset: 'M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z',
        light: 'M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z'
      };
      iconPath.setAttribute('d', iconPaths[theme.name]);
    }
  }

})();


