import * as Phaser from 'phaser';
import { UI_CONFIG } from './UIConfig';

export interface GameButtonConfig {
    x: number;
    y: number;
    width?: number;
    height?: number;
    color?: number; // Color del cuerpo del botón
    text: string;
    textConfig?: Phaser.Types.GameObjects.Text.TextStyle;
    onClick?: () => void;
}

export class GameButton extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Image;
    private label: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, config: GameButtonConfig) {
        super(scene, config.x, config.y);

        const width = config.width ?? 200;
        const height = config.height ?? 80;
        const color = config.color ?? UI_CONFIG.buttonColor;
        const colorHex = '#' + color.toString(16).padStart(6, '0');

        // Generar una clave única que incluya dimensiones y color para el cacheo
        const buttonKey = `btn_${width}_${height}_${color.toString(16)}`;

        if (!scene.textures.exists(buttonKey)) {
            // Sin márgenes ni sombras extras para un diseño más limpio
            const canvasWidth = width;
            const canvasHeight = height;

            const canvasTexture = scene.textures.createCanvas(buttonKey, canvasWidth, canvasHeight);
            if (canvasTexture) {
                const ctx = canvasTexture.getContext();
                const x = 0;
                const y = 0;

                const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
                    ctx.beginPath();
                    ctx.moveTo(x + r, y);
                    ctx.lineTo(x + w - r, y);
                    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                    ctx.lineTo(x + w, y + h - r);
                    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                    ctx.lineTo(x + r, y + h);
                    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                    ctx.lineTo(x, y + r);
                    ctx.quadraticCurveTo(x, y, x + r, y);
                    ctx.closePath();
                };

                // 1. Base (Cuerpo de color)
                ctx.fillStyle = colorHex;
                drawRoundedRect(ctx, x, y, width, height, UI_CONFIG.buttonRadius);
                ctx.fill();

                // 2. Brillos decorativos internos
                // Brillo superior derecha (Ajustado para estar dentro del borde dashed)
                const shinePadding = UI_CONFIG.dashedPadding + 8; // Padding del borde + un extra
                const shineRadius = Math.min(10, height * 0.1); // Escalar con la altura, max 10px
                const shineX = width - shinePadding - shineRadius;
                const shineY = shinePadding + shineRadius;

                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; // Un poco más visible
                ctx.beginPath();
                ctx.arc(shineX, shineY, shineRadius, 0, Math.PI * 2);
                ctx.fill();

                // 3. Borde decorativo dashed
                ctx.lineWidth = UI_CONFIG.dashedBorderWidth;
                ctx.strokeStyle = UI_CONFIG.dashedBorderColor;
                ctx.setLineDash([10, 6]);

                const padding = UI_CONFIG.dashedPadding;
                const bx = x + padding;
                const by = y + padding;
                const bw = width - (padding * 2);
                const bh = height - (padding * 2);
                const br = UI_CONFIG.buttonRadius - 4;

                drawRoundedRect(ctx, bx, by, bw, bh, br);
                ctx.stroke();

                canvasTexture.refresh();
            }
        }

        // Crear la imagen única del botón
        this.bg = scene.add.image(0, 0, buttonKey);
        this.bg.setInteractive({ useHandCursor: true });

        // Texto centralizado
        // Calcular grosor de borde proporcional (20% del tamaño de fuente) para evitar empaste en textos pequeños
        const fontSizeRaw = config.textConfig?.fontSize ?? '24px';
        const fontSize = parseInt(fontSizeRaw.toString());
        const dynamicStroke = Math.max(3, fontSize * 0.2); // Minimo 3px para legibilidad, ratio 0.2

        this.label = scene.add.text(0, 0, config.text, {
            fontFamily: UI_CONFIG.fontFamily,
            fontSize: fontSizeRaw,
            color: config.textConfig?.color ?? UI_CONFIG.fontColor,
            stroke: config.textConfig?.stroke ?? UI_CONFIG.strokeColor,
            strokeThickness: config.textConfig?.strokeThickness ?? dynamicStroke,
            align: 'center',
            fontStyle: '700', // Forzamos negrita para igualar al botón inicial
            padding: { top: 5, bottom: 5 }
        }).setOrigin(0.5);

        // Añadir solo 2 elementos al contenedor
        this.add([this.bg, this.label]);

        // Efectos de Feedback
        this.bg.on('pointerover', () => {
            if (this.scene) {
                this.setScale(1.04);
                this.bg.setTint(0xeeeeee); // Ligero oscurecimiento al pasar el mouse
            }
        });

        this.bg.on('pointerout', () => {
            if (this.scene) {
                this.setScale(1);
                this.bg.clearTint();
            }
        });

        this.bg.on('pointerdown', () => {
            if (this.scene) {
                this.setScale(0.98);
                if (config.onClick) config.onClick();
            }
        });

        this.bg.on('pointerup', () => {
            if (this.scene) {
                this.setScale(1.04);
            }
        });

        scene.add.existing(this);
    }
    setText(text: string) {
        this.label.setText(text);
    }
}
