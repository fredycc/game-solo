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
    this.load.image('back_btn', Assets.back_btn);
    this.load.image('game_btn', Assets.game_btn);

    this.load.audio('intro_music', AudioAssets.intro_1);
    this.load.audio('game_music', AudioAssets.music_2);
  }

  create() {
    this.scene.start('IntroScene');
  }
}
