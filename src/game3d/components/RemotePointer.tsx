import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { connectionManager } from '../../services/ConnectionManager';
import * as THREE from 'three';

export const RemotePointer = () => {
    const { camera, raycaster, scene, size, viewport } = useThree();
    const [pointer, setPointer] = useState({ x: 0, y: 0 }); // Viewport coordinates (-width/2 to width/2)
    const [visible, setVisible] = useState(false);
    const lastMoveTime = useRef(Date.now());
    const pointerRef = useRef<THREE.Group>(null);

    useEffect(() => {
        const unsubscribe = connectionManager.subscribeEvents((event) => {
            if (event.type === 'move') {
                setVisible(true);
                lastMoveTime.current = Date.now();

                // dy/dx from phone are typically pixels or relative. 
                // We'll treat them as a percentage of the screen for consistency or just scale them.
                // Let's assume dx/dy are roughly pixel-scale or sensitivity based.
                const sensitivity = 0.02; // Adjust based on phone feeling

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

        // 1. Raycast for 3D objects
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

        // 2. Click for HTML UI elements (Home Button, etc.)
        const clientX = (ndcX + 1) * size.width / 2;
        const clientY = (1 - ndcY) * size.height / 2;

        const element = document.elementFromPoint(clientX, clientY);
        if (element instanceof HTMLElement) {
            const options = { bubbles: true, cancelable: true, view: window, clientX, clientY };
            element.dispatchEvent(new MouseEvent('mousedown', options));
            element.dispatchEvent(new MouseEvent('mouseup', options));
            element.dispatchEvent(new MouseEvent('click', options));
        }
    };

    useFrame(() => {
        if (pointerRef.current) {
            pointerRef.current.position.set(pointer.x, pointer.y, 5); // Slightly in front
        }

        // Auto-hide after 5 seconds of inactivity
        if (visible && Date.now() - lastMoveTime.current > 5000) {
            setVisible(false);
        }
    });

    if (!visible) return null;

    return (
        <group ref={pointerRef}>
            {/* Visual for the remote cursor */}
            <mesh raycast={() => null}>
                <circleGeometry args={[0.2, 32]} />
                <meshBasicMaterial color="#FFD700" transparent opacity={0.8} depthTest={false} />
            </mesh>
            <mesh position={[0, 0, 0.01]} raycast={() => null}>
                <ringGeometry args={[0.2, 0.25, 32]} />
                <meshBasicMaterial color="#FF8C00" depthTest={false} />
            </mesh>
            {/* Pulsing effect */}
            <mesh scale={1.5} raycast={() => null}>
                <circleGeometry args={[0.25, 32]} />
                <meshBasicMaterial color="#FFFF00" transparent opacity={0.2} depthTest={false} />
            </mesh>
        </group>
    );
};
