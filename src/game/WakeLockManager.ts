export class WakeLockManager {
  private videoElement: HTMLVideoElement | null = null;
  private isVideoPlaying = false;
  private wakeLockTimer: number | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  private isReleasing = false;
  private audioContext: AudioContext | null = null;
  private audioInitialized = false;

  private readonly videoSource = "data:video/webm;base64,GkXfowEAAAAAAAAfQoaBAUL3gQFC8oEEQvOBCEKChHdlYm1Ch4ECQoWBAhhTgGcBAAAAAAB2BxFNm3RALE27i1OrhBVJqWZTrIHfTbuMU6uEFlSua1OsggEuTbuMU6uEHFO7a1OsgnXq7AEAAAAAAACkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmAQAAAAAAAEMq17GDD0JATYCMTGF2ZjU2LjcuMTAyV0GMTGF2ZjU2LjcuMTAyc6SQgjdo9yCGPKbvRDsqy6e8XUSJiECMwAAAAAAAFlSuawEAAAAAAABDrgEAAAAAAAA614EBc8WBAZyBACK1nIN1bmSGhVZfVlA4g4EBI+ODhAJiWgDgAQAAAAAAAA6wg==";

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.setupVideoElement();
    this.initAudioContext();
  }

  // --- Audio Keep-Alive (Nuevo) ---
  private initAudioContext() {
    if (this.audioInitialized) return;
    
    try {
      // @ts-ignore - Soporte legacy
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioContext = new AudioContextClass();
      this.audioInitialized = true;
      
      // Crear oscilador silencioso para mantener el hardware de audio activo
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 0.01; // Frecuencia inaudible
      gainNode.gain.value = 0.001; // Volumen casi cero
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.start();
      console.log('Audio Keep-Alive started');
    } catch (e) {
      console.warn('Audio Context failed', e);
    }
  }

  private setupVideoElement() {
    try {
      this.videoElement = document.createElement('video');
      Object.assign(this.videoElement, {
        playsInline: true,
        loop: true,
        muted: true,
        preload: 'auto',
        src: this.videoSource
      });
      
      // OPTIMIZACIÓN NUCLEAR PARA WEBOS (Píxel Camaleón):
      // Video visible pero mezclado con el fondo para ser imperceptible
      Object.assign(this.videoElement.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '4px',    // Un poco más grande para forzar el rasterizado
        height: '4px',
        opacity: '0.9',  // Opacidad alta (casi sólido)
        zIndex: '9999',  // Al frente de todo
        pointerEvents: 'none',
        // Filtro para que el píxel sea casi invisible al ojo humano
        // pero "real" para el procesador de imagen de la TV
        mixBlendMode: 'difference',
        filter: 'brightness(0.1)',
        visibility: 'visible'
      });

      // Detección de interferencia del sistema
      this.videoElement.addEventListener('pause', () => {
        if (!this.isReleasing && document.visibilityState === 'visible') {
          console.warn('WebOS screensaver interference detected');
          setTimeout(() => this.startVideoFallback(), 1000);
        }
      });

      document.body.appendChild(this.videoElement);
    } catch (e) {
      console.warn('Failed to setup video element', e);
    }
  }

  private async handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      await this.requestWakeLock();
    }
  }

  public async requestWakeLock() {
    // Intentar Wake Lock API con timeout
    if (!this.wakeLock && 'wakeLock' in navigator) {
      const wakeLockPromise = navigator.wakeLock.request('screen')
        .catch(() => null);
      const timeoutPromise = new Promise<null>(resolve => 
        setTimeout(() => resolve(null), 1000)
      );
      
      this.wakeLock = await Promise.race([wakeLockPromise, timeoutPromise]);
      
      if (this.wakeLock) {
        this.wakeLock.addEventListener('release', () => {
          if (!this.isReleasing) {
            this.wakeLock = null;
            setTimeout(() => this.requestWakeLock(), 1000);
          }
        });
      }
    }

    // Siempre activar video fallback en WebOS
    this.startVideoFallback();
  }

  private startVideoFallback() {
    if (!this.videoElement || this.isVideoPlaying) return;

    const attemptPlay = async () => {
      try {
        await this.videoElement!.play();
        this.isVideoPlaying = true;
        this.startRefreshTimer();
        
        // Verificar estado después de 1 min
        setTimeout(() => {
          if (this.videoElement?.paused) {
            console.warn('Video stopped, retrying...');
            this.isVideoPlaying = false;
            this.startVideoFallback();
          }
        }, 60000);
      } catch (err) {
        console.error('Video play failed:', err);
        this.isVideoPlaying = false;
      }
    };

    attemptPlay();
  }

  private startRefreshTimer() {
    if (this.wakeLockTimer) clearInterval(this.wakeLockTimer);
    
    // Killer Fix: Simular Teclas (Input Inyectado) cada 60s
    // Si nada de lo anterior funciona, esto resetea el timer de inactividad por fuerza bruta
    this.wakeLockTimer = window.setInterval(() => {
       // 1. Reset Video Loop
       if (this.videoElement && this.isVideoPlaying) {
          this.videoElement.play().catch(() => {});
       }

       // 2. Input Injection
       try {
           const event = new KeyboardEvent('keydown', {
               key: 'Shift',
               code: 'ShiftLeft',
               keyCode: 16,
               charCode: 0,
               bubbles: true
           });
           window.dispatchEvent(event);
       } catch { /* ignore */ }
    }, 60000);
  }

  public async releaseWakeLock() {
    this.isReleasing = true;
    
    if (this.wakeLock) {
      try { await this.wakeLock.release(); } catch {}
      this.wakeLock = null;
    }
    
    if (this.videoElement) {
      try { this.videoElement.pause(); } catch {}
      this.isVideoPlaying = false;
    }
    
    if (this.wakeLockTimer) {
      clearInterval(this.wakeLockTimer);
      this.wakeLockTimer = null;
    }
    
    this.isReleasing = false;
  }

  public cleanup() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.releaseWakeLock();
    this.videoElement?.remove();
    this.videoElement = null;
  }
}

export const wakeLockManager = new WakeLockManager();
