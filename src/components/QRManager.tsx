import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { connectionManager } from '../game/ConnectionManager';

export const QRManager = () => {
    const [gameId] = useState(() => connectionManager.getGameId());


    const [isVisible, setIsVisible] = useState(true);

    const [controllerUrl, setControllerUrl] = useState('');

    useEffect(() => {
        const determineConnectionUrl = async () => {
            let targetHost = window.location.hostname;
            const isLocalhost = targetHost === 'localhost' || targetHost === '127.0.0.1';

            // If we are on localhost, we try to get the Network IP for mobile access
            if (isLocalhost) {
                try {
                    // Try to fetch IP from backend (assuming port 3005 for backend locally)
                    // In dev, frontend is 5173, backend 3005. In prod (docker), both are same port.
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

            // Construct the final URL
            const protocol = window.location.protocol;
            let port = window.location.port ? `:${window.location.port}` : '';

            // Fix: If we switched from localhost to Network IP in Dev mode, 
            // we must ensure we point to the Vite port (5173), not stick to implicit ports.
            if (import.meta.env.DEV && targetHost !== 'localhost' && targetHost !== '127.0.0.1') {
                port = ':5173';
            }


            setControllerUrl(`${protocol}//${targetHost}${port}/controller?gameId=${connectionManager.getGameId()}`);
        };

        determineConnectionUrl();

        // Listen for scene changes
        const handleSceneChange = (e: Event) => {
            const { detail } = e as CustomEvent<{ scene?: string }>;
            const scene = detail?.scene;
            if (scene === 'IntroScene') {
                setIsVisible(true);
            } else if (scene === 'MainScene') {
                setIsVisible(false);
            }
        };

        window.addEventListener('phaser-scene-change', handleSceneChange);
        return () => window.removeEventListener('phaser-scene-change', handleSceneChange);
    }, []);

    if (!gameId || !isVisible) return null;

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
            fontFamily: 'Arial, sans-serif',
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
                Join Game
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
                    Comp. Code
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
