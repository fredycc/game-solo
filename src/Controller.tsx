import { useState, useEffect } from 'react';
import { connectionManager } from './game/ConnectionManager';
import type { ConnectionState } from './game/ConnectionManager';

export const Controller = () => {
    const [state, setState] = useState<ConnectionState>('disconnected');
    const [gameId] = useState(() => new URLSearchParams(window.location.search).get('gameId') ?? '');
    const [connType, setConnType] = useState<'P2P' | 'SERVER' | 'NONE'>('NONE');

    useEffect(() => {
        if (gameId) {
            const isDev = import.meta.env.DEV;
            const serverUrl = isDev
                ? `http://${window.location.hostname}:3005`
                : window.location.origin;

            console.log(`[Controller] Connecting to: ${serverUrl}`);
            connectionManager.connectAsController(serverUrl, gameId);
        }

        const unsubscribe = connectionManager.subscribeState((newState) => {
            setState(newState);
            setConnType(connectionManager.getConnectionType());
        });

        const interval = setInterval(() => {
            setConnType(connectionManager.getConnectionType());
        }, 1000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [gameId]);

    const [touchStartPos, setTouchStartPos] = useState<{ x: number, y: number } | null>(null);
    const [lastTouch, setLastTouch] = useState<{ x: number, y: number } | null>(null);
    const [isMoving, setIsMoving] = useState(false);

    const sendAction = (action: string) => {
        connectionManager.sendEvent({ type: 'action', action });
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setTouchStartPos({ x: touch.clientX, y: touch.clientY });
        setLastTouch({ x: touch.clientX, y: touch.clientY });
        setIsMoving(false);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        if (lastTouch) {
            const dx = touch.clientX - lastTouch.x;
            const dy = touch.clientY - lastTouch.y;

            // If we moved more than a tiny bit, it's a move, not a potential tap
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                setIsMoving(true);
            }

            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                connectionManager.sendEvent({ type: 'move', dx: dx * 2.5, dy: dy * 2.5 });
            }
        }
        setLastTouch({ x: touch.clientX, y: touch.clientY });
    };

    const handleTouchEnd = () => {
        if (!isMoving && touchStartPos) {
            // It was a TAP!
            sendAction('TAP_CLICK');
            if ('vibrate' in navigator) navigator.vibrate(50);
        }
        setLastTouch(null);
        setTouchStartPos(null);
        setIsMoving(false);
    };

    if (state === 'disconnected') {
        return (
            <div style={{ height: '100vh', background: '#FFD700', color: '#1a1a1a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center', fontFamily: 'Arial Black' }}>
                <h2 style={{ fontSize: '32px' }}>Oops!</h2>
                <p>Please scan the code again!</p>
            </div>
        );
    }

    if (state === 'signaling') {
        return (
            <div style={{ height: '100vh', background: '#4CAF50', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'Arial Black' }}>
                <div style={{
                    border: '8px solid rgba(255,255,255,0.3)',
                    borderTop: '8px solid white',
                    borderRadius: '50%',
                    width: '80px',
                    height: '80px',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '20px'
                }} />
                <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
                <h2>HELLO!</h2>
                <p>Joining the fun...</p>
            </div>
        );
    }

    return (
        <div style={{
            height: '100vh',
            background: '#87CEEB', // Sky Blue
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            userSelect: 'none',
            touchAction: 'none',
            overflow: 'hidden',
            fontFamily: 'Fredoka, sans-serif'
        }}>
            {/* Header */}
            <div style={{ padding: '15px', background: '#4CAF50', borderBottom: '5px solid #388E3C', borderRadius: '0 0 20px 20px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', textShadow: '2px 2px 0px #388E3C' }}>PRO GAMEPAD</h2>
                    <div style={{ fontSize: '10px', display: 'flex', gap: '5px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: connType === 'P2P' ? '#4CAF50' : '#888', border: '2px solid white' }} title="P2P" />
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: connType === 'SERVER' ? '#2196F3' : '#888', border: '2px solid white' }} title="Relay" />
                    </div>
                </div>
            </div>

            {/* Trackpad Area */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    flex: 1,
                    margin: '15px',
                    borderRadius: '30px',
                    background: 'white',
                    border: '5px solid #FFD700',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)'
                }}
            >
                <div style={{ opacity: 0.4, textAlign: 'center', pointerEvents: 'none', color: '#333' }}>
                    <div style={{ fontSize: '60px', marginBottom: '10px', animation: 'float 3s ease-in-out infinite' }}>�</div>
                    <style>{`
                        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                    `}</style>
                    <div style={{ fontSize: '14px' }}>MOVE & TAP!</div>
                </div>
            </div>

            {/* Big Action Button */}
            <div style={{ padding: '0 20px 40px 20px', display: 'flex', justifyContent: 'center' }}>
                <button
                    onPointerDown={() => sendAction('DROP')}
                    style={{
                        width: '100%',
                        height: '100px',
                        borderRadius: '30px',
                        background: '#FFB703',
                        border: '4px dashed white',
                        color: 'white',
                        fontSize: '38px',
                        fontWeight: '700',
                        fontFamily: 'Fredoka, sans-serif',
                        letterSpacing: '2px',
                        textShadow: `
                            -1.5px -1.5px 0 #000,
                             1.5px -1.5px 0 #000,
                            -1.5px  1.5px 0 #000,
                             1.5px  1.5px 0 #000
                        `,
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                        transform: 'translateY(0)',
                        transition: 'all 0.1s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box'
                    }}
                    onPointerUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                    DROP!
                </button>
            </div>

            <div style={{ padding: '10px', textAlign: 'center', color: '#388E3C', fontSize: '10px', opacity: 0.6 }}>
                CODE: {gameId}
            </div>
        </div>
    );
};
