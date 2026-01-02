export class WakeLockManager {
  private videoElement: HTMLVideoElement | null = null;
  private isVideoPlaying = false;
  private wakeLockTimer: number | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  private isReleasing = false;

  private readonly videoSource = "data:video/webm;base64,GkXfowEAAAAAAAAfQoaBAUL3gQFC8oEEQvOBCEKChHdlYm1Ch4ECQoWBAhhTgGcBAAAAAAB2BxFNm3RALE27i1OrhBVJqWZTrIHfTbuMU6uEFlSua1OsggEuTbuMU6uEHFO7a1OsgnXq7AEAAAAAAACkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmAQAAAAAAAEMq17GDD0JATYCMTGF2ZjU2LjcuMTAyV0GMTGF2ZjU2LjcuMTAyc6SQgjdo9yCGPKbvRDsqy6e8XUSJiECMwAAAAAAAFlSuawEAAAAAAABDrgEAAAAAAAA614EBc8WBAZyBACK1nIN1bmSGhVZfVlA4g4EBI+ODhAJiWgDgAQAAAAAAAA6wg==";

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.setupVideoElement();
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
      
      Object.assign(this.videoElement.style, {
        position: 'absolute',
        width: '1px',
        height: '1px',
        opacity: '0.01',
        pointerEvents: 'none',
        zIndex: '-1',
        top: '0',
        left: '0',
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
    
    // Agitación del DOM y reset de video cada 30 segundos
    this.wakeLockTimer = window.setInterval(() => {
      if (this.videoElement && this.isVideoPlaying) {
        // Forzar play/pause para re-despertar el hilo de video
        this.videoElement.play().catch(() => {});
        
        // Simular interacción con el DOM
        const dummy = document.createElement('div');
        dummy.style.display = 'none';
        document.body.appendChild(dummy);
        setTimeout(() => dummy.remove(), 100);
      }
    }, 30000);

    // Heartbeat cada 15 segundos con ruido
    window.setInterval(() => {
      if (this.videoElement && this.isVideoPlaying) {
        // 1. Alterar ligeramente el tiempo para forzar renderizado
        this.videoElement.currentTime = Math.random() * 0.1;
        
        // 2. Realizar una acción de red "dummy" para engañar al sistema operativo
        fetch('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')
          .catch(() => {});
      }
    }, 15000);
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
