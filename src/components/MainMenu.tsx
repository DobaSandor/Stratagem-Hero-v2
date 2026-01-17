import React, { useState, useEffect } from 'react';
import GameModeCard from './GameModeCard';
import { db } from '../services/db';
import LevelUpModal from './LevelUpModal';
import ProfileModal from './ProfileModal';
import DailyMissionsModal from './DailyMissionsModal';
import StarryBackground from './StarryBackground';
import { MISSION_POOL } from '../data/dailyMissions';
import type { UserMission } from '../data/dailyMissions';

interface MainMenuProps {
    username: string;
    onStart: (mode: 'hero' | 'illuminated' | 'truth_enforcers') => void;
    onLogout: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ username, onStart, onLogout }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hasPurgedIlluminite, setHasPurgedIlluminite] = useState(false);
    const [isStratagemMaster, setIsStratagemMaster] = useState(false);
    const [rank, setRank] = useState('Recruit');
    const [rankStyle, setRankStyle] = useState('text-yellow-500');

    // Level System State
    const [levelData, setLevelData] = useState({ level: 1, currentXP: 0, nextLevelXP: 100, progressPercent: 0 });
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showDailyMissions, setShowDailyMissions] = useState(false);
    const [isClosingMissions, setIsClosingMissions] = useState(false);
    const [missions, setMissions] = useState<UserMission[]>([]);
    const [activeBorder, setActiveBorder] = useState('default');
    const [avatarId, setAvatarId] = useState('default');
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const [gifts, setGifts] = useState<{ id: string; fromUsername: string; xpAmount: number }[]>([]);
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [currentGift, setCurrentGift] = useState<{ id: string; fromUsername: string; xpAmount: number } | null>(null);

    // Drag / Spin State
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [enableSpin, setEnableSpin] = useState(false);
    const [enableSpaceBg, setEnableSpaceBg] = useState(false);
    const [enableExpeditionBg, setEnableExpeditionBg] = useState(false);

    // Audio State
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const [volume, setVolume] = useState(() => {
        return parseFloat(localStorage.getItem('stratagem_hero_bgm_volume') || '0.5');
    });
    const [isMuted, setIsMuted] = useState(() => {
        return localStorage.getItem('stratagem_hero_bgm_muted') === 'true';
    });

    useEffect(() => {
        // Initialize Audio
        if (!audioRef.current) {
            audioRef.current = new Audio('/sounds/MainMenuMusic.mp3');
            audioRef.current.loop = true;
        }

        const audio = audioRef.current;
        // Apply initial volume
        audio.volume = isMuted ? 0 : volume;

        // Try to play
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Audio play prevented (autoplay policy):", error);
            });
        }

        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, []);

    // Update volume/mute when changed
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
            localStorage.setItem('stratagem_hero_bgm_volume', volume.toString());
            localStorage.setItem('stratagem_hero_bgm_muted', isMuted.toString());
        }
    }, [volume, isMuted]);

    const handleToggleSpin = (enabled: boolean) => {
        setEnableSpin(enabled);
        db.setSpinSetting(username, enabled);
    };

    const handleToggleSpaceBg = (enabled: boolean) => {
        setEnableSpaceBg(enabled);
        db.updateUserStats(username, { enableSpaceBg: enabled });
    };

    const refreshUserData = async () => {
        // Check Mission 10 Completion
        const highestUnlockedId = await db.getMissionProgress(username);
        if (highestUnlockedId > 10) {
            setHasPurgedIlluminite(true);
        }

        // Check Stratagem Hero High Score
        const score = await db.getUserScore(username, 'Hardcore');
        if (score >= 5000) {
            setIsStratagemMaster(true);
        }

        // Get Level Data
        const data = await db.getUserLevelData(username);
        setLevelData(data);

        // Get Rank & Style
        const { getRankForLevel, getRankStyle } = await import('../data/levelSystem');
        setRank(getRankForLevel(data.level));
        setRankStyle(getRankStyle(data.level));

        // Check if Level Up Modal should be shown
        const lastSeenLevel = parseInt(localStorage.getItem(`stratagem_hero_last_seen_level_${username}`) || '1');
        if (data.level > lastSeenLevel) {
            setShowLevelUp(true);
        }

        // Get Active Border and Avatar
        const stats = await db.getUserStats(username);
        setActiveBorder(stats.activeBorder);
        setAvatarId(stats.avatarId || 'default');
        setActiveBorder(stats.activeBorder);
        setAvatarId(stats.avatarId || 'default');
        setPendingRequestsCount(stats.friendRequests?.length || 0);
        setEnableSpaceBg(stats.enableSpaceBg || false);
        setEnableExpeditionBg(stats.useExpeditionBackground || false);
        setEnableSpin(stats.enableSpin ?? false);

        // Initialize Daily Missions
        const dailyMissions = await db.getDailyMissions(username);
        setMissions(dailyMissions);

        // Check Gifts
        const giftQueue = stats.giftsReceived || [];
        setGifts(giftQueue);
        // Show first gift if exists and no modal
        if (giftQueue.length > 0 && !showGiftModal) {
            // Can choose to auto-show or just show button. 
            // User asked for "Present Button under Daily Missions"
        }
    };

    useEffect(() => {
        refreshUserData();

        // Subscribe to Realtime Updates
        const unsubscribe = db.subscribeToUser(username, () => {
            refreshUserData();
        });

        return () => {
            unsubscribe();
        };
    }, [username]);

    const modes = [
        {
            id: 'hero',
            title: 'Stratagem Hero',
            description: 'Test your reflex and memory. Input stratagem codes as fast as possible.',
            color: 'yellow' as const,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-black" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
            )
        },
        {
            id: 'illuminated',
            title: 'Illuminate Invasion',
            description: 'Destroy the Fleets of the Illuminate. The Enemy hides but you can outsmart them.',
            color: 'purple' as const,
            icon: (
                <img
                    src="/illuminate_icon.png"
                    alt="Illuminate"
                    className="w-16 h-16 object-contain opacity-80"
                    draggable={false}
                    style={{ WebkitUserDrag: 'none' } as React.CSSProperties}
                />
            )
        },
        {
            id: 'truth_enforcers',
            title: 'Truth Enforcers',
            description: "The Enemy hides within our ranks, it is your duty to cleanse our Ranks and bring back Order to Super Earth's Finest Warriors, the Helldivers. ",
            color: 'red' as const,
            icon: (
                <img
                    src="/truth_enforcers.png"
                    alt="Truth Enforcers"
                    className="w-16 h-16 object-contain opacity-80"
                    draggable={false}
                    style={{ WebkitUserDrag: 'none' } as React.CSSProperties}
                />
            )
        }
    ];


    const nextMode = () => {
        setCurrentIndex((prev) => (prev + 1) % modes.length);
    };

    const prevMode = () => {
        setCurrentIndex((prev) => (prev - 1 + modes.length) % modes.length);
    };

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

    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white font-sans p-4 overflow-hidden relative overscroll-none"
            style={{ touchAction: 'none' }}
        >
            {(enableSpaceBg || enableExpeditionBg) && <StarryBackground gold={enableExpeditionBg} />}
            {/* User Icon */}
            <div className="absolute top-0 left-0 m-4 z-50">
                <button
                    onClick={() => setShowProfile(true)}
                    className="w-20 h-20 group cursor-pointer relative outline-none"
                    type="button"
                >
                    {/* Inner Circle: Bg, Border, Image/Text, Overflow Hidden */}
                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* Border Image Overlay */}
                        {BORDERS.find(b => b.id === activeBorder)?.src && (
                            <div className="absolute inset-[-4px] z-20 pointer-events-none">
                                <img src={BORDERS.find(b => b.id === activeBorder)?.src} alt="Border" className="w-full h-full object-contain scale-110" />
                            </div>
                        )}

                        <div className={`absolute inset-0 rounded-full bg-gray-900/80 backdrop-blur-sm flex items-center justify-center overflow-hidden transition-all duration-300 ${BORDERS.find(b => b.id === activeBorder)?.src ? '' : `border-4 ${BORDERS.find(b => b.id === activeBorder)?.class || 'border-gray-500 hover:border-yellow-400'}`}`}>
                            {avatarId && avatarId !== 'default' ? (
                                <img src={`/avatars/${avatarId}.png`} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            ) : (
                                <span className="text-4xl font-bold text-yellow-400 group-hover:scale-110 transition-transform">
                                    {username.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Global Notification Dot */}
                    {pendingRequestsCount > 0 && (
                        <div className="absolute top-0 right-0 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center border-2 border-gray-950 shadow-lg animate-pulse z-30">
                            <span className="text-[10px] font-bold text-white">{pendingRequestsCount}</span>
                        </div>
                    )}

                    {/* Level Banner (Bottom Right) - Unclipped */}
                    <div className="absolute -bottom-4 -right-1 flex flex-col items-center drop-shadow-lg z-20 transition-transform group-hover:scale-110">
                        {/* Banner Body */}
                        <div className="bg-gradient-to-b from-yellow-600 to-yellow-800 text-white text-xs font-bold w-6 h-5 flex items-center justify-center border-x border-t border-yellow-500 shadow-sm relative z-20">
                            {levelData.level}
                        </div>
                        {/* Banner Tail */}
                        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[8px] border-l-transparent border-r-transparent border-t-yellow-800 relative z-10 -mt-[1px]"></div>
                    </div>

                    {/* Tooltip/Full Name on Hover */}
                    <div className="absolute left-24 top-0 bg-gray-900 text-yellow-400 text-xl px-5 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-yellow-400/30 z-50 shadow-xl cursor-default" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <div className="font-bold">{username}</div>
                            <div className="text-sm text-yellow-600 font-mono">LVL {levelData.level}</div>
                        </div>

                        {/* Rank Display */}
                        <div className="mb-2 text-center border-b border-gray-700 pb-2">
                            <span className="text-xs text-gray-400 uppercase tracking-widest block">Current Rank</span>
                            <span className={`text-lg uppercase tracking-wider ${rankStyle}`}>
                                {rank}
                            </span>
                        </div>

                        {/* XP Bar */}
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-3 border border-gray-700">
                            <div
                                className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-all duration-500"
                                style={{ width: `${levelData.progressPercent}%` }}
                            ></div>
                        </div>
                        <div className="text-[10px] text-gray-500 text-right -mt-2 mb-2 font-mono">
                            {Math.floor(levelData.currentXP)} / {levelData.nextLevelXP} XP
                        </div>

                        {hasPurgedIlluminite && (
                            <div className="mb-2">
                                <div className="text-sm font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-400 via-pink-500 to-purple-500 animate-pulse tracking-wider">
                                    Purger of the Illuminite
                                </div>
                                <div className="h-px bg-gray-700 my-1 w-full"></div>
                                <div className="text-xs text-gray-400 font-normal italic">
                                    Delayed the Illuminite's Arrival
                                </div>
                            </div>
                        )}
                        {isStratagemMaster && (
                            <div className="mt-1">
                                <div className="text-sm font-bold bg-clip-text text-transparent bg-linear-to-r from-yellow-400 to-red-600 animate-pulse tracking-wider">
                                    Stratagem Master
                                </div>
                                <div className="h-px bg-gray-700 my-1 w-full"></div>
                                <div className="text-xs text-gray-400 font-normal italic">
                                    Achieved 5000 Points in Hardcore
                                </div>
                            </div>
                        )}

                        {/* Admin Debug Controls */}
                        {username === 'admin' && (
                            <div className="mt-4 pt-2 border-t border-gray-700">
                                <div className="text-[10px] text-gray-500 font-mono mb-1 text-center">DEBUG: SET LEVEL</div>
                                <div className="flex gap-1">
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        className="w-12 bg-gray-950 border border-gray-600 rounded px-1 text-xs text-center text-yellow-500 focus:border-yellow-500 outline-none"
                                        placeholder="#"
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                                const val = parseInt(e.currentTarget.value);
                                                if (!isNaN(val)) {
                                                    localStorage.setItem(`stratagem_hero_last_seen_level_${username}`, (val - 1).toString());
                                                    await db.setLevel(username, val);
                                                    refreshUserData();
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={async () => {
                                            const input = document.querySelector('input[placeholder="#"]') as HTMLInputElement;
                                            if (input) {
                                                const val = parseInt(input.value);
                                                if (!isNaN(val)) {
                                                    localStorage.setItem(`stratagem_hero_last_seen_level_${username}`, (val - 1).toString());
                                                    await db.setLevel(username, val);
                                                    refreshUserData();
                                                }
                                            }
                                        }}
                                        className="flex-1 bg-red-900/50 hover:bg-red-800 text-[10px] text-red-200 uppercase rounded border border-red-800/50"
                                    >
                                        Set
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </button>
            </div>

            {/* Daily Missions Button */}
            <div className="absolute top-0 right-0 m-4 z-50">
                <button
                    onClick={() => setShowDailyMissions(true)}
                    className="group relative w-16 h-16 bg-gray-900/80 backdrop-blur-sm border-2 border-yellow-500/50 hover:border-yellow-500 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)]"
                    title="Daily Missions"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500 group-hover:text-yellow-400 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>

                    {/* Pulsing indicator if unclaimed? For now just a subtle shine */}
                    <div className="absolute inset-0 rounded-full bg-linear-to-tr from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    {/* Hover Tooltip (Mini Mission View) */}
                    <div className="absolute right-20 top-0 w-64 bg-gray-900 text-left p-4 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-yellow-500/30 shadow-xl pointer-events-none z-50">
                        <h3 className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-3 border-b border-gray-700 pb-2">
                            Active Orders
                        </h3>
                        <div className="space-y-3">
                            {missions.map(mission => {
                                const def = MISSION_POOL.find(m => m.id === mission.missionId);
                                if (!def) return null;
                                const percent = Math.min(100, (mission.progress / def.target) * 100);

                                return (
                                    <div key={mission.missionId}>
                                        <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono">
                                            <span className={mission.completed ? 'text-green-400' : ''}>{mission.completed ? 'COMPLETED' : 'IN PROGRESS'}</span>
                                            <span>{mission.progress}/{def.target}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${mission.completed ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] text-gray-300 mt-1 truncate">
                                            {def.description}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </button>
                {/* Claim Gifts Button */}
                {gifts.length > 0 && (
                    <div className="absolute top-24 right-0 m-4 z-50 animate-in slide-in-from-right duration-500">
                        <button
                            onClick={() => {
                                setCurrentGift(gifts[0]);
                                setShowGiftModal(true);
                            }}
                            className="group relative w-12 h-12 bg-indigo-900/80 backdrop-blur-sm border-2 border-indigo-500/50 hover:border-indigo-400 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                            title="Claim Supply Drop"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400 group-hover:text-white transition-colors animate-bounce" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.171c.413 1.02.124 2.181-.17 3.041a1 1 0 101.446 1.132A1 1 0 005 5zm16 5a1 1 0 011 1v2.5c0 2.485-2.099 4.5-5.688 4.5H19a1 1 0 01-1-1v-2.5a1 1 0 00-1-1h-5a1 1 0 100 2h5a3 3 0 110 6H6a3 3 0 010-6h5a1 1 0 100-2H6a1 1 0 00-1 1v2.5a1 1 0 01-1 1c-3.136 0-5.123-1.637-5.748-3.66A1 1 0 001 7.252V6a1 1 0 112 0v1.252a1 1 0 00.252.748c1.334 3.999 5.093 5.494 8.748 4.71V10a3 3 0 013-3h3a1 1 0 011 1z" clipRule="evenodd" />
                                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4 5a2 2 0 012-2 3 3 0 013 3 3 3 0 01-3 3 2 2 0 01-2-2zm8 0a2 2 0 012-2 3 3 0 013 3 3 3 0 01-3 3 2 2 0 01-2-2z" />
                            </svg>

                            {/* Count Dot */}
                            {gifts.length > 1 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center border border-gray-900 shadow-sm z-10">
                                    <span className="text-[10px] font-bold text-white">{gifts.length}</span>
                                </div>
                            )}
                        </button>
                    </div>
                )}

            </div>

            {/* Header */}
            <div className="text-center mb-12 relative z-10">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-gray-200 to-gray-400 uppercase tracking-widest mb-2">
                    Welcome, {username}
                </h2>
                <p className="text-gray-500 text-sm uppercase tracking-wider">Select Simulation</p>
            </div>

            {/* Carousel Container */}
            <div
                className="relative z-10 h-[500px] flex items-center justify-center perspective-1000 select-none"
                draggable={false}
                onMouseDown={(e) => {
                    if (!enableSpin) return;
                    e.preventDefault();
                    setIsDragging(true);
                    setStartX(e.clientX);
                }}
                onMouseMove={(e) => {
                    if (!isDragging || !enableSpin) return;
                    e.preventDefault();
                    const currentX = e.clientX;
                    const diff = currentX - startX;

                    // Continuous Spin Logic
                    if (diff > 100) {
                        prevMode();
                        setStartX(currentX); // Reset origin to current
                        setDragOffset(0);    // Snap to center (new card takes place)
                    } else if (diff < -100) {
                        nextMode();
                        setStartX(currentX);
                        setDragOffset(0);
                    } else {
                        setDragOffset(diff);
                    }
                }}
                onMouseUp={() => {
                    if (!isDragging || !enableSpin) return;
                    setIsDragging(false);
                    setDragOffset(0); // Always snap back to center on release
                }}
                onMouseLeave={() => {
                    if (isDragging && enableSpin) {
                        setIsDragging(false);
                        setDragOffset(0);
                    }
                }}
                onTouchStart={(e) => {
                    if (!enableSpin) return;
                    setIsDragging(true);
                    setStartX(e.touches[0].clientX);
                }}
                onTouchMove={(e) => {
                    if (!isDragging || !enableSpin) return;
                    const currentX = e.touches[0].clientX;
                    const diff = currentX - startX;

                    if (diff > 100) {
                        prevMode();
                        setStartX(currentX);
                        setDragOffset(0);
                    } else if (diff < -100) {
                        nextMode();
                        setStartX(currentX);
                        setDragOffset(0);
                    } else {
                        setDragOffset(diff);
                    }
                }}
                onTouchEnd={() => {
                    if (!isDragging || !enableSpin) return;
                    setIsDragging(false);
                    setDragOffset(0);
                }}
                onDragStart={(e) => e.preventDefault()}
                style={{
                    cursor: enableSpin ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    transformStyle: 'preserve-3d',
                    WebkitUserDrag: 'none',
                    touchAction: 'none'
                } as React.CSSProperties}
            >

                {/* Left Arrow */}
                {!enableSpin && (
                    <button
                        onClick={prevMode}
                        className="absolute left-0 z-20 p-3 rounded-full bg-gray-800/50 hover:bg-gray-700 text-white transition-colors backdrop-blur-sm border border-gray-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                {/* Cards */}
                <div
                    className="relative w-full max-w-md h-full flex items-center justify-center transition-transform duration-75 ease-out"
                    style={{
                        transformStyle: 'preserve-3d',
                        WebkitUserDrag: 'none'
                    } as React.CSSProperties}
                >
                    {modes.map((mode, index) => {
                        const isActive = index === currentIndex;
                        const isPrev = index === (currentIndex - 1 + modes.length) % modes.length;
                        const isNext = index === (currentIndex + 1) % modes.length;

                        let baseClass = 'transition-all duration-500 ease-out absolute pointer-events-none opacity-0';
                        let transformStyle = 'scale(0.75)';

                        if (isActive) {
                            baseClass = 'opacity-100 z-10 relative';
                            transformStyle = `translateX(${dragOffset}px) scale(1)`;
                        } else if (isPrev) {
                            baseClass = 'opacity-50 blur-sm absolute';
                            transformStyle = `translateX(calc(-100% + ${dragOffset}px)) scale(0.75)`;
                        } else if (isNext) {
                            baseClass = 'opacity-50 blur-sm absolute';
                            transformStyle = `translateX(calc(100% + ${dragOffset}px)) scale(0.75)`;
                        }

                        return (
                            <div
                                key={mode.id}
                                className={`transition-all duration-500 ease-out w-full h-full select-none ${baseClass}`}
                                style={{
                                    transform: transformStyle
                                }}
                            >
                                <GameModeCard
                                    title={mode.title}
                                    description={mode.description}
                                    color={mode.color}
                                    onStart={() => {
                                        if (Math.abs(dragOffset) < 5) {
                                            onStart(mode.id as 'hero' | 'illuminated');
                                        }
                                    }}
                                    icon={mode.icon}
                                    enableExpeditionMode={enableExpeditionBg}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Right Arrow */}
                {!enableSpin && (
                    <button
                        onClick={nextMode}
                        className="absolute right-0 z-20 p-3 rounded-full bg-gray-800/50 hover:bg-gray-700 text-white transition-colors backdrop-blur-sm border border-gray-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}

            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mt-8 relative z-10">
                {modes.map((_, index) => (
                    <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition-colors ${index === currentIndex ? 'bg-white' : 'bg-gray-700'}`}
                    />
                ))}
            </div>

            {/* Logout */}
            <div className="text-center mt-12 relative z-10">
                <button
                    onClick={onLogout}
                    className="text-gray-500 hover:text-white text-sm transition-colors uppercase tracking-wider"
                >
                    Logout
                </button>
            </div>

            {
                showLevelUp && (
                    <LevelUpModal
                        level={levelData.level}
                        onClose={() => {
                            localStorage.setItem(`stratagem_hero_last_seen_level_${username}`, levelData.level.toString());
                            setShowLevelUp(false);
                        }}
                    />
                )
            }

            {
                showProfile && (
                    <ProfileModal
                        username={username}
                        levelData={levelData}
                        onClose={async () => {
                            setShowProfile(false);
                            refreshUserData();
                        }}
                        enableSpin={enableSpin}
                        onToggleSpin={handleToggleSpin}
                        enableSpaceBg={enableSpaceBg}
                        onToggleSpaceBg={handleToggleSpaceBg}
                    />
                )
            }

            {
                showDailyMissions && (
                    <DailyMissionsModal
                        username={username}
                        onClose={() => {
                            refreshUserData();
                            setIsClosingMissions(true);
                            setTimeout(() => {
                                setShowDailyMissions(false);
                                setIsClosingMissions(false);
                            }, 300); // Match animation duration
                        }}
                        isClosing={isClosingMissions}
                    />
                )
            }
            {showGiftModal && currentGift && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-gray-900 border-2 border-indigo-500 rounded-lg p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(99,102,241,0.3)] relative overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Background Shine */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                        <div className="relative z-10">
                            <h3 className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-4">Supply Drop Received</h3>

                            <div className="mb-6">
                                <div className="text-gray-300 text-sm mb-2">From Operative</div>
                                <div className="text-2xl font-bold text-white mb-4">{currentGift.fromUsername}</div>

                                <div className="bg-gray-800/50 rounded-lg p-4 border border-indigo-500/30">
                                    <div className="text-4xl font-black text-yellow-400 drop-shadow-md mb-1">+{currentGift.xpAmount} XP</div>
                                    <div className="text-xs text-indigo-300 uppercase tracking-wider">Friendship Bonus Applied</div>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    if (!currentGift) return;
                                    await db.claimGift(username, currentGift.id);

                                    // Slide out logic? For now just close/next
                                    // Check next gift
                                    const nextGifts = gifts.filter(g => g.id !== currentGift.id);
                                    setGifts(nextGifts);

                                    if (nextGifts.length > 0) {
                                        setCurrentGift(nextGifts[0]); // Show next immediately
                                    } else {
                                        setShowGiftModal(false);
                                        setCurrentGift(null);
                                        refreshUserData(); // Update XP bar
                                    }
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded uppercase tracking-wider transition-all hover:scale-105 shadow-lg"
                            >
                                Claim Supplies
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Audio Controls */}
            <div className="absolute bottom-4 left-4 z-50 flex items-center gap-3 bg-gray-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-700">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-gray-400 hover:text-yellow-400 transition-colors focus:outline-none"
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted || volume === 0 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        if (isMuted) setIsMuted(false);
                    }}
                    className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400"
                    title={`Volume: ${Math.round(volume * 100)}%`}
                />
            </div>
        </div>
    );
};

export default MainMenu;
