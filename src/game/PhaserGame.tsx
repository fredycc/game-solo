import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { IntroScene } from './scenes/IntroScene';
import { MainScene } from './scenes/MainScene';

export const PhaserGame = () => {
  const gameRef = useRef<any>(null);

  useEffect(() => {
    if (gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#87CEEB',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 300 },
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
      },
      scene: [BootScene, IntroScene, MainScene]
    };

    gameRef.current = new Phaser.Game(config);

    const resumeAudio = () => {
      if (gameRef.current && gameRef.current.sound.context.state === 'suspended') {
        gameRef.current.sound.context.resume();
      }
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
    };

    window.addEventListener('click', resumeAudio);
    window.addEventListener('keydown', resumeAudio);

    return () => {
      if (gameRef.current) {
        window.removeEventListener('click', resumeAudio);
        window.removeEventListener('keydown', resumeAudio);
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return <div id="phaser-container" style={{ width: '100vw', height: '100vh' }} />;
};
