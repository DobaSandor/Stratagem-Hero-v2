export type MissionType =
    | 'stratagem_hero_matches'
    | 'stratagem_hero_score'
    | 'stratagem_hero_perfect_round'
    | 'truth_enforcers_matches'; // Future proofing

export interface MissionDefinition {
    id: string;
    type: MissionType;
    description: string;
    target: number;
    xpReward: number;
}

export interface UserMission {
    missionId: string;
    progress: number;
    completed: boolean;
    claimed: boolean; // For future manual claiming if needed, currently auto-claim
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
        type: 'stratagem_hero_score', // We'll handle cumulative logic in the update function by checking if it's cumulative or single
        // Actually simpler: For "score" type, let's treat it as cumulative by default in the DB updater? 
        // No, "Score X in a single match" logic is different from "Accumulate X score".
        // Let's make a new type for clarity if we want cumulative, or just keep it simple for now. 
        // User asked for "Play 3 matches" (cumulative).
        // Let's add cumulative score.
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
    }
];

// Special handling types for the updater to know if it's "Add to progress" or "Check if value > target"
// Actually, "Play 3 matches" -> Add 1 to progress every match.
// "Score 5000 in single match" -> Check if score >= 5000. If so, set progress = target.
// "Accumulate 10000 score" -> Add score to progress.
// I should refine the generic types to be clearer for the updater.

export const MISSION_UPDATE_LOGIC: Record<string, 'cumulative' | 'high_water_mark'> = {
    'sh_matches_3': 'cumulative',
    'sh_matches_5': 'cumulative',
    'sh_score_1000': 'high_water_mark',
    'sh_score_5000': 'high_water_mark',
    'sh_score_cumulative_10000': 'cumulative',
    'sh_perfect_3': 'cumulative',
    'sh_perfect_10': 'cumulative'
};
