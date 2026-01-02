import { connectionManager } from './ConnectionManager';

export class RemoteCursor {
    private scene: Phaser.Scene;
    private cursor: Phaser.GameObjects.Container;
    private x: number;
    private y: number;
    private hoveredObject: Phaser.GameObjects.GameObject | null = null;
    private unsubscribe: (() => void) | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.x = scene.scale.width / 2;
        this.y = scene.scale.height / 2;

        // Create a fun, child-friendly colorful cursor (like a yellow cartoon hand or star)
        this.cursor = scene.add.container(this.x, this.y).setDepth(100000);

        // Glow effect
        const glow = scene.add.circle(0, 0, 15, 0xFFFF00, 0.3);

        // Main pointer body (Cartoonish Glove/Circle)
        const body = scene.add.circle(0, 0, 10, 0xFFD700); // Golden Yellow
        const border = scene.add.circle(0, 0, 10).setStrokeStyle(3, 0xFF8C00); // Dark Orange Border

        // Inner detail
        const shine = scene.add.circle(-3, -3, 3, 0xFFFFFF, 0.8);

        this.cursor.add([glow, body, border, shine]);

        // Add a fun pulsing animation
        scene.tweens.add({
            targets: glow,
            scale: 1.5,
            alpha: 0.1,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        this.setupListeners();
    }

    private setupListeners() {
        this.unsubscribe = connectionManager.subscribeEvents((event) => {
            // Priority: Always process movement and clicks if scene is active
            if (!this.scene.scene.isActive(this.scene.scene.key)) return;

            if (event.type === 'move') {
                this.updatePosition(event.dx, event.dy);
            } else if (event.type === 'action' && event.action === 'TAP_CLICK') {
                this.simulateClick();
            }
        });
    }

    private updatePosition(dx: number, dy: number) {
        this.x = Phaser.Math.Clamp(this.x + dx, 0, this.scene.scale.width);
        this.y = Phaser.Math.Clamp(this.y + dy, 0, this.scene.scale.height);

        this.cursor.setPosition(this.x, this.y);

        // Hover logic
        const hitObjects = this.scene.input.hitTestPointer({ x: this.x, y: this.y } as Phaser.Input.Pointer);
        const topObject = hitObjects.length > 0 ? hitObjects[0] : null;

        if (topObject !== this.hoveredObject) {
            if (this.hoveredObject) {
                this.hoveredObject.emit('pointerout');
            }
            this.hoveredObject = topObject;
            if (this.hoveredObject) {
                this.hoveredObject.emit('pointerover');
            }
        }
    }

    private simulateClick() {
        // 0. Dispatch global event for audio/fullscreen activation
        window.dispatchEvent(new CustomEvent('remote-interaction'));

        // 1. Visual feedback for the click
        this.scene.tweens.add({
            targets: this.cursor,
            scale: 0.8,
            duration: 50,
            yoyo: true
        });

        // 2. Find interactive objects at this position
        const interactiveObjects = this.scene.input.hitTestPointer({
            x: this.x,
            y: this.y
        } as Phaser.Input.Pointer);

        if (interactiveObjects.length > 0) {
            // Trigger pointerdown on the topmost object
            const topObject = interactiveObjects[0];
            topObject.emit('pointerdown', {
                pointer: { x: this.x, y: this.y },
                x: this.x,
                y: this.y,
                downX: this.x,
                downY: this.y,
                event: { stopPropagation: () => { } }
            });

            // Also emit pointerup as many Phaser buttons trigger on 'pointerup' or just need both
            this.scene.time.delayedCall(50, () => {
                topObject.emit('pointerup', {
                    pointer: { x: this.x, y: this.y },
                    x: this.x,
                    y: this.y
                });
            });
        }
    }

    destroy() {
        this.unsubscribe?.();
        this.cursor.destroy();
    }
}
