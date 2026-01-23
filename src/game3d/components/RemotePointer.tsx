import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { connectionManager } from '../../services/ConnectionManager';
import * as THREE from 'three';

export const RemotePointer = () => {
    const { camera, raycaster, scene, size, viewport } = useThree();
    const [pointer, setPointer] = useState({ x: 0, y: 0 }); // Viewport coordinates (-width/2 to width/2)
    const [visible, setVisible] = useState(false);
    const lastMoveTime = useRef(Date.now());

    // We don't need a ref for the group anymore since we are using Html
    // But we might want to keep the position logic clean.

    useEffect(() => {
        const unsubscribe = connectionManager.subscribeEvents((event) => {
            if (event.type === 'move') {
                setVisible(true);
                lastMoveTime.current = Date.now();

                const sensitivity = 0.02;

                setPointer(prev => ({
                    x: THREE.MathUtils.clamp(prev.x + event.dx * sensitivity, -viewport.width / 2, viewport.width / 2),
                    y: THREE.MathUtils.clamp(prev.y - event.dy * sensitivity, -viewport.height / 2, viewport.height / 2)
                }));
            } else if (event.type === 'action' && event.action === 'TAP_CLICK') {
                handleRemoteClick();
            }
        });

        const statusUnsubscribe = connectionManager.subscribeState((state) => {
            if (state === 'connected') setVisible(true);
            else setVisible(false);
        });

        return () => {
            unsubscribe();
            statusUnsubscribe();
        };
    }, [viewport, size]);

    const handleRemoteClick = () => {
        const ndcX = (pointer.x / (viewport.width / 2));
        const ndcY = (pointer.y / (viewport.height / 2));

        // Coordenadas de pantalla para HTML
        const clientX = (ndcX + 1) * size.width / 2;
        const clientY = (1 - ndcY) * size.height / 2;

        // 1. Intentar interactuar con UI HTML PRIMERO (Prioridad Alta)
        const elements = document.elementsFromPoint(clientX, clientY);

        for (const element of elements) {
            if (element instanceof HTMLElement) {
                const isCanvas = element.tagName === 'CANVAS';


                // Check if element is interactive or is our button
                const isClickable = element.tagName === 'BUTTON' || element.onclick || element.getAttribute('role') === 'button' || element.style.cursor === 'pointer' || window.getComputedStyle(element).cursor === 'pointer';

                // Si encontramos un elemento interactivo que NO es el canvas, le damos click
                if (!isCanvas && isClickable) {
                    const options = { bubbles: true, cancelable: true, view: window, clientX, clientY };
                    // Send full sequence
                    element.dispatchEvent(new MouseEvent('mousedown', options));
                    element.dispatchEvent(new MouseEvent('mouseup', options));
                    element.dispatchEvent(new MouseEvent('click', options));
                    return; // Stop after clicking the top-most interactive element
                }
            }
        }

        // 2. Si no hubo interacción HTML, probar Raycast 3D
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            for (const intersect of intersects) {
                let current: any = intersect.object;
                while (current) {
                    const handlers = current.__r3f?.handlers;
                    if (handlers?.onClick) {
                        handlers.onClick({
                            stopped: false,
                            target: current,
                            nativeEvent: new MouseEvent('click'),
                            pointer: new THREE.Vector2(ndcX, ndcY),
                            point: intersect.point,
                            face: intersect.face,
                            distance: intersect.distance,
                            uv: intersect.uv,
                            stopPropagation: () => { }
                        });
                        return; // Click handled
                    }
                    current = current.parent;
                }
            }
        }
    };

    useFrame(() => {
        // Auto-hide after 5 seconds of inactivity
        if (visible && Date.now() - lastMoveTime.current > 5000) {
            setVisible(false);
        }
    });

    if (!visible) return null;

    return (
        <Html
            position={[pointer.x, pointer.y, 0]} // Center at Z=0? Or 5? Since it's overlay, 0 is fine if we ignore depth.
            // Actually, if we use default zIndexRange with Html, it might get occluded by 3D objects if we are not careful.
            // But we want it ON TOP of everything.
            style={{
                pointerEvents: 'none', // Crucial: lets clicks pass through
                zIndex: 9999, // Crucial: puts it above all other UI
                transform: 'translate3d(-50%, -50%, 0)', // Center the div on the coordinate
            }}
            zIndexRange={[9999, 9999]} // Force it to be always on top in R3F sorting too

        >
            <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
            }}>
                {/* Visual for the remote cursor - CSS version */}
                <div style={{
                    position: 'absolute',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 215, 0, 0.8)', // Gold
                    boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                    border: '2px solid rgba(255, 140, 0, 1)' // Dark Orange
                }} />

                {/* Pulsing effect */}
                <div style={{
                    position: 'absolute',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 0, 0.2)',
                    animation: 'pulse 1.5s infinite'
                }} />

                <style>{`
                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 0.2; }
                        50% { transform: scale(1.2); opacity: 0.1; }
                        100% { transform: scale(1); opacity: 0.2; }
                    }
                `}</style>
            </div>
        </Html>
    );
};
