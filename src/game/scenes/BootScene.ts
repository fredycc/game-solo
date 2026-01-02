import * as Phaser from 'phaser';
import { Assets } from '../../assets/images';
import { AudioAssets } from '../../audio';
import { LoadingBar } from '../ui/LoadingBar';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // 1. Fondo de la escena (Azul cielo) - Para mantener consistencia
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0);

    // 2. Inicializar Barra de Carga
    new LoadingBar(this);

    // 3. Cargar SOLO assets esenciales para la Intro/UI Global
    this.load.image('ui_btn_base', Assets.ui_btn_base);
    this.load.image('ui_btn_border', Assets.ui_btn_border);
    this.load.image('intro_title', Assets.intro_game_opt);

    // Música de intro (esencial para el menú)
    this.load.audio('intro_music', AudioAssets.intro);
    
    // NOTA: Los assets del juego ('apple', 'tree', etc.) se mueven a GameLoadingScene
  }

  create() {
    // Esperar a que las fuentes de Google se carguen antes de iniciar el juego
    // Esto evita que Phaser renderice texto con fuentes default y artifacts
    if (document.fonts) {
      document.fonts.ready.then(() => {
        this.scene.start('IntroScene');
      });
    } else {
      this.scene.start('IntroScene');
    }
  }
}
