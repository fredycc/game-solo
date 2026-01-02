export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private ensureContext() {
    if (this.ctx && this.masterGain) return { ctx: this.ctx, masterGain: this.masterGain };

    const userActivation = navigator.userActivation;
    if (userActivation && !userActivation.hasBeenActive) return null;

    const webkitWindow = window as unknown as { webkitAudioContext?: typeof AudioContext };
    const AudioContextCtor = window.AudioContext ?? webkitWindow.webkitAudioContext;
    if (!AudioContextCtor) return null;

    const ctx = new AudioContextCtor();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(ctx.destination);

    this.ctx = ctx;
    this.masterGain = masterGain;
    return { ctx, masterGain };
  }

  playMoveSound() {
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, masterGain } = audio;

    if (ctx.state === 'suspended') ctx.resume().catch(() => { });
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  playSpawnSound() {
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, masterGain } = audio;

    if (ctx.state === 'suspended') ctx.resume().catch(() => { });
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  playThudSound() {
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, masterGain } = audio;

    if (ctx.state === 'suspended') ctx.resume().catch(() => { });
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);

    osc.type = 'square';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  stopMusic() {
    // Logic for stopping synthesized music if any was playing
  }
}

export const audioManager = new AudioManager();
