import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { lazy, Suspense, useState } from 'react';
const IntroScene3D = lazy(() => import('./scenes/IntroScene3D').then(module => ({ default: module.IntroScene3D })));
const MainScene3D = lazy(() => import('./scenes/MainScene3D').then(module => ({ default: module.MainScene3D })));
import { Loader } from '@react-three/drei';

export const GameCanvas = () => {
    // Simple state machine: 'intro' | 'game'
    const [gameState, setGameState] = useState<'intro' | 'game'>('intro');

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <Canvas
                shadows
                camera={{ position: [0, 5, 10], fov: 50 }}
                style={{ width: '100vw', height: '100vh', background: '#87CEEB' }}
                onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <directionalLight
                        position={[10, 10, 5]}
                        intensity={1}
                        castShadow
                        shadow-mapSize={[1024, 1024]}
                    />

                    {gameState === 'intro' && (
                        <IntroScene3D onStart={() => setGameState('game')} />
                    )}

                    {gameState === 'game' && (
                        <Physics gravity={[0, -9.81, 0]}>
                            <MainScene3D onBack={() => setGameState('intro')} />
                        </Physics>
                    )}
                </Suspense>
            </Canvas>

            {/* Global UI Overlay (Standard HTML) */}
            {gameState === 'game' && (
                <div
                    onClick={() => setGameState('intro')}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        width: '54px',
                        height: '54px',
                        backgroundColor: '#FFB703',
                        border: '4px solid white',
                        borderRadius: '16px', // Rounded corners for a modern look
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                        userSelect: 'none',
                        zIndex: 1000,
                        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#4CAF50';
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFB703';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    {/* Home Icon SVG */}
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
                </div>
            )}
            <Loader />
        </div>
    );
};
