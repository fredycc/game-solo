import { useState, useEffect } from 'react';
import { connectionManager } from '../services/ConnectionManager';
import type { ConnectionState } from '../services/ConnectionManager';

export const ConnectionStatus = () => {
    const [state, setState] = useState<ConnectionState>('disconnected');

    useEffect(() => {
        const unsubscribe = connectionManager.subscribeState((newState: ConnectionState) => {
            setState(newState);
        });

        // Fetch server IP to ensure we connect via network IP (better for P2P)
        const initConnection = async () => {
            const isDev = import.meta.env.DEV;
            let serverUrl = '';

            if (isDev) {
                try {
                    const response = await fetch(`http://${window.location.hostname}:3005/ip`);
                    const data = await response.json();
                    serverUrl = `http://${data.ip}:3005`;
                } catch (err) {
                    console.error("Could not fetch IP, falling back to hostname", err);
                    serverUrl = `http://${window.location.hostname}:3005`;
                }
            } else {
                // In production (Docker/Cloud), the server is same origin
                serverUrl = window.location.origin;
            }

            console.log(`[Host] Connecting to: ${serverUrl}`);
            connectionManager.connect(serverUrl);
        };

        initConnection();

        return () => unsubscribe();
    }, []);

    const getLightColor = () => {
        switch (state) {
            case 'connected': return '#4CAF50'; // Green
            case 'hosting': return '#2196F3'; // Blue
            case 'signaling': return '#FFC107'; // Yellow/Orange
            case 'disconnected': return '#F44336'; // Red
            default: return '#F44336';
        }
    };

    const getStatusText = () => {
        switch (state) {
            case 'connected': return 'P2P CONNECTED';
            case 'hosting': return 'WAITING FOR CONTROLLER';
            case 'signaling': return 'CONNECTING...';
            case 'disconnected': return 'DISCONNECTED';
            default: return 'DISCONNECTED';
        }
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 28px',
            background: 'linear-gradient(180deg, #4A148C 0%, #311B92 100%)', // Pro Purple
            border: '4px dashed rgba(255, 255, 255, 0.4)',
            borderRadius: '40px',
            color: 'white',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 6px 0 rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.2)',
            zIndex: 1000,
            pointerEvents: 'none',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
            <div style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: getLightColor(),
                boxShadow: `0 0 12px ${getLightColor()}, 0 0 4px white`,
                border: '2px solid white',
                transition: 'all 0.3s ease'
            }} />
            <span style={{ letterSpacing: '1px' }}>{getStatusText()}</span>
        </div>
    );
};
