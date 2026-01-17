import React, { useState, useEffect } from 'react';

interface SecurityModalProps {
    onSuccess: () => void;
    onClose: () => void;
}

const SecurityModal: React.FC<SecurityModalProps> = ({ onSuccess, onClose }) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);

    const PASSWORD = '12180403';

    useEffect(() => {
        if (shake) {
            const timer = setTimeout(() => setShake(false), 500);
            return () => clearTimeout(timer);
        }
    }, [shake]);

    const handleNumberClick = (num: string) => {
        if (input.length < 8) {
            setInput(prev => prev + num);
            setError(false);
        }
    };

    const handleClear = () => {
        setInput('');
        setError(false);
    };

    const handleEnter = () => {
        if (input === PASSWORD) {
            onSuccess();
        } else {
            setError(true);
            setShake(true);
            setInput('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm overflow-hidden font-mono">
            {/* Background Red Static Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay">
                <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiM3ZjdmN2YiLz4KPC9zdmc+')] animate-pulse"></div>
            </div>
            <div className="absolute inset-0 pointer-events-none bg-red-900/10 z-0"></div>

            {/* Main Container */}
            <div
                className={`relative z-10 bg-black border-2 border-red-600 p-8 rounded-lg shadow-[0_0_50px_rgba(220,38,38,0.5)] w-full max-w-sm flex flex-col items-center gap-6 ${shake ? 'animate-shake' : ''}`}
            >
                {/* Header */}
                <div className="text-center w-full">
                    <h2 className="text-red-500 font-bold text-2xl uppercase tracking-[0.2em] mb-2 animate-pulse">
                        Security Check
                    </h2>
                    <div className="h-px w-full bg-red-800 mb-4"></div>
                    <p className="text-red-400/70 text-xs uppercase tracking-widest">
                        Restricted Access <br /> Truth Enforcers Only
                    </p>
                </div>

                {/* Display Screen */}
                <div className="w-full bg-red-950/30 border border-red-800 rounded p-4 text-center min-h-[60px] flex items-center justify-center relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                    {/* Scanlines Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(255,0,0,0.02),rgba(255,0,0,0.06))] bg-size-[100%_4px,3px_100%] pointer-events-none"></div>

                    {error ? (
                        <span className="text-red-500 font-black tracking-widest text-lg animate-pulse">ACCESS DENIED</span>
                    ) : (
                        <span className="text-red-500 font-mono text-3xl tracking-[0.5em] drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">
                            {input.padEnd(8, '*').split('').map((_, i) => (
                                <span key={i} className={i < input.length ? "text-red-400" : "text-red-900/50"}>
                                    {i < input.length ? '●' : '•'}
                                </span>
                            ))}
                        </span>
                    )}
                </div>

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-4 w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num.toString())}
                            className="aspect-square bg-gray-900 border border-red-900/50 hover:border-red-500 text-red-500 hover:text-red-400 hover:bg-red-950 transition-all duration-100 flex items-center justify-center text-xl font-bold rounded shadow-[0_0_10px_rgba(0,0,0,0.5)] active:scale-95"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleClear}
                        className="aspect-square bg-red-950/50 border border-red-900 hover:bg-red-900/50 text-red-400 hover:text-red-200 transition-all flex items-center justify-center font-bold text-xs uppercase rounded active:scale-95"
                    >
                        CLR
                    </button>
                    <button
                        onClick={() => handleNumberClick('0')}
                        className="aspect-square bg-gray-900 border border-red-900/50 hover:border-red-500 text-red-500 hover:text-red-400 hover:bg-red-950 transition-all flex items-center justify-center text-xl font-bold rounded shadow-[0_0_10px_rgba(0,0,0,0.5)] active:scale-95"
                    >
                        0
                    </button>
                    <button
                        onClick={handleEnter}
                        className="aspect-square bg-red-700 hover:bg-red-600 border border-red-500 text-white transition-all flex items-center justify-center font-bold text-xs uppercase rounded shadow-[0_0_15px_rgba(220,38,38,0.4)] active:scale-95"
                    >
                        ENT
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="mt-4 text-red-700 hover:text-red-400 text-xs uppercase tracking-widest transition-colors"
                >
                    [ Cancel ]
                </button>
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}</style>
        </div>
    );
};

export default SecurityModal;
