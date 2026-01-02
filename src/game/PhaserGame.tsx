import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { IntroScene } from './scenes/IntroScene';
import { MainScene } from './scenes/MainScene';
import { connectionManager } from './ConnectionManager';

export const PhaserGame = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const resumeAudioIfNeeded = () => {
      const game = gameRef.current;
      if (game) {
        const soundManager = game.sound as unknown as { context?: AudioContext };
        if (soundManager.context?.state === 'suspended') {
          soundManager.context.resume().catch(() => { });
        }
      }
    };

    const requestFullscreenIfPossible = () => {
      if (document.fullscreenElement) return;
      const userActivation = navigator.userActivation;
      if (userActivation && !userActivation.isActive) return;
      const root = document.getElementById('game-root');
      const target = root ?? document.documentElement;
      const p = target.requestFullscreen?.();
      if (p) p.catch(() => { });
    };

    const onUserGesture = () => {
      resumeAudioIfNeeded();
      requestFullscreenIfPossible();
    };

    const onRemoteInteraction = () => {
      resumeAudioIfNeeded();
    };

    window.addEventListener('click', onUserGesture);
    window.addEventListener('keydown', onUserGesture);
    window.addEventListener('remote-interaction', onRemoteInteraction);

    const handleUnload = () => {
      connectionManager.disconnect();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (gameRef.current) {
        window.removeEventListener('click', onUserGesture);
        window.removeEventListener('keydown', onUserGesture);
        window.removeEventListener('remote-interaction', onRemoteInteraction);
        window.removeEventListener('beforeunload', handleUnload);
        handleUnload();
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const createGameIfNeeded = () => {
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
        height: '100%',
        fullscreenTarget: 'game-root'
      },
      scene: [BootScene, IntroScene, MainScene]
    };

    gameRef.current = new Phaser.Game(config);
  };

  const requestFullscreen = () => {
    if (document.fullscreenElement) return;
    const root = document.getElementById('game-root');
    const target = root ?? document.documentElement;
    const p = target.requestFullscreen?.();
    if (p) p.catch(() => { });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div id="phaser-container" style={{ width: '100vw', height: '100vh' }} />
      {!started && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#87CEEB',
            color: '#1a1a1a',
            fontFamily: 'Arial Black, sans-serif',
            userSelect: 'none'
          }}
        >
          <button
            type="button"
            onClick={() => {
              requestFullscreen();
              createGameIfNeeded();
              setStarted(true);
            }}
            style={{
              padding: '18px 26px',
              borderRadius: '18px',
              border: 'none',
              background: '#FFD700',
              color: '#1a1a1a',
              fontSize: '20px',
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            TOCA PARA INICIAR
          </button>
        </div>
      )}
    </div>
  );
};
