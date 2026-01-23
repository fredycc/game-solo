import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

export const Tree = (props: ThreeElements['group']) => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Sway animation
            const t = state.clock.getElapsedTime();
            groupRef.current.rotation.z = Math.sin(t * 1.5) * 0.05;
            groupRef.current.rotation.x = Math.cos(t * 1.0) * 0.02;
        }
    });

    return (
        <group ref={groupRef} {...props}>
            {/* Trunk */}
            <mesh position={[0, 2, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.4, 0.6, 4, 8]} />
                <meshStandardMaterial color="#8B4513" roughness={0.8} />
            </mesh>

            {/* Foliage - Layered Cones/Spheres for a better look */}
            <group position={[0, 4, 0]}>
                <mesh position={[0, 0, 0]} castShadow>
                    <sphereGeometry args={[1.5, 16, 16]} />
                    <meshStandardMaterial color="#4CAF50" />
                </mesh>
                <mesh position={[1, 1, 0]} castShadow>
                    <sphereGeometry args={[1.2, 16, 16]} />
                    <meshStandardMaterial color="#66BB6A" />
                </mesh>
                <mesh position={[-1, 0.5, 0.8]} castShadow>
                    <sphereGeometry args={[1.3, 16, 16]} />
                    <meshStandardMaterial color="#43A047" />
                </mesh>
                <mesh position={[0, 1.5, -0.5]} castShadow>
                    <sphereGeometry args={[1.0, 16, 16]} />
                    <meshStandardMaterial color="#81C784" />
                </mesh>
            </group>
        </group>
    );
};
