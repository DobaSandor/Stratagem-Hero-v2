import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// These should be in .env, but for now we'll check if they exist
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export interface User {
    username: string;
    passwordHash: string;
}

export interface ScoreEntry {
    username: string;
    score: number;
    difficulty: string;
    // Enhanced fields
    level?: number;
    rankTitle?: string;
    activeTitle?: string | null;
    activeBorder?: string;
    avatarId?: string;
}

export interface UserStats {
    uid?: string; // Unique 12-char ID
    totalTimePlayed: number; // in seconds
    totalStratagems: number;
    totalMissedInputs: number;
    activeBorder: string;
    avatarId: string;
    unlockedTitles?: string[];
    activeTitle?: string | null;
    dailyMissions?: {
        date: string;
        missions: UserMission[];
    };
    friends?: string[]; // List of Friend UIDs
    friendRequests?: { fromUid: string; timestamp: number }[]; // Incoming requests
    skipIntro?: boolean;
    useDarkIntro?: boolean;
    lastActive?: number; // Timestamp of last activity
    friendships?: Record<string, FriendshipData>; // Keyed by Friend UID
    giftsReceived?: GiftItem[];
    // Truth Enforcers
    truthEnforcers?: {
        day: number;
        credits: number;
        items: string[];
    };
    enableSpin?: boolean;
    enableSpaceBg?: boolean;
    useExpeditionBackground?: boolean;
    illuminate?: {
        highScore: number;
        credits: number;
        inventory: string[];
    };
    unlockedBorders?: string[];
    unlockedCodes?: string[];
}

export interface FriendshipData {
    level: number; // 0-5
    giftsExchanged: number; // Total gifts between users
    lastGiftSent: string; // ISO Date YYYY-MM-DD
    lastGiftReceived: string; // ISO Date YYYY-MM-DD
}

export interface GiftItem {
    id: string;
    fromUid: string;
    fromUsername: string; // Cache for display
    xpAmount: number;
    timestamp: number;
}

import { MISSION_POOL, MISSION_UPDATE_LOGIC } from '../data/dailyMissions';
import type { MissionType, UserMission } from '../data/dailyMissions';

const USERS_KEY = 'stratagem_hero_users';
const SCORES_KEY = 'stratagem_hero_highscores_v2'; // Changed key for new format

// Helper to generate 12-char UID
const generateUID = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const db = {
    // ... existing basic methods ...
    getUsers: (): Record<string, string> => {
        const stored = localStorage.getItem(USERS_KEY);
        return stored ? JSON.parse(stored) : {};
    },

    saveUsers: (users: Record<string, string>) => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    },

    getLocalScores: (): ScoreEntry[] => {
        const stored = localStorage.getItem(SCORES_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    saveLocalScores: (scores: ScoreEntry[]) => {
        localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
    },

    register: async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
        // 1. Supabase Register
        if (supabase) {
            // Check if exists
            const { data: existing } = await supabase.from('app_users').select('username').eq('username', username).single();
            if (existing) return { success: false, message: 'Username already taken (Cloud)' };

            // Insert
            const { error } = await supabase.from('app_users').insert([{ username, password }]);
            if (error) return { success: false, message: error.message };
        }

        // 2. Local Register (Fallback/Sync)
        const users = db.getUsers();
        if (users[username] && !supabase) { // Only checking local collision if supbase didn't catch it
            return { success: false, message: 'Username already taken (Local)' };
        }
        users[username] = password;
        db.saveUsers(users);

        return { success: true };
    },

    login: async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
        if (username === 'admin' && password === 'admin.-Hd9.k1GC-H223bY9') return { success: true };

        console.log(`[Auth] Attempting login: ${username}`);

        // 1. Local Login (Fast & Migrates old users)
        const users = db.getUsers();
        let localSuccess = false;

        if (users[username] && users[username] === password) {
            console.log('[Auth] Local login success.');
            localSuccess = true;
            // SMART SYNC: If logged in locally but Supabase is active, ensure detailed record exists
            if (supabase) {
                console.log('[Auth] Checking Cloud Sync...');
                const { data, error: fetchError } = await supabase.from('app_users').select('username').eq('username', username).single();

                if (fetchError && fetchError.code !== 'PGRST116') { // Ignore row not found
                    console.error('[Auth] Cloud Sync Check Error:', fetchError);
                }

                if (!data) {
                    // Migrate credentials to cloud
                    console.log('[Auth] Syncing user credentials to cloud...');
                    const { error: insertError } = await supabase.from('app_users').insert([{ username, password }]);
                    if (insertError) console.error('[Auth] Cloud Credential Sync Failed:', insertError);
                }

                // Check and Sync Stats
                const { data: statsData } = await supabase.from('user_stats').select('uid').eq('username', username).single();
                if (!statsData) {
                    console.log('[Auth] Syncing local stats to cloud...');
                    const localStats = await db.getUserStats(username);
                    // We need to be careful not to generate a NEW uid if one doesn't exist locally but SHOULD be consistent.
                    // But here we are migrating local -> cloud.
                    const dbStats = {
                        username,
                        uid: localStats.uid || generateUID(),
                        total_time_played: localStats.totalTimePlayed,
                        total_stratagems: localStats.totalStratagems,
                        total_missed_inputs: localStats.totalMissedInputs,
                        active_border: localStats.activeBorder,
                        avatar_id: localStats.avatarId,
                        unlocked_titles: localStats.unlockedTitles,
                        active_title: localStats.activeTitle,
                        daily_missions: localStats.dailyMissions,
                        friends: localStats.friends,
                        friend_requests: localStats.friendRequests,
                        skip_intro: localStats.skipIntro,
                        use_dark_intro: localStats.useDarkIntro,
                        last_active: localStats.lastActive,
                        friendships: localStats.friendships,
                        gifts_received: localStats.giftsReceived,
                        truth_enforcers: localStats.truthEnforcers,
                        enable_spin: localStats.enableSpin,
                        unlocked_borders: localStats.unlockedBorders,
                        unlocked_codes: localStats.unlockedCodes
                    };
                    await supabase.from('user_stats').insert([dbStats]);
                } else {
                    console.log('[Auth] User stats already synced.');
                }
            } else {
                console.warn('[Auth] Supabase not connected. Skipping Cloud Sync.');
            }
        }

        // 2. Cloud Login (If local failed or for fresh browser)
        if (!localSuccess && supabase) {
            console.log('[Auth] Checking Cloud Login...');
            const { data, error } = await supabase.from('app_users').select('password').eq('username', username).single();

            if (error) {
                console.error('[Auth] Cloud Login Lookup Error:', error);
            }

            if (data && data.password === password) {
                console.log('[Auth] Cloud Login Success!');
                // Login Success!
                // Cache locally for offline support
                users[username] = password;
                db.saveUsers(users);
                return { success: true };
            } else {
                console.warn('[Auth] Cloud Login Failed: Invalid password or user not found.');
            }
        } else if (!localSuccess) {
            console.warn('[Auth] Local login failed and Supabase disconnected.');
        }

        if (localSuccess) return { success: true };

        return { success: false, message: 'Invalid credentials' };
    },

    // ... saveScore, getTopScores, getUserScore omit for brevity, they are below ...


    // --- FRIENDS SYSTEM START ---

    getUserByUid: async (uid: string): Promise<{ username: string, stats: UserStats } | null> => {
        // 1. Supabase
        if (supabase) {
            const { data } = await supabase.from('user_stats').select('*').eq('uid', uid).single();
            if (data) {
                const stats = {
                    uid: data.uid,
                    totalTimePlayed: data.total_time_played || 0,
                    totalStratagems: data.total_stratagems || 0,
                    totalMissedInputs: data.total_missed_inputs || 0,
                    activeBorder: data.active_border || 'default',
                    avatarId: data.avatar_id || 'default',
                    unlockedTitles: data.unlocked_titles || [],
                    activeTitle: data.active_title || null,
                    dailyMissions: data.daily_missions,
                    friends: data.friends || [],
                    friendRequests: data.friend_requests || [],
                    unlockedBorders: data.unlocked_borders || [],
                    unlockedCodes: data.unlocked_codes || []
                };
                return { username: data.username, stats };
            }
        }
        // 2. Local Storage scan
        const key = 'stratagem_hero_user_stats';
        const stored = localStorage.getItem(key);
        if (stored) {
            const allStats = JSON.parse(stored);
            for (const [username, stats] of Object.entries(allStats) as [string, any]) {
                if (stats.uid === uid) return { username, stats };
            }
        }
        return null;
    },

    sendFriendRequest: async (fromUsername: string, targetUid: string): Promise<{ success: boolean; message: string }> => {
        // Get Sender Stats (to get UID)
        const senderStats = await db.getUserStats(fromUsername);
        if (!senderStats.uid) return { success: false, message: 'Sender UID missing.' };

        // Get Target
        const target = await db.getUserByUid(targetUid);
        if (!target) return { success: false, message: 'User not found.' };
        if (target.username === fromUsername) return { success: false, message: 'Cannot add yourself.' };

        // Check if already friends
        if (target.stats.friends?.includes(senderStats.uid)) {
            return { success: false, message: 'Already friends.' };
        }

        // Check if pending
        if (target.stats.friendRequests?.some(r => r.fromUid === senderStats.uid)) {
            return { success: false, message: 'Request already sent.' };
        }

        // Add Request
        const newRequests = target.stats.friendRequests || [];
        newRequests.push({ fromUid: senderStats.uid, timestamp: Date.now() });
        const updatedTargetStats = { ...target.stats, friendRequests: newRequests };

        // Save Target
        if (supabase) {
            await supabase.from('user_stats').update({ friend_requests: newRequests }).eq('username', target.username);
        }
        // Local
        const key = 'stratagem_hero_user_stats';
        const stored = localStorage.getItem(key);
        const allStats = stored ? JSON.parse(stored) : {};
        allStats[target.username] = updatedTargetStats;
        localStorage.setItem(key, JSON.stringify(allStats));

        return { success: true, message: 'Friend request sent!' };
    },

    acceptFriendRequest: async (username: string, fromUid: string) => {
        const stats = await db.getUserStats(username);
        const requests = stats.friendRequests || [];

        // Remove Request
        const newRequests = requests.filter(r => r.fromUid !== fromUid);

        // Add Friend (if not already)
        const friends = stats.friends || [];
        if (!friends.includes(fromUid)) {
            friends.push(fromUid);
        }

        // Update My Stats
        // ... (save logic reused below)

        // Update Other User (Must add ME to THEIR friends list)
        // This is tricky in LocalStorage if we don't know their username, but we can look it up
        const otherUser = await db.getUserByUid(fromUid);
        if (otherUser) {
            const otherFriends = otherUser.stats.friends || [];
            if (!otherFriends.includes(stats.uid!)) {
                otherFriends.push(stats.uid!);

                // Save Other
                if (supabase) {
                    await supabase.from('user_stats').update({ friends: otherFriends }).eq('username', otherUser.username);
                }
                const key = 'stratagem_hero_user_stats';
                const stored = localStorage.getItem(key);
                const allStats = stored ? JSON.parse(stored) : {};
                allStats[otherUser.username] = { ...otherUser.stats, friends: otherFriends };
                localStorage.setItem(key, JSON.stringify(allStats));
            }
        }

        // Save My Stats
        stats.friendRequests = newRequests;
        stats.friends = friends;

        if (supabase) {
            await supabase.from('user_stats').update({
                friend_requests: newRequests,
                friends: friends
            }).eq('username', username);
        }
        const key = 'stratagem_hero_user_stats';
        const stored = localStorage.getItem(key);
        const allStats = stored ? JSON.parse(stored) : {};
        allStats[username] = stats;
        localStorage.setItem(key, JSON.stringify(allStats));
    },

    denyFriendRequest: async (username: string, fromUid: string) => {
        const stats = await db.getUserStats(username);
        const requests = stats.friendRequests || [];
        const newRequests = requests.filter(r => r.fromUid !== fromUid);
        stats.friendRequests = newRequests;

        if (supabase) {
            await supabase.from('user_stats').update({ friend_requests: newRequests }).eq('username', username);
        }
        const key = 'stratagem_hero_user_stats';
        const stored = localStorage.getItem(key);
        const allStats = stored ? JSON.parse(stored) : {};
        allStats[username] = stats;
        localStorage.setItem(key, JSON.stringify(allStats));
    },

    removeFriend: async (username: string, friendUid: string) => {
        const stats = await db.getUserStats(username);
        stats.friends = (stats.friends || []).filter(uid => uid !== friendUid);
        if (stats.friendships) delete stats.friendships[friendUid];

        // Remove ME from THEIR friends
        const otherUser = await db.getUserByUid(friendUid);
        if (otherUser) {
            const otherFriends = (otherUser.stats.friends || []).filter(uid => uid !== stats.uid);
            const otherFriendships = otherUser.stats.friendships || {};
            delete otherFriendships[stats.uid!];

            if (supabase) await supabase.from('user_stats').update({ friends: otherFriends, friendships: otherFriendships }).eq('username', otherUser.username);

            const key = 'stratagem_hero_user_stats';
            const stored = localStorage.getItem(key);
            const allStats = stored ? JSON.parse(stored) : {};
            allStats[otherUser.username] = { ...otherUser.stats, friends: otherFriends, relationships: otherFriendships };
            localStorage.setItem(key, JSON.stringify(allStats));
        }

        // Save Mine
        if (supabase) await supabase.from('user_stats').update({ friends: stats.friends, friendships: stats.friendships }).eq('username', username);
        const key = 'stratagem_hero_user_stats';
        const stored = localStorage.getItem(key);
        const allStats = stored ? JSON.parse(stored) : {};
        allStats[username] = stats;
        localStorage.setItem(key, JSON.stringify(allStats));
    },

    sendGift: async (fromUsername: string, targetUid: string): Promise<{ success: boolean; message: string; xpSent?: number }> => {
        const today = new Date().toISOString().split('T')[0];

        // 1. Get Sender
        const senderStats = await db.getUserStats(fromUsername);
        if (!senderStats.uid) return { success: false, message: 'Error: User ID missing.' };

        if (!senderStats.friendships) senderStats.friendships = {};
        const senderFriendship = senderStats.friendships[targetUid] || { level: 0, giftsExchanged: 0, lastGiftSent: '', lastGiftReceived: '' };

        // Check if already sent
        if (senderFriendship.lastGiftSent === today) {
            return { success: false, message: 'Already sent a gift to this operative today.' };
        }

        // 2. Get Target
        const target = await db.getUserByUid(targetUid);
        if (!target) return { success: false, message: 'Target operative not found.' };

        // 3. Calculate XP & Friendship Progress
        // Levels: 1=1, 2=5, 3=10, 4=20, 5=50
        const getFriendshipLevel = (gifts: number) => {
            if (gifts >= 50) return 5;
            if (gifts >= 20) return 4;
            if (gifts >= 10) return 3;
            if (gifts >= 5) return 2;
            if (gifts >= 1) return 1;
            return 0;
        };

        const currentGifts = (senderFriendship.giftsExchanged || 0) + 1;
        const newLevel = getFriendshipLevel(currentGifts);

        // XP based on new level
        const xpMap: Record<number, number> = { 0: 5, 1: 10, 2: 20, 3: 50, 4: 75, 5: 125 };
        const xpAmount = xpMap[newLevel] || 10;

        // 4. Update Sender State
        senderFriendship.lastGiftSent = today;
        senderFriendship.giftsExchanged = currentGifts;
        senderFriendship.level = newLevel;

        senderStats.friendships[targetUid] = senderFriendship;

        // Save Sender
        await db.updateUserStats(fromUsername, { friendships: senderStats.friendships });

        // 5. Update Target State (Queue Gift + Update Friendship)
        const targetFriendships = target.stats.friendships || {};
        const targetFriendship = targetFriendships[senderStats.uid!] || { level: 0, giftsExchanged: 0, lastGiftSent: '', lastGiftReceived: '' };

        // Update Target's view
        targetFriendship.lastGiftReceived = today;
        targetFriendship.giftsExchanged = currentGifts; // Syncs count
        targetFriendship.level = newLevel; // Syncs level

        targetFriendships[senderStats.uid!] = targetFriendship;

        const targetGifts = target.stats.giftsReceived || [];
        targetGifts.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            fromUid: senderStats.uid!,
            fromUsername: fromUsername,
            xpAmount: xpAmount,
            timestamp: Date.now()
        });

        // Save Target (using direct update pattern or updateUserStats if accessible)
        // Since we have target.username, we can use updateUserStats logic or similar
        // We must update BOTH friendships and giftsReceived
        if (supabase) {
            await supabase.from('user_stats').update({
                friendships: targetFriendships,
                gifts_received: targetGifts
            }).eq('username', target.username);
        }
        // Local
        const key = 'stratagem_hero_user_stats';
        const stored = localStorage.getItem(key);
        const allStats = stored ? JSON.parse(stored) : {};
        allStats[target.username] = { ...target.stats, friendships: targetFriendships, giftsReceived: targetGifts };
        localStorage.setItem(key, JSON.stringify(allStats));

        return { success: true, message: `Gift sent! (${xpAmount} XP)`, xpSent: xpAmount };
    },

    claimGift: async (username: string, giftId: string) => {
        const stats = await db.getUserStats(username);
        const queue = stats.giftsReceived || [];
        const giftIndex = queue.findIndex(g => g.id === giftId);

        if (giftIndex === -1) return null; // Already claimed or invalid

        const gift = queue[giftIndex];

        // Apply XP
        await db.addXP(username, gift.xpAmount);

        // Remove from Queue
        const newQueue = queue.filter(g => g.id !== giftId);
        stats.giftsReceived = newQueue;

        await db.updateUserStats(username, { giftsReceived: newQueue });

        return gift;
    },

    // --- FRIENDS SYSTEM END ---


    saveScore: async (username: string, score: number, difficulty: string) => {
        // 1. Try Supabase
        if (supabase) {
            try {
                const { error } = await supabase
                    .from('scores')
                    .insert([{ username, score, difficulty }]);

                if (!error) return; // Success
                console.error('Supabase error:', error);
            } catch (e) {
                console.error('Supabase exception:', e);
            }
        }

        // 2. Fallback to Local Storage
        const scores = db.getLocalScores();
        // Check if this is a high score for this user on this difficulty
        const existingIndex = scores.findIndex(s => s.username === username && s.difficulty === difficulty);

        if (existingIndex >= 0) {
            if (score > scores[existingIndex].score) {
                scores[existingIndex].score = score;
                db.saveLocalScores(scores);
            }
        } else {
            scores.push({ username, score, difficulty });
            db.saveLocalScores(scores);
        }
    },

    getTopScores: async (difficulty: string): Promise<ScoreEntry[]> => {
        let scores: ScoreEntry[] = [];

        // 1. Try Supabase
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('scores')
                    .select('username, score, difficulty')
                    .eq('difficulty', difficulty)
                    .neq('username', 'admin') // Filter admin from Supabase
                    .order('score', { ascending: false })
                    .limit(10);

                if (!error && data) {
                    scores = data as ScoreEntry[];
                } else {
                    console.error('Supabase error:', error);
                }
            } catch (e) {
                console.error('Supabase exception:', e);
            }
        }

        // 2. Fallback to Local Storage if Supabase failed or returned empty (optional strategy, but here we prioritize Cloud)
        if (scores.length === 0) {
            const localScores = db.getLocalScores();
            scores = localScores
                .filter(s => s.difficulty === difficulty && s.username !== 'admin')
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
        }

        // 3. Enrich with User metadata
        const { getRankForLevel } = await import('../data/levelSystem');
        const enrichedScores: ScoreEntry[] = [];

        for (const score of scores) {
            try {
                // Fetch stats and level data parallel
                const [stats, levelData] = await Promise.all([
                    db.getUserStats(score.username),
                    db.getUserLevelData(score.username)
                ]);

                enrichedScores.push({
                    ...score,
                    level: levelData.level,
                    rankTitle: getRankForLevel(levelData.level),
                    activeTitle: stats.activeTitle,
                    activeBorder: stats.activeBorder,
                    avatarId: stats.avatarId
                });
            } catch (err) {
                // Determine fallback if fetch fails
                enrichedScores.push(score);
            }
        }

        return enrichedScores;
    },

    getUserScore: async (username: string, difficulty: string): Promise<number> => {
        // 1. Try Supabase
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('scores')
                    .select('score')
                    .eq('username', username)
                    .eq('difficulty', difficulty)
                    .order('score', { ascending: false })
                    .limit(1);

                if (!error && data && data.length > 0) {
                    return data[0].score;
                }
            } catch (e) {
                console.error('Supabase exception:', e);
            }
        }

        // 2. Fallback to Local Storage
        const scores = db.getLocalScores();
        const entry = scores.find(s => s.username === username && s.difficulty === difficulty);
        return entry ? entry.score : 0;
    },

    // Mission Progress
    saveMissionProgress: async (username: string, highestMissionId: number) => {
        // ... (Existing implementation unchanged)
        // 1. Try Supabase
        if (supabase) {
            try {
                const { error } = await supabase
                    .from('user_progress')
                    .upsert({ username, highest_mission_id: highestMissionId }, { onConflict: 'username' });

                if (!error) return;
                console.error('Supabase error:', error);
            } catch (e) {
                console.error('Supabase exception:', e);
            }
        }

        // 2. Fallback to Local Storage
        const key = 'stratagem_hero_mission_progress';
        const stored = localStorage.getItem(key);
        const progress = stored ? JSON.parse(stored) : {};

        if (!progress[username] || highestMissionId > progress[username]) {
            progress[username] = highestMissionId;
            localStorage.setItem(key, JSON.stringify(progress));
        }
    },

    getMissionProgress: async (username: string): Promise<number> => {
        // ... (Existing implementation unchanged)
        // 1. Try Supabase
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('user_progress')
                    .select('highest_mission_id')
                    .eq('username', username)
                    .single();

                if (!error && data) {
                    return data.highest_mission_id;
                }
            } catch (e) {
                console.error('Supabase exception:', e);
            }
        }

        // 2. Fallback to Local Storage
        const key = 'stratagem_hero_mission_progress';
        const stored = localStorage.getItem(key);
        const progress = stored ? JSON.parse(stored) : {};
        return progress[username] || 1;
    },

    // XP & Leveling System
    addXP: async (username: string, amount: number): Promise<{ newLevel: number, oldLevel: number, leveledUp: boolean, currentXP: number }> => {
        const { getLevelFromXP } = await import('../data/levelSystem');

        let currentXP = 0;

        // 1. Get Current XP
        // Try Supabase
        if (supabase) {
            const { data } = await supabase
                .from('user_progress')
                .select('xp')
                .eq('username', username)
                .single();
            if (data) currentXP = data.xp || 0;
        } else {
            // Local Storage
            const key = 'stratagem_hero_user_xp';
            const stored = localStorage.getItem(key);
            const progress = stored ? JSON.parse(stored) : {};
            currentXP = progress[username] || 0;
        }

        const oldLevel = getLevelFromXP(currentXP);
        const newTotalXP = currentXP + amount;
        const newLevel = getLevelFromXP(newTotalXP);
        const leveledUp = newLevel > oldLevel;

        // 2. Save New XP
        if (supabase) {
            await supabase
                .from('user_progress')
                .upsert({ username, xp: newTotalXP }, { onConflict: 'username' });
            // Note: This might overwrite mission_id if not careful, but upsert merges columns if row exists? 
            // Actually Supabase Upsert REPLACE the row if Primary Key matches unless we specify ignoreDuplicates which is for INSERT.
            // Wait, standard SQL upsert updates only specified columns? 
            // Supabase upsert: "If the record exists, it will be updated."
            // WARNING: If I only provide `xp`, will it nullify `highest_mission_id`?
            // ANSWER: No, Supabase/PostgREST updates only the provided columns if the row exists.
        }

        // Save Local
        const key = 'stratagem_hero_user_xp';
        const stored = localStorage.getItem(key);
        const progress = stored ? JSON.parse(stored) : {};
        progress[username] = newTotalXP;
        localStorage.setItem(key, JSON.stringify(progress));

        return { newLevel, oldLevel, leveledUp, currentXP: newTotalXP };
    },

    getUserLevelData: async (username: string) => {
        const { getLevelFromXP, getXPForLevel, getNextLevelXP } = await import('../data/levelSystem');

        let currentXP = 0;

        // Get XP (Copy logic from addXP or make helper but simple enough to repeat for now)
        if (supabase) {
            const { data } = await supabase.from('user_progress').select('xp').eq('username', username).single();
            if (data) currentXP = data.xp || 0;
        } else {
            const key = 'stratagem_hero_user_xp';
            const stored = localStorage.getItem(key);
            const progress = stored ? JSON.parse(stored) : {};
            currentXP = progress[username] || 0;
        }

        const level = getLevelFromXP(currentXP);
        const currentLevelStartXP = getXPForLevel(level);
        const nextLevelXP = getNextLevelXP(level);

        // Calculate progress within current level
        const xpInLevel = currentXP - currentLevelStartXP;
        const xpNeededForLevel = nextLevelXP - currentLevelStartXP;
        const progressPercent = Math.min(100, Math.max(0, (xpInLevel / xpNeededForLevel) * 100));

        return {
            level,
            currentXP,
            nextLevelXP,
            progressPercent
        };
    },

    setLevel: async (username: string, targetLevel: number) => {
        const { getXPForLevel } = await import('../data/levelSystem');

        // Calculate XP required for target level
        const newXP = getXPForLevel(targetLevel);

        // Save to Supabase
        if (supabase) {
            await supabase
                .from('user_progress')
                .upsert({ username, xp: newXP }, { onConflict: 'username' });
        }

        // Save to Local Storage
        const key = 'stratagem_hero_user_xp';
        const stored = localStorage.getItem(key);
        const progress = stored ? JSON.parse(stored) : {};
        progress[username] = newXP;
        localStorage.setItem(key, JSON.stringify(progress));

        return newXP;
    },

    // User Stats & Customization
    getUserStats: async (username: string): Promise<UserStats> => {
        // Read Local Storage First (for fallback/merging)
        const key = 'stratagem_hero_user_stats';
        const stored = localStorage.getItem(key);
        const allStats = stored ? JSON.parse(stored) : {};
        const local = allStats[username] || {};

        let stats: UserStats = {
            totalTimePlayed: 0,
            totalStratagems: 0,
            totalMissedInputs: 0,
            activeBorder: 'default',
            avatarId: 'default',
            unlockedTitles: [],
            activeTitle: null,
            unlockedBorders: [],
            unlockedCodes: []
        };

        let fromSupabase = false;

        // 1. Try Supabase
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('user_stats')
                    .select('*')
                    .eq('username', username)
                    .single();

                if (!error && data) {
                    fromSupabase = true;
                    // Map snake_case to camelCase
                    stats = {
                        uid: data.uid,
                        totalTimePlayed: data.total_time_played || 0,
                        totalStratagems: data.total_stratagems || 0,
                        totalMissedInputs: data.total_missed_inputs || 0,
                        activeBorder: data.active_border || 'default',
                        avatarId: data.avatar_id || 'default',
                        unlockedTitles: Array.from(new Set([...(data.unlocked_titles || []), ...(local.unlockedTitles || [])])),
                        activeTitle: data.active_title || null,
                        dailyMissions: data.daily_missions,
                        friends: data.friends || [],
                        friendRequests: data.friend_requests || [],
                        skipIntro: data.skip_intro || false,
                        useDarkIntro: data.use_dark_intro || false,
                        lastActive: data.last_active || 0,
                        friendships: data.friendships || {},

                        giftsReceived: data.gifts_received || [],
                        truthEnforcers: data.truth_enforcers || { day: 1, credits: 100, items: [] },
                        enableSpin: data.enable_spin ?? false,
                        // Cloud doesn't support this yet, use local or default
                        enableSpaceBg: data.enable_space_bg ?? local.enableSpaceBg ?? false,
                        // Prioritize local for this setting to prevent server defaults from overwriting user preference if sync is delayed/missing column
                        useExpeditionBackground: local.useExpeditionBackground ?? data.use_expedition_background ?? false,
                        illuminate: data.illuminate || local.illuminate || { highScore: 0, credits: 0, inventory: [] },
                        unlockedBorders: Array.from(new Set([...(data.unlocked_borders || []), ...(local.unlockedBorders || [])])),
                        unlockedCodes: Array.from(new Set([...(data.unlocked_codes || []), ...(local.unlockedCodes || [])]))
                    };
                }
            } catch (e) {
                console.error('Supabase exception:', e);
            }
        }

        // 2. Fallback / Merge Local Storage (if Supabase failed)
        if (!fromSupabase) {
            stats = { ...stats, ...local };
        } else {
            // If Supabase worked, but is missing UID (legacy), try to recover from local
            if (!stats.uid && local.uid) {
                stats.uid = local.uid;
            }
        }

        // 3. Ensure UID exists (Generate & Persist if missing)
        if (!stats.uid) {
            stats.uid = generateUID();

            // Persist immediately to Supabase
            if (supabase) {
                await supabase.from('user_stats').upsert({
                    username,
                    uid: stats.uid,
                    // Persist other fields to ensure row exists
                    total_time_played: stats.totalTimePlayed,
                    total_stratagems: stats.totalStratagems,
                    total_missed_inputs: stats.totalMissedInputs,
                    active_border: stats.activeBorder,
                    avatar_id: stats.avatarId,
                    unlocked_titles: stats.unlockedTitles,
                    active_title: stats.activeTitle,
                    daily_missions: stats.dailyMissions,
                    truth_enforcers: stats.truthEnforcers,
                    enable_spin: stats.enableSpin,
                    enable_space_bg: stats.enableSpaceBg,
                    unlocked_borders: stats.unlockedBorders,
                    unlocked_codes: stats.unlockedCodes
                }, { onConflict: 'username' });
            }

            // Save locally
            const allStats = stored ? JSON.parse(stored) : {};
            allStats[username] = stats;
            localStorage.setItem(key, JSON.stringify(allStats));
        }

        return stats;
    },

    updateUserStats: async (username: string, updates: Partial<UserStats>) => {
        // 1. Update Local Storage
        const key = 'stratagem_hero_user_stats';
        const stored = localStorage.getItem(key);
        let allStats = stored ? JSON.parse(stored) : {};
        if (!allStats[username]) allStats[username] = {};

        const currentStats = allStats[username];
        const newStats = { ...currentStats, ...updates };
        allStats[username] = newStats;
        localStorage.setItem(key, JSON.stringify(allStats));

        // 2. Update Supabase
        if (supabase) {
            const updatePayload: any = {};
            if (updates.skipIntro !== undefined) updatePayload.skip_intro = updates.skipIntro;
            if (updates.useDarkIntro !== undefined) updatePayload.use_dark_intro = updates.useDarkIntro;
            if (updates.giftsReceived !== undefined) updatePayload.gifts_received = updates.giftsReceived;
            if (updates.friendships !== undefined) updatePayload.friendships = updates.friendships;
            if (updates.truthEnforcers !== undefined) updatePayload.truth_enforcers = updates.truthEnforcers;
            if (updates.enableSpin !== undefined) updatePayload.enable_spin = updates.enableSpin;
            if (updates.activeBorder !== undefined) updatePayload.active_border = updates.activeBorder;
            if (updates.activeTitle !== undefined) updatePayload.active_title = updates.activeTitle;
            if (updates.unlockedTitles !== undefined) updatePayload.unlocked_titles = updates.unlockedTitles;
            if (updates.enableSpaceBg !== undefined) updatePayload.enable_space_bg = updates.enableSpaceBg;
            if (updates.useExpeditionBackground !== undefined) updatePayload.use_expedition_background = updates.useExpeditionBackground;
            if (updates.illuminate !== undefined) updatePayload.illuminate = updates.illuminate;
            if (updates.unlockedBorders !== undefined) updatePayload.unlocked_borders = updates.unlockedBorders;
            if (updates.unlockedCodes !== undefined) updatePayload.unlocked_codes = updates.unlockedCodes;

            if (Object.keys(updatePayload).length > 0) {
                await supabase
                    .from('user_stats')
                    .update(updatePayload)
                    .eq('username', username);
            }
        }
    },
    heartbeat: async (username: string) => {
        const timestamp = Date.now();
        // 1. Update Local
        const key = 'stratagem_hero_user_stats';
        const stored = localStorage.getItem(key);
        let allStats = stored ? JSON.parse(stored) : {};
        if (allStats[username]) {
            allStats[username].lastActive = timestamp;
            localStorage.setItem(key, JSON.stringify(allStats));
        }

        // 2. Update Supabase
        if (supabase) {
            await supabase
                .from('user_stats')
                .update({ last_active: timestamp })
                .eq('username', username);
        }
    },

    incrementUserStats: async (username: string, delta: { time?: number, stratagems?: number, missedInputs?: number }) => {
        const current = await db.getUserStats(username);
        const newStats = {
            totalTimePlayed: current.totalTimePlayed + (delta.time || 0),
            totalStratagems: current.totalStratagems + (delta.stratagems || 0),
            totalMissedInputs: current.totalMissedInputs + (delta.missedInputs || 0),
            activeBorder: current.activeBorder,
            avatarId: current.avatarId,
            unlockedTitles: current.unlockedTitles,
            activeTitle: current.activeTitle,
            dailyMissions: current.dailyMissions
        };

        // Save Supabase
        if (supabase) {
            await supabase.from('user_stats').upsert({
                username,
                total_time_played: newStats.totalTimePlayed,
                total_stratagems: newStats.totalStratagems,
                total_missed_inputs: newStats.totalMissedInputs,
                active_border: newStats.activeBorder,
                avatar_id: newStats.avatarId,
                unlocked_titles: newStats.unlockedTitles,
                active_title: newStats.activeTitle
            }, { onConflict: 'username' });
        }

        // Save Local
        const key = 'stratagem_hero_user_stats';
        const stored = localStorage.getItem(key);
        const allStats = stored ? JSON.parse(stored) : {};
        allStats[username] = newStats;
        localStorage.setItem(key, JSON.stringify(allStats));
    },

    setActiveBorder: async (username: string, borderId: string) => {
        const stats = await db.getUserStats(username);
        stats.activeBorder = borderId;

        // Save Supabase
        if (supabase) {
            await supabase.from('user_stats').upsert({
                username,
                active_border: borderId
            }, { onConflict: 'username' });
        }

        // Save Local
        const key = 'stratagem_hero_user_stats';
        const stored = localStorage.getItem(key);
        const allStats = stored ? JSON.parse(stored) : {};
        allStats[username] = stats;
        localStorage.setItem(key, JSON.stringify(allStats));
    },

    setActiveAvatar: async (username: string, avatarId: string) => {
        const stats = await db.getUserStats(username);
        stats.avatarId = avatarId;

        // Save Supabase
        if (supabase) {
            await supabase.from('user_stats').upsert({
                username,
                avatar_id: avatarId
            }, { onConflict: 'username' });
        }

        // Save Local
        const key = 'stratagem_hero_user_stats';
        const stored = localStorage.getItem(key);
        const allStats = stored ? JSON.parse(stored) : {};
        allStats[username] = stats;
        localStorage.setItem(key, JSON.stringify(allStats));
    },

    setActiveTitle: async (username: string, title: string) => {
        const stats = await db.getUserStats(username);
        stats.activeTitle = title;

        // Save Supabase
        if (supabase) {
            await supabase.from('user_stats').upsert({
                username,
                active_title: title
            }, { onConflict: 'username' });
        }

        // Save Local
        const key = 'stratagem_hero_user_stats';
        const stored = localStorage.getItem(key);
        const allStats = stored ? JSON.parse(stored) : {};
        allStats[username] = stats;
        localStorage.setItem(key, JSON.stringify(allStats));
    },

    unlockTitle: async (username: string, title: string) => {
        const stats = await db.getUserStats(username);
        if (!stats.unlockedTitles) stats.unlockedTitles = [];

        if (!stats.unlockedTitles.includes(title)) {
            stats.unlockedTitles.push(title);

            // Save Supabase
            if (supabase) {
                await supabase.from('user_stats').upsert({
                    username,
                    unlocked_titles: stats.unlockedTitles
                }, { onConflict: 'username' });
            }

            // Save Local
            const key = 'stratagem_hero_user_stats';
            const stored = localStorage.getItem(key);
            const allStats = stored ? JSON.parse(stored) : {};
            allStats[username] = stats;
            localStorage.setItem(key, JSON.stringify(allStats));
        }
    },


    // Daily Missions
    getDailyMissions: async (username: string): Promise<UserMission[]> => {
        const stats = await db.getUserStats(username);
        const today = new Date().toISOString().split('T')[0];

        // Check if missions need reset
        if (!stats.dailyMissions || stats.dailyMissions.date !== today) {
            // Select 3 random missions
            const shuffled = [...MISSION_POOL].sort(() => 0.5 - Math.random());
            const selectedMissions = shuffled.slice(0, 3).map(m => ({
                missionId: m.id,
                progress: 0,
                completed: false,
                claimed: false
            }));

            stats.dailyMissions = {
                date: today,
                missions: selectedMissions
            };

            // Save new missions
            if (supabase) {
                await supabase.from('user_stats').upsert({
                    username,
                    daily_missions: stats.dailyMissions
                }, { onConflict: 'username' });
            }

            const key = 'stratagem_hero_user_stats';
            const stored = localStorage.getItem(key);
            const allStats = stored ? JSON.parse(stored) : {};
            allStats[username] = stats;
            localStorage.setItem(key, JSON.stringify(allStats));
        }

        return stats.dailyMissions.missions;
    },

    updateMissionProgress: async (username: string, type: MissionType, amount: number) => {
        const stats = await db.getUserStats(username);
        if (!stats.dailyMissions) return;

        let changed = false;

        const updatedMissions = stats.dailyMissions.missions.map(mission => {
            const def = MISSION_POOL.find(m => m.id === mission.missionId);
            if (!def || mission.completed || def.type !== type) return mission;

            const updateType = MISSION_UPDATE_LOGIC[mission.missionId] || 'cumulative';
            let newProgress = mission.progress;

            if (updateType === 'cumulative') {
                newProgress += amount;
            } else if (updateType === 'high_water_mark') {
                if (amount > newProgress) {
                    newProgress = amount;
                }
            }

            // Cap progress at target for display purposes (optional, but good for UI)
            // Actually, keep raw progress in case target changes? No, keep it simple.
            // If high_water_mark: progress is the high score.
            // If cumulative: progress is total count.

            if (newProgress >= def.target) {
                newProgress = def.target; // Cap at target

                if (!mission.completed) {
                    mission.completed = true;
                    // Auto-XP removed. User must claim manually.
                }
            }

            if (newProgress !== mission.progress || mission.completed) {
                changed = true;
                return { ...mission, progress: newProgress };
            }
            return mission;
        });

        if (changed) {
            stats.dailyMissions.missions = updatedMissions;

            // Save Supabase
            if (supabase) {
                await supabase.from('user_stats').upsert({
                    username,
                    daily_missions: stats.dailyMissions
                }, { onConflict: 'username' });
            }

            // Save Local
            const key = 'stratagem_hero_user_stats';
            const stored = localStorage.getItem(key);
            const allStats = stored ? JSON.parse(stored) : {};
            allStats[username] = stats;
            localStorage.setItem(key, JSON.stringify(allStats));

            // Grant XP - Removed for Manual Claiming
            // if (xpToSend > 0) {
            //     await db.addXP(username, xpToSend);
            // }
        }
    },

    claimMissionReward: async (username: string, missionId: string): Promise<{ success: boolean; xpAwarded?: number }> => {
        const stats = await db.getUserStats(username);
        if (!stats.dailyMissions) return { success: false };

        let missionIndex = -1;
        const mission = stats.dailyMissions.missions.find((m, idx) => {
            if (m.missionId === missionId) {
                missionIndex = idx;
                return true;
            }
            return false;
        });

        if (!mission || !mission.completed || mission.claimed) {
            return { success: false };
        }

        const def = MISSION_POOL.find(m => m.id === missionId);
        if (!def) return { success: false };

        // Mark as claimed
        stats.dailyMissions.missions[missionIndex].claimed = true;

        // Save State
        if (supabase) {
            await supabase.from('user_stats').upsert({
                username,
                daily_missions: stats.dailyMissions
            }, { onConflict: 'username' });
        }

        const key = 'stratagem_hero_user_stats';
        const stored = localStorage.getItem(key);
        const allStats = stored ? JSON.parse(stored) : {};
        allStats[username] = stats;
        localStorage.setItem(key, JSON.stringify(allStats));

        // Award XP
        await db.addXP(username, def.xpReward);

        return { success: true, xpAwarded: def.xpReward };
    },

    // --- REALTIME SUBSCRIPTION ---
    subscribeToUser: (username: string, onUpdate: () => void) => {
        if (!supabase) return () => { };

        const channel = supabase
            .channel(`user_stats:${username}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_stats',
                    filter: `username=eq.${username}`
                },
                (payload) => {
                    console.log('Realtime update received:', payload);
                    onUpdate();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Subscribed to realtime updates for ${username}`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    },

    // --- TRUTH ENFORCERS PERSISTENCE ---
    saveTruthEnforcersData: async (username: string, data: { day: number, credits: number, items: string[] }) => {
        // 1. Update Local
        await db.updateUserStats(username, { truthEnforcers: data });

        // 2. Update Supabase
        if (supabase) {
            await supabase.from('user_stats').update({ truth_enforcers: data }).eq('username', username);
        }
    },

    saveIlluminateData: async (username: string, data: { highScore: number, credits: number, inventory: string[] }) => {
        // 1. Update Local
        await db.updateUserStats(username, { illuminate: data });

        // 2. Update Supabase
        if (supabase) {
            await supabase.from('user_stats').update({ illuminate: data }).eq('username', username);
        }
    },

    // --- SETTINGS PERSISTENCE ---
    setSpinSetting: async (username: string, enabled: boolean) => {
        // 1. Update Local
        await db.updateUserStats(username, { enableSpin: enabled });

        // 2. Update Supabase
        if (supabase) {
            await supabase.from('user_stats').update({ enable_spin: enabled }).eq('username', username);
        }
    }
};
