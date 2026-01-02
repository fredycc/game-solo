import * as Phaser from 'phaser';
import { Assets } from '../../assets/images';
import { AudioAssets } from '../../audio';
import { LoadingBar } from '../ui/LoadingBar';

export class GameLoadingScene extends Phaser.Scene {
    constructor() {
        super('GameLoadingScene');
    }

    preload() {
        // 1. Fondo consistente
        const { width, height } = this.scale;
        this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0);

        // 2. Usar el componente de barra de carga
        new LoadingBar(this);

        // 3. Cargar assets ESPECÍFICOS del juego
        this.load.image('apple', Assets.apple);
        this.load.image('tree', Assets.tree);
        this.load.image('cloud', Assets.cloud);
        this.load.image('crosshair', Assets.crosshair);
        
        // Música del juego
        this.load.audio('game_music', AudioAssets.music_1);
    }

    create() {
        // Una vez cargado todo, iniciamos la escena principal
        this.scene.start('MainScene');
    }
}
