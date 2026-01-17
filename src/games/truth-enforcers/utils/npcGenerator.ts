import { type NPC, type Decision, type NPCIDCard, type NPCDocument } from '../types';
import { firstNamesMale, firstNamesFemale, lastNames, planets } from '../data/names';

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const generateDate = (year: number) => {
    const month = getRandomInt(1, 12).toString().padStart(2, '0');
    const day = getRandomInt(1, 28).toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const generateRandomNPC = (day: number): NPC => {
    const isTraitor = Math.random() < 0.3 + (day * 0.02); // Chance increases slightly with days
    const gender = Math.random() > 0.5 ? 'Male' : 'Female';
    const firstName = gender === 'Male' ? getRandomElement(firstNamesMale) : getRandomElement(firstNamesFemale);
    const lastName = getRandomElement(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const homePlanet = getRandomElement(planets);
    const currentYear = 2184; // Setting
    const dob = generateDate(currentYear - getRandomInt(18, 60));

    // Day 1 Rules: Only need valid ID.
    // Discrepancy Types for Day 1: Expired ID, No ID (if allowed by logic later, but keeping simple for now)

    let discrepancy: string | undefined = undefined;
    let correctDecision: Decision = 'allow';

    let expiryYear = currentYear + getRandomInt(1, 5);

    if (isTraitor) {
        correctDecision = 'deny';
        const type = Math.random();

        if (type < 0.5) {
            // Expired ID
            expiryYear = currentYear - getRandomInt(1, 3);
            discrepancy = 'Expired ID';
        } else {
            // For Day 1, let's stick to Expired ID as the main traitor mechanic + maybe invalid gender? 
            // Let's add "Invalid Gender" for fun if complex enough, or just repeat expired.
            // Actually, "Banned Planet" could be fun if we had a list.
            // Let's stick to Expired ID for simplicity on Day 1 implementation first.
            expiryYear = currentYear - getRandomInt(1, 3);
            discrepancy = 'Expired ID';
        }
    }

    const expiryDate = generateDate(expiryYear);

    const idCard: NPCIDCard = {
        exists: true,
        details: {
            name: fullName,
            gender,
            dob,
            expiry: expiryDate,
            homePlanet,
            idNumber: Math.random().toString(36).substr(2, 9).toUpperCase()
        }
    };

    const documents: NPCDocument[] = []; // No extra docs for Day 1

    return {
        id: Math.random().toString(36).substr(2, 9),
        appearance: {
            image: `placeholder_${gender.toLowerCase()}_${getRandomInt(1, 3)}`
        },
        idCard,
        documents,
        dialogue: {
            greeting: "Glory to Super Earth.",
            purpose: "Transit.",
            duration: "Permanent."
        },
        correctDecision,
        discrepancy
    };
};

export const generateDailyNPCs = (day: number, count: number): NPC[] => {
    return Array.from({ length: count }, () => generateRandomNPC(day));
};
