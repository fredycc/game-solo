import * as Phaser from 'phaser';
import { Assets } from '../../assets/images';
import { AudioAssets } from '../../audio';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.image('apple', Assets.apple);
    this.load.image('tree', Assets.tree);
    this.load.image('cloud', Assets.cloud);
    this.load.image('crosshair', Assets.crosshair);
    this.load.image('ui_btn_base', Assets.ui_btn_base);
    this.load.image('ui_btn_border', Assets.ui_btn_border);
    this.load.image('intro_title', Assets.intro_game_opt);

    this.load.audio('intro_music', AudioAssets.intro);
    this.load.audio('game_music', AudioAssets.music_1);
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
