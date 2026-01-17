import React, { useState, useEffect } from 'react';
import BattleshipGame from './BattleshipGame';
import { campaignMissions } from '../data/campaignMissions';
import { db } from '../services/db';

interface CampaignPageProps {
    onBack: () => void;
    onMainMenu: () => void;
    mode: 'endless' | 'campaign';
    username: string;
}

const CampaignPage: React.FC<CampaignPageProps> = ({ onBack, onMainMenu, mode, username }) => {
    // Load progress from db
    const [highestUnlockedId, setHighestUnlockedId] = useState(1);

    useEffect(() => {
        db.getMissionProgress(username).then(id => {
            setHighestUnlockedId(id);
        });
    }, [username]);

    const [currentMissionIndex, setCurrentMissionIndex] = useState(0);
    const currentMission = campaignMissions[currentMissionIndex];

    const handleMissionComplete = () => {
        if (currentMission.id >= highestUnlockedId) {
            const nextId = currentMission.id + 1;
            setHighestUnlockedId(nextId);
            db.saveMissionProgress(username, nextId);

            // Award XP for new mission complete
            // Import dynamically or assume global constants if easier, but dynamic import is safer for cyclic deps if any
            // Actually let's just use hardcoded relative import at top of file, but we need to view file to add import.
            // For now, I'll add the logic here and assume import is added or add it in next step.
            // Wait, I can't check import here. I'll use `import(...)` inside or I should have added top level import.
            // Let's use dynamic import for safety here.
            import('../data/levelSystem').then(({ GAME_XP_RATES }) => {
                let xpAmount = GAME_XP_RATES.CAMPAIGN.MISSION_COMPLETE_BASE + (currentMission.id * GAME_XP_RATES.CAMPAIGN.MISSION_LEVEL_MULTIPLIER);

                // Override for Mission 10 (Campaign Complete)
                if (currentMission.id === 10) {
                    xpAmount = 1500;
                }

                db.addXP(username, xpAmount);
            });

            // Award Title if Mission 10
            if (currentMission.id === 10) {
                db.unlockTitle(username, "Purger of the Illuminite");
                db.setActiveTitle(username, "Purger of the Illuminite");
            }
        }
    };

    const handleNextMission = () => {
        if (currentMissionIndex < campaignMissions.length - 1) {
            // Only allow next if unlocked
            if (campaignMissions[currentMissionIndex + 1].id <= highestUnlockedId) {
                setCurrentMissionIndex(prev => prev + 1);
            }
        }
    };

    const handlePrevMission = () => {
        if (currentMissionIndex > 0) {
            setCurrentMissionIndex(prev => prev - 1);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white font-sans overflow-hidden">
            <div className="w-full h-full max-w-[1920px] bg-gray-900 shadow-2xl border border-gray-800 relative overflow-hidden flex flex-col">

                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(30,30,30,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,30,30,0.5)_1px,transparent_1px)] bg-size-[40px_40px] opacity-20 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col h-full w-full p-4 gap-4">
                    {/* Header */}
                    <div className="flex flex-col items-center shrink-0">
                        <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-blue-500 uppercase tracking-widest drop-shadow-lg">
                        </h2>
                        {username === 'admin' && (
                            <button
                                onClick={() => {
                                    setHighestUnlockedId(11);
                                    db.saveMissionProgress(username, 11);
                                    window.location.reload();
                                }}
                                className="mb-2 px-3 py-1 bg-red-600 text-white rounded font-bold uppercase text-xs hover:bg-red-700 shadow-lg z-50 border border-red-400"
                            >
                                [ADMIN] Unlock All Missions
                            </button>
                        )}
                        {mode === 'campaign' && (
                            <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500">
                                <h3 className="text-xl text-yellow-400 font-bold uppercase tracking-wider">
                                    Mission {currentMission.id}: {currentMission.name}
                                </h3>
                                <p className="text-gray-400 text-xs max-w-2xl truncate">
                                    {currentMission.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Game Area - Flex Grow to fill space */}
                    <div className="flex-1 min-h-0 w-full flex justify-center overflow-hidden">
                        <BattleshipGame
                            mode={mode}
                            missionConfig={mode === 'campaign' ? currentMission : undefined}
                            onMissionComplete={mode === 'campaign' ? handleMissionComplete : undefined}
                            username={username}
                            onMainMenu={onMainMenu}
                        />
                    </div>

                    {/* Footer Controls */}
                    <div className="flex items-center justify-center gap-4 shrink-0 py-2">
                        <button
                            onClick={onBack}
                            className="px-6 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all border border-gray-700 hover:border-gray-500 uppercase tracking-wider font-bold text-sm"
                        >
                            Return to Operations
                        </button>

                        {mode === 'campaign' && (
                            <div className="flex gap-4">
                                <button
                                    onClick={handlePrevMission}
                                    disabled={currentMissionIndex === 0}
                                    className={`px-6 py-2 rounded-lg border uppercase tracking-wider font-bold transition-all text-sm ${currentMissionIndex === 0
                                        ? 'bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed'
                                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-700 hover:border-gray-500'
                                        }`}
                                >
                                    Prev Mission
                                </button>
                                <button
                                    onClick={handleNextMission}
                                    disabled={currentMissionIndex === campaignMissions.length - 1 || campaignMissions[currentMissionIndex + 1].id > highestUnlockedId}
                                    className={`px-6 py-2 rounded-lg border uppercase tracking-wider font-bold transition-all text-sm ${currentMissionIndex === campaignMissions.length - 1 || campaignMissions[currentMissionIndex + 1].id > highestUnlockedId
                                        ? 'bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed'
                                        : 'bg-blue-900/50 hover:bg-blue-800/50 text-blue-200 hover:text-white border-blue-800 hover:border-blue-500'
                                        }`}
                                >
                                    Next Mission
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignPage;
