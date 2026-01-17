import React from 'react';
import { playCampaignSelectSound } from '../../../utils/sound';

interface TruthEnforcersSelectionProps {
    onSelectMode: (mode: 'endless' | 'campaign') => void;
    onBack: () => void;
}

const TruthEnforcersSelection: React.FC<TruthEnforcersSelectionProps> = ({ onSelectMode, onBack }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-sans p-4">
            <div className="w-full max-w-6xl bg-gray-900 rounded-2xl p-8 shadow-2xl border border-red-900 overflow-hidden relative">

                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(139,0,0,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(139,0,0,0.2)_1px,transparent_1px)] bg-size-[40px_40px] opacity-20"></div>

                {/* Red Vignette */}
                <div className="absolute inset-0 bg-radial-gradient(circle_at_center,transparent_0%,rgba(50,0,0,0.8)_100%) pointer-events-none"></div>

                {/* Logo Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <img src={`${import.meta.env.BASE_URL}truth_enforcers.png`} alt="Truth Enforcers" className="w-2/3 opacity-10 object-contain grayscale" />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <h2 className="text-5xl font-bold text-center mb-16 text-transparent bg-clip-text bg-linear-to-r from-red-500 to-rose-700 uppercase tracking-widest drop-shadow-[0_2px_10px_rgba(220,38,38,0.5)]">
                        Enforcer Operations
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 w-full max-w-4xl">

                        {/* Endless Mode */}
                        <button
                            onClick={() => {
                                onSelectMode('endless');
                                // Placeholder Alert
                                alert("Under Construction: Endless Mode coming soon!");
                            }}
                            className="group relative flex flex-col items-center p-8 bg-black/60 backdrop-blur-sm rounded-2xl border-2 border-red-900/50 hover:border-red-500 transition-all duration-300 hover:scale-105 hover:bg-black/80 hover:shadow-[0_0_30px_rgba(220,38,38,0.3)]"
                        >
                            <div className="w-64 h-64 mb-8 relative transition-transform duration-300 group-hover:scale-110">
                                <img
                                    src={`${import.meta.env.BASE_URL}enforcer_endless.png`}
                                    alt="Endless"
                                    className="w-full h-full object-contain drop-shadow-2xl"
                                />
                            </div>
                            <h3 className="text-3xl font-bold mb-4 uppercase tracking-wider text-red-500 group-hover:text-red-400">
                                Endless
                            </h3>
                            <p className="text-gray-400 text-center text-lg">
                                Eliminate the Traitors. No Mercy.
                            </p>
                        </button>

                        {/* Enforcer Campaign */}
                        <button
                            onClick={() => {
                                playCampaignSelectSound();
                                onSelectMode('campaign');
                            }}
                            className="group relative flex flex-col items-center p-8 bg-black/60 backdrop-blur-sm rounded-2xl border-2 border-red-900/50 hover:border-rose-500 transition-all duration-300 hover:scale-105 hover:bg-black/80 hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]"
                        >
                            <div className="w-64 h-64 mb-8 relative transition-transform duration-300 group-hover:scale-110">
                                <img
                                    src={`${import.meta.env.BASE_URL}enforcer_campaign.png`}
                                    alt="Enforcer Campaign"
                                    className="w-full h-full object-contain drop-shadow-2xl"
                                />
                            </div>
                            <h3 className="text-3xl font-bold mb-4 uppercase tracking-wider text-rose-500 group-hover:text-rose-400">
                                Enforcer Campaign
                            </h3>
                            <p className="text-gray-400 text-center text-lg">
                                Root out the corruption within.
                            </p>
                        </button>

                    </div>

                    <button
                        onClick={onBack}
                        className="px-8 py-3 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-300 hover:text-white transition-all border border-red-900/50 hover:border-red-500 uppercase tracking-wider font-bold"
                    >
                        Back to Main Menu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TruthEnforcersSelection;
