import React, { useState } from 'react';
import { playCampaignSelectSound } from '../utils/sound';
import LeaderboardModal from './LeaderboardModal';

interface GameModeSelectionProps {
    onSelectMode: (mode: 'endless' | 'campaign') => void;
    onBack: () => void;
    username: string;
}

const GameModeSelection: React.FC<GameModeSelectionProps> = ({ onSelectMode, onBack, username }) => {
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white font-sans p-4 relative">
            <div className="w-full max-w-6xl bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800 relative overflow-hidden">

                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(30,30,30,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,30,30,0.5)_1px,transparent_1px)] bg-size-[40px_40px] opacity-20"></div>

                {/* Super Earth Logo Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <img src="/super_earth_logo.png" alt="Super Earth" className="w-2/3 opacity-30 object-contain" />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <h2 className="text-5xl font-bold text-center mb-16 text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-blue-500 uppercase tracking-widest drop-shadow-lg">
                        Illuminate Operations
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 w-full max-w-4xl">

                        {/* Endless Invasion */}
                        <button
                            onClick={() => onSelectMode('endless')}
                            className="group relative flex flex-col items-center p-8 bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-gray-700 hover:border-purple-500 transition-all duration-300 hover:scale-105 hover:bg-gray-800/90 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                        >
                            <div className="w-64 h-64 mb-8 relative transition-transform duration-300 group-hover:scale-110">
                                <img
                                    src="/mode_campaign.png"
                                    alt="Endless Invasion"
                                    className="w-full h-full object-contain drop-shadow-2xl"
                                />
                            </div>
                            <h3 className="text-3xl font-bold mb-4 uppercase tracking-wider text-purple-500 group-hover:text-purple-400">
                                Endless Invasion
                            </h3>
                            <p className="text-gray-400 text-center text-lg">
                                Repel infinite waves of Illuminate forces.
                            </p>
                        </button>

                        {/* Campaign */}
                        <button
                            onClick={() => {
                                playCampaignSelectSound();
                                onSelectMode('campaign');
                            }}
                            className="group relative flex flex-col items-center p-8 bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-gray-700 hover:border-yellow-500 transition-all duration-300 hover:scale-105 hover:bg-gray-800/90 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]"
                        >
                            <div className="w-64 h-64 mb-8 relative transition-transform duration-300 group-hover:scale-110">
                                <img
                                    src="/mode_endless.png"
                                    alt="Campaign"
                                    className="w-full h-full object-contain drop-shadow-2xl"
                                />
                            </div>
                            <h3 className="text-3xl font-bold mb-4 uppercase tracking-wider text-yellow-500 group-hover:text-yellow-400">
                                Galactic Campaign
                            </h3>
                            <p className="text-gray-400 text-center text-lg">
                                Strategic warfare to liberate sectors.
                            </p>
                        </button>

                    </div>

                    <button
                        onClick={onBack}
                        className="px-8 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all border border-gray-700 hover:border-gray-500 uppercase tracking-wider font-bold"
                    >
                        Back to Main Menu
                    </button>
                </div>

                {/* Global Leaderboard Button (Bottom Left) */}
                <div className="fixed bottom-6 left-6 z-50">
                    <button
                        onClick={() => setShowLeaderboard(true)}
                        className="group bg-gray-800/80 hover:bg-gray-700 backdrop-blur-md border-2 border-purple-500/30 hover:border-purple-500 text-purple-400 rounded-lg p-3 flex items-center gap-3 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                    >
                        <div className="w-10 h-10 relative">
                            <img
                                src="/trophy_purple.png"
                                alt="Leaderboard"
                                className="w-full h-full object-contain filter drop-shadow-[0_0_5px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform"
                            />
                        </div>
                        <div>
                            <div className="font-bold text-sm uppercase tracking-wider text-purple-300 group-hover:text-purple-100">Leaderboard</div>
                            <div className="text-[10px] text-purple-500/80 font-mono">Global Elite</div>
                        </div>
                    </button>

                    <LeaderboardModal
                        isOpen={showLeaderboard}
                        onClose={() => setShowLeaderboard(false)}
                        currentUsername={username}
                        initialDifficulty="Endless Invasion"
                        exclusiveMode={true}
                        theme="purple"
                    />
                </div>
            </div>
        </div>
    );
};

export default GameModeSelection;
