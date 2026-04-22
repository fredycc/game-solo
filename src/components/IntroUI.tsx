import { Assets } from '../assets/images';

interface IntroUIProps {
    onStart: () => void;
}

export const IntroUI = ({ onStart }: IntroUIProps) => {
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
            pointerEvents: 'none',
        }}>
            <style>{`
                @keyframes float {
                    0%   { transform: translateY(0px); }
                    50%  { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                @keyframes intro-pulse {
                    0%   { transform: scale(1); }
                    50%  { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                /* FIX 2: Use CSS-only hover so React state never gets stuck "on"
                   when a remote click dispatches synthetic mouse events */
                #intro-start-btn {
                    pointer-events: auto;
                    background-color: #FFB703;
                    opacity: 1;
                    padding: 15px 40px;
                    border-radius: 20px;
                    border: 4px solid white;
                    color: white;
                    font-family: "Fredoka", "Roboto", sans-serif;
                    font-size: 2rem;
                    font-weight: bold;
                    cursor: pointer;
                    text-shadow: 2px 2px 0px black;
                    box-shadow: 0 6px 12px rgba(0,0,0,0.4);
                    transition: background-color 0.2s ease, transform 0.2s ease;
                    transform: scale(1);
                    z-index: 100;
                    animation: intro-pulse 1.5s infinite ease-in-out;
                    user-select: none;
                }
                #intro-start-btn:hover,
                #intro-start-btn:focus {
                    background-color: #4CAF50;
                    transform: scale(1.1);
                    animation: none;
                }
                #intro-start-btn:active {
                    transform: scale(0.97);
                }
            `}</style>

            <img
                src={Assets.intro_game_opt}
                alt="Game Title"
                style={{
                    width: '60%',
                    maxWidth: '600px',
                    height: 'auto',
                    objectFit: 'contain',
                    marginBottom: '40px',
                    animation: 'float 3s ease-in-out infinite',
                    pointerEvents: 'none',
                }}
            />

            {/* FIX 2 + FIX 3: Real <button> element — always found by tagName check
                in handleRemoteClick and never has React-state-based opacity issues */}
            <button
                id="intro-start-btn"
                onClick={onStart}
                onContextMenu={(e) => e.preventDefault()}
            >
                START GAME
            </button>

            <div style={{
                marginTop: '30px',
                color: 'white',
                fontSize: '1.2rem',
                fontFamily: '"Fredoka", sans-serif',
                textShadow: '1px 1px 2px black',
                fontWeight: 'bold',
                pointerEvents: 'none',
            }}>
                Press Click or Enter to Play
            </div>
        </div>
    );
};
