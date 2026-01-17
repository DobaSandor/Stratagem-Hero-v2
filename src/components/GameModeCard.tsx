import React from 'react';

interface GameModeCardProps {
    title: string;
    description: string;
    color: 'yellow' | 'purple' | 'red';
    onStart: () => void;
    icon: React.ReactNode;
    enableExpeditionMode?: boolean;
}

const GameModeCard: React.FC<GameModeCardProps> = ({ title, description, color, onStart, icon, enableExpeditionMode }) => {
    const [isExploding, setIsExploding] = React.useState(false);

    const handleStart = () => {
        if (enableExpeditionMode) {
            setIsExploding(true);
            setTimeout(() => {
                onStart();
                // Reset after navigation implies unmount, but just in case
                setIsExploding(false);
            }, 800); // Wait for explosion
        } else {
            onStart();
        }
    };

    const colorClasses = {
        yellow: {
            bg: 'from-yellow-500 to-orange-600',
            text: 'from-yellow-400 to-orange-500',
            button: 'bg-yellow-500 hover:bg-yellow-400',
            shadow: 'shadow-[0_0_20px_rgba(234,179,8,0.5)]',
            iconBg: 'bg-yellow-500'
        },
        purple: {
            bg: 'from-purple-500 to-indigo-600',
            text: 'from-purple-400 to-indigo-500',
            button: 'bg-purple-500 hover:bg-purple-400',
            shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]',
            iconBg: 'bg-purple-500'
        },
        red: {
            bg: 'from-red-600 to-rose-700',
            text: 'from-red-500 to-rose-600',
            button: 'bg-red-600 hover:bg-red-500',
            shadow: 'shadow-[0_0_20px_rgba(220,38,38,0.5)]',
            iconBg: 'bg-red-600'
        }
    };

    const theme = colorClasses[color];

    return (
        <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800 relative overflow-hidden text-center h-full flex flex-col">
            {/* Glow effect */}
            <div className={`absolute -inset-1 bg-linear-to-r ${theme.bg} rounded-2xl blur opacity-20`}></div>

            <div className="relative z-10 flex flex-col items-center grow">
                <div className={`w-24 h-24 ${theme.iconBg} rounded-full flex items-center justify-center mb-6 ${theme.shadow}`}>
                    {icon}
                </div>

                <h1 className={`text-4xl font-bold mb-4 text-transparent bg-clip-text bg-linear-to-r ${theme.text} uppercase tracking-widest`}>
                    {title}
                </h1>

                <p className="text-gray-400 mb-8 max-w-xs grow">
                    {description}
                </p>

                <div className="w-full relative">
                    <button
                        onClick={handleStart}
                        className={`w-full ${theme.button} text-black font-bold py-4 px-8 rounded-xl text-xl shadow-lg transform transition hover:scale-105 duration-200 mb-4 uppercase tracking-wider ${isExploding ? 'invisible' : ''}`}
                    >
                        Start Mission
                    </button>

                    {isExploding && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {[...Array(30)].map((_, i) => (
                                <div
                                    key={i}
                                    className="petal absolute"
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        animation: `explode 0.8s ease-out forwards`,
                                        transform: `rotate(${Math.random() * 360}deg)`,
                                        '--tx': `${(Math.random() - 0.5) * 300}px`,
                                        '--ty': `${(Math.random() - 0.5) * 300}px`,
                                        opacity: 0,
                                        left: '50%',
                                        top: '50%'
                                    } as any}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameModeCard;
