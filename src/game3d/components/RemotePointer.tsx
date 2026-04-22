import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { connectionManager } from '../../services/ConnectionManager';
import * as THREE from 'three';

/**
 * RemotePointer — renders the yellow cursor driven by the P2P controller
 * and handles remote click dispatch.
 *
 * HOW TO MAKE AN ELEMENT CLICKABLE FROM THE REMOTE CONTROLLER
 * -----------------------------------------------------------
 * Add the attribute  data-remote-clickable="true"  to any HTML element
 * (button, div, anchor, etc.) that should respond to a TAP_CLICK event.
 * This is the canonical, scene-agnostic way to opt in.
 *
 * Priority order inside handleRemoteClick:
 *   1. data-remote-clickable="true"   ← explicit opt-in (preferred)
 *   2. Native interactive tags: BUTTON, A, INPUT, SELECT, TEXTAREA
 *   3. role="button"                  ← ARIA opt-in
 *   (canvas is always skipped)
 *
 * Heuristics like cursor:pointer are intentionally removed to avoid
 * false positives on R3F-generated Html wrapper divs.
 */
export const RemotePointer = () => {
    const { camera, raycaster, scene, size, viewport } = useThree();
    const pointerRef = useRef({ x: 0, y: 0 });
    const groupRef = useRef<THREE.Group>(null);
    const [visible, setVisible] = useState(false);
    // Ref mirror of visible — avoids stale closures without extra re-renders
    const visibleRef = useRef(false);
    const lastMoveTime = useRef(Date.now());
    // Latest viewport/size available in callbacks without re-subscribing
    const viewportRef = useRef(viewport);
    const sizeRef = useRef(size);

    useEffect(() => {
        viewportRef.current = viewport;
        sizeRef.current = size;
    }, [viewport, size]);

    // Always-fresh ref to handleRemoteClick (avoids stale closure in subscription)
    const handleRemoteClickRef = useRef<() => void>(() => { });

    useEffect(() => {
        const unsubscribe = connectionManager.subscribeEvents((event) => {
            if (event.type === 'move') {
                lastMoveTime.current = Date.now();

                // Only call setVisible on transition — avoids per-event re-renders
                if (!visibleRef.current) {
                    visibleRef.current = true;
                    setVisible(true);
                }

                const vp = viewportRef.current;
                const sensitivity = 0.02;
                const newX = THREE.MathUtils.clamp(
                    pointerRef.current.x + event.dx * sensitivity,
                    -vp.width / 2,
                    vp.width / 2,
                );
                const newY = THREE.MathUtils.clamp(
                    pointerRef.current.y - event.dy * sensitivity,
                    -vp.height / 2,
                    vp.height / 2,
                );

                pointerRef.current.x = newX;
                pointerRef.current.y = newY;

                if (groupRef.current) {
                    groupRef.current.position.set(newX, newY, 0);
                }
            } else if (event.type === 'action' && event.action === 'TAP_CLICK') {
                handleRemoteClickRef.current();
            }
        });

        const statusUnsubscribe = connectionManager.subscribeState((state) => {
            const shouldBeVisible = state === 'connected';
            if (visibleRef.current !== shouldBeVisible) {
                visibleRef.current = shouldBeVisible;
                setVisible(shouldBeVisible);
            }
        });

        return () => {
            unsubscribe();
            statusUnsubscribe();
        };
    }, []); // No deps — viewport/size read via refs

    const handleRemoteClick = () => {
        const vp = viewportRef.current;
        const sz = sizeRef.current;

        const ndcX = pointerRef.current.x / (vp.width / 2);
        const ndcY = pointerRef.current.y / (vp.height / 2);

        const clientX = ((ndcX + 1) * sz.width) / 2;
        const clientY = ((1 - ndcY) * sz.height) / 2;

        const NATIVE_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']);

        const elements = document.elementsFromPoint(clientX, clientY);

        for (const element of elements) {
            if (!(element instanceof HTMLElement)) continue;
            if (element.tagName === 'CANVAS') continue;

            // Priority 1 — explicit opt-in via data attribute
            const isExplicit = element.dataset.remoteClickable === 'true';
            // Priority 2 — native interactive HTML elements
            const isNative = NATIVE_TAGS.has(element.tagName);
            // Priority 3 — ARIA button role
            const isAriaButton = element.getAttribute('role') === 'button';

            if (isExplicit || isNative || isAriaButton) {
                dispatchClick(element, clientX, clientY);
                return;
            }
        }

        // Fallback: Raycast into 3D scene for R3F onClick handlers
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        for (const intersect of intersects) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                        stopPropagation: () => { },
                    });
                    return;
                }
                current = current.parent;
            }
        }
    };

    /** Dispatch a full click sequence and immediately clean up hover state. */
    const dispatchClick = (element: HTMLElement, clientX: number, clientY: number) => {
        const opts = { bubbles: true, cancelable: true, view: window, clientX, clientY };
        element.dispatchEvent(new MouseEvent('mousedown', opts));
        element.dispatchEvent(new MouseEvent('mouseup', opts));
        element.dispatchEvent(new MouseEvent('click', opts));
        // Reset any hover state driven by mouseover/mouseenter
        element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false, cancelable: true }));
    };

    // Keep ref pointing at the latest closure
    useEffect(() => {
        handleRemoteClickRef.current = handleRemoteClick;
    });

    useFrame(() => {
        if (visibleRef.current && Date.now() - lastMoveTime.current > 5000) {
            visibleRef.current = false;
            setVisible(false);
        }
    });

    if (!visible) return null;

    return (
        <group ref={groupRef} position={[pointerRef.current.x, pointerRef.current.y, 0]}>
            <Html
                position={[0, 0, 0]}
                style={{
                    pointerEvents: 'none',
                    zIndex: 9999,
                    transform: 'translate3d(-50%, -50%, 0)',
                }}
                zIndexRange={[9999, 9999]}
            >
                <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                }}>
                    <div style={{
                        position: 'absolute',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 215, 0, 0.8)',
                        boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                        border: '2px solid rgba(255, 140, 0, 1)',
                    }} />
                    <div style={{
                        position: 'absolute',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 0, 0.2)',
                        animation: 'rp-pulse 1.5s infinite',
                    }} />
                    <style>{`
                        @keyframes rp-pulse {
                            0%   { transform: scale(1);   opacity: 0.2; }
                            50%  { transform: scale(1.2); opacity: 0.1; }
                            100% { transform: scale(1);   opacity: 0.2; }
                        }
                    `}</style>
                </div>
            </Html>
        </group>
    );
};
