import { AudioConfig } from './AudioConfig';

/**
 * AudioEffectsManager optimizado con pool de osciladores
 * Usa Web Audio API para generar efectos de sonido procedurales de forma eficiente
 */
export class AudioEffectsManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private effectsPool: Map<string, number> = new Map(); // Track de efectos activos

  private ensureContext() {
    if (this.ctx && this.masterGain) return { ctx: this.ctx, masterGain: this.masterGain };

    const userActivation = navigator.userActivation;
    if (userActivation && !userActivation.hasBeenActive) return null;

    const webkitWindow = window as unknown as { webkitAudioContext?: typeof AudioContext };
    const AudioContextCtor = window.AudioContext ?? webkitWindow.webkitAudioContext;
    if (!AudioContextCtor) return null;

    const ctx = new AudioContextCtor();
    const masterGain = ctx.createGain();
    masterGain.gain.value = AudioConfig.volumes.effects.master;
    masterGain.connect(ctx.destination);

    this.ctx = ctx;
    this.masterGain = masterGain;
    return { ctx, masterGain };
  }

  /**
   * Genera un efecto de sonido procedural
   * Reutiliza el contexto de audio para mejor rendimiento
   */
  private playEffect(
    type: 'sine' | 'triangle' | 'square',
    startFreq: number,
    endFreq: number,
    duration: number,
    volume: number,
    rampType: 'exponential' | 'linear' = 'exponential'
  ) {
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, masterGain } = audio;

    // Limitar efectos simultáneos para prevenir sobrecarga
    const effectKey = `${type}-${Date.now()}`;
    if (this.effectsPool.size > 10) {
      // Limpiar efectos antiguos
      const oldestKey = Array.from(this.effectsPool.keys())[0];
      this.effectsPool.delete(oldestKey);
    }

    if (ctx.state === 'suspended') ctx.resume().catch(() => { });

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);

    if (rampType === 'exponential') {
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
    } else {
      osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(volume, ctx.currentTime);

    if (rampType === 'exponential') {
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    } else {
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + duration);
    }

    osc.start();
    osc.stop(ctx.currentTime + duration);

    // Track el efecto y limpiarlo cuando termine
    this.effectsPool.set(effectKey, Date.now());
    setTimeout(() => {
      this.effectsPool.delete(effectKey);
    }, duration * 1000 + 100); // Añadir buffer
  }

  playMoveSound() {
    this.playEffect(
      'sine',
      200,
      100,
      0.1,
      AudioConfig.volumes.effects.move,
      'exponential'
    );
  }

  playSpawnSound() {
    this.playEffect(
      'triangle',
      400,
      600,
      0.1,
      AudioConfig.volumes.effects.spawn,
      'linear'
    );
  }

  playThudSound() {
    this.playEffect(
      'square',
      100,
      50,
      0.1,
      AudioConfig.volumes.effects.thud,
      'exponential'
    );
  }

  /**
   * Ajusta el volumen master de todos los efectos
   */
  setMasterVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        Math.max(0, Math.min(1, volume)),
        this.ctx!.currentTime
      );
    }
  }

  /**
   * Libera recursos del contexto de audio
   */
  dispose() {
    if (this.ctx) {
      this.ctx.close().catch(() => { });
      this.ctx = null;
      this.masterGain = null;
      this.effectsPool.clear();
    }
  }

  /**
   * Obtiene información sobre el estado del manager
   */
  getStatus() {
    return {
      contextState: this.ctx?.state || 'not-initialized',
      activeEffects: this.effectsPool.size,
      masterVolume: this.masterGain?.gain.value || 0,
    };
  }
}

// Singleton para reutilización global
export const audioEffectsManager = new AudioEffectsManager();
