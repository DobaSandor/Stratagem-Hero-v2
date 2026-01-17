import React from 'react';

interface StartCardProps {
    username: string;
    onStart: () => void;
    onLogout: () => void;
}

const StartCard: React.FC<StartCardProps> = ({ username, onStart, onLogout }) => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white font-sans p-4">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800 relative overflow-hidden text-center">

                {/* Glow effect */}
                <div className="absolute -inset-1 bg-linear-to-r from-yellow-500 to-orange-600 rounded-2xl blur opacity-20"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-black" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                    </div>

                    <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-orange-500 uppercase tracking-widest">
                        Stratagem Hero
                    </h1>

                    <p className="text-gray-400 mb-8 max-w-xs">
                        Welcome back, <span className="text-yellow-400 font-bold">{username}</span>.
                        Prepare to spread managed democracy.
                    </p>

                    <button
                        onClick={onStart}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-xl text-xl shadow-lg transform transition hover:scale-105 duration-200 mb-4 uppercase tracking-wider"
                    >
                        Start Mission
                    </button>

                    <button
                        onClick={onLogout}
                        className="text-gray-500 hover:text-white text-sm transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StartCard;
