import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { lazy, Suspense, useState } from 'react';
const MainScene3D = lazy(() => import('./scenes/MainScene3D').then(module => ({ default: module.MainScene3D })));
import { Loader, AdaptiveDpr } from '@react-three/drei';
import { RemotePointer } from './components/RemotePointer';
import { BackgroundMusic } from './components/BackgroundMusic';
import { IntroUI } from '../components/IntroUI';

const HOME_BTN_STYLE: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '54px',
    height: '54px',
    backgroundColor: '#FFB703',
    border: '4px solid white',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'white',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
    userSelect: 'none',
    zIndex: 1000,
    padding: 0,
    transition: 'background-color 0.2s ease, transform 0.2s ease',
};

export const GameCanvas = () => {
    // Simple state machine: 'intro' | 'game'
    const [gameState, setGameState] = useState<'intro' | 'game'>('intro');

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {/* Intro UI Overlay (2D HTML) */}
            {gameState === 'intro' && (
                <IntroUI onStart={() => setGameState('game')} />
            )}

            <Canvas
                shadows
                frameloop="demand"
                dpr={[1, 1.5]}
                performance={{ min: 0.5, max: 1, debounce: 200 }}
                gl={{ powerPreference: 'high-performance' }}
                camera={{ position: [0, 5, 10], fov: 50 }}
                style={{ width: '100vw', height: '100vh', background: '#87CEEB' }}
                onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
            >
                <AdaptiveDpr pixelated />
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <directionalLight
                        position={[10, 10, 5]}
                        intensity={1}
                        castShadow
                        shadow-mapSize={[512, 512]}
                    />

                    {gameState === 'game' && (
                        <Physics 
                            gravity={[0, -9.81, 0]}
                            updateLoop="independent"
                            interpolate={true}
                        >
                            <MainScene3D />
                        </Physics>
                    )}

                    <RemotePointer />
                </Suspense>
            </Canvas>

            <BackgroundMusic mode={gameState} />

            {/* Global UI Overlay (Standard HTML) */}
            <style>{`
                #home-btn:hover, #home-btn:focus { background-color: #4CAF50 !important; transform: scale(1.1); }
                #home-btn:active { transform: scale(0.97); }
            `}</style>
            {gameState === 'game' && (
                <button
                    id="home-btn"
                    data-remote-clickable="true"
                    onClick={() => setGameState('intro')}
                    style={HOME_BTN_STYLE}
                >
                    <svg
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                </button>
            )}
            <Loader />
        </div>
    );
};
