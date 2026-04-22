import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, 4, 8);
const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#8B4513', roughness: 0.8 });

// Share foliage geometries with lower segments
const foliageGeom1 = new THREE.SphereGeometry(1.5, 12, 12);
const foliageGeom2 = new THREE.SphereGeometry(1.2, 12, 12);
const foliageGeom3 = new THREE.SphereGeometry(1.3, 12, 12);
const foliageGeom4 = new THREE.SphereGeometry(1.0, 12, 12);

const foliageMat1 = new THREE.MeshStandardMaterial({ color: '#4CAF50' });
const foliageMat2 = new THREE.MeshStandardMaterial({ color: '#66BB6A' });
const foliageMat3 = new THREE.MeshStandardMaterial({ color: '#43A047' });
const foliageMat4 = new THREE.MeshStandardMaterial({ color: '#81C784' });

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
            <mesh position={[0, 2, 0]} castShadow receiveShadow geometry={trunkGeometry} material={trunkMaterial} />

            {/* Foliage - Layered Cones/Spheres for a better look */}
            <group position={[0, 4, 0]}>
                <mesh position={[0, 0, 0]} castShadow geometry={foliageGeom1} material={foliageMat1} />
                <mesh position={[1, 1, 0]} castShadow geometry={foliageGeom2} material={foliageMat2} />
                <mesh position={[-1, 0.5, 0.8]} castShadow geometry={foliageGeom3} material={foliageMat3} />
                <mesh position={[0, 1.5, -0.5]} castShadow geometry={foliageGeom4} material={foliageMat4} />
            </group>
        </group>
    );
};
