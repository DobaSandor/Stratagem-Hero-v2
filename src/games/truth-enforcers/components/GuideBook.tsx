import React, { useState } from 'react';

interface GuideBookProps {
    isOpen: boolean;
    onClose: () => void;
    logo: string;
    title: string;
    pages: { title: string, content: React.ReactNode }[];
}

const GuideBook: React.FC<GuideBookProps> = ({ isOpen, onClose, logo, title, pages }) => {
    const [currentPage, setCurrentPage] = useState(-1); // -1 is Cover

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentPage < pages.length - 1) setCurrentPage(p => p + 1);
    };

    const handlePrev = () => {
        if (currentPage > -1) setCurrentPage(p => p - 1);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative w-[600px] h-[800px] bg-[#fdfbf6] shadow-2xl rounded-sm overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
                style={{
                    boxShadow: 'inset 20px 0 50px rgba(0,0,0,0.1), 0 0 20px rgba(0,0,0,0.5)',
                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")' // Subtle texture pattern (optional)
                }}
            >
                {/* --- COVER PAGE --- */}
                {currentPage === -1 && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-10 bg-slate-800 text-white relative border-8 border-yellow-600/50">
                        <div className="w-full h-full border-2 border-yellow-500/30 flex flex-col items-center justify-center p-8">
                            <img src={logo} alt="Logo" className="w-48 h-48 mb-12 drop-shadow-2xl opacity-90" />
                            <h1 className="text-5xl font-bold uppercase tracking-[0.2em] text-center mb-4 text-yellow-500">{title}</h1>
                            <div className="w-32 h-1 bg-yellow-600 mb-4"></div>
                            <p className="text-yellow-500/60 uppercase tracking-widest text-sm">Authorized Personnel Only</p>
                        </div>

                        {/* Book Binding Shadow */}
                        <div className="absolute left-0 top-0 w-8 h-full bg-linear-to-r from-black/50 to-transparent"></div>
                    </div>
                )}

                {/* --- CONTENT PAGES --- */}
                {currentPage >= 0 && (
                    <div className="w-full h-full p-12 flex flex-col relative text-slate-800">
                        {/* Header */}
                        <div className="border-b-2 border-slate-300 pb-4 mb-8 flex justify-between items-end">
                            <h2 className="text-3xl font-bold uppercase tracking-widest text-slate-900">{pages[currentPage].title}</h2>
                            <span className="font-mono text-slate-400">PAGE {currentPage + 1}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 font-serif text-lg leading-relaxed whitespace-pre-line">
                            {pages[currentPage].content}
                        </div>

                        {/* Book Binding Shadow */}
                        <div className="absolute left-0 top-0 w-12 h-full bg-linear-to-r from-black/10 to-transparent pointer-events-none"></div>
                    </div>
                )}

                {/* --- CONTROLS --- */}
                <div className="absolute bottom-6 left-0 w-full px-12 flex justify-between items-center text-slate-500 font-bold tracking-widest uppercase text-xs z-10">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === -1}
                        className={`hover:text-amber-600 transition-colors ${currentPage === -1 ? 'opacity-0' : 'opacity-100'}`}
                    >
                        ← Previous
                    </button>

                    <button
                        onClick={onClose}
                        className="hover:text-red-600 transition-colors"
                    >
                        Close Book
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentPage === pages.length - 1}
                        className={`hover:text-amber-600 transition-colors ${currentPage === pages.length - 1 ? 'opacity-0' : 'opacity-100'}`}
                    >
                        Next →
                    </button>
                </div>

            </div>
        </div>
    );
};

export default GuideBook;
