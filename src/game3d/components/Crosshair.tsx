import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface CrosshairProps {
    // If remote control is active, we might override position
    position?: [number, number, number];
}

export const Crosshair = ({ position }: CrosshairProps) => {
    const ref = useRef<THREE.Group>(null);
    const { viewport, mouse } = useThree();

    useFrame(() => {
        if (ref.current) {
            if (position) {
                // Remote control mode
                ref.current.position.set(position[0], position[1], position[2]);
            } else {
                // Local Mouse Control
                // Map mouse (-1 to 1) to viewport
                const x = (mouse.x * viewport.width) / 2;
                const y = (mouse.y * viewport.height) / 2;
                ref.current.position.set(x, y, 0); // Assuming 2D plane logic on Z=0
            }
        }
    });

    return (
        <group ref={ref} position={[0, 0, 0]}>
            <mesh>
                <ringGeometry args={[0.3, 0.35, 32]} />
                <meshBasicMaterial color="white" />
            </mesh>
            <mesh>
                <circleGeometry args={[0.05, 16]} />
                <meshBasicMaterial color="red" />
            </mesh>
        </group>
    );
};
