import { useEffect } from 'react';
import { AudioAssets, AudioConfig } from '../../audio';


interface BackgroundMusicProps {
    mode: 'intro' | 'game';
}

/**
 * Singleton de audio global basado en Web Audio API
 * Garantiza loops perfectos (seamless) y elimina pausas por buffering
 */
class BackgroundAudioManager {
    private static instance: BackgroundAudioManager;

    // Contexto de Audio
    private ctx: AudioContext | null = null;
    private gainNode: GainNode | null = null;

    // Nodo de reproducción actual
    private sourceNode: AudioBufferSourceNode | null = null;

    // Estado
    private currentMode: 'intro' | 'game' | null = null;
    private isPlaying: boolean = false;

    // Cache de buffers decodificados para evitar re-descargas
    private bufferCache: Map<string, AudioBuffer> = new Map();

    // Tracking de carga en progreso
    private loadingPromise: Promise<void> | null = null;

    private constructor() { }

    static getInstance(): BackgroundAudioManager {
        if (!BackgroundAudioManager.instance) {
            BackgroundAudioManager.instance = new BackgroundAudioManager();
        }
        return BackgroundAudioManager.instance;
    }

    /**
     * Inicializa o recupera el AudioContext
     * Maneja compatibilidad con navegadores (webkit)
     */
    private ensureContext() {
        if (this.ctx) return this.ctx;

        const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextCtor();

        // Crear nodo de ganancia maestro para control de volumen
        this.gainNode = this.ctx.createGain();
        this.gainNode.connect(this.ctx.destination);

        return this.ctx;
    }

    /**
     * Carga y decodifica un archivo de audio
     */
    private async loadAudioBuffer(url: string): Promise<AudioBuffer> {
        if (this.bufferCache.has(url)) {
            return this.bufferCache.get(url)!;
        }

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        if (!this.ctx) this.ensureContext();

        const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
        this.bufferCache.set(url, audioBuffer);

        return audioBuffer;
    }

    /**
     * Detiene la reproducción actual
     */
    private stopCurrent(fadeOutDuration = 0.1) {
        if (this.sourceNode) {
            try {
                // Fade out rápido para evitar "polilla" (clicks)
                if (this.gainNode && this.ctx) {
                    this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
                    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx.currentTime);
                    this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fadeOutDuration);
                }

                this.sourceNode.stop(this.ctx!.currentTime + fadeOutDuration);
                this.sourceNode.disconnect();
            } catch (e) {
                // Ignorar errores si ya estaba detenido
            }
            this.sourceNode = null;
        }
        this.isPlaying = false;
    }

    /**
     * Cambia al modo especificado
     */
    async switchMode(mode: 'intro' | 'game') {
        // Inicializar contexto si no existe (importante: requiere interacción previa idealmente, 
        // pero lo intentamos de todos modos)
        this.ensureContext();

        // 1. Verificar si ya estamos en el modo correcto y reproduciendo
        if (this.currentMode === mode && this.isPlaying) {
            // Verificar si el estado del contexto está suspendido (browsers policy)
            if (this.ctx?.state === 'suspended') {
                this.ctx.resume();
            }
            return;
        }

        // 2. Si hay una carga en progreso para este modo, esperar
        if (this.loadingPromise && this.currentMode === mode) return;

        console.log(`[Audio] 🎵 Cambiando a Web Audio: ${mode}`);
        this.currentMode = mode;

        // Detener audio anterior
        this.stopCurrent();

        // Obtener URL
        const trackUrl = mode === 'intro'
            ? (Array.isArray(AudioAssets.intro) ? AudioAssets.intro[0] : AudioAssets.intro)
            : AudioAssets.music_1;

        // Iniciar proceso de carga y reproducción
        this.loadingPromise = (async () => {
            try {
                // Buffer loaded!
                const buffer = await this.loadAudioBuffer(trackUrl);

                // Si el modo cambió mientras cargábamos, abortar
                if (this.currentMode !== mode) return;

                // Crear source node
                const source = this.ctx!.createBufferSource();
                source.buffer = buffer;
                source.loop = true; // Seamless looping garantizado por Web Audio API

                // Configurar volumen inicial
                const targetVolume = mode === 'intro'
                    ? AudioConfig.volumes.music.intro
                    : AudioConfig.volumes.music.game;

                this.gainNode!.gain.setValueAtTime(0, this.ctx!.currentTime);
                this.gainNode!.gain.linearRampToValueAtTime(targetVolume, this.ctx!.currentTime + 0.5); // Fade in suave

                // Conectar grafo
                source.connect(this.gainNode!);

                // Iniciar
                source.start(0);
                this.sourceNode = source;
                this.isPlaying = true;

                // Asegurar que el contexto esté corriendo
                if (this.ctx!.state === 'suspended') {
                    await this.ctx!.resume();
                }

            } catch (err) {
                console.error('[Audio] Web Audio Error:', err);
                // Manejo de autoplay bloqueado
                this.setupInteractionListener();
            } finally {
                this.loadingPromise = null;
            }
        })();

        this.setupListeners();
    }

    /**
     * Listener para interacción de usuario (desbloquear AudioContext)
     */
    private setupInteractionListener() {
        const unlock = () => {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().then(() => {
                    console.log('[Audio] Contexto reanudado por interacción');
                });
            }
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('keydown', unlock);
        };

        window.addEventListener('click', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
    }

    /**
     * Manejo de visibilidad (Tab switching)
     */
    private setupListeners() {
        // Remover listener anterior si existía para no duplicar (sería mejor guardar ref, pero por simplicidad en singleton...)
        // Nota: En esta implementación simplificada, el listener de visibilidad es global y persistente
        if (!(window as any).__audioVisibilityHandler) {
            (window as any).__audioVisibilityHandler = () => {
                if (!this.ctx) return;

                if (document.hidden) {
                    this.ctx.suspend();
                } else {
                    this.ctx.resume();
                }
            };
            document.addEventListener('visibilitychange', (window as any).__audioVisibilityHandler);
        }
    }
}

/**
 * Componente React wrapper
 */
export const BackgroundMusic = ({ mode }: BackgroundMusicProps) => {
    useEffect(() => {
        const manager = BackgroundAudioManager.getInstance();
        manager.switchMode(mode);
        // Sin cleanup al desmontar para mantener música continua entre re-renders de UI
    }, [mode]);

    return null;
};
