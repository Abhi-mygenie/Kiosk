// Kiosk Lock - Prevents users from exiting the app
// For 5-star hotel self-service kiosk

class KioskLock {
  constructor() {
    this.isLocked = false;
    this.onAttemptExit = null;
  }

  enable() {
    if (this.isLocked) return;
    this.isLocked = true;

    // Disable right-click context menu
    document.addEventListener('contextmenu', this.preventDefault);

    // Disable keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);

    // Disable text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    // Disable drag
    document.addEventListener('dragstart', this.preventDefault);

    // Request fullscreen
    this.enterFullscreen();

    // Prevent pinch zoom on touch devices
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });

    // Hide cursor after inactivity
    this.setupCursorHide();

    console.log('Kiosk lock enabled');
  }

  disable() {
    if (!this.isLocked) return;
    this.isLocked = false;

    document.removeEventListener('contextmenu', this.preventDefault);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('dragstart', this.preventDefault);
    document.removeEventListener('touchmove', this.handleTouchMove);

    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';

    if (this.cursorTimeout) {
      clearTimeout(this.cursorTimeout);
    }
    document.body.style.cursor = '';

    console.log('Kiosk lock disabled');
  }

  preventDefault = (e) => {
    e.preventDefault();
    return false;
  };

  handleKeyDown = (e) => {
    // Block common escape keys
    const blockedKeys = [
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
      'Escape', 'Tab', 'PrintScreen'
    ];

    const blockedCombos = [
      { ctrl: true, key: 'w' },      // Close tab
      { ctrl: true, key: 't' },      // New tab
      { ctrl: true, key: 'n' },      // New window
      { ctrl: true, key: 'r' },      // Refresh
      { ctrl: true, key: 'p' },      // Print
      { ctrl: true, key: 'j' },      // Downloads
      { ctrl: true, key: 'h' },      // History
      { ctrl: true, shift: true, key: 'i' }, // Dev tools
      { ctrl: true, shift: true, key: 'j' }, // Dev tools
      { ctrl: true, shift: true, key: 'c' }, // Dev tools
      { alt: true, key: 'F4' },      // Close window
      { alt: true, key: 'Tab' },     // Switch window
      { meta: true, key: 'Tab' },    // Mac switch
    ];

    // Block F keys and Escape
    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block key combinations
    for (const combo of blockedCombos) {
      const ctrlMatch = combo.ctrl ? (e.ctrlKey || e.metaKey) : true;
      const shiftMatch = combo.shift ? e.shiftKey : !combo.shift;
      const altMatch = combo.alt ? e.altKey : !combo.alt;
      const metaMatch = combo.meta ? e.metaKey : !combo.meta;
      const keyMatch = e.key.toLowerCase() === combo.key.toLowerCase();

      if (ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  };

  handleTouchMove = (e) => {
    // Prevent pinch zoom (2+ fingers)
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  enterFullscreen() {
    const elem = document.documentElement;
    
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }

    // Re-enter fullscreen if user exits
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
  }

  handleFullscreenChange = () => {
    if (!document.fullscreenElement && this.isLocked) {
      // Small delay before re-entering fullscreen
      setTimeout(() => {
        if (this.isLocked) {
          this.enterFullscreen();
        }
      }, 100);
    }
  };

  setupCursorHide() {
    let cursorVisible = true;
    
    const hideCursor = () => {
      if (cursorVisible) {
        document.body.style.cursor = 'none';
        cursorVisible = false;
      }
    };

    const showCursor = () => {
      if (!cursorVisible) {
        document.body.style.cursor = '';
        cursorVisible = true;
      }
      
      if (this.cursorTimeout) {
        clearTimeout(this.cursorTimeout);
      }
      
      // Hide cursor after 3 seconds of inactivity
      this.cursorTimeout = setTimeout(hideCursor, 3000);
    };

    document.addEventListener('mousemove', showCursor);
    document.addEventListener('touchstart', showCursor);
  }

  // Admin unlock (for maintenance)
  // Triple-tap top-left corner within 2 seconds
  setupAdminUnlock(callback) {
    let tapCount = 0;
    let tapTimer = null;
    const cornerSize = 100; // pixels from corner

    document.addEventListener('click', (e) => {
      if (e.clientX < cornerSize && e.clientY < cornerSize) {
        tapCount++;
        
        if (tapCount === 1) {
          tapTimer = setTimeout(() => {
            tapCount = 0;
          }, 2000);
        }
        
        if (tapCount >= 5) {
          clearTimeout(tapTimer);
          tapCount = 0;
          if (callback) callback();
        }
      } else {
        tapCount = 0;
        if (tapTimer) clearTimeout(tapTimer);
      }
    });
  }
}

// Create singleton instance
const kioskLock = new KioskLock();

export default kioskLock;
