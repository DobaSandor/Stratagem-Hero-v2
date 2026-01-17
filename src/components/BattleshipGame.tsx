import { useState, type DragEvent, useEffect, useCallback, useRef } from 'react';
import { type MissionConfig } from '../data/campaignMissions';
import SpaceBackground from './SpaceBackground';
import DialogueOverlay from './DialogueOverlay';
import CampaignCompletionScreen from './CampaignCompletionScreen';
import { db } from '../services/db';
import { motion, AnimatePresence } from 'framer-motion';

interface Cell {
    x: number;
    y: number;
    status: 'empty' | 'ship' | 'hit' | 'miss';
    isShielded?: boolean;
    impactType?: 'blackhole' | 'orbital-laser';
    enemyShieldHealth?: number; // 2 = Full (Invisible), 1 = Damaged (Visible), 0 = Broken
}

interface Ship {
    id: string;
    name: string;
    size: { width: number; height: number };
    icon: string;
}

interface PlacedShip extends Ship {
    gridX: number;
    gridY: number;
}

interface Stratagem {
    name: string;
    count: number;
    icon: string;
}

import LeaderboardModal from './LeaderboardModal';

interface BattleshipGameProps {
    mode: 'endless' | 'campaign';
    missionConfig?: MissionConfig;
    onMissionComplete?: () => void;
    onMainMenu?: () => void;
    username: string;
}

// Constants
const CONSUMABLES = [
    { id: 'repair', name: 'Nano-Repair', icon: '🔧', cost: 500, desc: 'Restores 1 HP to a damaged ship.' },
    { id: 'cooldown', name: 'Rapid Cooldown', icon: '⚡', cost: 750, desc: 'Instantly reloads all Stratagems.' },
    { id: 'radar', name: 'Precise Radar', icon: '/icons/radar_upgrade.png', cost: 100, desc: 'Reveals one enemy ship tile. Limit 3 per wave.' },
];

const AMMO_UPGRADES = [
    { level: 1, cost: 150, bonus: 1 },
    { level: 2, cost: 300, bonus: 1 },
    { level: 3, cost: 450, bonus: 1 },
    { level: 4, cost: 600, bonus: 1 },
    { level: 5, cost: 750, bonus: 1 },
    { level: 6, cost: 900, bonus: 1 },
    { level: 7, cost: 1200, bonus: 2 },
    { level: 8, cost: 1500, bonus: 2 },
    { level: 9, cost: 2000, bonus: 2 },
    { level: 10, cost: 2500, bonus: 3 },
];

const REINFORCEMENT_UPGRADES = [
    { level: 1, cost: 50, rewards: [{ name: 'Eagle 1', count: 1 }] },
    { level: 2, cost: 50, rewards: [{ name: 'Eagle 1', count: 1 }] },
    { level: 3, cost: 100, rewards: [{ name: 'Eagle 1', count: 1 }] },
    { level: 4, cost: 250, rewards: [{ name: 'Pelican-1', count: 1 }] },
    { level: 5, cost: 100, rewards: [{ name: 'Eagle 1', count: 1 }] },
    { level: 6, cost: 100, rewards: [{ name: 'Eagle 1', count: 1 }] },
    { level: 7, cost: 300, rewards: [{ name: 'Pelican-1', count: 1 }, { name: 'Eagle 1', count: 1 }] },
    { level: 8, cost: 500, rewards: [{ name: 'Super Destroyer', count: 1 }] },
    { level: 9, cost: 150, rewards: [{ name: 'Eagle 1', count: 1 }] },
    { level: 10, cost: 150, rewards: [{ name: 'Eagle 1', count: 1 }] },
    { level: 11, cost: 300, rewards: [{ name: 'Pelican-1', count: 1 }] },
    { level: 12, cost: 500, rewards: [{ name: 'Super Destroyer', count: 1 }] },
    { level: 13, cost: 300, rewards: [{ name: 'Pelican-1', count: 2 }] },
    { level: 14, cost: 350, rewards: [{ name: 'Pelican-1', count: 2 }, { name: 'Eagle 1', count: 1 }] },
    { level: 15, cost: 1000, rewards: [{ name: 'Eagle 1', count: 4 }, { name: 'Pelican-1', count: 3 }, { name: 'Super Destroyer', count: 2 }] },
];

const BattleshipGame = ({ missionConfig: propConfig, onMissionComplete, onMainMenu, username, mode }: BattleshipGameProps) => {
    // Endless Mode State
    const [currentWave, setCurrentWave] = useState(1);
    const [endlessScore, setEndlessScore] = useState(0);
    const [endlessCredits, setEndlessCredits] = useState(0);
    const [generatedConfig, setGeneratedConfig] = useState<MissionConfig | null>(null);
    const [showEndlessWaveComplete, setShowEndlessWaveComplete] = useState(false);

    // Admin State
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const [adminWaveInput, setAdminWaveInput] = useState('');

    // Leaderboard State
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const scoreSavedRef = useRef(false);

    // Explosion System
    interface Explosion {
        id: number;
        x: number;
        y: number;
        isEnemyGrid: boolean;
    }
    const [activeExplosions, setActiveExplosions] = useState<Explosion[]>([]);

    const triggerExplosion = (x: number, y: number, isEnemyGrid: boolean) => {
        const id = Date.now() + Math.random();
        setActiveExplosions(prev => [...prev, { id, x, y, isEnemyGrid }]);
        setTimeout(() => {
            setActiveExplosions(prev => prev.filter(e => e.id !== id));
        }, 1000); // Animation duration
    };

    // Endless Mode Ammo & Reinforcements
    const [ammoUpgradeLevel, setAmmoUpgradeLevel] = useState(0);
    const [reinforcementLevel, setReinforcementLevel] = useState(0);
    const maxAmmo = 5 + AMMO_UPGRADES.slice(0, ammoUpgradeLevel).reduce((acc, upgrade) => acc + upgrade.bonus, 0);
    const [ammo, setAmmo] = useState(maxAmmo);
    const [isReloading, setIsReloading] = useState(false);

    // Custom Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; ship: PlacedShip } | null>(null);

    // Close context menu on global click
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const activeConfig = mode === 'campaign' ? propConfig : generatedConfig;
    const missionConfig = activeConfig; // Alias for compatibility
    const gridSize = missionConfig?.gridSize || 10;

    // Load Endless Stats
    // Load Endless Stats (High Score Only - Credits are session based)


    // Endless Wave Generator
    const generateEndlessConfig = useCallback((wave: number): MissionConfig => {
        // Difficulty Scaling

        const aiSmartness = Math.min(90, 10 + wave * 5); // Caps at 90%
        const enemyStratagemCount = Math.floor(wave / 3);

        // Dynamic Grid Size (Starts at 6, max 12)
        const dynamicGridSize = Math.min(12, 6 + Math.floor((wave - 1) / 2) * 2);

        const enemyShips: { name: string; count: number }[] = [];

        // Always 1 base ship
        enemyShips.push({ name: 'Dropship', count: 1 }); // 2x2

        if (wave > 2) enemyShips.push({ name: 'Leviathan', count: Math.floor(wave / 3) + 1 });
        if (wave > 5) enemyShips.push({ name: 'Harbinger Ship', count: 1 }); // Boss ship

        // Player Stratagems (Reload per wave or carry over? Reload is easier for balance)
        const stratagems = [
            { name: 'Orbital Laser', count: 1 + Math.floor(wave / 5), icon: '/stratagems/orbital-laser.png' },
            { name: 'Emergency Shield', count: 1, icon: '/icons/Emergency Shield.png' },
            { name: 'Reinforce', count: 1, icon: '/stratagems/reinforce.png' } // Assuming this exists or generic
        ];

        return {
            id: wave,
            name: `Wave ${wave}`,
            description: `Survive the Illuminate Invasion - Wave ${wave}`,

            gridSize: dynamicGridSize,
            ships: [
                { name: 'Super Destroyer', count: 1 },
                { name: 'Pelican-1', count: 2 },
                ...REINFORCEMENT_UPGRADES.slice(0, reinforcementLevel).flatMap(tier => tier.rewards)
            ],
            enemyShips,
            stratagems,
            enemyStratagems: [
                { name: 'Fusion Cannon', count: enemyStratagemCount },
                { name: 'Artificial Black Hole', count: wave > 8 ? 1 : 0 }
            ],
            enemyAi: 'smart',
            aiSmartness,
            dialogue: [] // No dialogue for endless
        };
    }, [reinforcementLevel]);



    // Init Endless Wave
    useEffect(() => {
        if (mode === 'endless') {
            const config = generateEndlessConfig(currentWave);
            setGeneratedConfig(config);
        }
    }, [mode, currentWave, generateEndlessConfig]);

    // Helper to create an empty grid
    const createEmptyGrid = (): Cell[][] => {
        const grid: Cell[][] = [];
        for (let y = 0; y < gridSize; y++) {
            const row: Cell[] = [];
            for (let x = 0; x < gridSize; x++) {
                row.push({ x, y, status: 'empty' });
            }
            grid.push(row);
        }
        return grid;
    };



    const [enemyGrid, setEnemyGrid] = useState<Cell[][]>(createEmptyGrid());
    const [playerGrid, setPlayerGrid] = useState<Cell[][]>(createEmptyGrid());
    const [availableShips, setAvailableShips] = useState<Ship[]>([]);
    const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
    const [enemyPlacedShips, setEnemyPlacedShips] = useState<PlacedShip[]>([]);
    const [draggedShip, setDraggedShip] = useState<Ship | null>(null);
    const [hoverPos, setHoverPos] = useState<{ x: number, y: number } | null>(null);

    // Consumables Data (Mock)
    // Consumables Data (Mock)


    // Stratagem State
    const [availableStratagems, setAvailableStratagems] = useState<Stratagem[]>([]);
    const [draggedStratagem, setDraggedStratagem] = useState<Stratagem | null>(null);
    const [selectedStratagem, setSelectedStratagem] = useState<Stratagem | null>(null);
    const [selectedTarget, setSelectedTarget] = useState<{ x: number, y: number } | null>(null);
    const [laserEffect, setLaserEffect] = useState<{ x: number, y: number, active: boolean } | null>(null);
    const [hellbombEffect, setHellbombEffect] = useState<{ x: number, y: number, active: boolean } | null>(null);
    const [fusionCannonEffect, setFusionCannonEffect] = useState<{ x: number, y: number, active: boolean } | null>(null);
    const [blackHoleEffect, setBlackHoleEffect] = useState<{ x: number, y: number, active: boolean } | null>(null);
    const [blackHoleCharging, setBlackHoleCharging] = useState<{ x: number, y: number, turnsRemaining: number } | null>(null);
    const [enemyStratagems, setEnemyStratagems] = useState<{ name: string; count: number }[]>([]);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [bossHealth, setBossHealth] = useState<number>(0);
    const [warpEffect, setWarpEffect] = useState<{ x: number, y: number, active: boolean } | null>(null);
    const [showDialogue, setShowDialogue] = useState(false);
    const [showPostDialogue, setShowPostDialogue] = useState(false);
    const [postDialogueCompleted, setPostDialogueCompleted] = useState(false);
    const [showCompletionScreen, setShowCompletionScreen] = useState(false);

    const [isHeaderVisible, setIsHeaderVisible] = useState(false);
    const [showArmory, setShowArmory] = useState(false);
    const [showDatapad, setShowDatapad] = useState(false);

    // Header Visibility Timer
    useEffect(() => {
        if (mode === 'endless') {
            setIsHeaderVisible(true);
            const timer = setTimeout(() => {
                setIsHeaderVisible(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [currentWave, mode]);

    // Game State
    const [gameState, setGameState] = useState<'setup' | 'playing' | 'won' | 'lost'>('setup');
    const [currentTurn, setCurrentTurn] = useState<'player' | 'enemy'>('player');

    // Radar State
    const [radarChargesUsed, setRadarChargesUsed] = useState(0);
    const [radarPing, setRadarPing] = useState<{ x: number, y: number } | null>(null);
    const [lastHit, setLastHit] = useState<{ x: number, y: number } | null>(null); // For AI hunting

    // Save Score on Game Over
    useEffect(() => {
        if (mode === 'endless' && gameState === 'lost' && !scoreSavedRef.current) {
            const totalScore = endlessScore + endlessCredits;
            console.log(`[BattleshipGame] Saving Score: ${totalScore} for ${username}`);
            db.saveScore(username, totalScore, 'Endless Invasion');
            scoreSavedRef.current = true;
        }
    }, [mode, gameState, endlessScore, endlessCredits, username]);



    // Initialize/Reset Ammo to Max & Radar
    useEffect(() => {
        if (mode === 'endless' && gameState === 'setup') {
            setAmmo(maxAmmo);
            setRadarChargesUsed(0);
            setRadarPing(null);
        }
    }, [gameState, mode, maxAmmo]);

    // Handle Consumable Purchases
    const buyConsumable = (item: typeof CONSUMABLES[0]) => {
        if (endlessCredits < item.cost) return;

        if (item.id === 'radar') {
            if (radarChargesUsed >= 3) return;

            // Find unhit enemy ship cells
            const unhitShipCells: { x: number, y: number }[] = [];
            enemyPlacedShips.forEach(ship => {
                for (let dx = 0; dx < ship.size.width; dx++) {
                    for (let dy = 0; dy < ship.size.height; dy++) {
                        const cellX = ship.gridX + dx;
                        const cellY = ship.gridY + dy;
                        // Determine if this cell is already hit by checking the grid
                        // Note: ship coordinates are correct, we just need to verify they aren't 'hit' in enemyGrid
                        if (enemyGrid[cellY][cellX].status !== 'hit' && enemyGrid[cellY][cellX].status !== 'miss') {
                            unhitShipCells.push({ x: cellX, y: cellY });
                        }
                    }
                }
            });

            if (unhitShipCells.length > 0) {
                const randomCell = unhitShipCells[Math.floor(Math.random() * unhitShipCells.length)];
                setRadarPing(randomCell);
                setTimeout(() => setRadarPing(null), 10000);

                setAlertMessage("ENEMY SHIP DETECTED");
                setTimeout(() => setAlertMessage(null), 2000);

                setRadarChargesUsed(prev => prev + 1);

                setEndlessCredits(prev => prev - item.cost);
                setShowDatapad(false); // Close modal on purchase
            } else {
                setAlertMessage("NO TARGETS FOUND");
                setTimeout(() => setAlertMessage(null), 2000);
            }
        } else {
            // Placeholder for other items
            // Logic for repair/cooldown/etc would go here
            if (item.id === 'repair' || item.id === 'cooldown') {
                // For now, just deduct credits to simulate purchase
                setEndlessCredits(prev => prev - item.cost);
                setShowDatapad(false); // Close modal on purchase
                setAlertMessage("ITEM PURCHASED");
                setTimeout(() => setAlertMessage(null), 1000);
            }
        }
    };

    // Handle Ammo Upgrade Purchase
    const buyAmmoUpgrade = () => {
        const nextUpgrade = AMMO_UPGRADES[ammoUpgradeLevel];
        if (!nextUpgrade) return;

        if (endlessCredits >= nextUpgrade.cost) {
            setEndlessCredits(prev => prev - nextUpgrade.cost);
            setAmmoUpgradeLevel(prev => prev + 1);
            // Optional: Refill ammo immediately? Or just update cap. 
            // Better to just update cap and let standard reload logic handle fill.
            // But if purchased mid-run (between waves), next wave start might need check.
            // Endless Mode Score Saving
            useEffect(() => {
                if (mode === 'endless' && gameState === 'lost' && !scoreSavedRef.current) {
                    const finalScore = endlessScore + endlessCredits;
                    scoreSavedRef.current = true;
                    db.saveScore(username, finalScore, 'Endless Invasion');
                }
                if (gameState === 'setup') {
                    scoreSavedRef.current = false;
                }
            }, [gameState, mode, endlessScore, endlessCredits, username]);

            // Setup Effect above handles setup reset.
        }
    };



    // REDEFINING handleCellClick TO INCLUDE LOGIC
    // Since I can't inject into the middle well with replace, I will rewrite the function logic in the next steps or use a targeted replace if possible.
    // Actually, I should use multi_replace to inject state and modify the function safely.
    // Let's just add state first here.


    // Trigger onMissionComplete when game is won
    useEffect(() => {
        if (gameState === 'won') {
            if (mode === 'endless') {
                if (!showEndlessWaveComplete) {
                    const waveBonus = currentWave * 100;
                    const completionCredits = currentWave * 50;

                    const newScore = endlessScore + waveBonus;
                    setEndlessScore(newScore);

                    const newTotalCredits = endlessCredits + completionCredits;
                    setEndlessCredits(newTotalCredits);

                    // Save Progress
                    db.getUserStats(username).then(stats => {
                        const currentHigh = stats.illuminate?.highScore || 0;
                        const isNewHigh = newScore > currentHigh;

                        db.saveIlluminateData(username, {
                            highScore: isNewHigh ? newScore : currentHigh,
                            credits: newTotalCredits,
                            inventory: stats.illuminate?.inventory || []
                        });
                    });

                    setShowEndlessWaveComplete(true);
                }
                return;
            }

            // Campaign Logic
            // Check for post-mission dialogue
            if (missionConfig?.afterMissionDialogue && !postDialogueCompleted) {
                setShowPostDialogue(true);
                return;
            }

            // If dialogue is done (or didn't exist), check for completion screen
            if (missionConfig?.id === 10 && !showCompletionScreen) {
                setShowCompletionScreen(true);
                return;
            }

            // Standard completion
            if (onMissionComplete && missionConfig?.id !== 10) {
                onMissionComplete();
            }
        }
    }, [gameState, onMissionComplete, missionConfig, postDialogueCompleted, showCompletionScreen, mode, currentWave, endlessScore, endlessCredits, showEndlessWaveComplete, username]);

    const handleEndlessNextWave = () => {
        setShowEndlessWaveComplete(false);
        setCurrentWave(prev => prev + 1);
        setGameState('setup');
    };

    const handlePostDialogueComplete = () => {
        setShowPostDialogue(false);
        setPostDialogueCompleted(true);
    };

    const handleCompletionContinue = () => {
        setShowCompletionScreen(false);
        if (onMissionComplete) {
            onMissionComplete();
        }
        if (onMainMenu) {
            onMainMenu();
        }
    };

    const [reloadTimer, setReloadTimer] = useState<number | null>(null);

    // Handle Stratagem Reload Timer
    useEffect(() => {
        if (currentTurn === 'player' && reloadTimer !== null) {
            if (reloadTimer > 1) {
                setReloadTimer(prev => prev! - 1);
            } else {
                // Reload Complete
                setReloadTimer(null);
                if (missionConfig?.stratagems) {
                    setAvailableStratagems(missionConfig.stratagems.map(s => ({ ...s })));
                    setAlertMessage("STRATAGEMS RELOADED! GIVE THEM HELL!");
                    setTimeout(() => setAlertMessage(null), 3000);
                }
            }
        }
    }, [currentTurn]);

    // Helper to check placement validity (generic)
    const isValidPlacement = (x: number, y: number, ship: Ship, currentPlacedShips: PlacedShip[], currentGridSize: number): boolean => {
        // Check bounds
        if (x + ship.size.width > currentGridSize || y + ship.size.height > currentGridSize) {
            return false;
        }

        // Check overlap
        for (let dy = 0; dy < ship.size.height; dy++) {
            for (let dx = 0; dx < ship.size.width; dx++) {
                const cellX = x + dx;
                const cellY = y + dy;

                // Check if any ship already occupies this cell
                const isOccupied = currentPlacedShips.some(p =>
                    cellX >= p.gridX && cellX < p.gridX + p.size.width &&
                    cellY >= p.gridY && cellY < p.gridY + p.size.height
                );

                if (isOccupied) return false;
            }
        }

        return true;
    };

    // Reset grids when mission config changes
    useEffect(() => {
        setEnemyGrid(createEmptyGrid());
        setPlayerGrid(createEmptyGrid());
        setPlacedShips([]);
        setEnemyPlacedShips([]);
        setGameState('setup');
        setCurrentTurn('player');
        setLastHit(null);
        setLastHit(null);
        setLastHit(null);
        setLaserEffect(null);
        setHellbombEffect(null);
        setHellbombEffect(null);
        setSelectedStratagem(null);
        setSelectedTarget(null);
        setDraggedShip(null);
        setDraggedStratagem(null);
        setFusionCannonEffect(null);
        setAlertMessage(null);
        setBossHealth(0);
        setWarpEffect(null);

        // Initialize Dialogue
        if (missionConfig?.dialogue && missionConfig.dialogue.length > 0) {
            setShowDialogue(true);
        } else {
            setShowDialogue(false);
        }

        // Re-initialize available ships based on config
        const ships: Ship[] = [];
        const enemyShipsToPlace: Ship[] = [];

        if (missionConfig) {
            // Player Ships
            missionConfig.ships.forEach(shipConfig => {
                for (let i = 0; i < shipConfig.count; i++) {
                    let size = { width: 1, height: 1 };
                    let icon = '/ships/eagle-1.png';

                    if (shipConfig.name === 'Pelican-1') {
                        size = { width: 2, height: 2 };
                        icon = '/ships/super-destroyer.png';
                    } else if (shipConfig.name === 'Super Destroyer') {
                        size = { width: 4, height: 2 };
                        icon = '/ships/pelican-1.png';
                    }

                    ships.push({
                        id: `player-${shipConfig.name.toLowerCase().replace(' ', '-')}-${i}`,
                        name: shipConfig.name,
                        size,
                        icon
                    });
                }
            });

            // Enemy Ships
            if (missionConfig.enemyShips) {
                missionConfig.enemyShips.forEach(shipConfig => {
                    for (let i = 0; i < shipConfig.count; i++) {
                        let size = { width: 1, height: 1 };
                        let icon = '/ships/Leviathan.png'; // Default for 1x1 (Stingray)

                        if (shipConfig.name === 'Dropship') {
                            size = { width: 2, height: 2 };
                            icon = '/ships/Stingray.png';
                        } else if (shipConfig.name === 'Leviathan') {
                            size = { width: 4, height: 2 };
                            icon = '/ships/Dropship.png';
                        } else if (shipConfig.name === 'Harbinger Ship') {
                            size = { width: 3, height: 3 };
                            icon = '/ships/harbinger.png';
                            setBossHealth(33); // 3x3 ship = 9 HP * 2 (Doubled) + 80% increase
                        }

                        enemyShipsToPlace.push({
                            id: `enemy-${shipConfig.name.toLowerCase().replace(' ', '-')}-${i}`,
                            name: shipConfig.name,
                            size,
                            icon
                        });
                    }
                });
            }

            setAvailableShips(ships);

            // Stratagems
            if (missionConfig.stratagems) {
                setAvailableStratagems(missionConfig.stratagems.map(s => ({
                    name: s.name,
                    count: s.count,
                    icon: s.icon
                })));
            } else {
                setAvailableStratagems([]);
            }

            if (missionConfig.enemyStratagems) {
                setEnemyStratagems(missionConfig.enemyStratagems);
            } else {
                setEnemyStratagems([]);
            }

            // Randomly place enemy ships
            const newEnemyPlacedShips: PlacedShip[] = [];

            enemyShipsToPlace.forEach(ship => {
                let placed = false;
                let attempts = 0;
                while (!placed && attempts < 100) {
                    const x = Math.floor(Math.random() * gridSize);
                    const y = Math.floor(Math.random() * gridSize);

                    if (isValidPlacement(x, y, ship, newEnemyPlacedShips, gridSize)) {
                        const newShip = { ...ship, gridX: x, gridY: y };
                        newEnemyPlacedShips.push(newShip);
                        placed = true;
                    }
                    attempts++;
                }
            });
            setEnemyPlacedShips(newEnemyPlacedShips);

            // Enemy Shields Logic (Wave 5+)
            let shieldCount = 0;
            if (currentWave >= 20) shieldCount = 20;
            else if (currentWave >= 16) shieldCount = 13;
            else if (currentWave >= 14) shieldCount = 10;
            else if (currentWave >= 12) shieldCount = 8;
            else if (currentWave >= 10) shieldCount = 6;
            else if (currentWave >= 7) shieldCount = 4;
            else if (currentWave >= 5) shieldCount = 2;

            if (shieldCount > 0) {
                // Collect all valid ship coordinates
                const shipCoords: { x: number, y: number }[] = [];
                newEnemyPlacedShips.forEach(ship => {
                    for (let dx = 0; dx < ship.size.width; dx++) {
                        for (let dy = 0; dy < ship.size.height; dy++) {
                            shipCoords.push({ x: ship.gridX + dx, y: ship.gridY + dy });
                        }
                    }
                });

                // Randomly assign unique shields
                const initialEnemyGrid = createEmptyGrid();
                let shieldsPlaced = 0;
                while (shieldsPlaced < shieldCount && shipCoords.length > 0) {
                    const randomIndex = Math.floor(Math.random() * shipCoords.length);
                    const coord = shipCoords[randomIndex];

                    // Remove used coord to avoid overlap
                    shipCoords.splice(randomIndex, 1);

                    // Apply shield to grid
                    initialEnemyGrid[coord.y][coord.x].enemyShieldHealth = 2;
                    shieldsPlaced++;
                }
                setEnemyGrid(initialEnemyGrid);
            }


        } else {
            // Default ships if no config
            const defaultShips: Ship[] = [
                { id: 'pelican-1-1', name: 'Pelican-1', size: { width: 2, height: 2 }, icon: '/ships/super-destroyer.png' },
                { id: 'pelican-1-2', name: 'Pelican-1', size: { width: 2, height: 2 }, icon: '/ships/super-destroyer.png' },
                { id: 'super-destroyer-1', name: 'Super Destroyer', size: { width: 4, height: 2 }, icon: '/ships/pelican-1.png' },
            ];
            setAvailableShips(defaultShips);
            setAvailableStratagems([
                { name: 'Orbital Laser', count: 2, icon: '/stratagems/orbital-laser.png' },
                { name: 'Emergency Shield', count: 2, icon: '/icons/Emergency Shield.png' }
            ]);
        }
    }, [missionConfig, gridSize]);

    const checkWinCondition = (grid: Cell[][], ships: PlacedShip[], currentBossHealth?: number) => {
        if (missionConfig?.id === 10) {
            return (currentBossHealth !== undefined ? currentBossHealth : bossHealth) <= 0;
        }

        // Check if all ship cells have been hit
        let allSunk = true;
        for (const ship of ships) {
            let shipSunk = true;
            for (let dy = 0; dy < ship.size.height; dy++) {
                for (let dx = 0; dx < ship.size.width; dx++) {
                    if (grid[ship.gridY + dy][ship.gridX + dx].status !== 'hit') {
                        shipSunk = false;
                        break;
                    }
                }
                if (!shipSunk) break;
            }
            if (!shipSunk) {
                allSunk = false;
                break;
            }
        }
        return allSunk;
    };

    const triggerWarp = () => {
        const harbinger = enemyPlacedShips.find(s => s.name === 'Harbinger Ship');
        if (harbinger) {
            // 1. Trigger Warp Effect at OLD location
            setWarpEffect({ x: harbinger.gridX, y: harbinger.gridY, active: true });
            setTimeout(() => setWarpEffect(null), 1500);

            // 2. Move Ship
            let placed = false;
            let newX = 0;
            let newY = 0;
            let attempts = 0;
            while (!placed && attempts < 100) {
                newX = Math.floor(Math.random() * gridSize);
                newY = Math.floor(Math.random() * gridSize);
                if (newX + 3 <= gridSize && newY + 3 <= gridSize) {
                    if (newX !== harbinger.gridX || newY !== harbinger.gridY) {
                        placed = true;
                    }
                }
                attempts++;
            }

            if (placed) {
                setEnemyPlacedShips(prev => prev.map(s =>
                    s.name === 'Harbinger Ship' ? { ...s, gridX: newX, gridY: newY } : s
                ));
            }

            // 3. Clear Grid
            setEnemyGrid(createEmptyGrid());
        }
    };

    const handleEnemyTurn = () => {
        if (gameState !== 'playing') return;

        // Create a copy of the grid to modify
        const newGrid = playerGrid.map(row => row.map(cell => ({ ...cell })));
        let targetX = -1;
        let targetY = -1;
        const smartness = missionConfig?.aiSmartness || 0;
        const isSmartMove = Math.random() * 100 < smartness;

        // Check for Black Hole Charge Execution
        if (blackHoleCharging) {
            if (blackHoleCharging.turnsRemaining <= 0) {
                // FIRE BLACK HOLE
                const { x, y } = blackHoleCharging;

                // Trigger Effect
                setBlackHoleEffect({ x, y, active: true });
                setTimeout(() => setBlackHoleEffect(null), 2500);
                setAlertMessage("CRITICAL ALERT: BLACK HOLE IMPLOSION DETECTED!");
                setTimeout(() => setAlertMessage(null), 3000);

                // Apply Damage (3x3)
                for (let dy = 0; dy < 3; dy++) {
                    for (let dx = 0; dx < 3; dx++) {
                        const tx = x + dx;
                        const ty = y + dy;

                        if (tx < gridSize && ty < gridSize) {
                            // Mark impact type
                            newGrid[ty][tx].impactType = 'blackhole';

                            if (newGrid[ty][tx].isShielded) {
                                newGrid[ty][tx].isShielded = false;
                            } else {
                                const shipHit = placedShips.find(ship =>
                                    tx >= ship.gridX && tx < ship.gridX + ship.size.width &&
                                    ty >= ship.gridY && ty < ship.gridY + ship.size.height
                                );

                                if (shipHit) {
                                    newGrid[ty][tx].status = 'hit';
                                } else {
                                    newGrid[ty][tx].status = 'miss';
                                }
                            }
                        }
                    }
                }

                // Clear Charging State
                setBlackHoleCharging(null);

                // Decrement count
                setEnemyStratagems(prev => prev.map(s =>
                    s.name === 'Artificial Black Hole' ? { ...s, count: s.count - 1 } : s
                ));

                setPlayerGrid(newGrid);

                if (checkWinCondition(newGrid, placedShips)) {
                    setGameState('lost');
                } else {
                    if (missionConfig?.id === 10) {
                        triggerWarp();
                    }
                    setCurrentTurn('player');
                }
                return;
            } else {
                // Decrement Turn
                setBlackHoleCharging(prev => prev ? { ...prev, turnsRemaining: prev.turnsRemaining - 1 } : null);
                setAlertMessage("WARNING: GRAVITATIONAL ANOMALY DETECTED! IMPACT IMMINENT!");
                setTimeout(() => setAlertMessage(null), 3000);
                setCurrentTurn('player');
                return;
            }
        }

        // Check for Stratagem Usage (New Initiation)
        const blackHole = enemyStratagems.find(s => s.name === 'Artificial Black Hole');
        if (blackHole && blackHole.count > 0 && !blackHoleCharging && Math.random() < 0.15) {
            // 15% chance to start Black Hole Charge
            const validTargets: { x: number, y: number }[] = [];
            for (let y = 0; y < gridSize - 2; y++) {
                for (let x = 0; x < gridSize - 2; x++) {
                    validTargets.push({ x, y });
                }
            }

            if (validTargets.length > 0) {
                const target = validTargets[Math.floor(Math.random() * validTargets.length)];
                setBlackHoleCharging({ x: target.x, y: target.y, turnsRemaining: 1 }); // 1 turn charge
                setAlertMessage("WARNING: THE ILLUMINITE SHIPS ARE CHARGING SOMETHING MASSIVE. PREPARE.");
                setTimeout(() => setAlertMessage(null), 4000);

                setCurrentTurn('player');
                return;
            }
        }

        const fusionCannon = enemyStratagems.find(s => s.name === 'Fusion Cannon');
        if (fusionCannon && fusionCannon.count > 0 && Math.random() < 0.2) {
            // 20% chance to use Fusion Cannon if available
            const validTargets: { x: number, y: number }[] = [];
            for (let y = 0; y < gridSize - 1; y++) {
                for (let x = 0; x < gridSize - 1; x++) {
                    let hasValidTarget = false;
                    for (let dy = 0; dy < 2; dy++) {
                        for (let dx = 0; dx < 2; dx++) {
                            if (newGrid[y + dy][x + dx].status !== 'hit' && newGrid[y + dy][x + dx].status !== 'miss') {
                                hasValidTarget = true;
                                break;
                            }
                        }
                        if (hasValidTarget) break;
                    }
                    if (hasValidTarget) {
                        validTargets.push({ x, y });
                    }
                }
            }

            if (validTargets.length > 0) {
                const target = validTargets[Math.floor(Math.random() * validTargets.length)];

                // Trigger Effect
                setFusionCannonEffect({ x: target.x, y: target.y, active: true });
                setTimeout(() => setFusionCannonEffect(null), 1500);
                setAlertMessage("WARNING: ENEMY FUSION CANNON DETECTED!");
                setTimeout(() => setAlertMessage(null), 3000);

                // Apply Damage (2x2)
                for (let dy = 0; dy < 2; dy++) {
                    for (let dx = 0; dx < 2; dx++) {
                        const tx = target.x + dx;
                        const ty = target.y + dy;

                        if (newGrid[ty][tx].isShielded) {
                            newGrid[ty][tx].isShielded = false;
                        } else {
                            const shipHit = placedShips.find(ship =>
                                tx >= ship.gridX && tx < ship.gridX + ship.size.width &&
                                ty >= ship.gridY && ty < ship.gridY + ship.size.height
                            );

                            if (shipHit) {
                                newGrid[ty][tx].status = 'hit';
                            } else {
                                newGrid[ty][tx].status = 'miss';
                            }
                        }
                    }
                }

                // Decrement count
                setEnemyStratagems(prev => prev.map(s =>
                    s.name === 'Fusion Cannon' ? { ...s, count: s.count - 1 } : s
                ));

                setPlayerGrid(newGrid);

                if (checkWinCondition(newGrid, placedShips)) {
                    setGameState('lost');
                } else {
                    if (missionConfig?.id === 10) {
                        triggerWarp();
                    }
                    setCurrentTurn('player');
                }
                return;
            }
        }

        // AI Logic
        if (isSmartMove && lastHit) {
            // Hunt mode: Try adjacent cells
            const directions = [
                { dx: 0, dy: -1 }, // Up
                { dx: 0, dy: 1 },  // Down
                { dx: -1, dy: 0 }, // Left
                { dx: 1, dy: 0 }   // Right
            ];

            // Shuffle directions for randomness in hunting
            directions.sort(() => Math.random() - 0.5);

            for (const dir of directions) {
                const nx = lastHit.x + dir.dx;
                const ny = lastHit.y + dir.dy;

                if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize &&
                    newGrid[ny][nx].status !== 'hit' && newGrid[ny][nx].status !== 'miss') {
                    targetX = nx;
                    targetY = ny;
                    break;
                }
            }
        }

        // If no target found (or not smart move, or hunt failed), pick random valid cell
        if (targetX === -1) {
            const validCells: { x: number, y: number }[] = [];
            for (let y = 0; y < gridSize; y++) {
                for (let x = 0; x < gridSize; x++) {
                    if (newGrid[y][x].status !== 'hit' && newGrid[y][x].status !== 'miss') {
                        validCells.push({ x, y });
                    }
                }
            }

            if (validCells.length > 0) {
                const randomCell = validCells[Math.floor(Math.random() * validCells.length)];
                targetX = randomCell.x;
                targetY = randomCell.y;
            }
        }

        if (targetX !== -1 && targetY !== -1) {
            // Check for Shield
            if (newGrid[targetY][targetX].isShielded) {
                newGrid[targetY][targetX].isShielded = false;
                // Shield absorbs hit, no status change
                setLastHit(null); // AI loses track
            } else {
                // Check hit
                const shipHit = placedShips.find(ship =>
                    targetX >= ship.gridX && targetX < ship.gridX + ship.size.width &&
                    targetY >= ship.gridY && targetY < ship.gridY + ship.size.height
                );

                if (shipHit) {
                    newGrid[targetY][targetX].status = 'hit';
                    setLastHit({ x: targetX, y: targetY });
                    triggerExplosion(targetX, targetY, false); // Trigger on Player Grid
                } else {
                    newGrid[targetY][targetX].status = 'miss';
                }
            }

            setPlayerGrid(newGrid);

            if (checkWinCondition(newGrid, placedShips)) {
                setGameState('lost');
            } else {
                if (missionConfig?.id === 10) {
                    triggerWarp();
                }
                setCurrentTurn('player');
            }
        }
    };

    const handleCellClick = (x: number, y: number, isEnemy: boolean) => {
        if (gameState !== 'playing' || currentTurn !== 'player') return;

        if (isEnemy) {
            // Player attacking enemy

            // Normal Attack

            // Endless Ammo Logic
            if (mode === 'endless') {
                if (isReloading) {
                    setAlertMessage("WEAPONS LOCKED - RELOADING");
                    setTimeout(() => setAlertMessage(null), 1000);
                    return;
                }
                if (ammo <= 0) return;

                // Decrement Ammo
                const newAmmo = ammo - 1;
                setAmmo(newAmmo);
            }

            if (enemyGrid[y][x].status === 'hit' || enemyGrid[y][x].status === 'miss') return;

            const newEnemyGrid = enemyGrid.map(row => row.map(cell => ({ ...cell })));
            const shipHit = enemyPlacedShips.find(ship =>
                x >= ship.gridX && x < ship.gridX + ship.size.width &&
                y >= ship.gridY && y < ship.gridY + ship.size.height
            );

            if (shipHit) {
                // Check for Enemy Shield
                const currentShieldHealth = newEnemyGrid[y][x].enemyShieldHealth || 0;
                if (currentShieldHealth > 0) {
                    // Hit Shield
                    newEnemyGrid[y][x].enemyShieldHealth = currentShieldHealth - 1;

                    // Visual Feedback for Shield Hit
                    // We don't mark as 'hit' status yet because it's absorbed
                    // But we need to update state to trigger re-render
                    // Maybe play a sound here?
                    setAlertMessage("SHIELD HIT!");
                    setTimeout(() => setAlertMessage(null), 1000);
                } else {
                    // Direct Hit
                    newEnemyGrid[y][x].status = 'hit';
                    triggerExplosion(x, y, true); // Trigger on Enemy Grid
                    if (shipHit.name === 'Harbinger Ship') {
                        setBossHealth(prev => {
                            const newHealth = prev - 1;
                            return newHealth;
                        });
                        triggerWarp();
                    }
                }
            } else {
                newEnemyGrid[y][x].status = 'miss';
            }

            setEnemyGrid(newEnemyGrid);

            let currentBossHealthForCheck = bossHealth;
            if (shipHit && shipHit.name === 'Harbinger Ship') {
                currentBossHealthForCheck -= 1;
            }

            if (checkWinCondition(newEnemyGrid, enemyPlacedShips, currentBossHealthForCheck)) {
                setGameState('won');
            } else {
                // Endless Auto-Reload Trigger
                if (mode === 'endless' && ammo - 1 === 0) {
                    setIsReloading(true);
                    setAlertMessage("GUNS RELOADING");
                    setTimeout(() => {
                        setAlertMessage(null);
                        setAmmo(maxAmmo);
                        setIsReloading(false);
                    }, 3000);
                }
                setCurrentTurn('enemy');
                setTimeout(handleEnemyTurn, 1000);
            }
        }
    };

    const autoDeployShips = () => {
        const newPlacedShips = [...placedShips];
        const newPlayerGrid = playerGrid.map(row => row.map(cell => ({ ...cell })));
        const shipsToPlace = [...availableShips];

        shipsToPlace.forEach(ship => {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                const isVertical = ship.name === 'Super Destroyer' ? false : Math.random() < 0.5;
                const width = isVertical ? ship.size.height : ship.size.width;
                const height = isVertical ? ship.size.width : ship.size.height;
                const currentShip = { ...ship, size: { width, height } };

                const x = Math.floor(Math.random() * gridSize);
                const y = Math.floor(Math.random() * gridSize);

                // Check if cells are empty in the grid (Redundant check for safety)
                let isGridClear = true;
                if (x + width > gridSize || y + height > gridSize) {
                    isGridClear = false;
                } else {
                    for (let dy = 0; dy < height; dy++) {
                        for (let dx = 0; dx < width; dx++) {
                            if (newPlayerGrid[y + dy][x + dx].status !== 'empty') {
                                isGridClear = false;
                                break;
                            }
                        }
                        if (!isGridClear) break;
                    }
                }

                if (isGridClear && isValidPlacement(x, y, currentShip, newPlacedShips, gridSize)) {
                    // Place ship
                    newPlacedShips.push({ ...currentShip, gridX: x, gridY: y });

                    // Update grid
                    for (let dy = 0; dy < height; dy++) {
                        for (let dx = 0; dx < width; dx++) {
                            newPlayerGrid[y + dy][x + dx].status = 'ship';
                        }
                    }
                    placed = true;
                }
                attempts++;
            }
        });

        setPlacedShips(newPlacedShips);
        setPlayerGrid(newPlayerGrid);
        setAvailableShips([]);
    };

    const buyReinforcementUpgrade = () => {
        const nextUpgrade = REINFORCEMENT_UPGRADES[reinforcementLevel];
        if (reinforcementLevel >= 15 || !nextUpgrade) return;

        if (endlessCredits >= nextUpgrade.cost) {
            setEndlessCredits(prev => prev - nextUpgrade.cost);
            setReinforcementLevel(prev => prev + 1);
            setAlertMessage("REINFORCEMENTS UPGRADED");
            setTimeout(() => setAlertMessage(null), 2000);
        }
    };

    const handleSellShip = (ship: PlacedShip) => {
        // Validation: Minimum Fleet Size
        if (placedShips.length <= 2) {
            setAlertMessage("CANNOT SELL: MINIMUM FLEET SIZE");
            setTimeout(() => setAlertMessage(null), 2000);
            return;
        }

        // Validation: Minimum Variety (if we have variety)
        const remainingShips = placedShips.filter(s => s.id !== ship.id);
        const currentTypes = new Set(placedShips.map(s => s.name)).size;
        const remainingTypes = new Set(remainingShips.map(s => s.name)).size;

        if (currentTypes >= 2 && remainingTypes < 2) {
            setAlertMessage("CANNOT SELL: FLEET DIVERSITY CRITICAL");
            setTimeout(() => setAlertMessage(null), 2000);
            return;
        }


        let value = 0;
        if (ship.size.width === 1 && ship.size.height === 1) value = 10;
        else if (ship.size.width === 2 && ship.size.height === 2) value = 50;
        else if (ship.size.width === 4 || ship.size.width === 3 || ship.size.width === 2) value = 200; // Super Destroyer (cover variations)

        // Remove ship logic (shared)
        const newPlacedShips = remainingShips;
        const newPlayerGrid = [...playerGrid];
        for (let dy = 0; dy < ship.size.height; dy++) {
            for (let dx = 0; dx < ship.size.width; dx++) {
                newPlayerGrid[ship.gridY + dy][ship.gridX + dx].status = 'empty';
            }
        }
        setPlacedShips(newPlacedShips);
        setPlayerGrid(newPlayerGrid);

        // Add Credits & Alert
        setEndlessCredits(prev => prev + value);
        setAlertMessage(`SHIP SOLD +${value} SC`);
        setTimeout(() => setAlertMessage(null), 1000);
        setContextMenu(null);
    };

    const handleMoveToReinforcements = (ship: PlacedShip) => {
        // Remove ship logic
        const newPlacedShips = placedShips.filter(s => s.id !== ship.id);
        const newPlayerGrid = [...playerGrid];
        for (let dy = 0; dy < ship.size.height; dy++) {
            for (let dx = 0; dx < ship.size.width; dx++) {
                newPlayerGrid[ship.gridY + dy][ship.gridX + dx].status = 'empty';
            }
        }
        setPlacedShips(newPlacedShips);
        setPlayerGrid(newPlayerGrid);
        setAvailableShips(prev => [...prev, ship]);
        setContextMenu(null);
    };

    const startGame = () => {
        // Validation: Minimum Ships
        if (placedShips.length < 2) {
            setAlertMessage("DEPLOY MORE SHIPS (MIN 2)");
            setTimeout(() => setAlertMessage(null), 2000);
            return;
        }

        // Validation: Ship Variety
        const allAvailableTypes = new Set([...availableShips, ...placedShips].map(s => s.name)).size;
        const placedTypes = new Set(placedShips.map(s => s.name)).size;

        if (allAvailableTypes > 1 && placedTypes < 2) {
            setAlertMessage("DEPLOY VARIED FLEET (MIN 2 TYPES)");
            setTimeout(() => setAlertMessage(null), 2000);
            return;
        }

        if (placedShips.length > 0) {
            setGameState('playing');
        } else {
            setAlertMessage("DEPLOY SHIPS TO START");
            setTimeout(() => setAlertMessage(null), 2000);
        }
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: DragEvent<HTMLDivElement>, ship: Ship) => {
        if (gameState !== 'setup') return;
        setDraggedShip(ship);
        e.dataTransfer.setData('type', 'ship');
        e.dataTransfer.setData('id', ship.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleStratagemDragStart = (e: DragEvent<HTMLDivElement>, stratagem: Stratagem) => {
        if (gameState !== 'playing' || currentTurn !== 'player') return;
        setDraggedStratagem(stratagem);
        e.dataTransfer.setData('type', 'stratagem');
        e.dataTransfer.setData('name', stratagem.name);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>, x: number, y: number) => {
        e.preventDefault();
        // Dynamic dropEffect based on what is being dragged
        if (draggedStratagem) {
            e.dataTransfer.dropEffect = 'copy';
        } else {
            e.dataTransfer.dropEffect = 'move';
        }
        setHoverPos({ x, y });
    };

    const handleDragLeave = () => {
        setHoverPos(null);
    };

    const handleDragEnd = () => {
        setDraggedStratagem(null);
        setDraggedShip(null);
        setHoverPos(null);
    };



    const handleDrop = (e: DragEvent<HTMLDivElement>, x: number, y: number) => {
        e.preventDefault();
        setHoverPos(null);

        const type = e.dataTransfer.getData('type');

        if (type === 'ship' && draggedShip) {
            if (isValidPlacement(x, y, draggedShip, placedShips, gridSize)) {
                placeShip(x, y, draggedShip);
            }
            setDraggedShip(null);
        } else if (type === 'stratagem' && draggedStratagem) {
            // Execute Stratagem
            if (draggedStratagem.name === 'Orbital Laser') {
                // 1x3 Vertical
                if (y + 2 < gridSize) {
                    executeOrbitalLaser(x, y);
                    // Decrement count
                    setAvailableStratagems(prev => prev.map(s =>
                        s.name === draggedStratagem.name ? { ...s, count: s.count - 1 } : s
                    ));
                }
            } else if (draggedStratagem.name === 'Emergency Shield') {
                // Single Tile Shield
                executeEmergencyShield(x, y);
                setAvailableStratagems(prev => prev.map(s =>
                    s.name === draggedStratagem.name ? { ...s, count: s.count - 1 } : s
                ));
            } else if (draggedStratagem.name === 'Orbital Hellbomb') {
                // 3x3 Area
                if (x + 3 <= gridSize && y + 3 <= gridSize) {
                    executeOrbitalHellbomb(x, y);
                    setAvailableStratagems(prev => prev.map(s =>
                        s.name === draggedStratagem.name ? { ...s, count: s.count - 1 } : s
                    ));
                }
            }
            setDraggedStratagem(null);
        }
    };

    // Click handling removed for drag-only stratagems

    const executeOrbitalLaser = (x: number, y: number) => {
        // Trigger Visual Effect
        setLaserEffect({ x, y, active: true });
        setTimeout(() => setLaserEffect(null), 1000);

        // Apply Damage
        const newEnemyGrid = enemyGrid.map(row => row.map(cell => ({ ...cell })));

        for (let i = 0; i < 3; i++) {
            const targetY = y + i;
            if (targetY < gridSize) {
                // Check if hit
                const shipHit = enemyPlacedShips.find(ship =>
                    x >= ship.gridX && x < ship.gridX + ship.size.width &&
                    targetY >= ship.gridY && targetY < ship.gridY + ship.size.height
                );

                if (shipHit) {
                    newEnemyGrid[targetY][x].status = 'hit';
                    if (shipHit.name === 'Harbinger Ship') {
                        // We need to track total damage in this single laser blast to check win condition properly
                        // But state updates are batched. We can just decrement locally for the check.
                        // However, since this loop runs 3 times, we might hit it multiple times.
                        // Let's use a functional update for setBossHealth, but we need to know the *final* health for the win check.
                        // Actually, let's just decrement it. The win check might be slightly delayed if we don't track it perfectly here,
                        // but since we check win condition at the end, we can calculate total hits.

                        // Better approach: Count hits in this execution
                    }
                } else {
                    if (newEnemyGrid[targetY][x].status !== 'hit') {
                        newEnemyGrid[targetY][x].status = 'miss';
                    }
                }
            }
        }

        // Calculate boss damage
        let bossDamage = 0;
        for (let i = 0; i < 3; i++) {
            const targetY = y + i;
            if (targetY < gridSize) {
                const shipHit = enemyPlacedShips.find(ship =>
                    x >= ship.gridX && x < ship.gridX + ship.size.width &&
                    targetY >= ship.gridY && targetY < ship.gridY + ship.size.height
                );
                if (shipHit && shipHit.name === 'Harbinger Ship') {
                    bossDamage++;
                }
            }
        }

        if (bossDamage > 0) {
            const newHealth = bossHealth - bossDamage;
            setBossHealth(newHealth);
            if (checkWinCondition(newEnemyGrid, enemyPlacedShips, newHealth)) {
                setGameState('won');
                setEnemyGrid(newEnemyGrid); // Ensure grid updates
                return;
            }
        }

        setEnemyGrid(newEnemyGrid);

        if (checkWinCondition(newEnemyGrid, enemyPlacedShips)) {
            setGameState('won');
        } else {
            setCurrentTurn('enemy');
            setTimeout(handleEnemyTurn, 1500);
        }
    };

    const executeEmergencyShield = (x: number, y: number) => {
        const newPlayerGrid = playerGrid.map(row => row.map(cell => ({ ...cell })));
        newPlayerGrid[y][x].isShielded = true;
        setPlayerGrid(newPlayerGrid);
    };

    const executeOrbitalHellbomb = (x: number, y: number) => {
        // Trigger Visual Effect
        setHellbombEffect({ x, y, active: true });
        setTimeout(() => setHellbombEffect(null), 1500);

        // Apply Damage (3x3)
        const newEnemyGrid = enemyGrid.map(row => row.map(cell => ({ ...cell })));

        for (let dy = 0; dy < 3; dy++) {
            for (let dx = 0; dx < 3; dx++) {
                const targetX = x + dx;
                const targetY = y + dy;

                if (targetX < gridSize && targetY < gridSize) {
                    const shipHit = enemyPlacedShips.find(ship =>
                        targetX >= ship.gridX && targetX < ship.gridX + ship.size.width &&
                        targetY >= ship.gridY && targetY < ship.gridY + ship.size.height
                    );

                    if (shipHit) {
                        newEnemyGrid[targetY][targetX].status = 'hit';
                    } else {
                        if (newEnemyGrid[targetY][targetX].status !== 'hit') {
                            newEnemyGrid[targetY][targetX].status = 'miss';
                        }
                    }
                }
            }
        }

        // Calculate boss damage
        let bossDamage = 0;
        for (let dy = 0; dy < 3; dy++) {
            for (let dx = 0; dx < 3; dx++) {
                const targetX = x + dx;
                const targetY = y + dy;
                if (targetX < gridSize && targetY < gridSize) {
                    const shipHit = enemyPlacedShips.find(ship =>
                        targetX >= ship.gridX && targetX < ship.gridX + ship.size.width &&
                        targetY >= ship.gridY && targetY < ship.gridY + ship.size.height
                    );
                    if (shipHit && shipHit.name === 'Harbinger Ship') {
                        bossDamage++;
                    }
                }
            }
        }

        if (bossDamage > 0) {
            const newHealth = bossHealth - bossDamage;
            setBossHealth(newHealth);
            if (checkWinCondition(newEnemyGrid, enemyPlacedShips, newHealth)) {
                setGameState('won');
                setEnemyGrid(newEnemyGrid);
                return;
            }
        }

        setEnemyGrid(newEnemyGrid);

        if (checkWinCondition(newEnemyGrid, enemyPlacedShips)) {
            setGameState('won');
        } else {
            setCurrentTurn('enemy');
            setTimeout(handleEnemyTurn, 2000);
        }
    };

    const placeShip = (x: number, y: number, ship: Ship) => {
        const newPlacedShip: PlacedShip = { ...ship, gridX: x, gridY: y };
        setPlacedShips([...placedShips, newPlacedShip]);

        // Remove from available ships
        setAvailableShips(availableShips.filter(s => s.id !== ship.id));

        // Update grid status for visualization
        const newGrid = [...playerGrid];
        for (let dy = 0; dy < ship.size.height; dy++) {
            for (let dx = 0; dx < ship.size.width; dx++) {
                newGrid[y + dy][x + dx].status = 'ship';
            }
        }
        setPlayerGrid(newGrid);
    };

    // Group available ships by name for the UI
    const groupedShips = availableShips.reduce((acc, ship) => {
        if (!acc[ship.name]) {
            acc[ship.name] = { count: 0, ship };
        }
        acc[ship.name].count++;
        return acc;
    }, {} as Record<string, { count: number; ship: Ship }>);

    const renderGrid = (grid: Cell[][], isEnemy: boolean) => {
        return (
            <div className="flex flex-col items-center space-y-2 relative w-full h-full">
                <h3 className={`text-lg md:text-xl font-bold uppercase tracking-widest ${isEnemy ? 'text-red-500' : 'text-blue-500'}`}>
                    {isEnemy ? 'Enemy Fleet' : 'Helldiver Fleet'}
                </h3>
                <div
                    onDragLeave={!isEnemy ? handleDragLeave : undefined}
                    className={`grid gap-1 p-2 rounded-lg border-2 relative aspect-square w-full max-w-[65vh] ${isEnemy ? 'bg-red-950/30 border-red-900/50' : 'bg-blue-950/30 border-blue-900/50'
                        } ${isEnemy && currentTurn === 'player' && gameState === 'playing' ? 'cursor-crosshair' : ''}`}
                    style={{
                        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
                    }}
                >
                    {/* Render Grid Cells */}
                    {grid.map((row, y) => (
                        row.map((cell, x) => {
                            // Calculate preview state
                            let isPreview = false;
                            let isValidPreview = false;

                            if (!isEnemy && draggedShip && hoverPos && gameState === 'setup') {
                                const dx = x - hoverPos.x;
                                const dy = y - hoverPos.y;

                                if (dx >= 0 && dx < draggedShip.size.width && dy >= 0 && dy < draggedShip.size.height) {
                                    isPreview = true;
                                    isValidPreview = isValidPlacement(hoverPos.x, hoverPos.y, draggedShip, placedShips, gridSize);
                                }
                            }

                            // Stratagem Preview
                            if (gameState === 'playing') {
                                // Radar Effect Overlay
                                if (isEnemy && radarPing && radarPing.x === x && radarPing.y === y) {
                                    // Rendered via direct check below to overlay properly
                                }

                                if (draggedStratagem && hoverPos) {
                                    if (isEnemy && draggedStratagem.name === 'Orbital Laser') {
                                        if (x === hoverPos.x && y >= hoverPos.y && y < hoverPos.y + 3) {
                                            isPreview = true;
                                            isValidPreview = hoverPos.y + 2 < gridSize;
                                        }
                                    } else if (!isEnemy && draggedStratagem.name === 'Emergency Shield') {
                                        if (x === hoverPos.x && y === hoverPos.y) {
                                            isPreview = true;
                                            isValidPreview = true;
                                        }
                                    } else if (isEnemy && draggedStratagem.name === 'Orbital Hellbomb') {
                                        if (x >= hoverPos.x && x < hoverPos.x + 3 && y >= hoverPos.y && y < hoverPos.y + 3) {
                                            isPreview = true;
                                            isValidPreview = hoverPos.x + 3 <= gridSize && hoverPos.y + 3 <= gridSize;
                                        }
                                    }
                                } else if (selectedStratagem && selectedTarget) {
                                    if (isEnemy && selectedStratagem.name === 'Orbital Laser') {
                                        if (x === selectedTarget.x && y >= selectedTarget.y && y < selectedTarget.y + 3) {
                                            isPreview = true;
                                            isValidPreview = true;
                                        }
                                    } else if (!isEnemy && selectedStratagem.name === 'Emergency Shield') {
                                        if (x === selectedTarget.x && y === selectedTarget.y) {
                                            isPreview = true;
                                            isValidPreview = true;
                                        }
                                    } else if (isEnemy && selectedStratagem.name === 'Orbital Hellbomb') {
                                        if (x >= selectedTarget.x && x < selectedTarget.x + 3 && y >= selectedTarget.y && y < selectedTarget.y + 3) {
                                            isPreview = true;
                                            isValidPreview = true;
                                        }
                                    }
                                }
                            }

                            // Find ship at this cell for enemy rendering
                            const enemyShipAtCell = isEnemy ? enemyPlacedShips.find(ship =>
                                x >= ship.gridX && x < ship.gridX + ship.size.width &&
                                y >= ship.gridY && y < ship.gridY + ship.size.height
                            ) : null;

                            return (
                                <div
                                    key={`${x}-${y}`}
                                    onClick={() => handleCellClick(x, y, isEnemy)}
                                    onDragOver={
                                        (!isEnemy && gameState === 'setup') || (gameState === 'playing' && draggedStratagem)
                                            ? (e) => handleDragOver(e, x, y)
                                            : undefined
                                    }
                                    onDrop={
                                        (!isEnemy && gameState === 'setup') || (gameState === 'playing' && draggedStratagem)
                                            ? (e) => handleDrop(e, x, y)
                                            : undefined
                                    }
                                    className={`
                                        w-full h-full border border-opacity-20 flex items-center justify-center transition-all duration-200 relative overflow-hidden
                                        ${isEnemy ? 'border-red-500 hover:bg-red-500/20' : 'border-blue-500'}
                                        ${cell.status === 'empty' && !isPreview ? 'bg-transparent' : ''}
                                        ${cell.status === 'hit' ? 'bg-red-500/50' : ''}
                                        ${cell.status === 'miss' ? 'bg-gray-500/50' : ''}
                                        ${!isEnemy && cell.status === 'ship' ? 'bg-blue-500/20' : ''} 
                                        ${isPreview ? (isValidPreview ? 'bg-yellow-500/40' : 'bg-red-500/60') : ''}
                                        ${cell.isShielded ? 'border-yellow-400 border-2 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : ''}
                                        ${cell.impactType === 'blackhole' ? 'shadow-[inset_0_0_10px_rgba(147,51,234,0.8)] border-purple-500/80 bg-purple-900/40!' : ''}
                                        ${cell.impactType === 'orbital-laser' ? 'bg-gray-900 border-orange-900 shadow-[inset_0_0_15px_rgba(255,69,0,0.6)]' : ''}
                                    `}
                                >
                                    {/* Shield Effect */}
                                    {cell.isShielded && (
                                        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center animate-pulse">
                                            <div className="w-full h-full border-2 border-yellow-500/50 bg-yellow-500/10 clip-path-hexagon"></div>
                                        </div>
                                    )}
                                    {/* Enemy Ship Fragment (Revealed on Hit) */}
                                    {isEnemy && enemyShipAtCell && cell.status === 'hit' && (
                                        <div className="absolute inset-0 z-0 pointer-events-none">
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: `calc(-${x - enemyShipAtCell.gridX} * 100%)`,
                                                    top: `calc(-${y - enemyShipAtCell.gridY} * 100%)`,
                                                    width: `calc(${enemyShipAtCell.size.width} * 100% - 0.25rem)`,
                                                    height: `calc(${enemyShipAtCell.size.height} * 100% - 0.25rem)`,
                                                }}
                                            >
                                                <img
                                                    src={enemyShipAtCell.icon}
                                                    alt=""
                                                    className="w-full h-full object-fill"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Burning Effect for Hit Ships */}
                                    {cell.status === 'hit' && (isEnemy ? enemyShipAtCell : placedShips.some(s => x >= s.gridX && x < s.gridX + s.size.width && y >= s.gridY && y < s.gridY + s.size.height)) && (
                                        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                                            <div className="w-full h-full bg-orange-500/30 rounded-full animate-burn mix-blend-screen"></div>
                                            <div className="absolute w-3/4 h-3/4 bg-red-600/40 rounded-full animate-pulse blur-sm"></div>
                                        </div>
                                    )}

                                    {cell.status === 'hit' && <div className="w-full h-full flex items-center justify-center text-lg md:text-3xl z-10 relative">💥</div>}
                                    {cell.status === 'miss' && <div className="w-2 h-2 md:w-4 md:h-4 bg-gray-400/50 rounded-full z-10 relative"></div>}
                                </div>
                            );
                        })
                    ))}

                    {/* Laser Effect Overlay */}
                    {
                        isEnemy && laserEffect && laserEffect.active && (
                            <div
                                className="absolute pointer-events-none z-50 flex flex-col items-center justify-center animate-pulse"
                                style={{
                                    left: `calc(${laserEffect.x} * (100% / ${gridSize}))`,
                                    top: `calc(${laserEffect.y} * (100% / ${gridSize}))`,
                                    width: `calc(100% / ${gridSize})`,
                                    height: `calc(300% / ${gridSize})`, // 3 cells
                                }}
                            >
                                <div className="w-1/4 h-full bg-yellow-400 shadow-[0_0_20px_10px_rgba(250,204,21,0.6)] rounded-full"></div>
                            </div>
                        )
                    }

                    {/* Hellbomb Effect Overlay */}
                    {
                        isEnemy && hellbombEffect && hellbombEffect.active && (
                            <div
                                className="absolute pointer-events-none z-50 flex items-center justify-center"
                                style={{
                                    left: `calc(${hellbombEffect.x} * (100% / ${gridSize}))`,
                                    top: `calc(${hellbombEffect.y} * (100% / ${gridSize}))`,
                                    width: `calc(300% / ${gridSize})`, // 3 cells
                                    height: `calc(300% / ${gridSize})`, // 3 cells
                                }}
                            >
                                <div className="w-full h-full bg-white/80 rounded-full animate-explosion shadow-[0_0_50px_20px_rgba(255,255,255,0.8)]"></div>
                                <div className="absolute w-full h-full border-4 border-yellow-500 rounded-full animate-ping opacity-75"></div>
                            </div>
                        )
                    }

                    {/* Fusion Cannon Effect Overlay */}
                    {
                        !isEnemy && fusionCannonEffect && fusionCannonEffect.active && (
                            <div
                                className="absolute pointer-events-none z-50 flex items-center justify-center"
                                style={{
                                    left: `calc(${fusionCannonEffect.x} * (100% / ${gridSize}))`,
                                    top: `calc(${fusionCannonEffect.y} * (100% / ${gridSize}))`,
                                    width: `calc(200% / ${gridSize})`, // 2 cells
                                    height: `calc(200% / ${gridSize})`, // 2 cells
                                }}
                            >
                                <div className="w-full h-full bg-blue-500/60 rounded-full animate-explosion shadow-[0_0_60px_30px_rgba(59,130,246,0.8)] relative z-10"></div>
                                <div className="absolute w-full h-full border-10 border-cyan-400 rounded-full animate-shockwave z-20"></div>
                                <div className="absolute w-full h-full border-4 border-blue-300 rounded-full animate-ping opacity-75 duration-500"></div>
                                <div className="absolute w-1/2 h-1/2 bg-white rounded-full animate-ping delay-100 z-30"></div>
                                {/* Particles */}
                                {Array.from({ length: 8 }).map((_, i) => {
                                    const angle = (i / 8) * Math.PI * 2;
                                    const tx = Math.cos(angle) * 150 + '%';
                                    const ty = Math.sin(angle) * 150 + '%';
                                    return (
                                        <div
                                            key={i}
                                            className="absolute w-3 h-3 bg-cyan-300 rounded-full animate-warp-particle z-0"
                                            style={{
                                                '--tx': tx,
                                                '--ty': ty,
                                                left: '50%',
                                                top: '50%',
                                            } as React.CSSProperties}
                                        ></div>
                                    );
                                })}
                            </div>
                        )
                    }

                    {/* Artificial Black Hole Effect Overlay */}
                    {
                        !isEnemy && blackHoleEffect && blackHoleEffect.active && (
                            <div
                                className="absolute pointer-events-none z-50 flex items-center justify-center"
                                style={{
                                    left: `calc(${blackHoleEffect.x} * (100% / ${gridSize}))`,
                                    top: `calc(${blackHoleEffect.y} * (100% / ${gridSize}))`,
                                    width: `calc(300% / ${gridSize})`, // 3 cells
                                    height: `calc(300% / ${gridSize})`, // 3 cells
                                }}
                            >
                                {/* Black Hole Core */}
                                <div className="w-3/4 h-3/4 bg-black rounded-full animate-black-hole shadow-[0_0_60px_30px_rgba(147,51,234,0.9)] border-4 border-purple-600 relative z-20"></div>
                                {/* Shockwave */}
                                <div className="absolute w-full h-full border-20 border-purple-500 rounded-full animate-shockwave z-10"></div>
                                {/* Accretion Disk */}
                                <div className="absolute w-full h-full bg-purple-900/30 rounded-full animate-spin duration-700"></div>
                            </div>
                        )
                    }

                    {/* Warp Effect Overlay */}
                    {
                        isEnemy && warpEffect && warpEffect.active && (
                            <div
                                className="absolute pointer-events-none z-50 flex items-center justify-center"
                                style={{
                                    left: `calc(${warpEffect.x} * (100% / ${gridSize}))`,
                                    top: `calc(${warpEffect.y} * (100% / ${gridSize}))`,
                                    width: `calc(300% / ${gridSize})`, // 3 cells (Harbinger size)
                                    height: `calc(300% / ${gridSize})`,
                                }}
                            >
                                <div className="w-full h-full bg-purple-900/50 rounded-full animate-ping"></div>
                                <div className="absolute w-3/4 h-3/4 border-4 border-purple-500 rounded-full animate-spin"></div>
                                <div className="absolute w-1/2 h-1/2 bg-black rounded-full shadow-[0_0_30px_15px_rgba(168,85,247,0.8)]"></div>
                                {/* Warp Particles */}
                                {Array.from({ length: 12 }).map((_, i) => {
                                    const angle = (i / 12) * Math.PI * 2;
                                    const tx = Math.cos(angle) * 100 + '%';
                                    const ty = Math.sin(angle) * 100 + '%';
                                    return (
                                        <div
                                            key={i}
                                            className="absolute w-12 h-12 -ml-6 -mt-6 bg-purple-400 rounded-full animate-warp-particle"
                                            style={{
                                                '--tx': tx,
                                                '--ty': ty,
                                                left: '50%',
                                                top: '50%',
                                            } as React.CSSProperties}
                                        ></div>
                                    );
                                })}
                                {/* Warp Sparks */}
                                {Array.from({ length: 8 }).map((_, i) => {
                                    const angle = (i / 8) * Math.PI * 2 + (Math.PI / 8); // Offset angle
                                    const tx = Math.cos(angle) * 120 + '%'; // Travel further
                                    const ty = Math.sin(angle) * 120 + '%';
                                    return (
                                        <div
                                            key={`spark-${i}`}
                                            className="absolute w-2 h-2 -ml-1 -mt-1 bg-yellow-200 rounded-full animate-warp-spark"
                                            style={{
                                                '--tx': tx,
                                                '--ty': ty,
                                                left: '50%',
                                                top: '50%',
                                            } as React.CSSProperties}
                                        ></div>
                                    );
                                })}
                            </div>
                        )
                    }

                    {/* Radar Ping Effect */}
                    <AnimatePresence>
                        {isEnemy && radarPing && (
                            <motion.div
                                key="radar-ping"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                                className="absolute pointer-events-none z-50 flex items-center justify-center"
                                style={{
                                    left: `calc(${radarPing.x} * (100% / ${gridSize}))`,
                                    top: `calc(${radarPing.y} * (100% / ${gridSize}))`,
                                    width: `calc(100% / ${gridSize})`,
                                    height: `calc(100% / ${gridSize})`,
                                }}
                            >
                                <img
                                    src="/icons/radar_crosshair.png"
                                    className="w-[120%] h-[120%] object-contain animate-[spin_4s_linear_infinite] drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Render Placed Ships Overlay (Only for Player) */}
                    {
                        !isEnemy && placedShips.map(ship => (
                            <div
                                key={ship.id}
                                className={`absolute flex items-center justify-center z-10 ${draggedStratagem ? 'pointer-events-none' : 'pointer-events-auto cursor-context-menu'}`}
                                style={{
                                    left: `calc(${ship.gridX} * (100% / ${gridSize}))`,
                                    top: `calc(${ship.gridY} * (100% / ${gridSize}))`,
                                    width: `calc(${ship.size.width} * (100% / ${gridSize}))`,
                                    height: `calc(${ship.size.height} * (100% / ${gridSize}))`,
                                }}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    if (gameState === 'setup') {
                                        setContextMenu({
                                            x: e.clientX,
                                            y: e.clientY,
                                            ship
                                        });
                                    }
                                }}
                            >
                                <img
                                    src={ship.icon}
                                    alt={ship.name}
                                    className={`w-full h-full object-contain drop-shadow-lg ${ship.name === 'Super Destroyer' ? 'scale-[1.5]' : ''}`}
                                />
                            </div>
                        ))
                    }

                    {/* Explosion Overlays */}
                    {activeExplosions.filter(e => e.isEnemyGrid === isEnemy).map(explosion => (
                        <div
                            key={explosion.id}
                            className="absolute pointer-events-none z-50 flex items-center justify-center"
                            style={{
                                left: `calc(${explosion.x} * (100% / ${gridSize}))`,
                                top: `calc(${explosion.y} * (100% / ${gridSize}))`,
                                width: `calc(100% / ${gridSize})`,
                                height: `calc(100% / ${gridSize})`,
                            }}
                        >
                            {/* Core Flash */}
                            <div className="absolute w-[120%] h-[120%] rounded-full animate-[explosion-flash_0.4s_ease-out_forwards] mix-blend-screen z-20"></div>

                            {/* Cloudy Smoke Puff Layers */}
                            <div className="absolute w-[140%] h-[140%] bg-gray-800/80 rounded-full animate-[explosion-smoke_0.8s_ease-out_forwards] blur-md z-10"></div>
                            <div className="absolute w-[160%] h-[160%] bg-orange-950/60 rounded-full animate-[explosion-smoke_0.9s_ease-out_forwards] blur-md z-10 delay-75"></div>
                            <div className="absolute w-[130%] h-[130%] bg-gray-900/90 rounded-full animate-[explosion-smoke_1s_ease-out_forwards] blur-sm z-10 delay-150"></div>

                            {/* Subtle Debris Particles */}
                            {Array.from({ length: 6 }).map((_, i) => {
                                const angle = (i / 6) * Math.PI * 2;
                                // Reduced distance variation
                                const dist = 50 + Math.random() * 50;
                                const dx = Math.cos(angle) * dist + '%';
                                const dy = Math.sin(angle) * dist + '%';
                                return (
                                    <div
                                        key={i}
                                        className="absolute w-1.5 h-1.5 bg-orange-400 rounded-sm animate-[explosion-debris_0.5s_ease-out_forwards]"
                                        style={{
                                            '--dx': dx,
                                            '--dy': dy,
                                            left: '50%',
                                            top: '50%'
                                        } as React.CSSProperties}
                                    ></div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Enemy Shield Overlays (Visible when damaged/Hit Once) */}
                    {isEnemy && enemyGrid.map((row, y) => row.map((cell, x) => {
                        if (cell.enemyShieldHealth === 1) {
                            return (
                                <div
                                    key={`shield-${x}-${y}`}
                                    className="absolute pointer-events-none z-40 flex items-center justify-center animate-in fade-in duration-300"
                                    style={{
                                        left: `calc(${x} * (100% / ${gridSize}))`,
                                        top: `calc(${y} * (100% / ${gridSize}))`,
                                        width: `calc(100% / ${gridSize})`,
                                        height: `calc(100% / ${gridSize})`,
                                    }}
                                >
                                    {/* Shield Hexagon/Circle Overlay */}
                                    <div className="w-[90%] h-[90%] bg-cyan-400/30 border-2 border-cyan-400/60 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.5)] backdrop-blur-[1px] animate-pulse">
                                        {/* Inner Hex Grid Pattern or Scanline */}
                                        <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,0.2)_5px,rgba(255,255,255,0.2)_10px)]"></div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    }))}
                </div>
            </div >
        );
    };

    const renderStratagemPanel = () => (
        <div className="flex flex-col space-y-2 p-4 bg-gray-800/50 rounded-xl border border-gray-700 w-full h-full overflow-hidden flex-1 min-h-0">
            <h3 className="text-yellow-500 font-bold uppercase tracking-widest text-sm mb-2 sticky top-0 bg-gray-900/90 p-1 z-10 shrink-0">
                Stratagems
            </h3>

            <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 pr-1">
                <div className="text-yellow-500/80 text-[10px] uppercase font-bold text-center mb-1 animate-pulse">
                    Drag & Drop to Deploy
                </div>
                {availableStratagems.length === 0 ? (
                    <div className="text-gray-500 italic text-sm text-center py-4">No stratagems available</div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {availableStratagems.map((stratagem, index) => (
                            <div
                                key={index}
                                draggable={gameState === 'playing' && currentTurn === 'player' && stratagem.count > 0}
                                onDragStart={(e) => handleStratagemDragStart(e, stratagem)}
                                onDragEnd={handleDragEnd}
                                className={`flex flex-col items-center p-3 bg-gray-900/80 rounded-lg border border-gray-700 transition-all group relative select-none ${gameState === 'playing' && currentTurn === 'player' && stratagem.count > 0
                                    ? 'cursor-grab active:cursor-grabbing hover:border-yellow-500/50 hover:bg-gray-800'
                                    : 'opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xs shadow-lg z-10">
                                    {stratagem.count}
                                </div>
                                <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center mb-2 shadow-inner">
                                    <img src={stratagem.icon} alt={stratagem.name} className="w-full h-full object-contain pointer-events-none" />
                                </div>
                                <p className="text-gray-300 font-bold text-xs text-center leading-tight group-hover:text-yellow-400 transition-colors truncate w-full">{stratagem.name}</p>
                            </div>
                        ))}
                    </div>
                )}
                {missionConfig?.allowStratagemReload && (
                    <button
                        onClick={() => setReloadTimer(5)}
                        disabled={reloadTimer !== null || gameState !== 'playing' || currentTurn !== 'player'}
                        className={`w-full py-2 mt-2 rounded font-bold uppercase tracking-wider text-xs transition-all shrink-0 ${reloadTimer === null && gameState === 'playing' && currentTurn === 'player'
                            ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {reloadTimer !== null ? `Reloading... (${reloadTimer} Turns)` : 'Reload Stratagems'}
                    </button>
                )}
            </div>
        </div>
    );

    const renderReinforcementPanel = () => (
        <div className="flex flex-col space-y-2 p-4 bg-gray-800/50 rounded-xl border border-gray-700 w-full h-full overflow-hidden flex-1 min-h-0">
            <h3 className="text-yellow-500 font-bold uppercase tracking-widest text-sm mb-2 sticky top-0 bg-gray-900/90 p-1 z-10 shrink-0">
                Reinforcements
            </h3>
            <div className="overflow-y-auto flex-1 min-h-0 pr-1">
                {availableShips.length === 0 ? (
                    <div className="text-gray-500 italic text-sm">All ships deployed</div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(groupedShips).map(([name, { count, ship }]) => (
                            <div
                                key={name}
                                draggable={gameState === 'setup'}
                                onDragStart={(e) => {
                                    if (gameState !== 'setup') return;
                                    const shipToDrag = availableShips.find(s => s.name === name);
                                    if (shipToDrag) handleDragStart(e, shipToDrag);
                                }}
                                onDragEnd={handleDragEnd}
                                className={`flex flex-col items-center p-3 bg-gray-900/80 rounded-lg border border-gray-700 transition-colors group relative ${gameState === 'setup' ? 'cursor-grab hover:border-yellow-500/50' : 'opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xs shadow-lg z-10">
                                    {count}
                                </div>
                                <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center mb-2">
                                    <img src={ship.icon} alt={ship.name} className="w-full h-full object-contain" />
                                </div>
                                <p className="text-gray-300 font-bold text-xs text-center leading-tight group-hover:text-yellow-400 transition-colors truncate w-full">{ship.name}</p>
                                <p className="text-gray-500 text-[10px]">{ship.size.width}x{ship.size.height}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-start space-y-2 w-full h-full max-w-full mx-auto p-2 overflow-hidden relative">
            <SpaceBackground />

            {/* Endless Mode Header Banner */}
            {mode === 'endless' && (
                <div className={`fixed top-8 left-0 z-20 flex flex-col items-start bg-gray-900/90 pl-6 pr-8 py-3 rounded-r-2xl border-y-2 border-r-2 border-purple-500/50 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.4)] pointer-events-none transition-all duration-700 ease-out transform ${isHeaderVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
                    <h3 className="text-xl md:text-3xl text-purple-400 font-black uppercase tracking-widest whitespace-nowrap drop-shadow-lg flex items-center gap-3">
                        Wave {currentWave} <span className="text-2xl animate-pulse">⚡</span>
                    </h3>
                    <div className="flex flex-col gap-1 text-xs md:text-sm font-mono mt-1 opacity-90 w-full">
                        <div className="flex justify-between w-full gap-4">
                            <span className="text-gray-400 uppercase tracking-wider">Score</span>
                            <span className="text-yellow-400 font-bold">{endlessScore}</span>
                        </div>
                        <div className="flex justify-between w-full gap-4">
                            <span className="text-gray-400 uppercase tracking-wider">Credits</span>
                            <div className="flex items-center gap-1 text-blue-400 font-bold">
                                {endlessCredits} <img src="/icons/super_credit.png" alt="SC" className="h-3 w-auto object-contain" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dialogue Overlay */}
            {showDialogue && missionConfig?.dialogue && (
                <DialogueOverlay
                    dialogue={missionConfig.dialogue}
                    onComplete={() => setShowDialogue(false)}
                    username={username}
                />
            )}

            {/* Post-Mission Dialogue Overlay */}
            {showPostDialogue && missionConfig?.afterMissionDialogue && (
                <DialogueOverlay
                    dialogue={missionConfig.afterMissionDialogue}
                    onComplete={handlePostDialogueComplete}
                    username={username}
                />
            )}

            {/* Campaign Completion Screen */}
            {showCompletionScreen && (
                <CampaignCompletionScreen
                    username={username}
                    onContinue={handleCompletionContinue}
                />
            )}

            {/* Game Status / Controls */}
            <div className="flex flex-col items-center justify-center min-h-[40px] shrink-0">
                {gameState === 'setup' && (
                    <div className="flex gap-4 items-center">
                        {availableShips.length > 0 && (
                            <button
                                onClick={autoDeployShips}
                                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider rounded-lg shadow-lg hover:shadow-yellow-500/50 transition-all text-sm"
                            >
                                Auto Deploy Ships
                            </button>
                        )}
                        <button
                            onClick={startGame}
                            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold uppercase tracking-wider rounded-lg shadow-lg hover:shadow-green-500/50 transition-all text-base animate-pulse"
                        >
                            Start Mission
                        </button>
                    </div>
                )}
                {gameState === 'playing' && (
                    <div className="text-2xl font-bold uppercase tracking-widest animate-pulse">
                        {currentTurn === 'player' ? <span className="text-blue-400">Your Turn</span> : <span className="text-red-500">Enemy Turn</span>}
                    </div>
                )}
                {gameState === 'won' && (
                    <div className="text-4xl font-bold text-yellow-500 uppercase tracking-widest drop-shadow-lg animate-bounce">
                        Mission Accomplished
                    </div>
                )}
                {gameState === 'lost' && (
                    <div className="text-4xl font-bold text-red-600 uppercase tracking-widest drop-shadow-lg">
                        Mission Failed
                    </div>
                )}
            </div>

            {/* Main Game Area */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 w-full h-full min-h-0">

                {/* Left Panel: Enemy Grid */}
                <div className="flex flex-col items-center justify-start gap-4 h-full w-full lg:w-auto flex-1">
                    {/* Boss Health Bar */}
                    {missionConfig?.id === 10 && (
                        <div className="w-full max-w-[65vh] mb-2">
                            <div className="flex justify-between text-purple-400 font-bold uppercase text-sm mb-1">
                                <span>Harbinger Integrity</span>
                                <span>{Math.ceil((bossHealth / 33) * 100)}%</span>
                            </div>
                            <div className="w-full h-4 bg-gray-900 rounded-full border border-purple-900 overflow-hidden">
                                <div
                                    className="h-full bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.8)] transition-all duration-500"
                                    style={{ width: `${(bossHealth / 33) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                    <div className="animate-in fade-in slide-in-from-top-4 duration-700 shrink-0 w-full flex justify-center h-full max-h-[65vh]">
                        {renderGrid(enemyGrid, true)}
                    </div>
                    {/* Mobile: Stratagems */}
                    <div className="lg:hidden w-full max-w-[65vh] max-h-[25vh]">
                        {renderStratagemPanel()}
                    </div>
                </div>

                {/* Center Panel: Controls (Desktop Only) */}
                <div className="hidden lg:flex flex-col gap-4 h-full w-full max-w-md py-4">
                    {renderStratagemPanel()}
                    {renderReinforcementPanel()}
                </div>

                {/* Right Panel: Player Grid */}
                <div className="flex flex-col items-center justify-start gap-4 h-full w-full lg:w-auto flex-1">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 shrink-0 w-full flex justify-center h-full max-h-[65vh]">
                        {renderGrid(playerGrid, false)}
                    </div>



                    {/* Mobile: Reinforcements */}
                    <div className="lg:hidden w-full max-w-[65vh] max-h-[25vh]">
                        {renderReinforcementPanel()}
                    </div>
                </div>
            </div>

            {/* Endless Wave Complete Overlay */}
            {showEndlessWaveComplete && (
                <div className="fixed inset-0 z-60 bg-black/80 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm">
                    <div className="bg-gray-900 border-2 border-yellow-500 p-8 rounded-xl shadow-2xl flex flex-col items-center gap-6 max-w-lg w-full relative">
                        <h2 className="text-4xl font-bold text-yellow-400 uppercase tracking-widest text-center">Wave {currentWave} Complete!</h2>

                        <div className="flex flex-col gap-2 w-full">
                            <div className="flex justify-between text-gray-300 text-lg border-b border-gray-700 pb-2">
                                <span>Wave Reward</span>
                                <div className="flex items-center gap-1 text-yellow-400 font-mono">
                                    +{currentWave * 100} <span className="text-xl">★</span>
                                </div>
                            </div>
                            <div className="flex justify-between text-gray-300 text-lg border-b border-gray-700 pb-2">
                                <span>Credits Earned</span>
                                <div className="flex items-center gap-1 text-blue-400 font-mono">
                                    +{currentWave * 50} <img src="/icons/super_credit.png" alt="SC" className="h-4 w-auto object-contain" />
                                </div>
                            </div>
                            <div className="flex justify-between text-white text-xl font-bold pt-2">
                                <span>Total Credits</span>
                                <div className="flex items-center gap-1 text-blue-400 font-mono">
                                    {endlessCredits} <img src="/icons/super_credit.png" alt="SC" className="h-5 w-auto object-contain" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 w-full">
                            <button
                                onClick={() => setShowArmory(true)}
                                className="flex-1 py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold uppercase tracking-wider rounded-lg transition-transform hover:scale-105 active:scale-95 border border-cyan-500"
                            >
                                Armory
                            </button>
                            <button
                                onClick={handleEndlessNextWave}
                                className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold uppercase tracking-wider rounded-lg transition-transform hover:scale-105 active:scale-95"
                            >
                                Next Wave
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Armory Modal (Placeholder) */}
            {showArmory && (
                <div className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center animate-in zoom-in duration-300">
                    <div className="bg-gray-800 border-2 border-cyan-500 p-8 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.5)] flex flex-col items-center gap-8 max-w-4xl w-full h-[80%] relative overflow-hidden">

                        {/* Header */}
                        <div className="flex justify-between items-center w-full border-b border-gray-600 pb-4">
                            <h2 className="text-4xl font-bold text-cyan-400 uppercase tracking-widest">Armory</h2>
                            <div className="flex flex-col items-end">
                                <span className="text-gray-400 text-sm">Valid Credits</span>
                                <div className="flex items-center gap-2 text-2xl font-mono text-yellow-400">
                                    {endlessCredits} <img src="/icons/super_credit.png" alt="SC" className="h-8 w-auto object-contain" />
                                </div>
                            </div>
                        </div>

                        {/* Content: Upgrades Grid */}
                        <div className="flex-1 w-full overflow-y-auto min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
                            {/* Ammo Upgrade Card */}
                            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden group hover:border-yellow-500/50 transition-colors">
                                <div className="absolute top-0 right-0 p-2 bg-gray-800 rounded-bl-xl border-b border-l border-gray-700 text-xs font-mono text-gray-400">
                                    Tier {ammoUpgradeLevel}/10
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center p-2">
                                        <img src="/icons/ammo_upgrade.png" alt="Ammo Upgrade" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <h4 className="text-yellow-400 font-bold uppercase tracking-wider">Ammunition</h4>
                                        <p className="text-gray-400 text-xs">Increase max ammo capacity.</p>
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    {ammoUpgradeLevel < 10 ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Next Level:</span>
                                                <span className="text-white">+{AMMO_UPGRADES[ammoUpgradeLevel].bonus} Max Ammo</span>
                                            </div>
                                            <button
                                                onClick={buyAmmoUpgrade}
                                                disabled={endlessCredits < AMMO_UPGRADES[ammoUpgradeLevel].cost}
                                                className={`w-full py-2 rounded font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all ${endlessCredits >= AMMO_UPGRADES[ammoUpgradeLevel].cost
                                                    ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg'
                                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                <span>Purchase</span>
                                                <div className="flex items-center gap-1 text-xs bg-black/20 px-2 py-0.5 rounded">
                                                    {AMMO_UPGRADES[ammoUpgradeLevel].cost} <img src="/icons/super_credit.png" alt="SC" className="h-3 w-auto" />
                                                </div>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full py-2 bg-green-900/50 border border-green-500/50 text-green-400 text-center font-bold uppercase tracking-wider rounded">
                                            Max Level
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Reinforcement Upgrade Card */}
                            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden group hover:border-yellow-500/50 transition-colors">
                                <div className="absolute top-0 right-0 p-2 bg-gray-800 rounded-bl-xl border-b border-l border-gray-700 text-xs font-mono text-gray-400">
                                    Tier {reinforcementLevel}/15
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center p-2">
                                        <img src="/icons/reinforcement_upgrade.png" alt="Reinforcements" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <h4 className="text-yellow-400 font-bold uppercase tracking-wider">Reinforcements</h4>
                                        <p className="text-gray-400 text-xs">Deploy additional ships for the fleet.</p>
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    {reinforcementLevel < 15 ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Next Level:</span>
                                                <span className="text-white text-xs">
                                                    {REINFORCEMENT_UPGRADES[reinforcementLevel].rewards.map((r, i) => (
                                                        <span key={i}>+{r.count} {r.name}{i < REINFORCEMENT_UPGRADES[reinforcementLevel].rewards.length - 1 ? ', ' : ''}</span>
                                                    ))}
                                                </span>
                                            </div>
                                            <button
                                                onClick={buyReinforcementUpgrade}
                                                disabled={endlessCredits < REINFORCEMENT_UPGRADES[reinforcementLevel].cost}
                                                className={`w-full py-2 rounded font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all ${endlessCredits >= REINFORCEMENT_UPGRADES[reinforcementLevel].cost
                                                    ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg'
                                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                <span>Purchase</span>
                                                <div className="flex items-center gap-1 text-xs bg-black/20 px-2 py-0.5 rounded">
                                                    {REINFORCEMENT_UPGRADES[reinforcementLevel].cost} <img src="/icons/super_credit.png" alt="SC" className="h-3 w-auto" />
                                                </div>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full py-2 bg-green-900/50 border border-green-500/50 text-green-400 text-center font-bold uppercase tracking-wider rounded">
                                            Max Level
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Footer / Close */}
                        <button
                            onClick={() => setShowArmory(false)}
                            className="w-full py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold uppercase tracking-widest rounded-lg transition-colors border border-gray-600 hover:border-gray-400"
                        >
                            Return to Battlefield
                        </button>
                    </div>
                </div>
            )}

            {/* Endless Game Over Overlay */}
            {mode === 'endless' && gameState === 'lost' && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center animate-in zoom-in duration-500">
                    <div className="bg-red-950/80 border-4 border-red-600 p-8 rounded-2xl shadow-[0_0_100px_rgba(220,38,38,0.5)] flex flex-col items-center gap-8 max-w-lg w-full relative overflow-hidden">
                        {/* Background Pulse */}
                        <div className="absolute inset-0 bg-red-600/10 animate-pulse pointer-events-none"></div>

                        <h2 className="text-5xl font-black text-red-500 uppercase tracking-widest text-center drop-shadow-lg scale-y-125 glow">
                            D E F E A T
                        </h2>

                        <div className="flex flex-col items-center gap-2 z-10">
                            <p className="text-gray-400 text-lg uppercase tracking-wider">The line has fallen</p>
                            <div className="w-full h-px bg-red-800 my-2"></div>

                            <div className="grid grid-cols-2 gap-x-12 gap-y-4 w-full">
                                <div className="text-right text-gray-400">Waves Survived</div>
                                <div className="text-left text-white font-mono text-xl">{currentWave - 1}</div>

                                <div className="text-right text-gray-400">Activity Score</div>
                                <div className="text-left text-yellow-400 font-mono text-xl">{endlessScore}</div>

                                <div className="text-right text-gray-400">Credit Bonus</div>
                                <div className="text-left text-blue-400 font-mono text-xl">+{endlessCredits}</div>

                                <div className="col-span-2 border-t border-gray-700 my-1"></div>

                                <div className="text-right text-yellow-500 font-bold uppercase tracking-widest text-xl">Total Score</div>
                                <div className="text-left text-white font-black font-mono text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                    {(endlessScore + endlessCredits).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 w-full z-10 mt-4">
                            <button
                                onClick={() => {
                                    setShowLeaderboard(true);
                                }}
                                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-yellow-500 border border-yellow-500/30 hover:border-yellow-500 font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2"
                            >
                                <span>🏆</span> Command Leaderboard
                            </button>
                            <button
                                onClick={() => {
                                    setCurrentWave(1);
                                    setEndlessScore(0);
                                    setEndlessCredits(0);
                                    setGameState('setup');
                                }}
                                className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-black uppercase tracking-widest text-xl rounded shadow-lg hover:shadow-yellow-500/20 transition-all hover:scale-[1.02]"
                            >
                                Reinforce (Retry)
                            </button>
                            <button
                                onClick={onMainMenu}
                                className="w-full py-3 bg-transparent border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-bold uppercase tracking-wider rounded transition-all"
                            >
                                Return to Command
                            </button>
                        </div>
                    </div>
                </div>
            )}



            <LeaderboardModal
                isOpen={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
                currentUsername={username}
                initialDifficulty="Endless Invasion"
                exclusiveMode={true}
                theme="purple"
            />

            {/* Alert Message Overlay */}
            {/* Admin Menu Button */}
            {
                username === 'admin' && mode === 'endless' && (
                    <div className="fixed top-20 right-4 z-50">
                        <button
                            onClick={() => setShowAdminMenu(prev => !prev)}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded text-xs uppercase tracking-wider shadow-lg border border-red-400"
                        >
                            Admin Tools
                        </button>
                    </div>
                )
            }

            {/* Admin Menu Modal */}
            {
                showAdminMenu && username === 'admin' && (
                    <div className="fixed inset-0 z-70 flex items-center justify-center pointer-events-none">
                        <div className="bg-gray-900/95 border border-red-500 p-4 rounded-lg shadow-2xl pointer-events-auto flex flex-col gap-4 w-64">
                            <h3 className="text-red-500 font-bold uppercase text-center border-b border-red-500/30 pb-2">Admin Control</h3>

                            {/* Wave Jump */}
                            <div className="flex flex-col gap-2">
                                <label className="text-gray-400 text-xs uppercase">Jump to Wave</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={adminWaveInput}
                                        onChange={(e) => setAdminWaveInput(e.target.value)}
                                        className="bg-gray-800 text-white p-1 rounded border border-gray-700 w-full text-sm"
                                        placeholder="#"
                                    />
                                    <button
                                        onClick={() => {
                                            const wave = parseInt(adminWaveInput);
                                            if (!isNaN(wave) && wave > 0) {
                                                setCurrentWave(wave);
                                                setGameState('setup');
                                                setShowAdminMenu(false);
                                                setAdminWaveInput('');
                                            }
                                        }}
                                        className="bg-red-600 hover:bg-red-500 text-white px-2 rounded font-bold text-xs"
                                    >
                                        GO
                                    </button>
                                </div>
                            </div>

                            {/* Credits */}
                            <div className="flex flex-col gap-2">
                                <label className="text-gray-400 text-xs uppercase">Grant Credits</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[50, 100, 200, 500].map(amount => (
                                        <button
                                            key={amount}
                                            onClick={() => setEndlessCredits(prev => prev + amount)}
                                            className="bg-blue-900/50 hover:bg-blue-800 border border-blue-500/30 text-blue-200 text-xs py-1 rounded"
                                        >
                                            +{amount}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setShowAdminMenu(false)}
                                className="text-gray-500 text-xs hover:text-white mt-2"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Consumables Datapad Trigger */}
            {
                mode === 'endless' && (
                    <>
                        <button
                            onClick={() => setShowDatapad(true)}
                            className="fixed bottom-6 left-6 z-40 group"
                        >
                            <div className="relative w-16 h-12 bg-gray-800 rounded-lg border-2 border-gray-600 shadow-xl group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-300 transform group-hover:-translate-y-1">
                                {/* Screen Glow */}
                                <div className="absolute inset-1 bg-cyan-900/50 rounded overflow-hidden">
                                    <div className="bg-cyan-900/40 p-1 mb-2 rounded border-b border-cyan-500/30 bg-[linear-gradient(90deg,transparent_0%,rgba(6,182,212,0.1)_50%,transparent_100%)] bg-size-[100%_4px] bg-no-repeat bg-bottom"></div>
                                </div>
                                {/* Icon */}
                                <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
                                    <span className="text-2xl">📱</span>
                                </div>
                            </div>
                        </button>

                        {/* Fixed Ammunition Bar (Bottom Right) */}
                        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-1 w-full max-w-[250px] animate-in slide-in-from-bottom-8 duration-500 pointer-events-none">
                            <div className="flex justify-between w-full px-2 text-xs text-gray-400 font-mono uppercase tracking-wider backdrop-blur-sm bg-black/40 rounded-t p-1">
                                <span>Ammunition</span>
                                <span className={ammo === 0 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}>{isReloading ? 'RELOADING' : `${ammo}/${maxAmmo}`}</span>
                            </div>
                            <div className="flex gap-1 bg-gray-900/80 p-2 rounded-lg border border-gray-600 w-full justify-end shadow-xl backdrop-blur-md">
                                {[...Array(maxAmmo)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-4 w-full rounded-sm transition-all duration-300 ${i < ammo
                                            ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                                            : 'bg-gray-800 border border-gray-700 opacity-50'
                                            } ${isReloading ? 'animate-pulse bg-red-900/50' : ''}`}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </>
                )
            }

            {/* Holographic Consumables Modal */}
            <AnimatePresence>
                {showDatapad && (
                    <div className="fixed inset-0 z-60 flex items-end justify-start p-6 pointer-events-none">
                        {/* Click backdrop to close */}
                        <div
                            className="absolute inset-0 bg-black/20 pointer-events-auto"
                            onClick={() => setShowDatapad(false)}
                        ></div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 50, rotateX: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 50, rotateX: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="pointer-events-auto relative w-full max-w-sm bg-cyan-950/80 backdrop-blur-md border-2 border-cyan-400 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.3)] origin-bottom-left"
                            style={{
                                perspective: '1000px',
                            }}
                        >
                            {/* Hologram Scanlines Overlay */}
                            <div className="absolute inset-0 pointer-events-none opacity-30 z-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(6,182,212,0.4)_3px,rgba(6,182,212,0.4)_3px)]"></div>

                            {/* Header */}
                            <div className="relative z-10 p-4 border-b border-cyan-500/50 flex justify-between items-center bg-cyan-900/50">
                                <h3 className="text-cyan-300 font-mono font-bold uppercase tracking-widest text-lg flex items-center gap-2">
                                    <span className="animate-pulse">●</span> Requisitions
                                </h3>
                                <div className="text-xs font-mono text-cyan-500">
                                    CR: {endlessCredits}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="relative z-10 p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
                                {CONSUMABLES.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group flex items-center gap-3 p-3 bg-cyan-900/30 border border-cyan-600/30 rounded hover:bg-cyan-800/50 hover:border-cyan-400 transition-all cursor-pointer"
                                    >
                                        <div className="w-10 h-10 bg-cyan-950 rounded flex items-center justify-center text-xl shadow-[inset_0_0_10px_rgba(6,182,212,0.3)]">
                                            {item.icon.includes('/') ? (
                                                <img src={item.icon} alt={item.name} className="w-full h-full object-contain p-1" />
                                            ) : (
                                                item.icon
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <h4 className="text-cyan-200 font-bold text-sm truncate">{item.name}</h4>
                                                <span className="text-yellow-400 text-xs font-mono">{item.cost} SC</span>
                                            </div>
                                            <p className="text-cyan-500/80 text-[10px] leading-tight">{item.desc}</p>
                                        </div>
                                        <button
                                            onClick={() => buyConsumable(item)}
                                            disabled={endlessCredits < item.cost}
                                            className={`px-3 py-1 text-xs font-bold uppercase rounded border transition-all ${endlessCredits >= item.cost
                                                ? 'bg-cyan-600/20 border-cyan-400 text-cyan-300 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_10px_rgba(34,211,238,0.6)]'
                                                : 'bg-gray-800/50 border-gray-600 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            Buy
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="relative z-10 p-2 bg-cyan-900/50 border-t border-cyan-500/50 text-[10px] text-cyan-600 font-mono text-center uppercase">
                                Super Earth High Command // Log 42-B
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Ship Context Menu */}
            {
                contextMenu && (
                    <div
                        className="fixed z-100 bg-gray-900 border border-yellow-500 rounded-lg shadow-2xl flex flex-col min-w-[200px] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-4 py-2 border-b border-gray-700 bg-gray-800/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            {contextMenu.ship.name}
                        </div>
                        <button
                            onClick={() => handleMoveToReinforcements(contextMenu.ship)}
                            className="px-4 py-3 text-left text-sm text-gray-200 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-3 font-semibold"
                        >
                            <span>↩️</span> Return to Fleet
                        </button>
                        <button
                            onClick={() => handleSellShip(contextMenu.ship)}
                            className="px-4 py-3 text-left text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors flex items-center gap-3 border-t border-gray-800 font-semibold group"
                        >
                            <span>💰</span> Sell for Scrap
                            <span className="ml-auto text-yellow-500 font-mono text-xs bg-yellow-500/10 px-2 py-0.5 rounded group-hover:bg-yellow-500/20">
                                +{
                                    (contextMenu.ship.size.width === 1 && contextMenu.ship.size.height === 1) ? 10 :
                                        (contextMenu.ship.size.width === 2 && contextMenu.ship.size.height === 2) ? 50 : 200
                                } SC
                            </span>
                        </button>
                    </div>
                )
            }

            {/* Alert Message Overlay */}
            <AnimatePresence>
                {alertMessage && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-60 pointer-events-none w-full max-w-[500px] aspect-4/3 flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="bg-red-600/50 text-white px-8 py-4 rounded-lg border-2 border-red-500 shadow-[0_0_50px_rgba(220,38,38,0.4)] backdrop-blur-sm"
                        >
                            <h2 className="text-3xl font-bold uppercase tracking-widest text-center whitespace-nowrap">
                                {alertMessage}
                            </h2>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};


export default BattleshipGame;
