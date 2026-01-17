import React, { useMemo } from 'react';

interface StarryBackgroundProps {
    gold?: boolean;
}

const StarryBackground: React.FC<StarryBackgroundProps> = ({ gold }) => {
    // Memoize star data to prevent re-randomization on re-renders
    const starsLayer1 = useMemo(() => Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        style: {
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            animation: `twinkle ${Math.random() * 5 + 3}s infinite ease-in-out`,
            animationDelay: `${Math.random() * 5}s`
        }
    })), []);

    const starsLayer2 = useMemo(() => Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        style: {
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            animation: `twinkle ${Math.random() * 4 + 2}s infinite ease-in-out`,
            animationDelay: `${Math.random() * 4}s`
        }
    })), []);

    return (
        <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none ${gold ? 'bg-yellow-950' : 'bg-black'} transition-colors duration-1000`}>
            {/* Gradient Overlay for depth */}
            <div className={`absolute inset-0 bg-radial-gradient from-transparent ${gold ? 'via-yellow-900/40 to-yellow-950' : 'via-black/40 to-black'} z-10 transition-colors duration-1000`} />

            {/* Gold Mist Layers (Only provided if Gold) */}
            {gold && (
                <>
                    <div className="absolute inset-0 bg-yellow-500/10 blur-[100px] animate-[mist-flow_10s_ease-in-out_infinite] mix-blend-screen z-10"></div>
                    {/* Floating Gold Particles */}
                    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                        {[...Array(30)].map((_, i) => (
                            <div
                                key={`gold-particle-${i}`}
                                className="absolute w-1 h-1 bg-yellow-300 rounded-full shadow-[0_0_2px_#ffd700]"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    '--move-x': `${(Math.random() - 0.5) * 100}px`,
                                    animation: `float ${5 + Math.random() * 5}s linear infinite`,
                                    animationDelay: `-${Math.random() * 5}s`,
                                    opacity: Math.random() * 0.6
                                } as any}
                            ></div>
                        ))}
                    </div>
                    {/* Falling Rose Petals */}
                    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={`rose-petal-${i}`}
                                className="petal"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animation: `petal-fall ${10 + Math.random() * 10}s linear infinite`,
                                    animationDelay: `-${Math.random() * 10}s`,
                                    width: `${10 + Math.random() * 10}px`,
                                    height: `${10 + Math.random() * 10}px`,
                                    opacity: Math.random() * 0.8
                                } as any}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Stars Layer 1 (Small, Slow) */}
            <div className="absolute inset-0 animate-[spin_240s_linear_infinite]">
                {starsLayer1.map((star) => (
                    <div
                        key={`star-1-${star.id}`}
                        className={`absolute rounded-full opacity-40 ${gold ? 'bg-yellow-200' : 'bg-white'}`}
                        style={star.style}
                    />
                ))}
            </div>

            {/* Stars Layer 2 (Medium, Faster) */}
            <div className="absolute inset-0 animate-[spin_180s_linear_infinite_reverse]">
                {starsLayer2.map((star) => (
                    <div
                        key={`star-2-${star.id}`}
                        className={`absolute rounded-full opacity-30 ${gold ? 'bg-orange-300 shadow-[0_0_2px_rgba(253,186,116,0.8)]' : 'bg-blue-200 shadow-[0_0_2px_rgba(147,197,253,0.8)]'}`}
                        style={star.style}
                    />
                ))}
            </div>

            {/* Shooting Stars (Occasional) */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] animate-[shooting-star_8s_infinite_linear] opacity-0">
                <div className="w-[100px] h-px bg-white shadow-[0_0_10px_white]" />
            </div>

            <style>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                @keyframes shooting-star {
                    0% { transform: translate(-100px, -100px) rotate(45deg); opacity: 0; }
                    10% { opacity: 1; }
                    20% { transform: translate(600px, 600px) rotate(45deg); opacity: 0; }
                    100% { opacity: 0; }
                }
             `}</style>
        </div>
    );
};

export default React.memo(StarryBackground);
