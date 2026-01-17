import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { MISSION_POOL } from '../data/dailyMissions';
import type { UserMission } from '../data/dailyMissions';

interface DailyMissionsModalProps {
    username: string;
    onClose: () => void;
    isClosing: boolean;
    enableExpeditionBg?: boolean;
}

const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({ username, onClose, isClosing, enableExpeditionBg }) => {
    const [missions, setMissions] = useState<UserMission[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [timeToReset, setTimeToReset] = useState('');
    const [dissolvingMissionId, setDissolvingMissionId] = useState<string | null>(null);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const midnight = new Date();
            midnight.setUTCHours(24, 0, 0, 0);
            const diff = midnight.getTime() - now.getTime();

            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeToReset(`${hours}h ${minutes}m ${seconds}s`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleClaim = async (missionId: string) => {
        // If Expedition mode is on, trigger dissolve effect first
        if (enableExpeditionBg) {
            setDissolvingMissionId(missionId);
            // Wait for animation to finish (1.5s)
            setTimeout(async () => {
                await processClaim(missionId);
                setDissolvingMissionId(null);
            }, 1400);
        } else {
            await processClaim(missionId);
        }
    };

    const processClaim = async (missionId: string) => {
        const result = await db.claimMissionReward(username, missionId);
        if (result.success) {
            setMissions(prev => prev.map(m =>
                m.missionId === missionId ? { ...m, claimed: true } : m
            ));
        }
    };

    useEffect(() => {
        // Trigger entrance animation
        requestAnimationFrame(() => {
            setIsVisible(true);
        });

        const fetchMissions = async () => {
            const data = await db.getDailyMissions(username);
            setMissions(data);
        };
        fetchMissions();
    }, [username]);

    const showContent = isVisible && !isClosing;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-700 ease-out 
            ${showContent ? 'bg-black/80 backdrop-blur-sm opacity-100' : 'bg-black/0 backdrop-blur-none opacity-0'}`}
        >
            {/* Modal Content */}
            <div className={`bg-gray-900 border-2 border-yellow-500 rounded-xl w-full max-w-lg shadow-[0_0_30px_rgba(234,179,8,0.2)] relative overflow-hidden flex flex-col max-h-[90vh] transition-all duration-500 delay-100 
                ${showContent ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'}`}
            >

                {/* Header */}
                <div className="bg-linear-to-r from-yellow-900/50 to-gray-900 p-6 border-b border-yellow-500/30 flex justify-between items-center relative overflow-hidden">
                    {/* Background Logo */}
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
                        <img src={`${import.meta.env.BASE_URL}super_earth_command_logo.png`} alt="" className="h-32 w-32 object-contain" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-yellow-500 uppercase tracking-widest drop-shadow-md">Daily Missions</h2>
                        <p className="text-xs text-yellow-600 font-mono mt-1 font-bold tracking-wider">SUPER EARTH HIGH COMMAND</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors relative z-10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Missions List */}
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                    {missions.map((mission) => {
                        const def = MISSION_POOL.find(m => m.id === mission.missionId);
                        if (!def) return null;

                        const progressPercent = Math.min(100, (mission.progress / def.target) * 100);
                        const isClaimable = mission.completed && !mission.claimed;
                        const isClaimed = mission.claimed;
                        const isDissolving = dissolvingMissionId === mission.missionId;

                        return (
                            <div
                                key={mission.missionId}
                                onClick={() => isClaimable && !isDissolving ? handleClaim(mission.missionId) : null}
                                className={`relative p-4 rounded-lg border leading-tight transition-all duration-300 overflow-hidden
                                    ${isClaimable
                                        ? 'bg-green-900/30 border-green-500 cursor-pointer hover:scale-105 hover:bg-green-900/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse'
                                        : isClaimed
                                            ? 'bg-gray-900/50 border-gray-800 opacity-75 grayscale-[0.5]'
                                            : 'bg-gray-800/50 border-gray-700 hover:border-yellow-500/50 hover:bg-gray-800 hover:shadow-yellow-500/10 hover:scale-[1.02]'
                                    }`}
                                style={isDissolving ? {
                                    transition: 'clip-path 1.2s ease-in-out',
                                    clipPath: 'inset(0 0 0 100%)'
                                } : {}}
                            >
                                {isDissolving && (
                                    <div className="absolute inset-0 pointer-events-none z-20">
                                        {[...Array(40)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="petal absolute"
                                                style={{
                                                    left: '0',
                                                    top: `${Math.random() * 100}%`,
                                                    width: `${8 + Math.random() * 8}px`,
                                                    height: `${8 + Math.random() * 8}px`,
                                                    animation: `petal-drift 1.2s linear forwards`,
                                                    animationDelay: `${Math.random() * 0.8}s`,
                                                    opacity: 0,
                                                } as any}
                                            />
                                        ))}
                                        <style>{`
                                            @keyframes petal-drift {
                                                0% { opacity: 0; transform: translateX(0) rotate(0deg); }
                                                10% { opacity: 1; }
                                                100% { opacity: 0; transform: translateX(100%) translateY(${Math.random() * 50 - 25}px) rotate(${Math.random() * 360}deg); }
                                            }
                                        `}</style>
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`font-bold text-sm ${isClaimed ? 'text-gray-500 line-through' : mission.completed ? 'text-green-400' : 'text-gray-200'}`}>
                                        {def.description}
                                    </h3>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${isClaimed ? 'bg-gray-800 text-gray-500' : mission.completed ? 'bg-green-900 text-green-300' : 'bg-yellow-900/40 text-yellow-500'}`}>
                                            +{def.xpReward} XP
                                        </span>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="mt-3">
                                    {isClaimed ? (
                                        <div className="flex justify-between items-center text-xs text-gray-500 font-mono bg-gray-950/50 p-2 rounded border border-gray-800">
                                            <span className="text-green-500 font-bold uppercase">Mission Complete</span>
                                            <span>Next Mission: <span className="text-yellow-500">{timeToReset}</span></span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1 font-mono">
                                                <span>PROGRESS</span>
                                                <span>{mission.progress} / {def.target}</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                                                <div
                                                    className={`h-full transition-all duration-500 relative overflow-hidden ${mission.completed ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]'}`}
                                                    style={{ width: `${progressPercent}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Checkmark or Arrow */}
                                {mission.completed && (
                                    <div className="absolute top-0 right-0 p-2">
                                        {isClaimed ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <div className="bg-green-500 rounded-full p-0.5 shadow-lg shadow-green-500/50 animate-bounce">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-900 border-t border-gray-800 text-center text-xs text-gray-600 uppercase tracking-wider">
                    Missions reset daily at 00:00 UTC
                </div>
            </div>
        </div>
    );
};

export default DailyMissionsModal;
