import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { connectionManager } from '../game/ConnectionManager';

export const QRManager = () => {
    const [gameId, setGameId] = useState('');
    const [ip, setIp] = useState('');

    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        setGameId(connectionManager.getGameId());

        // Fetch server IP
        fetch(`http://${window.location.hostname}:3005/ip`)
            .then(res => res.json())
            .then(data => setIp(data.ip))
            .catch(err => {
                console.error("Could not fetch IP, falling back to hostname", err);
                setIp(window.location.hostname);
            });

        // Listen for scene changes
        const handleSceneChange = (e: any) => {
            const scene = e.detail?.scene;
            if (scene === 'IntroScene') {
                setIsVisible(true);
            } else if (scene === 'MainScene') {
                setIsVisible(false);
            }
        };

        window.addEventListener('phaser-scene-change', handleSceneChange);
        return () => window.removeEventListener('phaser-scene-change', handleSceneChange);
    }, []);

    const controllerUrl = `http://${ip}:5173/controller?gameId=${gameId}`;

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
