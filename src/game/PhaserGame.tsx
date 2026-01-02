import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { IntroScene } from './scenes/IntroScene';
import { GameLoadingScene } from './scenes/GameLoadingScene';
import { MainScene } from './scenes/MainScene';
import { connectionManager } from './ConnectionManager';
import { wakeLockManager } from './WakeLockManager';

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
      wakeLockManager.requestWakeLock();
    };

    const onRemoteInteraction = () => {
      resumeAudioIfNeeded();
      wakeLockManager.requestWakeLock();
    };

    window.addEventListener('click', onUserGesture);
    window.addEventListener('keydown', onUserGesture);
    window.addEventListener('remote-interaction', onRemoteInteraction);

    const handleUnload = () => {
      connectionManager.disconnect();
      wakeLockManager.releaseWakeLock();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (gameRef.current) {
        window.removeEventListener('click', onUserGesture);
        window.removeEventListener('keydown', onUserGesture);
        window.removeEventListener('remote-interaction', onRemoteInteraction);
        window.removeEventListener('beforeunload', handleUnload);
        handleUnload();
        wakeLockManager.cleanup();
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
      scene: [BootScene, IntroScene, GameLoadingScene, MainScene]
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
            fontFamily: "Fredoka, sans-serif",
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
              position: 'relative',
              padding: '0',
              width: '500px',
              height: '120px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Cuerpo Amarillo */}
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '110px',
              borderRadius: '30px',
              backgroundColor: '#FFB703',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Borde Punteado */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                right: '10px',
                bottom: '10px',
                border: '4px dashed white',
                borderRadius: '20px',
                pointerEvents: 'none'
              }} />

              <span style={{
                fontFamily: "Fredoka, sans-serif",
                fontSize: '44px',
                fontWeight: '700',
                color: '#FFFFFF',
                letterSpacing: '2px', // Añadido espaciado entre letras
                // Usamos text-shadow más fino (2px en lugar de 3px)
                textShadow: `
                  -2px -2px 0 #000,
                   2px -2px 0 #000,
                  -2px  2px 0 #000,
                   2px  2px 0 #000,
                   0px  4px 0px rgba(0,0,0,0.2)
                `,
                zIndex: 1
              }}>TOCA PARA INICIAR</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
