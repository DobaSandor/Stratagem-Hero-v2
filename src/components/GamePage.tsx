import React, { useState, useEffect, useCallback } from 'react';
import { STRATAGEMS } from '../data/stratagems';
import type { Stratagem, Direction } from '../data/stratagems';
import StratagemArrow from './StratagemArrow';
import LeaderboardModal from './LeaderboardModal';
import DifficultySelection, { DIFFICULTY_SETTINGS } from './DifficultySelection';
import type { DifficultyLevel } from './DifficultySelection';
import { db } from '../services/db';
import { GAME_XP_RATES } from '../data/levelSystem';

import { playInputSound, playErrorSound, playCompletionSound, playStartSound, playBGM, stopBGM, playRoundWonSound, playFailureSound } from '../utils/sound';

interface GamePageProps {
    onBack: () => void;
    username: string;
}

const GamePage: React.FC<GamePageProps> = ({ onBack, username }) => {
    const [gameState, setGameState] = useState<'difficulty-select' | 'ready' | 'playing' | 'round-won' | 'game-over'>('difficulty-select');
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('Classic');
    const [currentStratagem, setCurrentStratagem] = useState<Stratagem | null>(null);
    const [upcomingStratagems, setUpcomingStratagems] = useState<Stratagem[]>([]);
    const [inputIndex, setInputIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [stratagemsCompleted, setStratagemsCompleted] = useState(0);
    const [timeLeft, setTimeLeft] = useState(DIFFICULTY_SETTINGS['Classic'].roundTime);
    const [isError, setIsError] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [highScore, setHighScore] = useState(0);

    // Dynamic Theme Colors
    const isPermadeath = difficulty === 'Permadeath';
    const themeColor = isPermadeath ? 'red' : 'yellow';
    const borderColor = isPermadeath ? 'border-red-600' : 'border-yellow-500';
    const textColor = isPermadeath ? 'text-red-500' : 'text-yellow-500';
    const bgColor = isPermadeath ? 'bg-red-500' : 'bg-yellow-500';

    // Round Stats
    const [isPerfectRound, setIsPerfectRound] = useState(true);
    const [roundStats, setRoundStats] = useState({
        roundBonus: 0,
        timeBonus: 0,
        perfectBonus: 0,
        totalRoundScore: 0
    });

    // Session Stats
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
    const [stratagemsCompletedTotal, setStratagemsCompletedTotal] = useState(0);
    const [sessionMissedInputs, setSessionMissedInputs] = useState(0);
    const [perfectRoundsSession, setPerfectRoundsSession] = useState(0);

    // Initialize game
    useEffect(() => {
        if (gameState === 'ready') {
            startGame();
        }
    }, [gameState]);

    // Timer logic
    useEffect(() => {
        if (gameState !== 'playing') return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    playFailureSound();
                    setGameState('game-over');
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100);

        return () => clearInterval(timer);
    }, [gameState]);

    // BGM Logic
    useEffect(() => {
        playBGM();
        return () => {
            stopBGM();
        };
    }, []);



    // High Score & XP & Stats Logic
    useEffect(() => {
        if (gameState === 'game-over') {
            const saveGameData = async () => {
                await db.saveScore(username, score, difficulty);

                // Award XP
                const xpAmount = Math.floor(score * GAME_XP_RATES.STRATAGEM_HERO.PER_POINT);
                if (xpAmount > 0) {
                    await db.addXP(username, xpAmount);
                }

                // Update Stats (Time Played & Stratagems)
                if (sessionStartTime) {
                    const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
                    await db.incrementUserStats(username, {
                        time: durationSeconds,
                        stratagems: stratagemsCompletedTotal,
                        missedInputs: sessionMissedInputs
                    });
                }

                // Update high score display
                const highScoreVal = await db.getUserScore(username, difficulty);
                setHighScore(highScoreVal);

                // Update Mission Progress
                await db.updateMissionProgress(username, 'stratagem_hero_matches', 1);
                await db.updateMissionProgress(username, 'stratagem_hero_score', score);
                if (perfectRoundsSession > 0) {
                    await db.updateMissionProgress(username, 'stratagem_hero_perfect_round', perfectRoundsSession);
                }
            };
            saveGameData();
        }
    }, [gameState, score, username, difficulty, perfectRoundsSession]);

    // Fetch high score on difficulty change
    useEffect(() => {
        db.getUserScore(username, difficulty).then(setHighScore);
    }, [username, difficulty]);

    // Round Transition Logic
    useEffect(() => {
        if (gameState === 'round-won') {
            const timeout = setTimeout(() => {
                setRound((prev) => prev + 1);
                setStratagemsCompleted(0);
                setIsPerfectRound(true); // Reset for next round
                nextStratagem();
                setGameState('playing');
            }, 6000); // Increased time for animation
            return () => clearTimeout(timeout);
        }
    }, [gameState]);

    const getRandomStratagem = () => STRATAGEMS[Math.floor(Math.random() * STRATAGEMS.length)];

    const handleDifficultySelect = (selected: DifficultyLevel) => {
        setDifficulty(selected);
        setGameState('ready');
    };

    const startGame = () => {
        playStartSound(); // Play start sequence
        setScore(0);
        setRound(1);
        setStratagemsCompletedTotal(0);
        setSessionMissedInputs(0);
        setPerfectRoundsSession(0);
        setSessionStartTime(Date.now());

        // Use difficulty settings
        const config = DIFFICULTY_SETTINGS[difficulty];
        setTimeLeft(config.roundTime);

        setIsPerfectRound(true);

        // Initialize queue
        const initialQueue = [getRandomStratagem(), getRandomStratagem(), getRandomStratagem()];
        setUpcomingStratagems(initialQueue);

        // Set first stratagem
        const first = getRandomStratagem();
        setCurrentStratagem(first);

        setInputIndex(0);
        setGameState('playing');
        setIsError(false);
    };

    const nextStratagem = () => {
        if (upcomingStratagems.length > 0) {
            const next = upcomingStratagems[0];
            const newQueue = upcomingStratagems.slice(1);
            newQueue.push(getRandomStratagem());

            setCurrentStratagem(next);
            setUpcomingStratagems(newQueue);
        } else {
            // Fallback if queue is empty (shouldn't happen)
            setCurrentStratagem(getRandomStratagem());
        }

        setInputIndex(0);
        setIsError(false);
    };

    const handleInput = useCallback((input: Direction) => {
        if (gameState !== 'playing' || !currentStratagem || isError) return;

        const expected = currentStratagem.sequence[inputIndex];

        if (input === expected) {
            playInputSound();
            const newIndex = inputIndex + 1;
            setInputIndex(newIndex);

            if (newIndex === currentStratagem.sequence.length) {
                // Stratagem completed
                playCompletionSound();
                const bonusTime = 1; // +1s per stratagem
                const points = (currentStratagem.sequence.length * 5); // Base points for stratagem (Reduced from 10)

                setScore((prev) => prev + points);
                setTimeLeft((prev) => prev + bonusTime);
                setStratagemsCompletedTotal(prev => prev + 1);

                const requiredForRound = round + 2;
                const newCompleted = stratagemsCompleted + 1;

                if (newCompleted >= requiredForRound) {
                    // Round Completed Calculation
                    const config = DIFFICULTY_SETTINGS[difficulty];
                    const roundBonus = config.roundBonusBase + (round * config.roundBonusMultiplier);
                    const timeBonus = Math.floor(timeLeft * 10);
                    const perfectBonus = isPerfectRound ? (config.roundBonusBase * 5) : 0;
                    const totalRoundScore = roundBonus + timeBonus + perfectBonus;

                    setRoundStats({
                        roundBonus,
                        timeBonus,
                        perfectBonus,
                        totalRoundScore
                    });

                    if (isPerfectRound) {
                        setPerfectRoundsSession(prev => prev + 1);
                    }

                    setScore((prev) => prev + totalRoundScore);
                    setTimeLeft((prev) => prev + 5); // Round completion time bonus for next round
                    playRoundWonSound();
                    setGameState('round-won');
                } else {
                    setStratagemsCompleted(newCompleted);
                    nextStratagem();
                }
            }
        } else {
            // Wrong input
            playErrorSound();
            setIsError(true);
            setSessionMissedInputs(prev => prev + 1);
            setIsPerfectRound(false); // Mark round as imperfect

            // Penalties
            if (difficulty === 'Permadeath') {
                // PERMADEATH: 1 Miss = Game Over
                setGameState('game-over');
                playFailureSound();
                return;
            } else if (difficulty === 'Hardcore') {
                setTimeLeft(prev => Math.max(0, prev - 1));
            } else if (difficulty === 'Mediocre') {
                setTimeLeft(prev => Math.max(0, prev - 0.25));
            }

            setTimeout(() => {
                setInputIndex(0);
                setIsError(false);
            }, 500);
        }
    }, [gameState, currentStratagem, inputIndex, isError, timeLeft, round, stratagemsCompleted, upcomingStratagems, isPerfectRound, difficulty]);

    // Keyboard listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== 'playing') return;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    handleInput('UP');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    handleInput('DOWN');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    handleInput('LEFT');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    handleInput('RIGHT');
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleInput, gameState]);

    const getArrowState = (index: number) => {
        if (isError) return 'error';
        if (index < inputIndex) return 'completed';
        if (index === inputIndex) return 'active';
        return 'inactive';
    };

    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        });
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart) return;

        const touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
        };

        const deltaX = touchEnd.x - touchStart.x;
        const deltaY = touchEnd.y - touchStart.y;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        const minSwipeDistance = 30; // Threshold

        if (Math.max(absX, absY) > minSwipeDistance) {
            if (absX > absY) {
                // Horizontal
                handleInput(deltaX > 0 ? 'RIGHT' : 'LEFT');
            } else {
                // Vertical
                handleInput(deltaY > 0 ? 'DOWN' : 'UP');
            }
        }

        setTouchStart(null);
    };

    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white font-sans p-4 touch-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className={`w-full max-w-4xl bg-gray-900 rounded-2xl p-8 shadow-2xl border ${gameState === 'difficulty-select' ? 'border-gray-800' : borderColor} relative overflow-hidden transition-colors duration-500`}>

                {/* Header */}
                {gameState !== 'difficulty-select' && (
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <h2 className={`text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r ${isPermadeath ? 'from-red-500 to-red-800' : 'from-yellow-400 to-gray-700'}`}>
                            Stratagem Hero
                        </h2>
                        <div className="flex items-center gap-4">
                            {username === 'admin' && (
                                <button
                                    onClick={() => setScore(prev => prev + 5000)}
                                    className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-bold text-xs uppercase border border-red-500"
                                >
                                    +5000 Pts
                                </button>
                            )}
                            <button
                                onClick={() => setShowLeaderboard(true)}
                                className={`p-2 rounded-lg bg-${themeColor}-500/10 hover:bg-${themeColor}-500/20 text-${themeColor}-500 transition-colors border border-${themeColor}-500/30`}
                                title="Leaderboard"
                            >
                                <img src="/scoreboard_icon.png" alt="Leaderboard" className="h-12 w-12 object-contain" />
                            </button>
                            <button
                                onClick={onBack}
                                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-gray-300"
                            >
                                Exit Game
                            </button>
                        </div>
                    </div>
                )}

                {gameState === 'difficulty-select' ? (
                    <DifficultySelection onSelect={handleDifficultySelect} onBack={onBack} />
                ) : (
                    <>
                        {/* Game Area */}
                        <div className={`aspect-video bg-gray-950 rounded-xl border-2 ${borderColor} flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500`}>

                            {/* Background Grid/Effect */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,30,30,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,30,30,0.5)_1px,transparent_1px)] bg-size-[40px_40px] opacity-20"></div>

                            {/* Permadeath Flame Background */}
                            {isPermadeath && (
                                <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                                    <div className="absolute inset-0 bg-linear-to-t from-red-900 via-transparent to-transparent animate-fire-rise bg-size-[100%_200%]"></div>
                                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-linear-to-t from-red-700/50 to-transparent blur-xl animate-pulse"></div>
                                </div>
                            )}

                            {/* Super Earth Logo Background */}
                            {(gameState === 'round-won' || gameState === 'game-over') && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                    <img src="/super_earth_logo.png" alt="Super Earth" className="w-2/3 opacity-50 object-contain" />
                                </div>
                            )}

                            {gameState === 'playing' && currentStratagem && (
                                <div className="z-10 flex flex-col items-center space-y-8 w-full">

                                    {/* Upcoming Queue */}
                                    <div className="flex space-x-4 mb-4 opacity-70">
                                        {upcomingStratagems.map((strat, idx) => (
                                            <div key={idx} className="w-12 h-12 bg-gray-800/50 rounded border border-gray-600 flex items-center justify-center overflow-hidden">
                                                <img src={strat.icon} alt={strat.name} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Current Stratagem Icon */}
                                    <div className={`w-32 h-32 ${isPermadeath ? 'bg-red-500/10 border-red-500' : 'bg-yellow-500/10 border-yellow-500'} rounded-xl border-2 flex items-center justify-center overflow-hidden ${isPermadeath ? 'shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'shadow-[0_0_20px_rgba(234,179,8,0.3)]'}`}>
                                        <img src={currentStratagem.icon} alt={currentStratagem.name} className="w-full h-full object-cover" />
                                    </div>

                                    <h3 className={`text-4xl font-bold ${textColor} tracking-widest uppercase drop-shadow-lg`}>
                                        {currentStratagem.name}
                                    </h3>

                                    <div className="flex flex-col w-full max-w-2xl items-center space-y-2">
                                        <div className="flex space-x-4 p-6 bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-xl">
                                            {currentStratagem.sequence.map((dir, idx) => (
                                                <StratagemArrow
                                                    key={idx}
                                                    direction={dir}
                                                    state={getArrowState(idx)}
                                                />
                                            ))}
                                        </div>

                                        {/* Timer Bar */}
                                        <div className="w-full h-3 bg-gray-800/50 rounded-full overflow-hidden border border-gray-700/50 shadow-inner">
                                            <div
                                                className={`h-full transition-all duration-100 ease-linear ${isPermadeath ? 'shadow-[0_0_10px_rgba(220,38,38,0.6)]' : 'shadow-[0_0_10px_rgba(234,179,8,0.6)]'} ${timeLeft < 3 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : isPermadeath ? 'bg-red-600' : 'bg-yellow-500'}`}
                                                style={{ width: `${Math.min(100, (timeLeft / DIFFICULTY_SETTINGS[difficulty].roundTime) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Round Progress */}
                                    <div className="text-gray-400 text-sm font-mono">
                                        Stratagem {stratagemsCompleted + 1} / {round + 2}
                                    </div>
                                </div>
                            )}

                            {gameState === 'round-won' && (
                                <div className="z-10 flex flex-col items-center justify-center w-full max-w-md animate-in fade-in zoom-in duration-300">
                                    <h3 className={`text-4xl font-bold ${textColor} uppercase tracking-widest mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]`}>
                                        Round {round} Complete
                                    </h3>

                                    <div className="w-full bg-gray-900/95 p-6 rounded-lg border border-gray-700 shadow-2xl space-y-3 backdrop-blur-md">
                                        <div className="flex justify-between items-center text-gray-300">
                                            <span className="uppercase tracking-wider text-sm">Round Bonus</span>
                                            <span className={`font-mono ${textColor}`}>+{roundStats.roundBonus}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-gray-300">
                                            <span className="uppercase tracking-wider text-sm">Time Bonus</span>
                                            <span className={`font-mono ${textColor}`}>+{roundStats.timeBonus}</span>
                                        </div>
                                        {roundStats.perfectBonus > 0 && (
                                            <div className="flex justify-between items-center text-yellow-300 animate-pulse">
                                                <span className="uppercase tracking-wider text-sm font-bold">Perfect Bonus</span>
                                                <span className="font-mono font-bold">+{roundStats.perfectBonus}</span>
                                            </div>
                                        )}

                                        <div className="h-px bg-gray-700 my-2"></div>

                                        <div className="flex justify-between items-center">
                                            <span className="uppercase tracking-wider text-sm text-white font-bold">Total Round Score</span>
                                            <span className={`font-mono text-2xl ${textColor} font-bold`}>+{roundStats.totalRoundScore}</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 text-center">
                                        <p className="text-blue-400 text-sm uppercase tracking-widest animate-pulse">
                                            Preparing Round {round + 1}...
                                        </p>
                                    </div>
                                </div>
                            )}

                            {gameState === 'game-over' && (
                                <div className="z-10 text-center space-y-6">
                                    <h3 className="text-5xl font-bold text-red-500 uppercase tracking-widest">Mission Failed</h3>
                                    <div className="space-y-2">
                                        <p className="text-2xl text-gray-400">Final Score: {score}</p>
                                        <p className={`text-xl ${textColor}`}>
                                            High Score: {Math.max(score, highScore)}
                                        </p>
                                        <p className="text-sm text-blue-400 font-mono mt-2">
                                            XP Gained: +{Math.floor(score * GAME_XP_RATES.STRATAGEM_HERO.PER_POINT)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setGameState('ready')}
                                        className={`px-8 py-3 ${bgColor} hover:bg-${themeColor}-400 text-black font-bold rounded-full text-xl transition-transform hover:scale-105`}
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="mt-8 grid grid-cols-2 gap-4 relative z-10 max-w-2xl w-full mx-auto">
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 text-center">
                                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Score</h3>
                                <p className={`text-3xl font-bold ${textColor}`}>{score}</p>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 text-center">
                                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Round</h3>
                                <p className="text-3xl font-bold text-blue-400">{round}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <LeaderboardModal
                isOpen={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
                currentUsername={username}
                initialDifficulty={difficulty}
            />
        </div>
    );
};

export default GamePage;
