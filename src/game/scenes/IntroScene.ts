import * as Phaser from 'phaser';
import { RemoteCursor } from '../RemoteCursor';
import { GameButton } from '../ui/GameButton';

/**
 * IntroScene Refactor: Menú de selección de juegos y gestión de inicio (Audio/Fullscreen).
 */
export class IntroScene extends Phaser.Scene {
  private remoteCursor!: RemoteCursor;

  constructor() {
    super('IntroScene');
  }

  create() {
    this.remoteCursor = new RemoteCursor(this);
    this.events.once('shutdown', () => this.remoteCursor.destroy());
    this.events.once('destroy', () => this.remoteCursor.destroy());
    window.dispatchEvent(new CustomEvent('phaser-scene-change', { detail: { scene: 'IntroScene' } }));
    const { width, height } = this.scale;

    // 1. Fondo
    this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0);

    // 2. Gestión de Inicio (Audio y Pantalla Completa)
    this.setupStartHandlers();
    if (!this.sound.locked) {
      const intro = this.sound.get('intro_music');
      if (!intro || !intro.isPlaying) {
        this.sound.play('intro_music', { loop: true, volume: 0.5 });
      }
    }

    // Definición de Área Segura (Safe Area) para TV/Móvil
    const safeTop = Math.max(120, height * 0.18); // 18% superior o 120px
    const safeBottom = Math.max(100, height * 0.15); // 15% inferior o 100px
    const centerY = height / 2;

    // 3. Título de la sección
    this.createHeader(width, safeTop);

    // 4. Botones de Selección de Juego (Escalable)
    this.createGameButton(
      width / 2,
      centerY,
      'Apple Tree Game',
      'MainScene'
    );

    // 5. Instrucciones secundarias
    this.createFooterInstructions(width, height - safeBottom);
  }

  private setupStartHandlers() {
    const startIntroMusic = () => {
      if (!this.sound.locked) {
        const intro = this.sound.get('intro_music');
        if (!intro || !intro.isPlaying) {
          this.sound.play('intro_music', { loop: true, volume: 0.5 });
        }
      }
    };

    const onFirstUserGesture = () => {
      startIntroMusic();

      this.input.off('pointerdown', onFirstUserGesture);
      if (this.input.keyboard) {
        this.input.keyboard.off('keydown', onFirstUserGesture);
      }
    };

    this.input.on('pointerdown', onFirstUserGesture);
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown', onFirstUserGesture);
    }
  }

  private createHeader(width: number, y: number) {
    this.add.text(width / 2, y, 'GAMES', {
      fontFamily: 'Fredoka',
      fontSize: '80px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 10,
    }).setOrigin(0.5);
  }

  private createGameButton(x: number, y: number, label: number | string, sceneKey: string) {
    // Acción de inicio
    const startGame = () => {
      this.sound.stopAll();
      this.scene.start(sceneKey);
    };

    new GameButton(this, {
      x,
      y,
      width: 500,
      height: 120,
      text: label.toString(),
      textConfig: {
        fontSize: '48px'
      },
      onClick: startGame
    });

    // Soporte para tecla Enter si solo hay un juego o es el seleccionado
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ENTER', startGame);
    }
  }

  private createFooterInstructions(width: number, y: number) {
    const startText = this.add.text(width / 2, y, 'Press ENTER or Click to Play', {
      fontFamily: 'Fredoka',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }
}
