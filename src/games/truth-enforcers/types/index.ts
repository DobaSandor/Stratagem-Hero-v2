// Basic Game Types for Truth Enforcers

export type Decision = 'allow' | 'deny' | 'exterminate';

export interface NPCDocument {
    id: string;
    type: 'id_card' | 'entry_permit' | 'work_pass' | 'medical_record';
    label: string;
    content: Record<string, string>; // Flexible content key-value pairs
}

export interface NPCIDCard {
    exists: boolean;
    details: {
        name: string;
        gender: 'Male' | 'Female';
        dob: string;
        expiry: string;
        homePlanet: string;
        idNumber: string;
    };
}

export interface NPC {
    id: string;
    appearance: {
        image: string; // Placeholder for now, eventually path to asset
        isSilhouette?: boolean;
    };
    idCard: NPCIDCard | null;
    documents: NPCDocument[];
    dialogue: {
        greeting: string;
        purpose?: string;
        duration?: string;
        [questionId: string]: string | undefined;
    };
    correctDecision: Decision;
    discrepancy?: string; // e.g. "Expired ID", "Name Mismatch", "None"
}

export interface DayConfig {
    day: number;
    description: string;
    npcCount: number;
    requiredDocs: string[]; // List of doc types required for valid entry
    rules: string[]; // Text description of rules for the day
}
