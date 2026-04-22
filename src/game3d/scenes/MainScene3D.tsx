import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useState, useEffect, useRef } from 'react';
import { Tree } from '../components/Tree';
import { Apple } from '../components/Apple';
import { Crosshair } from '../components/Crosshair';
import { connectionManager } from '../../services/ConnectionManager';

import * as THREE from 'three';



export const MainScene3D = () => {
    const [apples, setApples] = useState<{ id: string; position: [number, number, number] }[]>([]);
    const spawnPos = useRef(new THREE.Vector3(0, 2, 0));

    const spawnApple = (targetPosition: THREE.Vector3) => {
        const id = Math.random().toString(36).substring(2, 11);
        // Spawn slightly above the click point or at a fixed height
        setApples(prev => [...prev, { id, position: [targetPosition.x, targetPosition.y, 0] }]);
    };

    useEffect(() => {
        const unsubscribe = connectionManager.subscribeEvents((event) => {
            if (event.type === 'action' && event.action === 'DROP') {
                // Spawn apple at a default position (e.g., from the tree) if remote triggered
                spawnApple(spawnPos.current);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);



    const handlePointerDown = (e: { point: THREE.Vector3 }) => {
        // e.point is the 3D point of intersection
        spawnApple(e.point);
    };

    return (
        <group>
            {/* Background / Click Area */}
            <mesh
                position={[0, 0, -1]}
                onClick={handlePointerDown}
                visible={false} // Invisible plane for capturing clicks
            >
                <planeGeometry args={[100, 100]} />
                <meshBasicMaterial />
            </mesh>

            {/* Ground Visuals & Physics */}
            <RigidBody type="fixed" friction={1} name="floor">
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]} receiveShadow>
                    <planeGeometry args={[50, 50]} />
                    <meshStandardMaterial color="#4CAF50" />
                </mesh>
                <CuboidCollider args={[25, 1, 25]} position={[0, -5, 0]} />
            </RigidBody>

            {/* Environment */}
            <Tree position={[0, -4, -5]} scale={1} />

            {/* Dynamic Objects */}
            {apples.map(apple => (
                <Apple key={apple.id} position={apple.position} />
            ))}

            {/* UI Elements in 3D Space */}
            <Crosshair />
        </group>
    );
};
