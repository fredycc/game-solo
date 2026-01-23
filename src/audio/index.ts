import main_intro_mp3 from './main_intro.mp3?url';
import main_intro_m4a from './main_intro.m4a?url';
import music_1 from './music_1.mp3?url';
import music_2 from './music_2.mp3?url';

export const AudioAssets = {
    intro: [main_intro_mp3, main_intro_m4a],
    music_1,
    music_2
};

// Exportar managers y configuración de audio
export { AudioEffectsManager, audioEffectsManager } from './AudioManager';
export { AudioConfig } from './AudioConfig';
