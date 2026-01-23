import { useEffect, useRef } from 'react';
import { AudioAssets } from '../../audio';

interface BackgroundMusicProps {
    mode: 'intro' | 'game';
}

export const BackgroundMusic = ({ mode }: BackgroundMusicProps) => {
    // We use a ref for the audio element to keep it persistent across re-renders
    const audioRef = useRef<HTMLAudioElement | null>(null);
    // We also need to track the current mode to avoid redundant play calls
    const currentMode = useRef<string | null>(null);

    useEffect(() => {
        const trackUrl = mode === 'intro'
            ? (Array.isArray(AudioAssets.intro) ? AudioAssets.intro[0] : AudioAssets.intro)
            : AudioAssets.music_1;

        // If the mode hasn't changed, don't do anything
        if (currentMode.current === mode && audioRef.current) return;

        // 1. Stop any current audio immediately
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }

        // 2. Setup new audio
        const audio = new Audio(trackUrl);
        audio.loop = true;
        audio.volume = mode === 'intro' ? 0.5 : 0.4;
        audioRef.current = audio;
        currentMode.current = mode;

        let resumeListeners: (() => void)[] = [];

        const tryPlay = async () => {
            try {
                await audio.play();
            } catch (err) {
                // If autoplay is blocked, add listeners for user interaction
                const resume = () => {
                    audio.play().catch(() => { });
                    window.removeEventListener('click', resume);
                    window.removeEventListener('keydown', resume);
                };
                window.addEventListener('click', resume);
                window.addEventListener('keydown', resume);
                resumeListeners.push(resume);
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                audio.pause();
            } else {
                // Only resume if the user has interacted (to avoid autoplay blocks again)
                audio.play().catch(() => { });
            }
        };

        tryPlay();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup function
        return () => {
            audio.pause();
            audio.currentTime = 0;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            resumeListeners.forEach(ln => {
                window.removeEventListener('click', ln);
                window.removeEventListener('keydown', ln);
            });
            audioRef.current = null;
            currentMode.current = null;
        };
    }, [mode]);

    return null;
};
