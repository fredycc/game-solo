import { useState, useEffect } from 'react';
import { connectionManager } from './game/ConnectionManager';
import type { ConnectionState } from './game/ConnectionManager';

export const Controller = () => {
    const [state, setState] = useState<ConnectionState>('disconnected');
    const [gameId, setGameId] = useState('');
    const [connType, setConnType] = useState<'P2P' | 'SERVER' | 'NONE'>('NONE');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('gameId');
        if (id) {
            setGameId(id);
            const isDev = import.meta.env.DEV;
            const serverUrl = isDev
                ? `http://${window.location.hostname}:3005`
                : window.location.origin;

            console.log(`[Controller] Connecting to: ${serverUrl}`);
            connectionManager.connectAsController(serverUrl, id);
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
    }, []);

    const sendAction = (action: string) => {
        connectionManager.sendEvent({ type: 'action', action });
    };

    if (state === 'disconnected') {
        return (
            <div style={{ height: '100vh', background: '#1a1a1a', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center' }}>
                <h2>No Game ID Found</h2>
                <p>Please scan the QR code from the game menu.</p>
            </div>
        );
    }

    if (state === 'signaling') {
        return (
            <div style={{ height: '100vh', background: '#1a1a1a', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #FFD700',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    animation: 'spin 2s linear infinite',
                    marginBottom: '20px'
                }} />
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
                <h2>Connecting (Signaling)...</h2>
                <p>Waiting for P2P connection...</p>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', background: '#1a1a1a', color: 'white', display: 'flex', flexDirection: 'column', userSelect: 'none', touchAction: 'none' }}>
            <div style={{ padding: '15px', borderBottom: '1px solid #333', textAlign: 'center' }}>
                <h2 style={{ margin: 0 }}>GAMEPAD PRO</h2>
                <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '5px' }}>
                    <span style={{ color: connType === 'P2P' ? '#4CAF50' : '#888' }}>● P2P</span>
                    <span style={{ color: connType === 'SERVER' ? '#2196F3' : '#888' }}>● SERVER</span>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <button
                    onPointerDown={() => sendAction('DROP')}
                    style={{
                        width: '220px', height: '220px', borderRadius: '50%',
                        background: 'linear-gradient(145deg, #ff4e50, #f9d423)',
                        border: '10px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 15px 35px rgba(255, 78, 80, 0.4)',
                        fontSize: '36px', fontWeight: 'bold', color: 'white',
                        WebkitTapHighlightColor: 'transparent',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                >
                    DROP!
                </button>
            </div>

            <div style={{ padding: '20px', textAlign: 'center', background: '#222', color: '#666', fontSize: '12px' }}>
                SESSION: {gameId}
            </div>
        </div>
    );
};
