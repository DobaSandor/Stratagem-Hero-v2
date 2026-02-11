export type MissionType =
    | 'stratagem_hero_matches'
    | 'stratagem_hero_score'
    | 'stratagem_hero_perfect_round'
    | 'illuminite_invasion_waves'
    | 'illuminite_invasion_upgrade'
    | 'illuminite_invasion_stratagem_buy'
    | 'truth_enforcers_matches'
    | 'stratagem_hero_matches_permadeath'
    | 'stratagem_hero_score_permadeath';

export interface MissionDefinition {
    id: string;
    type: MissionType;
    description: string;
    target: number;
    xpReward: number;
    medalReward?: number;
}

export interface UserMission {
    missionId: string;
    progress: number;
    completed: boolean;
    claimed: boolean;
}

export const MISSION_POOL: MissionDefinition[] = [
    {
        id: 'sh_matches_3',
        type: 'stratagem_hero_matches',
        description: 'Play 3 Stratagem Hero matches on any difficulty',
        target: 3,
        xpReward: 150
    },
    {
        id: 'sh_matches_5',
        type: 'stratagem_hero_matches',
        description: 'Play 5 Stratagem Hero matches on any difficulty',
        target: 5,
        xpReward: 300
    },
    {
        id: 'sh_score_1000',
        type: 'stratagem_hero_score',
        description: 'Score 1,000 points in a single Stratagem Hero match',
        target: 1000,
        xpReward: 100
    },
    {
        id: 'sh_score_5000',
        type: 'stratagem_hero_score',
        description: 'Score 5,000 points in a single Stratagem Hero match',
        target: 5000,
        xpReward: 500
    },
    {
        id: 'sh_score_cumulative_10000',
        type: 'stratagem_hero_score',
        description: 'Accumulate 10,000 points in Stratagem Hero',
        target: 10000,
        xpReward: 400
    },
    {
        id: 'sh_perfect_3',
        type: 'stratagem_hero_perfect_round',
        description: 'Complete 3 Perfect Rounds in Stratagem Hero',
        target: 3,
        xpReward: 200
    },
    {
        id: 'sh_perfect_10',
        type: 'stratagem_hero_perfect_round',
        description: 'Complete 10 Perfect Rounds in Stratagem Hero',
        target: 10,
        xpReward: 600
    },
    // --- New Missions ---
    {
        id: 'sh_score_2000_permadeath',
        type: 'stratagem_hero_score_permadeath',
        description: 'Score 2,000 points on Permadeath Mode in Stratagem Hero',
        target: 2000,
        xpReward: 200,
        medalReward: 1
    },
    {
        id: 'sh_matches_3_permadeath',
        type: 'stratagem_hero_matches_permadeath',
        description: 'Play 3 Stratagem Hero matches on Permadeath difficulty',
        target: 3,
        xpReward: 150,
        medalReward: 1
    },
    {
        id: 'ii_waves_5_endless',
        type: 'illuminite_invasion_waves',
        description: "Complete 5 Waves in Illuminite Invasion's Endless mode",
        target: 5,
        xpReward: 300,
        medalReward: 1
    },
    {
        id: 'ii_upgrade_buy_any',
        type: 'illuminite_invasion_upgrade',
        description: 'Buy any UPGRADE during an Illuminite Invasion Endless match',
        target: 1,
        xpReward: 300,
        medalReward: 2
    },
    {
        id: 'ii_reach_wave_3',
        type: 'illuminite_invasion_waves',
        description: 'Reach Wave 3 in Illuminite Endless mode once',
        target: 3,
        xpReward: 100,
        medalReward: 1
    },
    {
        id: 'ii_stratagem_buy_3_single',
        type: 'illuminite_invasion_stratagem_buy',
        description: 'Buy 3 Quick use Stratagems during a SINGLE Endless Invasion match',
        target: 3,
        xpReward: 200,
        medalReward: 1
    }
];

export const MISSION_UPDATE_LOGIC: Record<string, 'cumulative' | 'high_water_mark'> = {
    'sh_matches_3': 'cumulative',
    'sh_matches_5': 'cumulative',
    'sh_score_1000': 'high_water_mark',
    'sh_score_5000': 'high_water_mark',
    'sh_score_cumulative_10000': 'cumulative',
    'sh_perfect_3': 'cumulative',
    'sh_perfect_10': 'cumulative',
    // New Missions
    'sh_score_2000_permadeath': 'high_water_mark',
    'sh_matches_3_permadeath': 'cumulative',
    'ii_waves_5_endless': 'high_water_mark',
    'ii_upgrade_buy_any': 'cumulative',
    'ii_reach_wave_3': 'high_water_mark',
    'ii_stratagem_buy_3_single': 'high_water_mark'
};
