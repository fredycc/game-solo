import { useEffect } from 'react';
import { AudioAssets } from '../../audio';

interface BackgroundMusicProps {
    mode: 'intro' | 'game';
}

/**
 * Singleton de audio global - asegura que solo una instancia de audio existe
 * Previene múltiples audios reproduciéndose simultáneamente
 */
class AudioManager {
    private static instance: AudioManager;
    private audio: HTMLAudioElement | null = null;
    private currentMode: 'intro' | 'game' | null = null;
    private isPlaying: boolean = false;
    private visibilityHandler: (() => void) | null = null;
    private pauseHandler: (() => void) | null = null;
    private interactionHandler: (() => void) | null = null;

    private constructor() { }

    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    /**
     * Limpia completamente el audio actual
     */
    private cleanup() {
        if (!this.audio) return;

        // Remover listeners
        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
            this.visibilityHandler = null;
        }
        if (this.pauseHandler) {
            this.audio.removeEventListener('pause', this.pauseHandler);
            this.pauseHandler = null;
        }
        if (this.interactionHandler) {
            window.removeEventListener('click', this.interactionHandler);
            window.removeEventListener('touchstart', this.interactionHandler);
            window.removeEventListener('keydown', this.interactionHandler);
            this.interactionHandler = null;
        }

        // Detener y liberar audio
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.volume = 0;
        this.audio.src = '';
        this.audio.load();
        this.audio = null;
        this.isPlaying = false;
        this.currentMode = null;
    }

    /**
     * Cambia al modo especificado (intro o game)
     */
    switchMode(mode: 'intro' | 'game') {
        // Si ya está en el modo correcto y reproduciendo, no hacer nada
        if (this.currentMode === mode && this.audio && this.isPlaying) {
            return;
        }

        // Limpiar audio anterior INMEDIATAMENTE (síncrono)
        this.cleanup();

        // Obtener URL del track
        const trackUrl = mode === 'intro'
            ? (Array.isArray(AudioAssets.intro) ? AudioAssets.intro[0] : AudioAssets.intro)
            : AudioAssets.music_1;

        // Crear nuevo audio
        this.audio = new Audio(trackUrl);
        this.audio.loop = true;
        this.audio.volume = mode === 'intro' ? 0.5 : 0.4;
        this.audio.preload = 'auto';
        this.currentMode = mode;

        // Intentar reproducir
        this.attemptPlay();

        // Configurar listeners
        this.setupListeners();
    }

    /**
     * Intenta reproducir el audio
     */
    private attemptPlay(retryCount = 0) {
        if (!this.audio || !this.currentMode) return;

        const audio = this.audio;

        audio.play()
            .then(() => {
                this.isPlaying = true;
            })
            .catch((err) => {
                // Autoplay bloqueado
                if (err.name === 'NotAllowedError') {
                    this.setupInteractionListener();
                }
                // Reintentar con delay si no está listo
                else if (retryCount < 3) {
                    const delay = 100 * Math.pow(2, retryCount);
                    setTimeout(() => this.attemptPlay(retryCount + 1), delay);
                }
            });
    }

    /**
     * Configura listener para interacción del usuario cuando autoplay está bloqueado
     */
    private setupInteractionListener() {
        if (this.interactionHandler || !this.audio) return;

        const audio = this.audio;

        this.interactionHandler = () => {
            audio.play()
                .then(() => {
                    this.isPlaying = true;
                })
                .catch(() => { });

            // Limpiar listeners
            if (this.interactionHandler) {
                window.removeEventListener('click', this.interactionHandler);
                window.removeEventListener('touchstart', this.interactionHandler);
                window.removeEventListener('keydown', this.interactionHandler);
                this.interactionHandler = null;
            }
        };

        window.addEventListener('click', this.interactionHandler, { once: true });
        window.addEventListener('touchstart', this.interactionHandler, { once: true });
        window.addEventListener('keydown', this.interactionHandler, { once: true });
    }

    /**
     * Configura listeners de visibilidad y pausas inesperadas
     */
    private setupListeners() {
        if (!this.audio) return;

        const audio = this.audio;
        const mode = this.currentMode;

        // Listener de visibilidad
        this.visibilityHandler = () => {
            if (!this.audio || this.currentMode !== mode) return;

            if (document.hidden) {
                if (!audio.paused) {
                    audio.pause();
                }
            } else {
                if (this.isPlaying && audio.paused) {
                    audio.play().catch(() => { });
                }
            }
        };

        document.addEventListener('visibilitychange', this.visibilityHandler);

        // Listener de pausas inesperadas (ej: al conectar dispositivo QR)
        this.pauseHandler = () => {
            if (!document.hidden && this.isPlaying && this.currentMode === mode) {
                setTimeout(() => {
                    if (this.audio && this.audio.paused && !document.hidden) {
                        this.audio.play().catch(() => { });
                    }
                }, 50);
            }
        };

        audio.addEventListener('pause', this.pauseHandler);
    }

    /**
     * Detiene completamente el audio
     */
    stop() {
        this.cleanup();
    }
}

/**
 * Componente de música de fondo
 * Usa un singleton para asegurar que solo una instancia de audio existe
 */
export const BackgroundMusic = ({ mode }: BackgroundMusicProps) => {
    useEffect(() => {
        const manager = AudioManager.getInstance();
        manager.switchMode(mode);

        // Cleanup al desmontar - pero NO detener el audio
        // para permitir que continúe entre cambios de escena
        return () => {
            // No hacemos cleanup aquí porque queremos que el audio continúe
            // Solo cuando cambia el modo se hace el cleanup
        };
    }, [mode]);

    return null;
};
