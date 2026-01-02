import * as Phaser from 'phaser';
import { UI_CONFIG } from './UIConfig';

export class LoadingBar {
    private scene: Phaser.Scene;
    private progressBar: Phaser.GameObjects.Graphics;
    private loadingText: Phaser.GameObjects.Text;
    private percentText: Phaser.GameObjects.Text;
    private frameKey: string;
    private barWidth: number;
    private barHeight: number;
    private x: number;
    private y: number;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.barWidth = 500;
        this.barHeight = 60;
        
        const { width, height } = this.scene.scale;
        this.x = width / 2 - this.barWidth / 2;
        this.y = height / 2;

        this.frameKey = 'loading_bar_frame';
        this.createFrameTexture();

        this.progressBar = this.scene.add.graphics();
        
        // Crear elementos visuales
        this.scene.add.image(width / 2, this.y + this.barHeight / 2, this.frameKey);

        this.loadingText = this.scene.add.text(width / 2, this.y - 40, 'CARGANDO...', {
            fontFamily: UI_CONFIG.fontFamily,
            fontSize: '32px',
            color: UI_CONFIG.fontColor,
            stroke: UI_CONFIG.strokeColor,
            strokeThickness: 6,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.percentText = this.scene.add.text(width / 2, this.y + this.barHeight + 30, '0%', {
            fontFamily: UI_CONFIG.fontFamily,
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.setupEvents();
    }

    private createFrameTexture() {
        if (!this.scene.textures.exists(this.frameKey)) {
            const canvas = this.scene.textures.createCanvas(this.frameKey, this.barWidth, this.barHeight);
            if (canvas) {
                const ctx = canvas.getContext();
                const r = UI_CONFIG.buttonRadius;
                const pad = UI_CONFIG.dashedPadding;
                
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

                ctx.lineWidth = UI_CONFIG.dashedBorderWidth;
                ctx.strokeStyle = UI_CONFIG.dashedBorderColor;
                ctx.setLineDash([10, 6]);

                drawRoundedRect(ctx, pad, pad, this.barWidth - pad * 2, this.barHeight - pad * 2, r - 4);
                ctx.stroke();
                
                canvas.refresh();
            }
        }
    }

    private setupEvents() {
        this.scene.load.on('progress', (value: number) => {
            this.updateProgress(value);
        });
    }

    public updateProgress(value: number) {
        this.percentText.setText(parseInt((value * 100).toString()) + '%');
        
        this.progressBar.clear();
        this.progressBar.fillStyle(UI_CONFIG.buttonColor, 1);
        
        const pad = UI_CONFIG.dashedPadding;
        const w = (this.barWidth - pad * 2) * value;
        const h = this.barHeight - pad * 2;
        
        if (w > 0) {
            const r = UI_CONFIG.buttonRadius - 4;
            const effectiveR = Math.min(r, w/2, h/2);
            this.progressBar.fillRoundedRect(this.x + pad, this.y + pad, w, h, effectiveR);
        }
    }

    public destroy() {
        this.progressBar.destroy();
        this.loadingText.destroy();
        this.percentText.destroy();
    }
}
