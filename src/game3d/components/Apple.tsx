import { RigidBody } from '@react-three/rapier';

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
            <mesh castShadow>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#D32F2F" />
            </mesh>
            {/* Stem */}
            <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.1, 4]} />
                <meshStandardMaterial color="#5D4037" />
            </mesh>
        </RigidBody>
    );
};
