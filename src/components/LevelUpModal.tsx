import React from 'react';
import { LEVEL_REWARDS } from '../data/levelSystem';
import type { LevelReward } from '../data/levelSystem';

// Avatars mapping (Can be imported from ProfileModal or defined here/shared file)
// For simplicity, defining mapping here matching ProfileModal to avoid circular deps if ProfileModal exports it
const LEVEL_AVATARS: Record<number, string> = {
    3: '/avatars/level3.png',
    5: '/avatars/level5.png',
    7: '/avatars/level7.png',
    10: '/avatars/level10.png',
    13: '/avatars/level13.png',
    15: '/avatars/level15.png',
    18: '/avatars/level18.png',
    20: '/avatars/level20.png',
    22: '/avatars/level22.png',
    25: '/avatars/level25.png',
};

interface LevelUpModalProps {
    level: number;
    onClose: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ level, onClose }) => {
    const reward: LevelReward | undefined = LEVEL_REWARDS[level];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md p-8 bg-gray-900 border-2 border-yellow-500 rounded-lg shadow-[0_0_50px_rgba(234,179,8,0.3)] flex flex-col items-center text-center transform scale-100 animate-in zoom-in-95 duration-300">

                {/* Header Decoration */}
                <div className="absolute -top-6 bg-gray-950 px-6 py-2 border border-yellow-500/50 rounded-full uppercase tracking-widest text-yellow-400 font-bold text-sm shadow-xl">
                    Promotion Granted
                </div>

                <div className="mt-4 mb-6">
                    <div className="w-24 h-24 rounded-full border-4 border-yellow-500 flex items-center justify-center bg-gray-800 shadow-[0_0_20px_rgba(234,179,8,0.5)] mx-auto mb-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-yellow-400/20 animate-pulse"></div>
                        <span className="text-5xl font-bold text-yellow-100 drop-shadow-md relative z-10">{level}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-300 to-yellow-600 uppercase tracking-widest">
                        Level Up!
                    </h2>
                </div>

                <div className="space-y-4 w-full mb-8">
                    <p className="text-gray-400 text-sm">
                        You have reached Level <span className="text-yellow-400 font-bold">{level}</span>.
                    </p>

                    {reward && (
                        <div className="bg-gray-800/50 p-4 rounded border border-gray-700/50">
                            <h4 className="text-yellow-500 text-xs uppercase tracking-wider mb-2 font-bold">Rewards Unlocked</h4>
                            <div className="space-y-4">
                                {reward.title && (
                                    <div className="flex items-center justify-center gap-2 text-purple-300 font-bold">
                                        <span>Title:</span>
                                        <span className="text-purple-100">{reward.title}</span>
                                    </div>
                                )}

                                {LEVEL_AVATARS[level] && (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 rounded-full bg-gray-900 border-2 border-yellow-500 overflow-hidden shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                                            <img src={LEVEL_AVATARS[level]} alt="Unlocked Avatar" className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-yellow-200 text-xs font-bold uppercase tracking-wider">New Avatar Unlocked</span>
                                    </div>
                                )}

                                {reward.items?.filter(i => i !== 'New Profile Avatar').map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-center gap-2 text-blue-300">
                                        <span>•</span>
                                        <span>{item}</span>
                                    </div>
                                ))}
                                {reward.border && (
                                    <div className="text-yellow-200 text-xs italic">
                                        New Profile Border Available
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold uppercase tracking-wider rounded transition-colors shadow-lg hover:shadow-yellow-500/20"
                >
                    Acknowledge
                </button>
            </div>
        </div>
    );
};

export default LevelUpModal;
