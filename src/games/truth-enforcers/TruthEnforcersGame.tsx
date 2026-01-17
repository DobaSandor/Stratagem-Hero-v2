import React, { useState } from 'react';
import TruthEnforcersSelection from './components/TruthEnforcersSelection';
import EnforcerDesk from './components/EnforcerDesk';
import { generateDailyNPCs } from './utils/npcGenerator';
import { type NPC } from './types';
import ShiftReport from './components/ShiftReport';

interface TruthEnforcersGameProps {
    onBack: () => void;
    onSelectMode?: (mode: 'endless' | 'campaign') => void;
}

const TruthEnforcersGame: React.FC<TruthEnforcersGameProps> = ({ onBack, onSelectMode }) => {
    // Game State
    const [gameState, setGameState] = useState<'selection' | 'playing' | 'summary'>('selection');
    const [day, setDay] = useState(1);
    const [credits, setCredits] = useState(100);
    const [items, setItems] = useState<string[]>([]);

    // Auth
    const username = sessionStorage.getItem('stratagem_hero_session_user') || localStorage.getItem('stratagem_hero_session_user') || 'Guest';

    // Load Progress
    React.useEffect(() => {
        if (username !== 'Guest') {
            import('../../services/db').then(({ db }) => {
                db.getUserStats(username).then(stats => {
                    if (stats.truthEnforcers) {
                        setDay(stats.truthEnforcers.day);
                        setCredits(stats.truthEnforcers.credits);
                        setItems(stats.truthEnforcers.items);
                    }
                });
            });
        }
    }, [username]);

    const [queue, setQueue] = useState<NPC[]>([]);
    const [currentNPC, setCurrentNPC] = useState<NPC | null>(null);
    const [processedCount, setProcessedCount] = useState(0);

    // Selection Handler
    const handleModeSelect = (mode: 'endless' | 'campaign') => {
        if (mode === 'campaign') {
            startDay(day); // Use loaded day
        } else {
            alert("Endless Mode Coming Soon!");
        }

        if (onSelectMode) {
            // Optional: notify parent
        }
    };

    const startDay = (dayNum: number) => {
        // setDay(dayNum); // Already set or setting via prop? 
        // Logic: if dayNum is passed, use it, but our state 'day' tracks progress. 
        // If we replay a day, we might need logic. For now, assume progressive.

        const dailyCount = 5 + dayNum; // Scale difficulty
        const newQueue = generateDailyNPCs(dayNum, dailyCount);
        setQueue(newQueue);
        setProcessedCount(0);
        setCurrentNPC(newQueue[0]);
        setGameState('playing');
    };

    const nextNPC = () => {
        const nextIndex = processedCount + 1;
        setProcessedCount(nextIndex);

        if (nextIndex < queue.length) {
            setCurrentNPC(queue[nextIndex]);
        } else {
            setCurrentNPC(null);
            setTimeout(async () => {
                // Shift Complete Logic
                const nextDay = day + 1;
                alert(`Shift Complete! Earned Credits: ${credits}`);

                // Save Progress
                if (username !== 'Guest') {
                    const { db } = await import('../../services/db');
                    await db.saveTruthEnforcersData(username, {
                        day: nextDay,
                        credits: credits,
                        items: items
                    });
                }

                setDay(nextDay);
                setGameState('selection');
            }, 1000);
        }
    };

    // Desk Handlers
    const handleDecision = (decision: 'allow' | 'deny') => {
        if (!currentNPC) return;

        const isCorrect = currentNPC.correctDecision === decision;

        if (isCorrect) {
            console.log("Correct Decision!");
            setCredits(c => c + 10);
            // Example Feedback: Play sound, show green flash
        } else {
            console.log(`Wrong Decision! Expected: ${currentNPC.correctDecision}. Reason: ${currentNPC.discrepancy || 'None'}`);
            setCredits(c => c - 20); // Penalty
            // Example Feedback: Play error sound, show red citations
            alert(`CITATION ISSUED: Incorrect Protocol. \nExpected: ${currentNPC.correctDecision.toUpperCase()} \nReason: ${currentNPC.discrepancy || 'Clearance was valid'}`);
        }

        nextNPC();
    };


    return (
        <div className="w-full h-screen bg-black text-white">
            {gameState === 'selection' && (
                <TruthEnforcersSelection onSelectMode={handleModeSelect} onBack={onBack} />
            )}

            {gameState === 'playing' && (
                <EnforcerDesk
                    day={day}
                    totalNPCs={queue.length}
                    currentNPCIndex={processedCount + 1}
                    npc={currentNPC}
                    onAllow={() => handleDecision('allow')}
                    onDeny={() => handleDecision('deny')}
                />
            )}

            {gameState === 'summary' && (
                <ShiftReport
                    day={day}
                    creditsEarned={credits - 100} // Assuming 100 is starting, diff is earned
                    processedCount={processedCount}
                    onContinue={() => setGameState('selection')}
                />
            )}
        </div>
    );
};

export default TruthEnforcersGame;
