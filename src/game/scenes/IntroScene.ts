import * as Phaser from 'phaser';

/**
 * IntroScene Refactor: Menú de selección de juegos y gestión de inicio (Audio/Fullscreen).
 */
export class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  create() {
    window.dispatchEvent(new CustomEvent('phaser-scene-change', { detail: { scene: 'IntroScene' } }));
    const { width, height } = this.scale;

    // 1. Fondo
    this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0);

    // 2. Gestión de Inicio (Audio y Pantalla Completa)
    this.setupStartHandlers();

    // 3. Título de la sección
    this.createHeader(width);

    // 4. Botones de Selección de Juego (Escalable)
    this.createGameButton(
      width / 2,
      height * 0.45,
      'Apple Tree Game',
      'MainScene'
    );

    // 5. Instrucciones secundarias
    this.createFooterInstructions(width, height);
  }

  private setupStartHandlers() {
    const onFirstInteraction = () => {
      // Activar pantalla completa
      if (!this.scale.isFullscreen) {
        this.scale.startFullscreen();
      }

      // Activar audio
      if (!this.sound.locked) {
        const intro = this.sound.get('intro_music');
        if (!intro || !intro.isPlaying) {
          this.sound.play('intro_music', { loop: true, volume: 0.5 });
        }
      }

      // Limpiar escuchadores una vez activado
      this.input.off('pointerdown', onFirstInteraction);
      if (this.input.keyboard) {
        this.input.keyboard.off('keydown', onFirstInteraction);
      }
    };

    this.input.on('pointerdown', onFirstInteraction);
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown', onFirstInteraction);
    }
  }

  private createHeader(width: number) {
    this.add.text(width / 2, 80, 'GAMES', {
      fontFamily: 'Arial Black',
      fontSize: '80px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 10,
    }).setOrigin(0.5);
  }

  private createGameButton(x: number, y: number, label: number | string, sceneKey: string) {
    const container = this.add.container(x, y);
    const bg = this.add.image(0, 0, 'game_btn').setInteractive({ useHandCursor: true });

    const text = this.add.text(0, -5, label.toString(), {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center'
    }).setOrigin(0.5);

    container.add([bg, text]);

    // Efectos de Feedback
    bg.on('pointerover', () => {
      container.setScale(1.05);
      bg.setTint(0xbbdefb);
    });

    bg.on('pointerout', () => {
      container.setScale(1);
      bg.clearTint();
    });

    // Acción de inicio
    const startGame = () => {
      this.sound.stopAll();
      this.scene.start(sceneKey);
    };

    bg.on('pointerdown', startGame);

    // Soporte para tecla Enter si solo hay un juego o es el seleccionado
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ENTER', startGame);
    }
  }

  private createFooterInstructions(width: number, height: number) {
    const startText = this.add.text(width / 2, height * 0.85, 'Press ENTER or Click to Play', {
      fontFamily: 'Arial',
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
