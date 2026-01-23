import { Text, Float, useTexture } from '@react-three/drei';
import { useState, useEffect } from 'react';
import { Assets } from '../../assets/images';



interface IntroScene3DProps {
    onStart: () => void;
}

export const IntroScene3D = ({ onStart }: IntroScene3DProps) => {
    const [hovered, setHovered] = useState(false);

    // Load texture for the title image
    // Suspense in GameCanvas will handle the loading state
    const titleTexture = useTexture(Assets.intro_game_opt);

    useEffect(() => {
        // No local audio management here anymore
    }, []);

    return (
        <>
            <Float speed={3} rotationIntensity={0.6} floatIntensity={0.8}>
                {/* Title Image Plane */}
                <mesh position={[0, 2.5, 0]}>
                    <planeGeometry args={[8.5, 4.25]} />
                    {/* toneMapped={false} ensures true colors for UI elements */}
                    <meshBasicMaterial map={titleTexture} transparent toneMapped={false} />
                </mesh>
            </Float>

            {/* Start Button Group - Flat Design with scaling fix */}
            <group
                position={[0, -1.5, 0]}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={onStart}
                scale={hovered ? 1.1 : 1}
            >
                {/* White Border visual (slightly larger plane behind) */}
                <mesh position={[0, 0, -0.01]}>
                    <planeGeometry args={[5.3, 1.8]} />
                    <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
                </mesh>

                {/* Button Base (Flat Plane) */}
                <mesh>
                    <planeGeometry args={[5, 1.5]} />
                    <meshBasicMaterial color={hovered ? '#4CAF50' : '#FFB703'} toneMapped={false} />
                </mesh>

                {/* Text */}
                <Text
                    position={[0, 0, 0.1]}
                    fontSize={0.5}
                    color="#FFFFFF"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.03}
                    outlineColor="#000000"
                >
                    START GAME
                </Text>
            </group>

            <Text
                position={[0, -3.5, 0]}
                fontSize={0.3}
                color="#FFFFFF"
                outlineWidth={0.02}
                outlineColor="#000000"
            >
                Press Click or Enter to Play
            </Text>
        </>
    );
};
