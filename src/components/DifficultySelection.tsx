import React from 'react';

export type DifficultyLevel = 'Mediocre' | 'Classic' | 'Hardcore' | 'Permadeath';

export interface DifficultyConfig {
    name: DifficultyLevel;
    roundTime: number;
    roundBonusBase: number;
    roundBonusMultiplier: number;
    description: string;
    icon: string;
    color: string;
}

export const DIFFICULTY_SETTINGS: Record<DifficultyLevel, DifficultyConfig> = {
    'Classic': {
        name: 'Classic',
        roundTime: 12,
        roundBonusBase: 20,
        roundBonusMultiplier: 10,
        description: 'Standard issue Stratagem Hero experience. (12s Round Time)',
        icon: '/difficulty_classic.png',
        color: 'text-blue-400'
    },
    'Mediocre': {
        name: 'Mediocre',
        roundTime: 12,
        roundBonusBase: 30,
        roundBonusMultiplier: 15,
        description: 'For those who need a little more challenge. Small penalty for missed inputs (12s Round Time)',
        icon: '/difficulty_mediocre.png',
        color: 'text-green-400'
    },

    'Hardcore': {
        name: 'Hardcore',
        roundTime: 10,
        roundBonusBase: 50,
        roundBonusMultiplier: 20,
        description: 'Only for the elite, Fast reflexes required. Huge penalty for missed inputs (10s Round Time)',
        icon: '/difficulty_hardcore.png',
        color: 'text-red-400'
    },
    'Permadeath': {
        name: 'Permadeath',
        roundTime: 10,
        roundBonusBase: 100,
        roundBonusMultiplier: 50,
        description: 'ONE LIFE. NO MERCY. No mistakes allowed, just like on the battlefield. (10s Round Time)',
        icon: '/permadeath_icon.png',
        color: 'text-red-600 animate-pulse'
    }
};

interface DifficultySelectionProps {
    onSelect: (difficulty: DifficultyLevel) => void;
    onBack: () => void;
}

const DifficultySelection: React.FC<DifficultySelectionProps> = ({ onSelect, onBack }) => {
    return (
        <>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,30,30,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,30,30,0.5)_1px,transparent_1px)] bg-size-[40px_40px] opacity-20"></div>

            {/* Super Earth Logo Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <img src="/super_earth_logo.png" alt="Super Earth" className="w-2/3 opacity-50 object-contain" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
                <h2 className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-orange-500 uppercase tracking-widest drop-shadow-lg">
                    Select Difficulty
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 w-full max-w-[95vw]">
                    {(Object.keys(DIFFICULTY_SETTINGS) as DifficultyLevel[]).map((level) => {
                        const config = DIFFICULTY_SETTINGS[level];
                        return (
                            <button
                                key={level}
                                onClick={() => onSelect(level)}
                                className="group relative flex flex-col items-center p-6 bg-gray-800/80 backdrop-blur-sm rounded-xl border-2 border-gray-700 hover:border-yellow-500 transition-all duration-300 hover:scale-105 hover:bg-gray-800/90 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                            >
                                <div className="w-48 h-48 mb-6 relative transition-transform duration-300 group-hover:rotate-3">
                                    <img
                                        src={config.icon}
                                        alt={level}
                                        className="w-full h-full object-contain drop-shadow-2xl"
                                    />
                                </div>

                                <h3 className={`text-2xl font-bold mb-2 uppercase tracking-wider ${config.color}`}>
                                    {level}
                                </h3>

                                <p className="text-gray-400 text-center text-sm min-h-12">
                                    {config.description}
                                </p>
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={onBack}
                    className="px-8 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all border border-gray-700 hover:border-gray-500 uppercase tracking-wider font-bold"
                >
                    Exit to Main Menu
                </button>
            </div>
        </>
    );
};

export default DifficultySelection;
