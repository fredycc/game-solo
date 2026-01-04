/**
 * WakeLockManager - Mantener pantalla activa en TVs Smart
 * Optimizado para LG OLED y navegadores basados en Chromium
 * 
 * Estrategia:
 * 1. Screen Wake Lock API (nativa, eficiente)
 * 2. Video fallback silencioso (para WebOS)
 * 3. Reactivación en visibility change
 */

export class WakeLockManager {
  private videoElement: HTMLVideoElement | null = null;
  private isVideoPlaying = false;
  private wakeLockRefreshTimer: number | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  private isReleasing = false;
  private hasVisibilityListener = false;

  // Video base64 mínimo (1ms vacío, ~300 bytes)
  private readonly videoSource = "data:video/webm;base64,GkXfowEAAAAAAAAfQoaBAUL3gQFC8oEEQvOBCEKChHdlYm1Ch4ECQoWBAhhTgGcBAAAAAAB2BxFNm3RALE27i1OrhBVJqWZTrIHfTbuMU6uEFlSua1OsggEuTbuMU6uEHFO7a1OsgnXq7AEAAAAAAACkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmAQAAAAAAAEMq17GDD0JATYCMTGF2ZjU2LjcuMTAyV0GMTGF2ZjU2LjcuMTAyc6SQgjdo9yCGPKbvRDsqy6e8XUSJiECMwAAAAAAAFlSuawEAAAAAAABDrgEAAAAAAAA614EBc8WBAZyBACK1nIN1bmSGhVZfVlA4g4EBI+ODhAJiWgDgAQAAAAAAAA6wg==";

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.init();
  }

  private init() {
    if (!this.hasVisibilityListener) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      this.hasVisibilityListener = true;
    }
    this.setupVideoElement();
  }

  /**
   * Configura elemento video oculto para mantener sesión activa
   */
  private setupVideoElement() {
    if (this.videoElement) return;

    try {
      this.videoElement = document.createElement('video');
      
      // Configuración del video
      this.videoElement.src = this.videoSource;
      this.videoElement.muted = true;
      this.videoElement.loop = true;
      this.videoElement.playsInline = true;
      this.videoElement.preload = 'auto';

      // Estilo: Oculto completamente, fuera del flujo de documento
      Object.assign(this.videoElement.style, {
        position: 'fixed',
        bottom: '-9999px',      // Fuera del viewport
        left: '-9999px',
        width: '1px',
        height: '1px',
        pointerEvents: 'none',
        zIndex: '-9999',
        visibility: 'hidden'
      });

      // Reactivar si el video se pausa (interferencia del sistema)
      this.videoElement.addEventListener('pause', () => {
        if (!this.isReleasing && document.visibilityState === 'visible') {
          console.warn('[WakeLock] Video pausado por sistema, reintentando...');
          setTimeout(() => this.startVideoFallback(), 1000);
        }
      });

      document.body.appendChild(this.videoElement);
      console.log('[WakeLock] Video element initialized');
    } catch (error) {
      console.warn('[WakeLock] Failed to setup video element:', error);
    }
  }

  /**
   * Maneja cambios de visibilidad del tab/ventana
   */
  private handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      console.log('[WakeLock] Document became visible, reacquiring...');
      this.requestWakeLock();
    } else {
      console.log('[WakeLock] Document hidden');
      this.clearRefreshTimer();
    }
  }

  /**
   * Solicita Screen Wake Lock API con timeout
   */
  public async requestWakeLock() {
    // Asegurar que estamos inicializados (útil si se llamó a cleanup previamente)
    this.init();

    // 1. Intentar Screen Wake Lock API nativa (recomendado)
    if ('wakeLock' in navigator && !this.wakeLock) {
      try {
        const wakeLockPromise = navigator.wakeLock.request('screen');
        
        // Timeout de 1s en caso de que el navegador cuelgue
        const timeoutPromise = new Promise<null>(resolve =>
          setTimeout(() => resolve(null), 1000)
        );

        this.wakeLock = await Promise.race([wakeLockPromise, timeoutPromise]) as WakeLockSentinel | null;

        if (this.wakeLock) {
          console.log('[WakeLock] Screen Wake Lock API activo');

          // Reacquire si el sistema lo libera
          this.wakeLock.addEventListener('release', () => {
            if (!this.isReleasing) {
              console.warn('[WakeLock] Wake Lock liberado automáticamente');
              this.wakeLock = null;
              setTimeout(() => this.requestWakeLock(), 500);
            }
          });
        } else {
          console.warn('[WakeLock] Screen Wake Lock API timeout o no disponible');
        }
      } catch (error) {
        console.warn('[WakeLock] Screen Wake Lock API error:', error);
        this.wakeLock = null;
      }
    }

    // 2. Fallback: Video silencioso en WebOS/navegadores antiguos
    this.startVideoFallback();
  }

  /**
   * Inicia reproducción de video como fallback
   */
  private startVideoFallback() {
    if (!this.videoElement) {
      this.setupVideoElement();
    }
    
    if (!this.videoElement || this.isVideoPlaying) {
      return;
    }

    const attemptPlay = async () => {
      try {
        await this.videoElement!.play();
        this.isVideoPlaying = true;
        console.log('[WakeLock] Video fallback started');

        // Timer para refrescar periódicamente
        this.startRefreshTimer();

        // Verificar cada minuto si el video sigue reproduciéndose
        const checkInterval = setTimeout(() => {
          if (this.videoElement?.paused && !this.isReleasing) {
            console.warn('[WakeLock] Video se pausó, reintentando...');
            this.isVideoPlaying = false;
            clearTimeout(checkInterval);
            this.startVideoFallback();
          }
        }, 60000);
      } catch (error) {
        console.error('[WakeLock] Video play failed:', error);
        this.isVideoPlaying = false;
      }
    };

    attemptPlay();
  }

  /**
   * Timer para refrescar el wake lock periódicamente
   * Solo reintenta reproducir video si está parado
   */
  private startRefreshTimer() {
    this.clearRefreshTimer();

    // Refrescar cada 30 segundos (intervalo seguro para TVs)
    this.wakeLockRefreshTimer = window.setInterval(() => {
      if (this.videoElement && !this.videoElement.paused) {
        // Video sigue reproduciéndose, todo bien
        return;
      }

      if (!this.isReleasing && this.isVideoPlaying) {
        // Video se pausó, reintentarlo
        console.log('[WakeLock] Refreshing video...');
        this.videoElement?.play().catch(() => {
          // Silenciosamente fallar si no se puede reproducir
        });
      }
    }, 30000);
  }

  /**
   * Limpia el timer de refresh
   */
  private clearRefreshTimer() {
    if (this.wakeLockRefreshTimer) {
      clearInterval(this.wakeLockRefreshTimer);
      this.wakeLockRefreshTimer = null;
    }
  }

  /**
   * Libera todos los recursos de wake lock
   */
  public async releaseWakeLock() {
    this.isReleasing = true;

    // Liberar Screen Wake Lock API
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        console.log('[WakeLock] Screen Wake Lock released');
      } catch (error) {
        console.warn('[WakeLock] Error releasing wake lock:', error);
      }
      this.wakeLock = null;
    }

    // Pausar video
    if (this.videoElement) {
      try {
        this.videoElement.pause();
        this.isVideoPlaying = false;
        console.log('[WakeLock] Video stopped');
      } catch (error) {
        console.warn('[WakeLock] Error pausing video:', error);
      }
    }

    // Limpiar timer
    this.clearRefreshTimer();
    this.isReleasing = false;
  }

  /**
   * Limpieza completa: eliminar el manager
   */
  public cleanup() {
    if (this.hasVisibilityListener) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      this.hasVisibilityListener = false;
    }
    this.releaseWakeLock();
    
    if (this.videoElement) {
      this.videoElement.remove();
      this.videoElement = null;
    }

    console.log('[WakeLock] Manager cleaned up');
  }
}

// Singleton exportado
export const wakeLockManager = new WakeLockManager();
