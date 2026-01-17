import React from 'react';

interface ShiftReportProps {
    day: number;
    creditsEarned: number;
    processedCount: number;
    onContinue: () => void;
}

const ShiftReport: React.FC<ShiftReportProps> = ({ day, creditsEarned, processedCount, onContinue }) => {
    return (
        <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white font-sans p-8 relative overflow-hidden">

            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(50,0,0,0.5)_0%,rgba(0,0,0,1)_100%)]"></div>
            <div className="absolute top-0 w-full h-2 bg-red-900 shadow-[0_0_20px_rgba(220,38,38,0.5)]"></div>

            <div className="z-10 bg-gray-900/80 backdrop-blur-md p-12 rounded-lg border-2 border-red-900/50 shadow-2xl max-w-2xl w-full text-center relative">

                <h1 className="text-4xl font-bold uppercase tracking-[0.2em] text-red-500 mb-2">Shift Report</h1>
                <h2 className="text-xl text-gray-400 font-mono mb-12">Day {day} Summary</h2>

                <div className="space-y-6 mb-12">
                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-300 uppercase tracking-wider">Citizens Processed</span>
                        <span className="text-2xl font-mono">{processedCount}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-300 uppercase tracking-wider">Credits Earned</span>
                        <span className={`text-2xl font-mono ${creditsEarned >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {creditsEarned > 0 ? '+' : ''}{creditsEarned}
                        </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-300 uppercase tracking-wider">Account Balance</span>
                        <span className="text-2xl font-mono text-yellow-500">
                            {/* Placeholder for total balance if we track it globally later */}
                            {100 + creditsEarned}
                        </span>
                    </div>
                </div>

                <div className="mb-12">
                    <p className="text-gray-400 italic">
                        "{creditsEarned > 0 ? 'Adequate performance. The Ministry of Truth acknowledges your effort.' : 'Substandard performance. Improvement is mandatory.'}"
                    </p>
                </div>

                <button
                    onClick={onContinue}
                    className="px-10 py-4 bg-red-900/40 hover:bg-red-900 border border-red-600/50 hover:border-red-500 text-red-100 uppercase tracking-widest font-bold transition-all duration-300 rounded shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]"
                >
                    Ackowledge & Sign Out
                </button>

            </div>
        </div>
    );
};

export default ShiftReport;
