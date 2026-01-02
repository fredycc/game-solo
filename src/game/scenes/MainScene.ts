import { audioManager } from '../AudioManager';
import { connectionManager } from '../ConnectionManager';
import { RemoteCursor } from '../RemoteCursor';

/**
 * MainScene Refactor: Lógica centralizada y clara.
 * Se han extraído métodos para creación de objetos y gestión de redimensionamiento.
 */
export class MainScene extends Phaser.Scene {
  // Miembros de clase
  private remoteCursor!: RemoteCursor;
  private eventUnsubscribe: (() => void) | null = null;
  private resizeHandler: ((gameSize: Phaser.Structs.Size) => void) | null = null;
  private tree!: Phaser.GameObjects.Container;
  private apples!: Phaser.Physics.Arcade.Group;
  private ground!: Phaser.GameObjects.Rectangle;
  private clouds!: Phaser.GameObjects.Group;
  private crosshair!: Phaser.GameObjects.Sprite;
  private backBtnContainer!: Phaser.GameObjects.Container;

  // Constantes de diseño
  private readonly GROUND_HEIGHT = 100;
  private readonly TREE_HEIGHT_OFFSET = 140;
  private readonly CROSSHAIR_HEIGHT_OFFSET = 180;

  constructor() {
    super('MainScene');
  }

  create() {
    this.remoteCursor = new RemoteCursor(this);

    // Cleanup helper
    const cleanup = () => {
      this.remoteCursor.destroy();
      this.eventUnsubscribe?.();
      if (this.resizeHandler) {
        this.scale.off('resize', this.resizeHandler);
        this.resizeHandler = null;
      }
    };

    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);

    window.dispatchEvent(new CustomEvent('phaser-scene-change', { detail: { scene: 'MainScene' } }));
    const { width, height } = this.scale;

    const soundManager = this.sound as unknown as { context?: AudioContext };
    if (soundManager.context?.state === 'suspended') {
      soundManager.context.resume().catch(() => { });
    }

    // ... rest of the layers ...
    this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0);
    this.createGround(width, height);
    this.createClouds(width);

    // ... elements ...
    this.createTree(width, height);
    this.createApplesGroup();
    this.createCrosshair(width, height);
    this.createBackButton(width);

    // ... system ...
    this.setupInput();
    this.setupCollisions();
    this.setupResizeListener();

    // 6. Audio inicial (Ensured)
    this.sound.stopAll(); // Ensure clean slate
    this.sound.play('game_music', { loop: true, volume: 0.4 });

    // 7. Eventos de Control Remoto (Pro)
    this.eventUnsubscribe = connectionManager.subscribeEvents((event) => {
      // Validar que la escena esté activa antes de procesar eventos
      if (!this.scene.isActive('MainScene')) return;

      if (event.type === 'action' && event.action === 'DROP') {
        this.spawnApple();
      }
    });
  }

  /* --- MÉTODOS DE CREACIÓN --- */

  private createGround(width: number, height: number) {
    this.ground = this.add.rectangle(
      width / 2,
      height - this.GROUND_HEIGHT / 2,
      width,
      this.GROUND_HEIGHT,
      0x4CAF50
    );
    this.physics.add.existing(this.ground, true);
  }

  private createClouds(width: number) {
    this.clouds = this.add.group();
    for (let i = 0; i < 4; i++) {
      this.spawnCloud(Phaser.Math.Between(0, width), Phaser.Math.Between(50, 200), Phaser.Math.FloatBetween(0.8, 1.2));
    }
  }

  private createTree(width: number, height: number) {
    this.tree = this.add.container(width / 2, height - this.GROUND_HEIGHT - this.TREE_HEIGHT_OFFSET);
    const sprite = this.add.sprite(0, 0, 'tree');
    this.tree.add(sprite);
    this.tree.setSize(200, 300);

    this.startTreeAnimation(width);
  }

  private createApplesGroup() {
    this.apples = this.physics.add.group({
      defaultKey: 'apple',
      bounceY: 0.3,
      gravityY: 300
    });
  }

  private createCrosshair(width: number, height: number) {
    this.crosshair = this.add.sprite(width / 2, height / 2, 'crosshair').setDepth(10);
    this.startCrosshairAnimation(width, height);
  }

  private createBackButton(width: number) {
    // SAFE AREA: Margen superior para evitar cortes en TV/Navegadores
    this.backBtnContainer = this.add.container(width - 110, 80);
    const bg = this.add.image(0, 0, 'back_btn').setInteractive({ useHandCursor: true });
    const text = this.add.text(15, -2, 'INICIO', {
      fontFamily: 'Arial Black',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.backBtnContainer.add([bg, text]);

    bg.on('pointerover', () => {
      this.backBtnContainer.setScale(1.1);
      bg.setTint(0xfffb00);
    });

    bg.on('pointerout', () => {
      this.backBtnContainer.setScale(1);
      bg.clearTint();
    });

    bg.on('pointerdown', () => {
      this.sound.stopAll();
      this.scene.start('IntroScene');
    });
  }

  /* --- ANIMACIONES --- */

  private startTreeAnimation(width: number) {
    this.tweens.killTweensOf(this.tree);
    this.tweens.add({
      targets: this.tree,
      x: { from: 100, to: width - 100 },
      duration: 3000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  private startCrosshairAnimation(width: number, height: number) {
    this.tweens.killTweensOf(this.crosshair);
    const treeTop = height - this.GROUND_HEIGHT - this.CROSSHAIR_HEIGHT_OFFSET;

    // Horizontal
    this.tweens.add({
      targets: this.crosshair,
      x: { from: 50, to: width - 50 },
      duration: 4000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // Vertical
    this.tweens.add({
      targets: this.crosshair,
      y: { from: treeTop - 60, to: treeTop + 60 },
      duration: 2500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  /* --- LÓGICA DE JUEGO --- */

  private setupInput() {
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ENTER', (e: KeyboardEvent) => {
        if (!e.repeat) this.spawnApple();
      });
    }
    this.input.on('pointerdown', () => this.spawnApple());
  }

  private setupCollisions() {
    this.physics.add.collider(this.apples, this.ground, (obj1: unknown, obj2: unknown) => {
      const resolved1 =
        obj1 && typeof obj1 === 'object' && 'gameObject' in obj1
          ? (obj1 as { gameObject?: unknown }).gameObject ?? obj1
          : obj1;
      const resolved2 =
        obj2 && typeof obj2 === 'object' && 'gameObject' in obj2
          ? (obj2 as { gameObject?: unknown }).gameObject ?? obj2
          : obj2;

      const apple = ((resolved1 === this.ground) ? resolved2 : resolved1) as Phaser.Physics.Arcade.Sprite;
      if (apple.getData('landed')) return;

      audioManager.playThudSound();
      apple.setData('landed', true);

      if (apple.body) {
        const body = apple.body as Phaser.Physics.Arcade.Body;
        body.velocity.set(0, 0);
        body.angularVelocity = 0;
        body.stop();
        body.enable = false;
      }

      this.tweens.add({
        targets: apple,
        alpha: 0,
        duration: 1000,
        delay: 4000,
        onComplete: () => { if (apple.active) apple.destroy(); }
      });
    });
  }

  private setupResizeListener() {
    if (this.resizeHandler) {
      this.scale.off('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    this.resizeHandler = (gameSize: Phaser.Structs.Size) => {
      if (!this.scene.isActive('MainScene')) return;
      if (!this.ground || !this.tree || !this.crosshair || !this.backBtnContainer || !this.apples) return;
      const applesGroup = this.apples as unknown as { children?: unknown };
      if (!applesGroup.children) return;

      const { width, height } = gameSize;

      // Actualizar suelo
      this.ground.width = width;
      this.ground.x = width / 2;
      this.ground.y = height - this.GROUND_HEIGHT / 2;
      if (this.ground.body) {
        const body = this.ground.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(width, this.GROUND_HEIGHT);
        body.updateFromGameObject();
      }

      // Reposicionar elementos y reiniciar animaciones
      if (this.tree) {
        this.tree.x = width / 2;
        this.tree.y = height - this.GROUND_HEIGHT - this.TREE_HEIGHT_OFFSET;
        this.startTreeAnimation(width);
      }

      if (this.crosshair) {
        this.startCrosshairAnimation(width, height);
      }

      if (this.backBtnContainer) {
        // SAFE AREA: Mantenemos más margen para TVs y barras de navegador
        this.backBtnContainer.x = width - 110;
        this.backBtnContainer.y = 80;
      }

      // Limpiar manzanas viejas para evitar "fantmas" al redimensionar
      this.apples.getChildren().forEach((child: Phaser.GameObjects.GameObject) => {
        const apple = child as Phaser.Physics.Arcade.Sprite;
        if (apple.getData('landed')) apple.destroy();
      });
    };

    this.scale.on('resize', this.resizeHandler);
  }

  private spawnApple() {
    const treeX = this.tree.x;
    const treeY = this.tree.y - 10;
    const dist = Phaser.Math.Distance.Between(this.crosshair.x, this.crosshair.y, treeX, treeY);

    if (dist <= 80) {
      const relX = this.crosshair.x - this.tree.x;
      const relY = this.crosshair.y - this.tree.y;
      const apple = this.add.sprite(relX, relY, 'apple');
      this.tree.add(apple);
      audioManager.playSpawnSound();
    } else {
      const apple = this.apples.create(this.crosshair.x, this.crosshair.y, 'apple');
      apple.body.setCircle(13, 3, 3);
      apple.setVelocity(0, 100);
      audioManager.playSpawnSound();
    }
  }

  private spawnCloud(x: number, y: number, scale: number) {
    const cloud = this.add.sprite(x, y, 'cloud').setScale(scale).setAlpha(0.9);
    this.clouds.add(cloud);

    this.tweens.add({
      targets: cloud,
      x: -150,
      duration: ((x + 150) / 50) * 1000,
      ease: 'Linear',
      onComplete: () => {
        cloud.x = this.scale.width + 150;
        this.moveCloud(cloud);
      }
    });
  }

  private moveCloud(cloud: Phaser.GameObjects.Sprite) {
    // Nubes más abajo para no estorbar la UI superior (SAFE ZONE)
    cloud.y = Phaser.Math.Between(120, 250);
    this.tweens.add({
      targets: cloud,
      x: -150,
      duration: Phaser.Math.Between(20000, 30000),
      ease: 'Linear',
      onComplete: () => {
        cloud.x = this.scale.width + 150;
        this.moveCloud(cloud);
      }
    });
  }
}
