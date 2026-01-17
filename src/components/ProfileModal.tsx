import React, { useState, useEffect } from 'react';
import { db, type UserStats } from '../services/db';

interface ProfileModalProps {
    username: string;
    onClose: () => void;
    levelData: {
        level: number;
        currentXP: number;
        nextLevelXP: number;
        progressPercent: number;
    };
    enableSpin: boolean;
    onToggleSpin: (enabled: boolean) => void;
    enableSpaceBg: boolean;
    onToggleSpaceBg: (enabled: boolean) => void;
}

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
    { id: 'default', src: null, levelReq: 0 },
    { id: 'avatar_1', src: '/avatars/avatar_1.png', levelReq: 0 },
    { id: 'avatar_2', src: '/avatars/avatar_2.png', levelReq: 0 },
    { id: 'avatar_3', src: '/avatars/avatar_3.png', levelReq: 0 },
    { id: 'avatar_4', src: '/avatars/avatar_4.png', levelReq: 0 },
    { id: 'level3', src: '/avatars/level3.png', levelReq: 3 },
    { id: 'level5', src: '/avatars/level5.png', levelReq: 5 },
    { id: 'level7', src: '/avatars/level7.png', levelReq: 7 },
    { id: 'level10', src: '/avatars/level10.png', levelReq: 10 },
    { id: 'level13', src: '/avatars/level13.png', levelReq: 13 },
    { id: 'level15', src: '/avatars/level15.png', levelReq: 15 },
    { id: 'level18', src: '/avatars/level18.png', levelReq: 18 },
    { id: 'level20', src: '/avatars/level20.png', levelReq: 20 },
    { id: 'level22', src: '/avatars/level22.png', levelReq: 22 },
    { id: 'level25', src: '/avatars/level25.png', levelReq: 25 },
];

const ProfileModal: React.FC<ProfileModalProps> = ({ username, onClose, levelData, enableSpin, onToggleSpin, enableSpaceBg, onToggleSpaceBg }) => {
    const [activeTab, setActiveTab] = useState<'career' | 'armory' | 'awards' | 'settings' | 'friends'>('career');
    const [stats, setStats] = useState<UserStats | null>(null);
    const [highScores, setHighScores] = useState<{ classic: number; hardcore: number; mediocre: number }>({ classic: 0, hardcore: 0, mediocre: 0 });
    const [rank, setRank] = useState('Recruit');
    const [rankStyle, setRankStyle] = useState('');

    // Friends System State
    const [friends, setFriends] = useState<{ uid: string, username: string, avatarId: string, level: number, lastActive?: number, friendship?: { level: number, giftsExchanged?: number, lastGiftSent: string } }[]>([]);
    const [friendRequests, setFriendRequests] = useState<{ fromUid: string, username: string, avatarId: string }[]>([]);
    const [searchUid, setSearchUid] = useState('');
    const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
    const [isExploding, setIsExploding] = useState(false);
    const [searchResult, setSearchResult] = useState<string>('');
    const [viewingFriend, setViewingFriend] = useState<{ username: string, stats: UserStats, levelData: any } | null>(null);
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [redeemCode, setRedeemCode] = useState('');
    const [redeemMessage, setRedeemMessage] = useState('');
    const [showRewardModal, setShowRewardModal] = useState<{ type: 'border' | 'avatar', id: string, name: string, src: string } | null>(null);

    useEffect(() => {
        const loadData = async () => {
            // Stats
            const userStats = await db.getUserStats(username);
            setStats(userStats);

            // Scores
            const classic = await db.getUserScore(username, 'Classic');
            const hardcore = await db.getUserScore(username, 'Hardcore');
            const mediocre = await db.getUserScore(username, 'Mediocre');
            setHighScores({ classic, hardcore, mediocre });

            // Rank
            const { getRankForLevel, getRankStyle } = await import('../data/levelSystem');
            setRank(getRankForLevel(levelData.level));
            setRankStyle(getRankStyle(levelData.level));

            // Load Friends Details
            if (userStats.friends && userStats.friends.length > 0) {
                const friendsData = await Promise.all(userStats.friends.map(async (uid) => {
                    const data = await db.getUserByUid(uid);
                    if (data) {
                        const lvlData = await db.getUserLevelData(data.username);
                        return {
                            uid,
                            username: data.username,
                            avatarId: data.stats.avatarId,
                            level: lvlData.level,
                            lastActive: data.stats.lastActive,
                            friendship: userStats.friendships ? userStats.friendships[uid] : undefined
                        };
                    }
                    // Ghost/Missing User Handler
                    return {
                        uid,
                        username: 'Unknown Operative', // Flag for user to see
                        avatarId: 'default',
                        level: 0,
                        lastActive: 0,
                        friendship: { level: 0, giftsExchanged: 0, lastGiftSent: '' },
                        isGhost: true
                    };
                }));
                setFriends(friendsData as any);
            }

            // Load Requests Details
            if (userStats.friendRequests && userStats.friendRequests.length > 0) {
                const requestsData = await Promise.all(userStats.friendRequests.map(async (req) => {
                    const data = await db.getUserByUid(req.fromUid);
                    if (data) {
                        return {
                            fromUid: req.fromUid,
                            username: data.username,
                            avatarId: data.stats.avatarId
                        };
                    }
                    return null;
                }));
                setFriendRequests(requestsData.filter(r => r !== null) as any);
            }
        };
        loadData();
    }, [username, levelData.level, activeTab]); // Reload when tab changes to refresh logic

    const handleBorderSelect = async (borderId: string) => {
        if (!stats) return;

        // Check requirement
        const border = BORDERS.find(b => b.id === borderId);
        if (border && (levelData.level >= border.levelReq || (border.secret && stats.unlockedBorders?.includes(border.id)))) {
            await db.setActiveBorder(username, borderId);
            setStats({ ...stats, activeBorder: borderId });
        }
    };

    const handleAvatarSelect = async (avatarId: string) => {
        if (!stats) return;
        await db.setActiveAvatar(username, avatarId);
        setStats({ ...stats, avatarId: avatarId });
    };

    const handleTitleSelect = async (title: string) => {
        if (!stats) return;
        await db.setActiveTitle(username, title);
        setStats({ ...stats, activeTitle: title });
    };

    // --- Friends Handlers ---
    const handleSendRequest = async () => {
        if (!searchUid) return;
        setSearchResult('Sending...');
        const res = await db.sendFriendRequest(username, searchUid);
        setSearchResult(res.message);
        if (res.success) setSearchUid('');
        setTimeout(() => setSearchResult(''), 3000);
    };

    const handleAccept = async (fromUid: string) => {
        await db.acceptFriendRequest(username, fromUid);
        // Optimistic update
        setFriendRequests(prev => prev.filter(r => r.fromUid !== fromUid));
        // Force reload to get new friend in list
        setActiveTab('career');
        setTimeout(() => setActiveTab('friends'), 10);
    };

    const handleDeny = async (fromUid: string) => {
        await db.denyFriendRequest(username, fromUid);
        setFriendRequests(prev => prev.filter(r => r.fromUid !== fromUid));
    };

    const handleViewFriend = async (friendUid: string) => {
        const data = await db.getUserByUid(friendUid);
        if (data) {
            const lvlData = await db.getUserLevelData(data.username);
            setViewingFriend({ username: data.username, stats: data.stats, levelData: lvlData });
        }
    };



    const handleRedeem = async () => {
        const code = redeemCode.trim();
        if (!code) return;

        if (code === 'N7') {
            // Check if already redeemed
            if (stats?.unlockedCodes?.includes('N7')) {
                setRedeemMessage('Code already redeemed.');
                setTimeout(() => setRedeemMessage(''), 2000);
                return;
            }

            // Unlock Logic
            const newUnlockedBorders = [...(stats?.unlockedBorders || [])];
            if (!newUnlockedBorders.includes('n7')) newUnlockedBorders.push('n7');

            const newUnlockedCodes = [...(stats?.unlockedCodes || [])];
            if (!newUnlockedCodes.includes('N7')) newUnlockedCodes.push('N7');

            // Optimistic Update
            console.log('Unlocking N7 Border. New State:', { unlockedBorders: newUnlockedBorders, unlockedCodes: newUnlockedCodes });
            setStats(prev => prev ? { ...prev, unlockedBorders: newUnlockedBorders, unlockedCodes: newUnlockedCodes, activeBorder: 'n7' } : null);
            await db.updateUserStats(username, { unlockedBorders: newUnlockedBorders, unlockedCodes: newUnlockedCodes, activeBorder: 'n7' });

            setRedeemMessage('Code Redeemed!');
            setShowRedeemModal(false);
            setRedeemCode('');
            setRedeemMessage('');

            // Show Reward Modal
            setShowRewardModal({
                type: 'border',
                id: 'n7',
                name: 'Spectre Elite',
                src: '/borders/n7.png'
            });

        } else if (code === 'EXP33') {
            // Check if already redeemed
            if (stats?.unlockedCodes?.includes('EXP33')) {
                setRedeemMessage('Code already redeemed.');
                setTimeout(() => setRedeemMessage(''), 2000);
                return;
            }

            // Unlock Logic
            const newUnlockedBorders = [...(stats?.unlockedBorders || [])];
            if (!newUnlockedBorders.includes('exp33')) newUnlockedBorders.push('exp33');

            const newUnlockedCodes = [...(stats?.unlockedCodes || [])];
            if (!newUnlockedCodes.includes('EXP33')) newUnlockedCodes.push('EXP33');

            const newUnlockedTitles = [...(stats?.unlockedTitles || [])];
            if (!newUnlockedTitles.includes('Expeditioner')) newUnlockedTitles.push('Expeditioner');

            // Optimistic Update
            console.log('Unlocking EXP33 Border & Title. New State:', { unlockedBorders: newUnlockedBorders, unlockedCodes: newUnlockedCodes, unlockedTitles: newUnlockedTitles });
            setStats(prev => prev ? { ...prev, unlockedBorders: newUnlockedBorders, unlockedCodes: newUnlockedCodes, unlockedTitles: newUnlockedTitles, activeBorder: 'exp33', activeTitle: 'Expeditioner' } : null);
            await db.updateUserStats(username, { unlockedBorders: newUnlockedBorders, unlockedCodes: newUnlockedCodes, unlockedTitles: newUnlockedTitles, activeBorder: 'exp33', activeTitle: 'Expeditioner' });

            setRedeemMessage('Code Redeemed!');
            setShowRedeemModal(false);
            setRedeemCode('');
            setRedeemMessage('');

            // Show Reward Modal
            setShowRewardModal({
                type: 'border',
                id: 'exp33',
                name: 'EXP33',
                src: '/borders/exp33.png'
            });

        } else {
            console.log('Redeeming code:', code);
            setRedeemMessage('Verifying code...');

            setTimeout(() => {
                setRedeemMessage('Invalid Code Provided');
                setTimeout(() => setRedeemMessage(''), 2000);
            }, 1000);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    if (!stats) return null;

    // Viewing Friend Mode
    if (viewingFriend) {
        // We reuse the modal layout but with Friend's data and "Back" button
        // Simplification: Just render a specific view here to avoid massive refactor
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-gray-900 w-full max-w-2xl rounded-xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="p-6 border-b border-gray-800 bg-gray-950/50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Friend Profile</h2>
                        <button onClick={() => setViewingFriend(null)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-bold transition-colors">
                            Return
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                {/* Border Image Overlay */}
                                {BORDERS.find(b => b.id === viewingFriend.stats.activeBorder)?.src && (
                                    <div className="absolute inset-[-4px] z-20 pointer-events-none">
                                        <img src={BORDERS.find(b => b.id === viewingFriend.stats.activeBorder)?.src} alt="Border" className="w-full h-full object-contain scale-110" />
                                    </div>
                                )}

                                <div className={`w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-3xl font-bold text-yellow-500 overflow-hidden ${BORDERS.find(b => b.id === viewingFriend.stats.activeBorder)?.src ? '' : `border-4 ${BORDERS.find(b => b.id === viewingFriend.stats.activeBorder)?.class || 'border-gray-500'}`}`}>
                                    {AVATARS.find(a => a.id === viewingFriend.stats.avatarId)?.src ? (
                                        <img src={AVATARS.find(a => a.id === viewingFriend.stats.avatarId)?.src!} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        viewingFriend.username.charAt(0).toUpperCase()
                                    )}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white uppercase">{viewingFriend.username}</h2>
                                <div className="text-yellow-500 font-bold uppercase tracking-widest text-sm">{viewingFriend.stats.activeTitle || 'Recruit'}</div>
                                <div className="text-gray-500 font-mono text-xs mt-1">Level {viewingFriend.levelData.level}</div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">Total Playtime</div>
                                <div className="text-xl font-mono text-white">{formatTime(viewingFriend.stats.totalTimePlayed)}</div>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">Total Stratagems</div>
                                <div className="text-xl font-mono text-white">{viewingFriend.stats.totalStratagems}</div>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">Missed Inputs</div>
                                <div className="text-xl font-mono text-red-400">{viewingFriend.stats.totalMissedInputs}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 w-full max-w-2xl rounded-xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-800 bg-gray-950/50 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            {/* Border Image Overlay */}
                            {BORDERS.find(b => b.id === stats.activeBorder)?.src && (
                                <div className="absolute inset-[-4px] z-20 pointer-events-none">
                                    <img src={BORDERS.find(b => b.id === stats.activeBorder)?.src} alt="Border" className="w-full h-full object-contain scale-110" />
                                </div>
                            )}

                            {/* Avatar Container */}
                            <div className={`w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-3xl font-bold text-yellow-500 overflow-hidden ${BORDERS.find(b => b.id === stats.activeBorder)?.src ? '' : `border-4 ${BORDERS.find(b => b.id === stats.activeBorder)?.class || 'border-gray-500'}`}`}>
                                {AVATARS.find(a => a.id === stats.avatarId)?.src ? (
                                    <img src={AVATARS.find(a => a.id === stats.avatarId)?.src!} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    username.charAt(0).toUpperCase()
                                )}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{username}</h2>
                            <div className={`text-sm uppercase tracking-wider ${stats.activeTitle === 'Expeditioner'
                                ? 'text-yellow-400 font-serif font-bold drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]'
                                : rankStyle
                                }`}>
                                {stats.activeTitle ? stats.activeTitle : rank}
                            </div>
                            <div className="text-gray-500 text-xs mt-1 font-mono">Level {levelData.level}</div>
                            {stats.uid && (
                                <div className="flex items-center gap-2 mt-2 bg-gray-950/50 px-2 py-1 rounded w-fit border border-gray-800">
                                    <span className="text-gray-400 text-[10px] font-mono tracking-widest leading-none">ID: {stats.uid}</span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(stats.uid || '');
                                            const btn = document.getElementById('copy-uid-btn');
                                            if (btn) {
                                                const original = btn.innerHTML;
                                                btn.innerHTML = '<span class="text-green-400">✓</span>';
                                                setTimeout(() => { btn.innerHTML = original; }, 1000);
                                            }
                                        }}
                                        id="copy-uid-btn"
                                        className="text-gray-600 hover:text-white transition-colors"
                                        title="Copy UID"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 bg-gray-950/30">
                    <button
                        onClick={() => setActiveTab('career')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors min-w-[80px] ${activeTab === 'career' ? 'text-yellow-500 border-b-2 border-yellow-500 bg-yellow-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Career
                    </button>
                    <button
                        onClick={() => setActiveTab('armory')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors min-w-[80px] ${activeTab === 'armory' ? 'text-yellow-500 border-b-2 border-yellow-500 bg-yellow-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Armory
                    </button>
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors min-w-[80px] relative ${activeTab === 'friends' ? 'text-yellow-500 border-b-2 border-yellow-500 bg-yellow-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Friends
                        {friendRequests.length > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('awards')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors min-w-[80px] ${activeTab === 'awards' ? 'text-yellow-500 border-b-2 border-yellow-500 bg-yellow-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Awards
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors min-w-[80px] ${activeTab === 'settings' ? 'text-yellow-500 border-b-2 border-yellow-500 bg-yellow-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Settings
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-y-auto relative scrollbar-thin scrollbar-thumb-yellow-600 scrollbar-track-gray-900 pr-2 mr-1 mb-1 rounded-br-lg">
                    <div className="p-6 pr-6">
                        {activeTab === 'career' && (
                            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-right-4 duration-300">
                                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                    <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">Total Playtime</div>
                                    <div className="text-2xl font-mono text-white">{formatTime(stats.totalTimePlayed)}</div>
                                </div>
                                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                    <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">Stratagems Completed</div>
                                    <div className="text-2xl font-mono text-white">{stats.totalStratagems}</div>
                                </div>
                                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                    <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">Best Score (Mediocre)</div>
                                    <div className="text-2xl font-mono text-green-400">{highScores.mediocre}</div>
                                </div>
                                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                    <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">Best Score (Classic)</div>
                                    <div className="text-2xl font-mono text-yellow-500">{highScores.classic}</div>
                                </div>
                                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                    <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">Best Score (Hardcore)</div>
                                    <div className="text-2xl font-mono text-red-500">{highScores.hardcore}</div>
                                </div>
                                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                    <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">Total Missed Inputs</div>
                                    <div className="text-2xl font-mono text-red-400">{stats.totalMissedInputs}</div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'armory' && (
                            <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-3">Borders</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {BORDERS.map((border: any) => {
                                            // Secret Logic
                                            const isSecret = border.secret;
                                            const isUnlockedSecret = isSecret && stats.unlockedBorders?.includes(border.id);

                                            // Debug log for N7
                                            if (border.id === 'n7') {
                                                console.log('Rendering N7 Border check:', {
                                                    id: border.id,
                                                    isSecret,
                                                    unlockedBorders: stats.unlockedBorders,
                                                    isUnlockedSecret
                                                });
                                            }

                                            if (isSecret && !isUnlockedSecret) {
                                                return null;
                                            }

                                            const isUnlocked = border.secret
                                                ? stats.unlockedBorders?.includes(border.id)
                                                : levelData.level >= border.levelReq;

                                            const isActive = stats.activeBorder === border.id;

                                            return (
                                                <button
                                                    key={border.id}
                                                    disabled={!isUnlocked}
                                                    onClick={() => handleBorderSelect(border.id)}
                                                    className={`relative p-4 rounded-lg border-2 flex flex-col items-center gap-3 transition-all ${isActive
                                                        ? 'bg-yellow-500/10 border-yellow-500'
                                                        : isUnlocked
                                                            ? 'bg-gray-800/30 border-gray-700 hover:bg-gray-700'
                                                            : 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <div className={`w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden relative ${isActive ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-gray-900' : ''}`}>
                                                        {border.src ? (
                                                            <div className="absolute inset-0 z-10">
                                                                <img src={border.src} alt="Border" className="w-full h-full object-cover scale-110" />
                                                            </div>
                                                        ) : (
                                                            <div className={`w-full h-full rounded-full border-4 ${border.class}`}></div>
                                                        )}
                                                    </div>
                                                    <div className="text-center">
                                                        <div className={`text-sm font-bold ${isActive ? 'text-yellow-500' : 'text-gray-300'}`}>{border.name}</div>
                                                        {!isUnlocked && <div className="text-xs text-red-400">Lvl {border.levelReq}</div>}
                                                        {isActive && <div className="text-xs text-yellow-500 mt-1">EQUIPPED</div>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-3">Avatars</h3>
                                    <div className="grid grid-cols-4 gap-4">
                                        {AVATARS.map((avatar) => {
                                            const isUnlocked = levelData.level >= (avatar.levelReq || 0);
                                            const isActive = stats.avatarId === avatar.id || (stats.avatarId === undefined && avatar.id === 'default');

                                            return (
                                                <button
                                                    key={avatar.id}
                                                    disabled={!isUnlocked}
                                                    onClick={() => handleAvatarSelect(avatar.id)}
                                                    className={`relative p-2 rounded-lg border-2 flex flex-col items-center gap-2 transition-all group ${isActive
                                                        ? 'bg-yellow-500/10 border-yellow-500'
                                                        : isUnlocked
                                                            ? 'bg-gray-800/30 border-gray-700 hover:bg-gray-700 hover:border-gray-500'
                                                            : 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <div className="w-16 h-16 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center relative">
                                                        {avatar.src ? (
                                                            <img src={avatar.src} alt={avatar.id} className={`w-full h-full object-cover transition-transform ${isUnlocked ? 'group-hover:scale-110' : 'grayscale'}`} />
                                                        ) : (
                                                            <span className="text-2xl font-bold text-gray-500">{username.charAt(0).toUpperCase()}</span>
                                                        )}
                                                        {!isUnlocked && (
                                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isActive && <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Equipped</div>}
                                                    {!isUnlocked && <div className="text-[9px] text-red-400 font-bold">LVL {avatar.levelReq}</div>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-3">Titles</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Default Rank Title */}
                                        <button
                                            onClick={() => handleTitleSelect(rank)}
                                            className={`relative p-3 rounded-lg border-2 text-left transition-all ${stats.activeTitle === rank || (!stats.activeTitle && rank)
                                                ? 'bg-yellow-500/10 border-yellow-500'
                                                : 'bg-gray-800/30 border-gray-700 hover:bg-gray-700'
                                                }`}
                                        >
                                            <div className={`text-sm font-bold ${stats.activeTitle === rank || (!stats.activeTitle && rank) ? 'text-yellow-500' : 'text-gray-300'}`}>
                                                {rank}
                                            </div>
                                            <div className="text-xs text-gray-500">Current Rank</div>
                                        </button>

                                        {/* Unlocked Titles */}
                                        {(() => { console.log('Rendering Titles:', stats.unlockedTitles); return null; })()}
                                        {(stats.unlockedTitles || []).map((title) => {
                                            if (title === rank) return null; // Don't duplicate if unlocked title is same as rank (unlikely but possible)
                                            const isActive = stats.activeTitle === title;
                                            return (
                                                <button
                                                    key={title}
                                                    onClick={() => handleTitleSelect(title)}
                                                    className={`relative p-3 rounded-lg border-2 text-left transition-all ${isActive
                                                        ? 'bg-yellow-500/10 border-yellow-500'
                                                        : 'bg-gray-800/30 border-gray-700 hover:bg-gray-700'
                                                        }`}
                                                >
                                                    <div className={`text-sm font-bold ${isActive
                                                        ? 'text-yellow-500'
                                                        : title === 'Expeditioner'
                                                            ? 'text-yellow-400 font-serif drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]'
                                                            : 'text-gray-300'
                                                        }`}>
                                                        {title}
                                                    </div>
                                                    <div className="text-xs text-yellow-500/50">Unlocked Title</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'friends' && (
                            <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                                {/* Add Friend Section */}
                                <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                                    <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-3">Add Operative</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter UID (e.g. A1B2C3D4E5F6)"
                                            className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-mono focus:border-yellow-500 outline-none uppercase placeholder-gray-600"
                                            value={searchUid}
                                            onChange={(e) => setSearchUid(e.target.value.toUpperCase())}
                                            maxLength={12}
                                        />
                                        <button
                                            onClick={handleSendRequest}
                                            disabled={searchUid.length !== 12 || searchResult === 'Sending...'}
                                            className="bg-yellow-500 text-black font-bold uppercase px-4 py-2 rounded hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Send Request
                                        </button>
                                    </div>
                                    {searchResult && <div className={`text-xs mt-2 ${searchResult.includes('sent') ? 'text-green-400' : 'text-yellow-500'}`}>{searchResult}</div>}
                                </div>

                                {/* Pending Requests */}
                                {friendRequests.length > 0 && (
                                    <div>
                                        <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-3">Priority Transmissions ({friendRequests.length})</h3>
                                        <div className="flex flex-col gap-2">
                                            {friendRequests.map((req) => (
                                                <div key={req.fromUid} className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/50 p-3 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border-2 border-yellow-500">
                                                            {AVATARS.find(a => a.id === req.avatarId)?.src ? (
                                                                <img src={AVATARS.find(a => a.id === req.avatarId)?.src!} alt="Av" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="flex items-center justify-center h-full text-white font-bold">{req.username.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-bold">{req.username}</div>
                                                            <div className="text-yellow-500/70 text-xs font-mono">REQUESTING ALLIANCE</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleAccept(req.fromUid)} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded transition-colors" title="Accept">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        </button>
                                                        <button onClick={() => handleDeny(req.fromUid)} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded transition-colors" title="Deny">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Friends List */}
                                <div>
                                    <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-3">Allies ({friends.length})</h3>
                                    {friends.length === 0 ? (
                                        <div className="text-gray-500 text-sm italic text-center py-4">No allies found. Recruit operatives via UID.</div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {friends.map((friend) => (
                                                <button
                                                    key={friend.uid}
                                                    onClick={() => handleViewFriend(friend.uid)}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all group text-left relative overflow-hidden ${friend.username === 'Unknown Operative'
                                                        ? 'bg-red-900/20 border-red-500/50 hover:bg-red-900/40'
                                                        : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                                                        }`}
                                                >
                                                    <div className="relative z-10">
                                                        <div className="w-12 h-12 rounded-full bg-gray-900 overflow-hidden border-2 border-gray-600 group-hover:border-yellow-500 transition-colors">
                                                            {AVATARS.find(a => a.id === friend.avatarId)?.src ? (
                                                                <img src={AVATARS.find(a => a.id === friend.avatarId)?.src!} alt="Av" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="flex items-center justify-center h-full text-white font-bold">{friend.username.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        {/* Status Dot */}
                                                        {/* Status Dot */}
                                                        {(friend.lastActive || 0) > 0 && (Date.now() - (friend.lastActive || 0) < 5 * 60 * 1000) && (
                                                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 z-10">
                                                        <div className="flex justify-between items-center">
                                                            <div className="text-white font-bold group-hover:text-yellow-500 transition-colors">{friend.username}</div>
                                                            {/* Friendship Level Stars */}
                                                            {/* Friendship Bar */}
                                                            {(() => {
                                                                // Robust Fallback: Defaults if friendship data is missing (New Friend)
                                                                const friendship = friend.friendship || { giftsExchanged: 0, level: 0 };
                                                                const gifts = friendship.giftsExchanged || 0;

                                                                // Explicit Level Calculation (Source of Truth)
                                                                let displayLevel = 0;
                                                                if (gifts >= 50) displayLevel = 5;
                                                                else if (gifts >= 20) displayLevel = 4;
                                                                else if (gifts >= 10) displayLevel = 3;
                                                                else if (gifts >= 5) displayLevel = 2;
                                                                else if (gifts >= 1) displayLevel = 1;

                                                                // Thresholds: 1, 5, 10, 20, 50
                                                                // [0->1], [1->5], [5->10], [10->20], [20->50]
                                                                const thresholds = [0, 1, 5, 10, 20, 50];

                                                                let progress = 0;
                                                                if (displayLevel >= 5) {
                                                                    progress = 100;
                                                                } else {
                                                                    const prevT = thresholds[displayLevel];
                                                                    const nextT = thresholds[displayLevel + 1];
                                                                    const currentInTier = gifts - prevT;
                                                                    const neededForSeparation = nextT - prevT;
                                                                    progress = Math.max(0, Math.min(100, (currentInTier / neededForSeparation) * 100));
                                                                }

                                                                // Colors Map
                                                                const colors = [
                                                                    'bg-white',           // Lvl 0
                                                                    'bg-cyan-300',        // Lvl 1 (Light Blue)
                                                                    'bg-teal-400',        // Lvl 2
                                                                    'bg-green-400',       // Lvl 3 (Light Green)
                                                                    'bg-yellow-400',      // Lvl 4
                                                                    'bg-orange-500'       // Lvl 5
                                                                ];

                                                                const isMax = displayLevel >= 5;
                                                                const barColor = isMax ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]' : colors[displayLevel] || 'bg-gray-500';

                                                                return (
                                                                    <div className="flex flex-col w-full max-w-[100px]" title={`Gifts: ${gifts} (Level ${displayLevel})`}>
                                                                        <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase font-bold mb-0.5">
                                                                            <span>Lvl {displayLevel}</span>
                                                                            {isMax && <span className="text-red-500 animate-pulse">MAX</span>}
                                                                            {!isMax && <span className="text-[8px] opacity-50">{gifts}/{thresholds[displayLevel + 1]}</span>}
                                                                        </div>
                                                                        <div className="h-2 w-full bg-gray-900 rounded-full border border-gray-700 overflow-hidden relative">
                                                                            <div
                                                                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                                                                style={{ width: `${progress}%` }}
                                                                            >
                                                                                <div className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-white/30 to-transparent"></div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="flex justify-between items-center mt-1">
                                                            {(() => {
                                                                const gifts = friend.friendship?.giftsExchanged || 0;
                                                                let l = 0;
                                                                if (gifts >= 50) l = 5; else if (gifts >= 20) l = 4; else if (gifts >= 10) l = 3; else if (gifts >= 5) l = 2; else if (gifts >= 1) l = 1;
                                                                return <div className="text-gray-500 text-xs">Level {l}</div>;
                                                            })()}

                                                            {/* Actions */}
                                                            <div className="flex gap-2">
                                                                {/* Remove Friend Button */}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        if (confirmRemove === friend.uid) {
                                                                            // Execute Remove
                                                                            db.removeFriend(username, friend.uid).then(() => {
                                                                                setFriends(prev => prev.filter(f => f.uid !== friend.uid));
                                                                                setConfirmRemove(null);
                                                                            });
                                                                        } else {
                                                                            setConfirmRemove(friend.uid);
                                                                            // Auto-reset after 3s
                                                                            setTimeout(() => setConfirmRemove(null), 3000);
                                                                        }
                                                                    }}
                                                                    className={`p-1.5 rounded-full transition-all flex items-center justify-center border z-20 relative ${confirmRemove === friend.uid
                                                                        ? 'bg-red-900/80 border-red-500 text-white animate-pulse'
                                                                        : 'bg-gray-900/40 border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-900/50'
                                                                        }`}
                                                                    title={confirmRemove === friend.uid ? "Confirm Remove?" : "Remove Ally"}
                                                                >
                                                                    {confirmRemove === friend.uid ? (
                                                                        <span className="text-[10px] font-bold px-1">CONFIRM</span>
                                                                    ) : (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    )}
                                                                </button>

                                                                {/* Send Gift Button */}
                                                                <button
                                                                    type="button"
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault(); // Extra safety
                                                                        const today = new Date().toISOString().split('T')[0];
                                                                        const currentFriendship = friend.friendship || { lastGiftSent: '' };

                                                                        if (currentFriendship.lastGiftSent === today) return; // double check

                                                                        setSearchResult('Sending Gift...');
                                                                        const res = await db.sendGift(username, friend.uid);
                                                                        setSearchResult(res.message);
                                                                        setTimeout(() => setSearchResult(''), 3000);

                                                                        // Optimistic Update
                                                                        setFriends(prev => prev.map(f => {
                                                                            if (f.uid === friend.uid) {
                                                                                const existing = f.friendship || { level: 0, giftsExchanged: 0, lastGiftSent: '', lastGiftReceived: '' };
                                                                                const newGifts = (existing.giftsExchanged || 0) + 1;
                                                                                // Recalc Level locally for instant feedback
                                                                                let newLevel = 0;
                                                                                if (newGifts >= 50) newLevel = 5;
                                                                                else if (newGifts >= 20) newLevel = 4;
                                                                                else if (newGifts >= 10) newLevel = 3;
                                                                                else if (newGifts >= 5) newLevel = 2;
                                                                                else if (newGifts >= 1) newLevel = 1;

                                                                                return { ...f, friendship: { ...existing, lastGiftSent: today, giftsExchanged: newGifts, level: newLevel } };
                                                                            }
                                                                            return f;
                                                                        }));
                                                                    }}
                                                                    className={`p-1.5 rounded-full transition-colors flex items-center justify-center border z-20 relative ${friend.friendship?.lastGiftSent === new Date().toISOString().split('T')[0]
                                                                        ? 'bg-green-900/20 border-green-800 text-green-700 cursor-not-allowed'
                                                                        : 'bg-indigo-900/40 border-indigo-500/50 hover:bg-indigo-700 text-indigo-300 hover:text-white cursor-pointer active:scale-95'
                                                                        }`}
                                                                    title={friend.friendship?.lastGiftSent === new Date().toISOString().split('T')[0] ? "Gift Sent Today" : "Send Gift"}
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'awards' && (
                            <div className="text-center text-gray-500 py-12 animate-in slide-in-from-right-4 duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                <p>Achievements System Offline</p>
                                <p className="text-xs mt-2">Coming in next update package.</p>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="p-4 animate-in slide-in-from-right-4 duration-300">
                                <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-4">Interface Options</h3>

                                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                                    <div>
                                        <div className="text-white font-bold text-sm">Manual Carousel Spin</div> <p className="text-xs text-yellow-500 font-bold animate-pulse">EXPERIMENTAL</p>
                                        <div className="text-gray-500 text-xs">Allow dragging/swiping to rotate the game selection.</div>
                                    </div>
                                    <button
                                        onClick={() => onToggleSpin(!enableSpin)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enableSpin ? 'bg-yellow-500' : 'bg-gray-700'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableSpin ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700 mt-3">
                                    <div>
                                        <div className="text-white font-bold text-sm">Animated Space Background</div>
                                        <div className="text-gray-500 text-xs">Replace the dark void with a dynamic starry expanse.</div>
                                    </div>
                                    <button
                                        onClick={() => onToggleSpaceBg(!enableSpaceBg)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enableSpaceBg ? 'bg-yellow-500' : 'bg-gray-700'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableSpaceBg ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700 mt-3">
                                    <div>
                                        <div className="text-white font-bold text-sm">Skip Intro Sequence</div>
                                        <div className="text-gray-500 text-xs">Jump straight to the main menu after login.</div>
                                    </div>
                                    <button
                                        onClick={() => setStats(prev => prev ? ({ ...prev, skipIntro: !prev.skipIntro }) : null)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${stats.skipIntro ? 'bg-yellow-500' : 'bg-gray-700'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${stats.skipIntro ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700 mt-3">
                                    <div>
                                        <div className="text-white font-bold text-sm">Use Dark Intro</div>
                                        <div className="text-gray-500 text-xs">Play the "Ministry of Defense Dark" variant instead.</div>
                                    </div>
                                    <button
                                        onClick={() => setStats(prev => prev ? ({ ...prev, useDarkIntro: !prev.useDarkIntro }) : null)}
                                        disabled={stats.skipIntro}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${stats.useDarkIntro ? 'bg-yellow-500' : 'bg-gray-700'} ${stats.skipIntro ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${stats.useDarkIntro ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </button>
                                </div>

                                {/* Expedition Background Setting - Only if unlocked */}
                                {stats.unlockedTitles?.includes('Expeditioner') && (
                                    <div className="flex items-center justify-between p-4 bg-yellow-900/20 rounded-lg border border-yellow-700/50 mt-3 animate-in fade-in slide-in-from-bottom-2">
                                        <div>
                                            <div className="text-yellow-500 font-bold text-sm">Expedition Background</div>
                                            <div className="text-yellow-200/60 text-xs">Transform the main menu with a golden fleet theme.</div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                // Only update local state
                                                setStats(prev => prev ? ({ ...prev, useExpeditionBackground: !prev.useExpeditionBackground }) : null);
                                            }}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${stats.useExpeditionBackground ? 'bg-yellow-500' : 'bg-gray-700'}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${stats.useExpeditionBackground ? 'translate-x-6' : 'translate-x-1'}`}
                                            />
                                        </button>
                                    </div>
                                )}

                                <div className="mt-8 flex justify-center">
                                    <button
                                        onClick={async () => {
                                            if (!stats) return;

                                            // 1. Save Stats Fields
                                            await db.updateUserStats(username, {
                                                skipIntro: stats.skipIntro,
                                                useDarkIntro: stats.useDarkIntro,
                                                useExpeditionBackground: stats.useExpeditionBackground
                                            });

                                            // 2. Handle Spin & SpaceBg (which are passed as props/callbacks)
                                            // The toggles for these currently call onToggleSpin/onToggleSpaceBg directly. 
                                            // To make them "Save" based, we should have coerced them to local state too.
                                            // But for now, let's at least fix the new setting (ExpeditionBackground).

                                            // Show Success Feedback
                                            const btn = document.getElementById('save-settings-btn');
                                            if (btn) {
                                                const originalText = btn.innerText;
                                                btn.innerText = 'Saved!';
                                                btn.classList.add('bg-green-600', 'border-green-400');
                                                setTimeout(() => {
                                                    btn.innerText = originalText;
                                                    btn.classList.remove('bg-green-600', 'border-green-400');
                                                }, 2000);
                                            }
                                        }}
                                        id="save-settings-btn"
                                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 text-white font-bold uppercase tracking-widest rounded shadow-lg transition-all hover:scale-105 active:scale-95"
                                    >
                                        Save Settings
                                    </button>
                                </div>

                                {/* Dev Tools - Temporary for Testing */}
                                <div className="flex items-center justify-between p-4 bg-red-900/10 rounded-lg border border-red-900/30 mt-3">
                                    <div>
                                        <div className="text-red-400 font-bold text-sm">Reset EXP33 (Dev)</div>
                                        <div className="text-red-500/50 text-xs text-left">Reset redemption status for testing.</div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!stats) return;
                                            const newStats = { ...stats };
                                            newStats.unlockedCodes = newStats.unlockedCodes?.filter(c => c !== 'EXP33') || [];
                                            newStats.unlockedBorders = newStats.unlockedBorders?.filter(b => b !== 'exp33') || [];
                                            newStats.unlockedTitles = newStats.unlockedTitles?.filter(t => t !== 'Expeditioner') || [];

                                            if (newStats.activeBorder === 'exp33') newStats.activeBorder = 'default';
                                            if (newStats.activeTitle === 'Expeditioner') newStats.activeTitle = null;

                                            setStats(newStats);
                                            await db.updateUserStats(username, {
                                                unlockedCodes: newStats.unlockedCodes,
                                                unlockedBorders: newStats.unlockedBorders,
                                                unlockedTitles: newStats.unlockedTitles,
                                                activeBorder: newStats.activeBorder,
                                                activeTitle: newStats.activeTitle
                                            });
                                            alert(`EXP33 Reset for ${username}. You can now redeem it again.`);
                                        }}
                                        className="px-3 py-1 bg-red-900/30 border border-red-700 text-red-400 rounded hover:bg-red-900/50 transition-colors text-xs font-mono uppercase"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const testUsers = ['Test', 'Test2', 'test3', 'Test4', 'Test5', 'Test6'];
                                            if (confirm(`Reset EXP33 for: ${testUsers.join(', ')}?`)) {
                                                for (const user of testUsers) {
                                                    // This is a bit hacky as we are using client-side DB access for other users
                                                    // ideally this should be an admin function, but for dev tool usage it's fine
                                                    try {
                                                        const userStats = await db.getUserStats(user);
                                                        if (userStats) {
                                                            const newStats = { ...userStats };
                                                            newStats.unlockedCodes = newStats.unlockedCodes?.filter(c => c !== 'EXP33') || [];
                                                            newStats.unlockedBorders = newStats.unlockedBorders?.filter(b => b !== 'exp33') || [];
                                                            newStats.unlockedTitles = newStats.unlockedTitles?.filter(t => t !== 'Expeditioner') || [];

                                                            if (newStats.activeBorder === 'exp33') newStats.activeBorder = 'default';
                                                            if (newStats.activeTitle === 'Expeditioner') newStats.activeTitle = null;

                                                            await db.updateUserStats(user, {
                                                                unlockedCodes: newStats.unlockedCodes,
                                                                unlockedBorders: newStats.unlockedBorders,
                                                                unlockedTitles: newStats.unlockedTitles,
                                                                activeBorder: newStats.activeBorder,
                                                                activeTitle: newStats.activeTitle
                                                            });
                                                            console.log(`Reset complete for ${user}`);
                                                        }
                                                    } catch (e) {
                                                        console.error(`Failed to reset ${user}`, e);
                                                    }
                                                }
                                                alert('Bulk Reset Complete. Check console for details.');
                                            }
                                        }}
                                        className="px-3 py-1 bg-red-900/30 border border-red-700 text-red-400 rounded hover:bg-red-900/50 transition-colors text-xs font-mono uppercase ml-2"
                                    >
                                        Reset Test Users
                                    </button>
                                </div>

                                {/* Redeem Code Button */}
                                <div className="mt-8 pt-4 border-t border-gray-800">
                                    <button
                                        onClick={() => setShowRedeemModal(true)}
                                        className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-yellow-500 font-bold uppercase tracking-wider border border-yellow-500/30 rounded-lg transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                        </svg>
                                        Redeem Access Code
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Redeem Modal Overlay */}
                {showRedeemModal && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-gray-900 w-full max-w-sm p-6 rounded-xl border border-yellow-500 shadow-2xl relative">
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-4 text-center">Redeem Code</h3>
                            <input
                                type="text"
                                placeholder="ENTER ACCESS CODE"
                                value={redeemCode}
                                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                                className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-center text-yellow-500 font-mono text-lg placeholder-gray-700 focus:border-yellow-500 outline-none uppercase mb-4"
                            />
                            {redeemMessage && (
                                <div className={`text-center text-sm font-bold mb-4 ${redeemMessage.includes('Invalid') ? 'text-red-500' : 'text-yellow-500'}`}>
                                    {redeemMessage}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowRedeemModal(false); setRedeemCode(''); setRedeemMessage(''); }}
                                    className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRedeem}
                                    disabled={!redeemCode.trim() || redeemMessage === 'Verifying code...'}
                                    className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Redeem
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Mass Effect Style Reward Modal */}
            {/* Reward Modal */}
            {showRewardModal && (
                <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/90 animate-in fade-in duration-500">

                    {/* N7 Theme */}
                    {showRewardModal.id === 'n7' && (
                        <div className="relative w-full max-w-lg p-1 bg-gradient-to-br from-red-600 to-red-900 rounded-sm shadow-[0_0_100px_rgba(220,38,38,0.5)]">
                            <div className="bg-black p-8 relative overflow-hidden flex flex-col items-center">
                                {/* Diagonal Stripes Background */}
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)' }}></div>

                                <div className="relative z-10 flex flex-col items-center">
                                    <h2 className="text-4xl font-bold italic tracking-widest text-white uppercase mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                                        <span className="text-red-600">N7</span> <span className="text-gray-200">Authorized</span>
                                    </h2>
                                    <div className="w-full h-px bg-gradient-to-r from-transparent via-red-600 to-transparent mb-8"></div>

                                    <div className="mb-8 relative">
                                        <div className="absolute inset-0 bg-red-600 blur-[50px] opacity-20 animate-pulse"></div>
                                        {showRewardModal.type === 'border' && (
                                            <div className="w-48 h-48 relative">
                                                {/* Preview Avatar with Border */}
                                                <img src={showRewardModal.src} className="absolute inset-0 w-full h-full object-cover z-20" alt="Reward" />
                                                <div className="absolute inset-4 rounded-full bg-gray-800 overflow-hidden z-10 flex items-center justify-center">
                                                    <span className="text-4xl font-bold text-gray-500">{username.charAt(0).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-center mb-8">
                                        <div className="text-red-500 text-sm font-bold uppercase tracking-[0.2em] mb-2">Systems Alliance Registry</div>
                                        <div className="text-2xl text-white font-bold">{showRewardModal.name}</div>
                                        <div className="text-gray-400 text-sm italic mt-1">Special Operations Classification</div>
                                    </div>

                                    <button
                                        onClick={() => setShowRewardModal(null)}
                                        className="px-10 py-2 bg-linear-to-r from-red-800 to-red-900 text-white font-bold uppercase border border-red-500 hover:bg-red-800 transition-colors skew-x-[-10deg] hover:skew-x-[-15deg] hover:scale-105 shadow-lg border-l-4 border-white"
                                    >
                                        <div className="skew-x-[10deg]">Acknowledge</div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EXP33 Theme - Gold & Elegant */}
                    {showRewardModal.id === 'exp33' && (
                        <div className="relative w-full max-w-lg p-1 bg-linear-to-tr from-yellow-700 via-yellow-400 to-yellow-900 rounded-sm shadow-[0_0_100px_rgba(234,179,8,0.5)]">
                            {/* Gold Mist Background Effect - Stronger */}
                            <div className="absolute inset-0 z-[-1] pointer-events-none overflow-visible">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-yellow-500/30 blur-[120px] animate-[mist-flow_6s_ease-in-out_infinite] rounded-full mix-blend-screen"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-orange-500/20 blur-[100px] animate-[mist-flow_8s_ease-in-out_infinite_reverse] rounded-full mix-blend-screen"></div>
                            </div>

                            {/* Foreground Mist for Depth */}
                            <div className="absolute inset-0 z-[50] pointer-events-none overflow-visible">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-yellow-200/5 blur-[60px] animate-pulse rounded-full"></div>
                                {/* Floating Gold Particles */}
                                {[...Array(50)].map((_, i) => (
                                    <div
                                        key={`dust-${i}`}
                                        className="absolute w-1 h-1 bg-yellow-300 rounded-full shadow-[0_0_2px_#ffd700]"
                                        style={{
                                            left: `${Math.random() * 100}%`,
                                            top: `${50 + Math.random() * 50}%`, // Start from bottom half
                                            '--move-x': `${(Math.random() - 0.5) * 50}px`,
                                            animation: `float ${2 + Math.random() * 3}s linear infinite`,
                                            animationDelay: `-${Math.random() * 5}s`,
                                            opacity: Math.random() * 0.7
                                        } as any}
                                    ></div>
                                ))}
                            </div>

                            <div className="bg-gray-950 p-8 relative overflow-hidden flex flex-col items-center">
                                {/* Elegant Background Overlay */}
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #ffd700 0%, transparent 70%)' }}></div>

                                {/* Falling Rose Petals Animation */}
                                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-sm">
                                    {[...Array(20)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute top-0 w-3 h-3 bg-red-600/80 rounded-br-lg rounded-tl-sm shadow-sm"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                animation: `fall ${3 + Math.random() * 4}s linear infinite`,
                                                animationDelay: `-${Math.random() * 5}s`,
                                                transform: `rotate(${Math.random() * 360}deg)`
                                            }}
                                        ></div>
                                    ))}
                                </div>

                                {/* Content */}
                                <div className="relative z-20 flex flex-col items-center justify-center text-center p-4 w-full mt-2">
                                    <h2 className="text-xl font-serif text-yellow-400 uppercase tracking-widest mb-2 drop-shadow-md w-full px-4 flex flex-col gap-1">
                                        <span>For Those Who</span>
                                        <span className="text-2xl font-bold text-yellow-300">Dive After</span>
                                    </h2>

                                    <div className="mb-2 relative mt-4">
                                        <div className="absolute inset-0 bg-yellow-500 blur-[60px] opacity-20 animate-pulse"></div>
                                        <div className="w-40 h-40 relative">
                                            <img src={showRewardModal.src} className="absolute inset-0 w-full h-full object-cover z-20 scale-110" alt="Reward" />
                                            <div className="absolute inset-0 border-2 border-yellow-500/50 rounded-full z-30 animate-spin-slow"></div>
                                        </div>
                                    </div>

                                    <div className="text-yellow-100 font-serif tracking-widest text-sm mb-4">EXCLUSIVE CUSTOMIZATION</div>
                                    <div className="text-4xl font-bold text-yellow-500 mb-2 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] font-serif">EXP33</div>
                                    <div className="text-yellow-200/80 italic text-sm mb-8 animate-pulse">+ Title: "Expeditioner"</div>

                                    <button
                                        onClick={() => {
                                            if (isExploding) return; // Prevent double click
                                            setIsExploding(true);
                                            // Reset after animation (1s)
                                            setTimeout(() => {
                                                setShowRewardModal(null);
                                                setIsExploding(false);
                                            }, 1000);
                                        }}
                                        className="relative px-8 py-3 bg-linear-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-white font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] rounded-sm transition-all transform hover:scale-105 active:scale-95"
                                    >
                                        Accept Treasure
                                        {/* Exploding Petals */}
                                        {isExploding && (
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                                {[...Array(30)].map((_, i) => {
                                                    const angle = Math.random() * 360;
                                                    const distance = 100 + Math.random() * 100;
                                                    const tx = Math.cos(angle * Math.PI / 180) * distance;
                                                    const ty = Math.sin(angle * Math.PI / 180) * distance;
                                                    return (
                                                        <div
                                                            key={i}
                                                            className="absolute w-2 h-2 bg-red-600 rounded-full"
                                                            style={{
                                                                '--tx': `${tx}px`,
                                                                '--ty': `${ty}px`,
                                                                animation: `explode 1s ease-out forwards`,
                                                                left: 0,
                                                                top: 0
                                                            } as any}
                                                        ></div>
                                                    );
                                                })}
                                                {/* Gold Dust */}
                                                {[...Array(20)].map((_, i) => {
                                                    const angle = Math.random() * 360;
                                                    const distance = 80 + Math.random() * 80;
                                                    const tx = Math.cos(angle * Math.PI / 180) * distance;
                                                    const ty = Math.sin(angle * Math.PI / 180) * distance;
                                                    return (
                                                        <div
                                                            key={`gold-${i}`}
                                                            className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                                                            style={{
                                                                '--tx': `${tx}px`,
                                                                '--ty': `${ty}px`,
                                                                animation: `explode 0.8s ease-out forwards`,
                                                                left: 0,
                                                                top: 0
                                                            } as any}
                                                        ></div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}</div>
            )}
        </div>

    );
};

export default ProfileModal;
