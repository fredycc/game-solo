/**
 * Configuración centralizada de audio para el juego
 */

export const AudioConfig = {
    // Volúmenes por defecto
    volumes: {
        music: {
            intro: 0.5,
            game: 0.4,
        },
        effects: {
            master: 0.3,
            move: 0.5,
            spawn: 0.3,
            thud: 0.3,
        }
    },

    // Configuración de fade
    fade: {
        duration: 500, // ms
        steps: 20,
    },

    // Configuración de preload
    preload: {
        // Precargar música en el momento inicial
        music: true,
        // Precargar efectos de sonido
        effects: false, // Web Audio API crea sonidos en tiempo real
    },

    // Auto-hide para cursor remoto
    remote: {
        idleTimeout: 5000, // ms
    },

    // Configuración de reintentos para autoplay bloqueado
    playback: {
        maxRetries: 3,
        retryDelayBase: 100, // ms (se duplica con cada reintento)
    }
} as const;

// Tipos TypeScript derivados de la configuración
export type MusicType = keyof typeof AudioConfig.volumes.music;
export type EffectType = keyof typeof AudioConfig.volumes.effects;
