import React, { useEffect, useRef, useState } from 'react';

interface IntroVideoProps {
    onComplete: () => void;
    videoSrc?: string;
}

const IntroVideo: React.FC<IntroVideoProps> = ({ onComplete, videoSrc }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [videoOpacity, setVideoOpacity] = useState(0);

    useEffect(() => {
        const videoElement = videoRef.current;

        // Trigger fade in on mount
        setIsVisible(true);
        setTimeout(() => setVideoOpacity(1), 100);

        if (videoElement) {
            videoElement.play().catch(e => console.error("Auto-play blocked:", e));
        }

    }, []);

    const handleEnded = () => {
        // Fade out
        setVideoOpacity(0);
        setTimeout(() => {
            onComplete();
        }, 1000); // 1s transition time
    };

    const isDark = videoSrc?.includes('DARK') || false;

    return (
        <div className={`fixed inset-0 z-[100] ${isDark ? 'bg-black' : 'bg-white'} flex items-center justify-center overflow-hidden transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Video Player */}
            <video
                ref={videoRef}
                className={`w-full h-full object-contain transition-opacity duration-1000 ease-in-out`}
                style={{ opacity: videoOpacity }}
                src={videoSrc || "/Intro/Ministry of Defense Intro.mp4"}
                onEnded={handleEnded}
                playsInline
                muted={false}
            />

            {/* Skip Button */}
            <button
                onClick={handleEnded}
                className={`absolute bottom-8 right-8 text-xs uppercase tracking-[0.2em] border px-4 py-2 rounded transition-all duration-500 z-[110] ${videoOpacity > 0 ? 'opacity-100' : 'opacity-0'} ${isDark
                        ? 'text-white/50 hover:text-white border-white/20'
                        : 'text-black/50 hover:text-black border-black/20'
                    }`}
            >
                Skip Intro
            </button>
        </div>
    );
};

export default IntroVideo;
