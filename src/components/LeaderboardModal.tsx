import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import type { ScoreEntry } from '../services/db';
import { DIFFICULTY_SETTINGS } from './DifficultySelection';
import type { DifficultyLevel } from './DifficultySelection';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUsername: string;
    initialDifficulty?: DifficultyLevel | 'Endless Invasion';
    exclusiveMode?: boolean;
    theme?: 'yellow' | 'purple';
}

// Border definitions (mirrored from ProfileModal for now)
const BORDERS = [
    { id: 'default', name: 'Default', levelReq: 1, class: 'border-gray-500' },
    { id: 'bronze', name: 'Bronze', levelReq: 5, class: 'border-orange-700' },
    { id: 'silver', name: 'Silver', levelReq: 10, class: 'border-slate-400' },
    { id: 'gold', name: 'Gold', levelReq: 15, class: 'border-yellow-500' },
    { id: 'platinum', name: 'Platinum', levelReq: 20, class: 'border-cyan-400' },
    { id: 'diamond', name: 'Diamond', levelReq: 25, class: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' },
    { id: 'n7', name: 'Spectre (N7)', class: 'border-transparent', levelReq: 0, secret: true, src: '/borders/n7.png' },
    { id: 'exp33', name: 'EXP33', class: 'border-transparent', levelReq: 0, secret: true, src: '/borders/exp33.png' },
];

const AVATARS = [
    { id: 'default', src: null },
    { id: 'avatar_1', src: '/avatars/avatar_1.png' },
    { id: 'avatar_2', src: '/avatars/avatar_2.png' },
    { id: 'avatar_3', src: '/avatars/avatar_3.png' },
    { id: 'avatar_4', src: '/avatars/avatar_4.png' },
];

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
    isOpen,
    onClose,
    currentUsername,
    initialDifficulty = 'Classic',
    exclusiveMode = false,
    theme = 'yellow'
}) => {
    const [scores, setScores] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'Endless Invasion'>(initialDifficulty);
    const [userRank, setUserRank] = useState<number | null>(null);

    // Theme Classes
    const themeClasses = {
        yellow: {
            border: 'border-yellow-500',
            text: 'text-yellow-500',
            textLight: 'text-yellow-400',
            bg: 'bg-yellow-500',
            shadow: 'shadow-[0_0_50px_rgba(234,179,8,0.3)]',
            highlightBg: 'bg-yellow-500/10',
            highlightBorder: 'border-yellow-500/50',
            buttonActive: 'bg-yellow-500 text-black shadow-lg',
            buttonHover: 'hover:bg-gray-700'
        },
        purple: {
            border: 'border-purple-500',
            text: 'text-purple-500',
            textLight: 'text-purple-400',
            bg: 'bg-purple-500',
            shadow: 'shadow-[0_0_50px_rgba(168,85,247,0.3)]',
            highlightBg: 'bg-purple-500/10',
            highlightBorder: 'border-purple-500/50',
            buttonActive: 'bg-purple-500 text-black shadow-lg',
            buttonHover: 'hover:bg-gray-700'
        }
    }[theme];

    // Initialize difficulty state correctly when prop changes
    useEffect(() => {
        if (exclusiveMode && initialDifficulty) {
            setSelectedDifficulty(initialDifficulty);
        } else if (initialDifficulty) {
            setSelectedDifficulty(initialDifficulty);
        }
    }, [initialDifficulty, exclusiveMode]);

    useEffect(() => {
        if (isOpen) {
            loadScores();
        }
    }, [isOpen, selectedDifficulty]);

    const loadScores = async () => {
        setLoading(true);
        try {
            const data = await db.getTopScores(selectedDifficulty);
            setScores(data);

            // Find user rank
            const rank = data.findIndex(s => s.username === currentUsername);
            if (rank !== -1) {
                setUserRank(rank + 1);
            } else {
                setUserRank(null);
            }
        } catch (error) {
            console.error("Failed to load scores:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-4xl bg-gray-900 border-2 ${themeClasses.border} rounded-xl overflow-hidden ${themeClasses.shadow} flex flex-col max-h-[90vh]`}>

                {/* Header */}
                <div className={`p-6 border-b border-gray-800 bg-gray-950/50 flex justify-between items-center`}>
                    <div className="flex items-center gap-4">
                        {theme === 'purple' ? (
                            <img src={`${import.meta.env.BASE_URL}trophy_purple.png`} alt="Trophy" className="w-10 h-10 object-contain drop-shadow" />
                        ) : (
                            <span className="text-3xl">🏆</span>
                        )}
                        <div>
                            <h2 className={`text-2xl font-black uppercase italic tracking-wider ${themeClasses.text}`}>Leaderboard</h2>
                            <div className="text-gray-500 text-xs font-mono uppercase tracking-widest">{selectedDifficulty} Protocol</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Difficulty Tabs (Hidden in Exclusive Mode) */}
                {!exclusiveMode && (
                    <div className="flex border-b border-gray-800 bg-gray-950/30 overflow-x-auto p-1 space-x-1">
                        {[...Object.keys(DIFFICULTY_SETTINGS), 'Endless Invasion'].map((level) => (
                            <button
                                key={level}
                                onClick={() => setSelectedDifficulty(level as DifficultyLevel | 'Endless Invasion')}
                                className={`flex-1 min-w-[100px] px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap rounded ${selectedDifficulty === level
                                    ? `${themeClasses.buttonActive}`
                                    : `text-gray-500 ${themeClasses.buttonHover}`
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className={`w-10 h-10 border-4 border-t-transparent ${themeClasses.border} rounded-full animate-spin`}></div>
                            <div className="text-gray-500 animate-pulse uppercase tracking-widest text-xs">Accessing Mainframe...</div>
                        </div>
                    ) : (
                        <>
                            {scores.length === 0 ? (
                                <div className="text-center py-20 text-gray-500 flex flex-col items-center gap-4">
                                    <div className="text-6xl opacity-20">∅</div>
                                    <div>No records found for this sector.</div>
                                    <div className="text-xs uppercase tracking-widest opacity-50">Be the first to conquest</div>
                                </div>
                            ) : (
                                scores.map((entry, index) => {
                                    const isMe = entry.username === currentUsername;
                                    const rank = index + 1;

                                    // Resolve styling
                                    const avatar = AVATARS.find(a => a.id === entry.avatarId) || AVATARS[0];
                                    const border = BORDERS.find(b => b.id === entry.activeBorder) || BORDERS[0];

                                    return (
                                        <div
                                            key={index}
                                            className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all group ${isMe
                                                ? `${themeClasses.highlightBg} ${themeClasses.border} shadow-lg z-10 scale-[1.01]`
                                                : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60 hover:border-gray-600'
                                                }`}
                                        >
                                            {/* Avatar Section */}
                                            <div className="flex-shrink-0 relative">
                                                <div className="relative w-16 h-16 flex items-center justify-center">
                                                    {/* Border Image Overlay */}
                                                    {border.src && (
                                                        <div className="absolute inset-[-4px] z-20 pointer-events-none">
                                                            <img src={border.src} alt="Border" className="w-full h-full object-contain scale-110" />
                                                        </div>
                                                    )}

                                                    <div className={`w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-500 overflow-hidden relative shadow-lg ${border.src ? '' : `border-4 ${border.class}`}`}>
                                                        {avatar.src ? (
                                                            <img src={avatar.src} alt={entry.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span>{entry.username.charAt(0).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Info Section */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center h-full gap-1">
                                                {/* Row 1: Name [Level] [Rank] */}
                                                <div className="flex items-center gap-2 overflow-hidden flex-wrap">
                                                    <h3 className={`text-lg font-black uppercase truncate ${isMe ? 'text-white' : 'text-gray-200 group-hover:text-white transition-colors'}`}>
                                                        {entry.username}
                                                    </h3>
                                                    {entry.level && (
                                                        <span className="text-xs font-mono text-gray-500 whitespace-nowrap">
                                                            [Lvl {entry.level}]
                                                        </span>
                                                    )}
                                                    {entry.rankTitle && (
                                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded whitespace-nowrap bg-gray-700 ${theme === 'purple' ? 'text-purple-200' : 'text-yellow-200'}`}>
                                                            [{entry.rankTitle}]
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Row 2: Title (Active Title) - Grayed */}
                                                <div className={`text-xs font-bold uppercase tracking-widest truncate ${entry.activeTitle === 'Expeditioner' ? 'text-yellow-400 font-serif drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]' : 'text-gray-600'}`}>
                                                    {entry.activeTitle ? `[${entry.activeTitle}]` : ''}
                                                </div>

                                                {/* Row 3: Score */}
                                                <div className={`text-sm font-bold uppercase tracking-wider ${theme === 'purple' ? 'text-purple-400' : 'text-yellow-500'}`}>
                                                    Score: {entry.score.toLocaleString()}
                                                </div>
                                            </div>

                                            {/* Rank Badge Section */}
                                            <div className="flex-shrink-0 pl-2">
                                                <div className={`h-10 px-4 flex items-center justify-center rounded-full font-black text-xl italic bg-gray-900 border border-gray-700 shadow-inner ${rank === 1 ? 'text-yellow-400 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' :
                                                    rank === 2 ? 'text-gray-300 border-gray-400/50' :
                                                        rank === 3 ? 'text-orange-400 border-orange-500/50' :
                                                            'text-gray-600'
                                                    }`}>
                                                    #{rank}
                                                </div>
                                            </div>
                                        </div >
                                    );
                                })
                            )}
                        </>
                    )}
                </div >

                {/* Footer (My Rank Indicator) */}
                {
                    userRank && userRank > 10 && (
                        <div className="p-4 border-t border-gray-800 bg-gray-950/80 backdrop-blur text-center text-sm text-gray-500 font-mono">
                            Your Rank: <span className={themeClasses.textLight}>#{userRank}</span>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default LeaderboardModal;
