import { Assets } from '../assets/images';
import { useState } from 'react';

interface IntroUIProps {
    onStart: () => void;
}

export const IntroUI = ({ onStart }: IntroUIProps) => {
    const [isHovered, setIsHovered] = useState(false);

    // Animación de pulso para el botón
    const pulseStyle = {
        animation: 'pulse 1.5s infinite ease-in-out',
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            pointerEvents: 'none' // Permitir clicks en el botón, pero no bloquear fondo si fuera necesario (aunque aquí es opaco conceptualmente, el usuario quiere ver "solo menú")
        }}>
            {/* Definición de Keyframes para pulse */}
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
            `}</style>

            {/* Imagen de Título */}
            <img
                src={Assets.intro_game_opt}
                alt="Game Title"
                style={{
                    width: '60%',
                    maxWidth: '600px',
                    height: 'auto',
                    objectFit: 'contain',
                    marginBottom: '40px',
                    // Animación suave de flotación similar a la 3D
                    animation: 'float 3s ease-in-out infinite'
                }}
            />
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
            `}</style>

            {/* Botón START GAME */}
            <div
                onClick={onStart}
                onContextMenu={(e) => e.preventDefault()} // Prevenir menú contextual
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    pointerEvents: 'auto', // Reactivar eventos para el botón
                    backgroundColor: isHovered ? '#4CAF50' : '#FFB703',
                    opacity: 1, // Ensure fully opaque
                    padding: '15px 40px',
                    borderRadius: '20px',
                    border: '4px solid white',
                    color: 'white',
                    fontFamily: '"Fredoka", "Roboto", sans-serif', // Asegurar fuente
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textShadow: '2px 2px 0px black', // Borde negro en texto
                    boxShadow: '0 6px 12px rgba(0,0,0,0.4)', // Stronger shadow for depth
                    transition: 'all 0.2s ease',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)', // Efecto hover scale
                    zIndex: 100, // Ensure it sits on top of everything
                    ...(!isHovered ? pulseStyle : {}) // Aplicar pulso solo si no está en hover
                }}
            >
                START GAME
            </div>

            {/* Texto informativo */}
            <div style={{
                marginTop: '30px',
                color: 'white',
                fontSize: '1.2rem',
                fontFamily: '"Fredoka", sans-serif',
                textShadow: '1px 1px 2px black',
                fontWeight: 'bold'
            }}>
                Press Click or Enter to Play
            </div>
        </div>
    );
};
