// Elegant touch sound system for 5-star hotel kiosk
// Uses Web Audio API for premium sound quality

class TouchSoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.3; // Subtle volume for elegant feel
  }

  init() {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  // Elegant soft click for buttons
  playClick() {
    if (!this.enabled) return;
    this.init();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.08);
  }

  // Soft tap for menu items
  playTap() {
    if (!this.enabled) return;
    this.init();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.03);
    
    gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  // Success chime for order confirmation
  playSuccess() {
    if (!this.enabled) return;
    this.init();
    
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 - pleasant chord
    
    notes.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.1);
      
      const startTime = this.audioContext.currentTime + index * 0.1;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    });
  }

  // Add to cart sound
  playAddToCart() {
    if (!this.enabled) return;
    this.init();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(900, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  // Error/warning sound
  playError() {
    if (!this.enabled) return;
    this.init();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(250, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  // Number/table selection
  playSelect() {
    if (!this.enabled) return;
    this.init();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(700, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(this.volume * 0.25, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.06);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.06);
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// Create singleton instance
const touchSound = new TouchSoundManager();

export default touchSound;
