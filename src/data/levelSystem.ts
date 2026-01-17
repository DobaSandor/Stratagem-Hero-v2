export interface LevelReward {
    title?: string;
    items?: string[]; // Names of unlocked items/features
    border?: string; // CSS class for border style
}

export const XP_TABLE: number[] = [
    0,      // Level 1 starts at 0
    100,    // Level 2
    250,    // Level 3
    500,    // Level 4
    1000,   // Level 5
    2000,   // Level 6
    4000,   // Level 7
    8000,   // Level 8
    10000,  // Level 9
    12000,   // Level 10
    15000,   // Level 11
    20000,   // Level 12
    25000,   // Level 13
    30000,   // Level 14
    35000,   // Level 15
    40000,   // Level 16
    45000,   // Level 17
    50000,   // Level 18
    60000,   // Level 19
    65000,   // Level 20
    70000,   // Level 21
    75000,   // Level 22
    80000,   // Level 23
    90000,   // Level 24
    100000,   // Level 25

];

export const LEVEL_REWARDS: Record<number, LevelReward> = {
    2: { items: ['New Avatar Border'], title: 'Cadet' },

    3: { title: 'Helldiver', items: ['Access to community channels', 'New Profile Avatar'] },
    4: { title: 'Junior Strategist', },
    5: { title: 'Senior Strategist', items: ['New Profile Avatar'] },
    6: { title: 'Master Strategist', },
    7: { title: 'Sergeant', items: ['New Profile Avatar'] },
    8: { title: 'Master Sergeant', },
    9: { title: 'Grandmaster Strategist', items: ['Golden Cape Skin'] },
    10: { title: 'Chief', items: ['Golden Cape Skin', 'New Profile Avatar'] },  //Make the letters Bronze slight shine animation 10-15
    11: { title: 'Space Chief Prime', items: ['Golden Cape Skin'] },
    12: { title: 'Death Captain', items: ['Golden Cape Skin'] },
    13: { title: 'Marshal', items: ['Golden Cape Skin', 'New Profile Avatar'] },
    14: { title: 'Star Marshal', items: ['Golden Cape Skin'] },
    15: { title: 'Admiral', items: ['Golden Cape Skin', 'New Profile Avatar'] },
    16: { title: 'Skull Admiral', items: ['Golden Cape Skin'] }, //Make the letters Silver shiny animation 16-20
    17: { title: 'Fleet Admiral', items: ['Golden Cape Skin'] },
    18: { title: 'Admireable Admiral', items: ['Golden Cape Skin', 'New Profile Avatar'] },
    19: { title: 'Galactic Commander', items: ['Golden Cape Skin'] },
    20: { title: 'Hell Commander', items: ['Golden Cape Skin', 'New Profile Avatar'] }, //Make the letters Gold shiny animation 20-24
    21: { title: 'General', items: ['Golden Cape Skin'] },
    22: { title: '5-Star General', items: ['Golden Cape Skin', 'New Profile Avatar'] },
    23: { title: '10-Star General', items: ['Golden Cape Skin'] },
    24: { title: 'Private', items: ['Golden Cape Skin'] },
    25: { title: 'Super Private', items: ['Golden Cape Skin', 'New Profile Avatar'] }, //Make the letters Navy blue and Gold, shiny animation and glow in the behind 25

};

export const GAME_XP_RATES = {
    STRATAGEM_HERO: {
        PER_POINT: 0.1, // 10 points = 1 XP
        ROUND_BONUS_MULTIPLIER: 5 // Round * 5 XP
    },
    CAMPAIGN: {
        MISSION_COMPLETE_BASE: 50,
        MISSION_LEVEL_MULTIPLIER: 10 // Mission ID * 10 XP
    }
};

export const getLevelFromXP = (xp: number): number => {
    let level = 1;
    for (let i = 0; i < XP_TABLE.length; i++) {
        if (xp >= XP_TABLE[i]) {
            level = i + 1;
        } else {
            break;
        }
    }
    return level;
};

export const getXPForLevel = (level: number): number => {
    if (level <= 1) return 0;
    if (level > XP_TABLE.length) return XP_TABLE[XP_TABLE.length - 1]; // Cap? Or formula?
    return XP_TABLE[level - 1];
};

export const getNextLevelXP = (level: number): number => {
    if (level >= XP_TABLE.length) return XP_TABLE[XP_TABLE.length - 1] * 1.5; // Infinite scaling placeholder
    return XP_TABLE[level]; // XP needed TO REACH next level (index matches level because 0-index is level 1)
};

export const getRankForLevel = (level: number): string => {
    let rank = 'Recruit'; // Default Rank

    // Iterate from current level down to 1 to find the highest unlocked title
    for (let l = level; l >= 1; l--) {
        const reward = LEVEL_REWARDS[l];
        if (reward && reward.title) {
            rank = reward.title;
            break;
        }
    }

    return rank;
};

export const getRankStyle = (level: number): string => {
    if (level >= 25) return 'text-super-private font-extrabold';
    if (level >= 20) return 'text-gold font-bold';
    if (level >= 16) return 'text-silver font-bold';
    if (level >= 10) return 'text-bronze font-bold';
    return 'text-yellow-500 font-bold'; // Default
};
