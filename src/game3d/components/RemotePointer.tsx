import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame, invalidate } from '@react-three/fiber';
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
    const groupRef = useRef<THREE.Group>(null);
    const [visible, setVisible] = useState(false);
    // Ref mirror of visible — avoids stale closures without extra re-renders
    const visibleRef = useRef(false);
    const lastMoveTime = useRef(0); // Initialized in useEffect to maintain purity during render
    // Latest viewport/size available in callbacks without re-subscribing
    const viewportRef = useRef(viewport);
    const sizeRef = useRef(size);
    
    // Vector to store target position for interpolation
    const targetRef = useRef(new THREE.Vector3(0, 0, 0));
    
    // Reusable vectors to avoid GC pressure
    const vector3 = useRef(new THREE.Vector3());
    const vector2 = useRef(new THREE.Vector2());

    useEffect(() => {
        viewportRef.current = viewport;
        sizeRef.current = size;
    }, [viewport, size]);

    // Always-fresh ref to handleRemoteClick (avoids stale closure in subscription)
    const handleRemoteClickRef = useRef<() => void>(() => { });

    useEffect(() => {
        lastMoveTime.current = Date.now();
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
                
                // Update target position
                targetRef.current.x = THREE.MathUtils.clamp(
                    targetRef.current.x + event.dx * sensitivity,
                    -vp.width / 2,
                    vp.width / 2,
                );
                targetRef.current.y = THREE.MathUtils.clamp(
                    targetRef.current.y - event.dy * sensitivity,
                    -vp.height / 2,
                    vp.height / 2,
                );

                // In demand mode, we need to invalidate to trigger the useFrame loop
                invalidate();
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
        const sz = sizeRef.current;

        // Use the current group position for the click (interpolated)
        if (!groupRef.current) return;
        const vector = vector3.current.copy(groupRef.current.position);
        
        vector.project(camera);
        const ndcX = vector.x;
        const ndcY = vector.y;

        const canvas = document.querySelector('canvas');
        const canvasRect = canvas?.getBoundingClientRect();
        const offsetX = canvasRect?.left ?? 0;
        const offsetY = canvasRect?.top ?? 0;
        
        const clientX = ((ndcX + 1) * sz.width) / 2 + offsetX;
        const clientY = ((1 - ndcY) * sz.height) / 2 + offsetY;

        const NATIVE_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']);

        const elements = document.elementsFromPoint(clientX, clientY);

        for (const element of elements) {
            // Support both HTMLElement and SVGElement (icons inside buttons)
            if (!(element instanceof HTMLElement || element instanceof SVGElement)) continue;
            
            // If it's an SVG, we want to check its parent button
            let target: HTMLElement | null = element instanceof HTMLElement ? element : element.parentElement as HTMLElement;
            
            while (target && target !== document.body) {
                if (target.tagName === 'CANVAS') break;

                const isExplicit = target.dataset.remoteClickable === 'true';
                const isNative = NATIVE_TAGS.has(target.tagName);
                const isAriaButton = target.getAttribute('role') === 'button';

                if (isExplicit || isNative || isAriaButton) {
                    dispatchClick(target, clientX, clientY);
                    return;
                }
                target = target.parentElement;
            }
        }

        // Fallback: Direct query by bounding rect
        const remoteClickables = document.querySelectorAll<HTMLElement>('[data-remote-clickable="true"]');
        for (const el of remoteClickables) {
            const rect = el.getBoundingClientRect();
            if (clientX >= rect.left && clientX <= rect.right &&
                clientY >= rect.top && clientY <= rect.bottom) {
                dispatchClick(el, clientX, clientY);
                return;
            }
        }

        // Final Fallback: Raycast into 3D scene
        raycaster.setFromCamera(vector2.current.set(ndcX, ndcY), camera);
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
                        pointer: vector2.current.set(ndcX, ndcY),
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

    useFrame((_state, delta) => {
        if (!groupRef.current) return;

        // Interpolation logic
        const smoothing = 0.15; // Lower = smoother but more lag. Higher = snappier.
        const weight = 1 - Math.pow(smoothing, delta * 60);
        
        groupRef.current.position.lerp(targetRef.current, weight);

        // Auto-hide after inactivity
        if (visibleRef.current && Date.now() - lastMoveTime.current > 5000) {
            visibleRef.current = false;
            setVisible(false);
        }

        // In demand mode, if we are still moving, keep invalidating
        if (visibleRef.current && groupRef.current.position.distanceTo(targetRef.current) > 0.001) {
            invalidate();
        }
    });

    if (!visible) return null;

    return (
        <group ref={groupRef} renderOrder={9999}>
            {/* Main yellow dot */}
            <mesh scale={[0.15, 0.15, 0.15]}>
                <circleGeometry args={[1, 32]} />
                <meshBasicMaterial 
                    color="#FFD700" 
                    transparent 
                    opacity={0.8} 
                    depthTest={false}
                />
            </mesh>
            
            {/* Border ring */}
            <mesh scale={[0.15, 0.15, 0.15]}>
                <ringGeometry args={[0.9, 1, 32]} />
                <meshBasicMaterial 
                    color="#FF8C00" 
                    transparent 
                    opacity={1} 
                    depthTest={false}
                />
            </mesh>

            {/* Pulsing outer ring */}
            <PulseAnimation />
        </group>
    );
};

/** Separate component for the pulsing animation to avoid per-frame logic in main pointer */
const PulseAnimation = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (meshRef.current) {
            const scale = 1 + Math.sin(clock.elapsedTime * 4) * 0.2;
            meshRef.current.scale.set(scale, scale, 1);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mat = meshRef.current.material as any;
            mat.opacity = 0.3 * (1 - (scale - 0.8) / 0.4);
        }
    });
    return (
        <mesh ref={meshRef} scale={[0.2, 0.2, 0.2]}>
            <ringGeometry args={[0.8, 1, 32]} />
            <meshBasicMaterial 
                color="#FFFF00" 
                transparent 
                opacity={0.3} 
                depthTest={false}
            />
        </mesh>
    );
};

