// Placeholder for Truth Enforcers Campaign Data
// The campaign will span 20 days (levels).
// Each day will have difficulty settings, number of NPCs, etc.

export interface DayConfig {
    day: number;
    difficulty: number;
    npcCount: number;
    // Add more config here
}

export const campaignDays: DayConfig[] = Array.from({ length: 20 }, (_, i) => ({
    day: i + 1,
    difficulty: i + 1,
    npcCount: 5 + i // Example progression
}));
