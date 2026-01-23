import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useState, useEffect } from 'react';
import { Tree } from '../components/Tree';
import { Apple } from '../components/Apple';
import { Crosshair } from '../components/Crosshair';
import { connectionManager } from '../../game/ConnectionManager';
import { AudioAssets } from '../../audio';
import * as THREE from 'three';

interface MainScene3DProps {
    onBack: () => void;
}

export const MainScene3D = ({ }: MainScene3DProps) => {
    const [apples, setApples] = useState<{ id: string; position: [number, number, number] }[]>([]);

    useEffect(() => {
        // Initialize Game Music
        const music = new Audio(AudioAssets.music_1);
        music.loop = true;
        music.volume = 0.4;

        let isMounted = true;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                music.pause();
            } else if (isMounted) {
                music.play().catch(() => { });
            }
        };

        const resumeMusic = () => {
            if (music.paused) {
                music.play().catch(console.error);
            }
            window.removeEventListener('click', resumeMusic);
            window.removeEventListener('keydown', resumeMusic);
        };

        const playMusic = async () => {
            try {
                await music.play();
            } catch (err) {
                if (isMounted) {
                    window.addEventListener('click', resumeMusic);
                    window.addEventListener('keydown', resumeMusic);
                }
            }
        };

        playMusic();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const unsubscribe = connectionManager.subscribeEvents((event) => {
            if (event.type === 'action' && event.action === 'DROP') {
                // Spawn apple at a default position (e.g., from the tree) if remote triggered
                spawnApple(new THREE.Vector3(0, 2, 0));
            }
        });

        return () => {
            isMounted = false;
            music.pause();
            music.currentTime = 0;
            window.removeEventListener('click', resumeMusic);
            window.removeEventListener('keydown', resumeMusic);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            unsubscribe();
        };
    }, []);

    const spawnApple = (targetPosition: THREE.Vector3) => {
        const id = Math.random().toString(36).substr(2, 9);
        // Spawn slightly above the click point or at a fixed height
        setApples(prev => [...prev, { id, position: [targetPosition.x, targetPosition.y, 0] }]);
    };

    const handlePointerDown = (e: any) => {
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
