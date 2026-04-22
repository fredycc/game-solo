import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

const appleGeometry = new THREE.SphereGeometry(0.25, 16, 16);
const appleMaterial = new THREE.MeshStandardMaterial({ color: '#D32F2F' });
const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 4);
const stemMaterial = new THREE.MeshStandardMaterial({ color: '#5D4037' });

interface AppleProps {
    position: [number, number, number];
    onFloorHit?: () => void;
}

export const Apple = ({ position, onFloorHit }: AppleProps) => {
    return (
        <RigidBody
            position={position}
            colliders="ball"
            restitution={0.5}
            friction={0.7}
            onCollisionEnter={(payload) => {
                // Simple check if it hit the floor (based on other object name or role)
                // For now, we assume if it collides with something stable with 'floor' name it triggers
                if (payload.other.rigidBodyObject?.name === 'floor') {
                    onFloorHit?.();
                }
            }}
        >
            <mesh castShadow geometry={appleGeometry} material={appleMaterial} />
            {/* Stem */}
            <mesh position={[0, 0.2, 0]} geometry={stemGeometry} material={stemMaterial} />
        </RigidBody>
    );
};
