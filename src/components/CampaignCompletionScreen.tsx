import React, { useEffect, useState } from 'react';

interface CampaignCompletionScreenProps {
    onContinue: () => void;
    username: string;
}

const CampaignCompletionScreen: React.FC<CampaignCompletionScreenProps> = ({ onContinue, username }) => {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowContent(true), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 text-white font-sans overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-900/20 via-black to-black"></div>
            <div
                className="absolute inset-0 opacity-10 animate-pulse"
                style={{ background: 'linear-gradient(to bottom right, #111827, #1f2937)' }}
            ></div>

            <div className={`relative z-10 flex flex-col items-center max-w-4xl p-8 text-center transition-all duration-1000 transform ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                {/* Super Earth Logo / Icon Placeholder */}
                <div className="w-32 h-32 mb-8 rounded-full bg-yellow-500/10 border-4 border-yellow-500 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-spin-slow">
                    <span className="text-6xl" >🦅</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-linear-to-b from-yellow-300 to-yellow-600 uppercase tracking-widest mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                    Campaign Victory
                </h1>

                <div className="h-1 w-32 bg-yellow-500 mb-8 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>

                <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
                    Outstanding work, <span className="text-yellow-400 font-bold">{username}</span>.
                    <br />
                    The Illuminate army has been culled. You definietly have delayed their evil plans. You've proved to yourself that you have the strenght, and the courage to be Free.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
                    <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-lg backdrop-blur-sm">
                        <div className="text-gray-500 text-sm uppercase tracking-wider mb-2">Status</div>
                        <div className="text-green-400 text-xl font-bold">Mission Accomplished</div>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-lg backdrop-blur-sm">
                        <div className="text-gray-500 text-sm uppercase tracking-wider mb-2">XP Awarded</div>
                        <div className="text-yellow-400 text-xl font-bold">1500</div>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-lg backdrop-blur-sm">
                        <div className="text-gray-500 text-sm uppercase tracking-wider mb-2">Title Awarded</div>
                        <div className="text-purple-400 text-xl font-bold">Purger of The Illuminite</div>
                    </div>
                </div>

                <button
                    onClick={onContinue}
                    className="px-12 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xl rounded-lg uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] transition-all transform hover:scale-105 active:scale-95"
                >
                    Return to Fleet
                </button>
            </div>
        </div>
    );
};

export default CampaignCompletionScreen;
