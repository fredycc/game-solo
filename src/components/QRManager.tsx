import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { connectionManager } from '../services/ConnectionManager';

export const QRManager = () => {
    const [gameId] = useState(() => connectionManager.getGameId());
    const [controllerUrl, setControllerUrl] = useState('');

    useEffect(() => {
        const determineConnectionUrl = async () => {
            let targetHost = window.location.hostname;
            const isLocalhost = targetHost === 'localhost' || targetHost === '127.0.0.1';

            if (isLocalhost) {
                try {
                    const backendPort = import.meta.env.DEV ? '3005' : window.location.port;
                    const response = await fetch(`${window.location.protocol}//${window.location.hostname}:${backendPort}/ip`);
                    const data = await response.json();
                    if (data.ip) {
                        targetHost = data.ip;
                    }
                } catch (err) {
                    console.error("Could not fetch IP, falling back to hostname", err);
                }
            }

            const protocol = window.location.protocol;
            let port = window.location.port ? `:${window.location.port}` : '';

            if (import.meta.env.DEV && targetHost !== 'localhost' && targetHost !== '127.0.0.1') {
                port = ':5173';
            }

            setControllerUrl(`${protocol}//${targetHost}${port}/controller?gameId=${connectionManager.getGameId()}`);
        };

        determineConnectionUrl();
    }, []);

    if (!gameId || !controllerUrl) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '15px',
            borderRadius: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: 2000,
            color: '#333',
            fontFamily: 'Fredoka, sans-serif',
            pointerEvents: 'auto',
            backdropFilter: 'blur(5px)',
            border: '2px solid rgba(255, 255, 255, 0.5)'
        }}>
            <h3 style={{
                margin: 0,
                fontSize: '12px',
                color: '#333',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: '800'
            }}>
                Únete
            </h3>

            <div style={{
                padding: '5px',
                background: 'white',
                borderRadius: '8px'
            }}>
                <QRCodeSVG value={controllerUrl} size={120} />
            </div>

            <div style={{ textAlign: 'center' }}>
                <p style={{
                    margin: 0,
                    fontSize: '10px',
                    color: '#666',
                    marginBottom: '2px'
                }}>
                    Code
                </p>
                <p style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '900',
                    color: '#000',
                    fontFamily: 'monospace',
                    letterSpacing: '2px'
                }}>
                    {gameId}
                </p>
            </div>
        </div>
    );
};
