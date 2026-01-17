export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Stratagem {
    name: string;
    sequence: Direction[];
    icon: string;
}

export const STRATAGEMS: Stratagem[] = [
    { name: 'Reinforce', sequence: ['UP', 'DOWN', 'RIGHT', 'LEFT', 'UP'], icon: `${import.meta.env.BASE_URL}icons/Reinforce.png` },
    { name: 'Resupply', sequence: ['DOWN', 'DOWN', 'UP', 'RIGHT'], icon: `${import.meta.env.BASE_URL}icons/Resupply.png` },
    { name: 'Eagle Airstrike', sequence: ['UP', 'RIGHT', 'DOWN', 'RIGHT'], icon: '/icons/Eagle Airstrike.png' },
    { name: 'Hellbomb', sequence: ['DOWN', 'UP', 'LEFT', 'DOWN', 'UP', 'RIGHT', 'DOWN', 'UP'], icon: `${import.meta.env.BASE_URL}icons/Hellbomb.png` },
    { name: 'SOS Beacon', sequence: ['UP', 'DOWN', 'RIGHT', 'UP'], icon: '/icons/SOS Beacon.png' },
    { name: 'Railgun', sequence: ['DOWN', 'RIGHT', 'DOWN', 'UP', 'LEFT', 'RIGHT'], icon: `${import.meta.env.BASE_URL}icons/Railgun.png` },
    { name: '500kg Bomb', sequence: ['UP', 'RIGHT', 'DOWN', 'DOWN', 'DOWN'], icon: '/icons/500Kg Bomb.png' },
    { name: 'Orbital Napalm Barrage', sequence: ['RIGHT', 'RIGHT', 'DOWN', 'LEFT', 'RIGHT', 'UP'], icon: '/icons/Orbital napalm Barrage.png' },
    { name: 'Orbital Gatling Barrage', sequence: ['RIGHT', 'DOWN', 'LEFT', 'UP', 'UP', 'UP'], icon: '/icons/Orbital Gatling barrage.png' },
    { name: 'Orbital Airburst Strike', sequence: ['RIGHT', 'RIGHT', 'RIGHT'], icon: '/icons/Orbital Airburst Strike.png' },
    { name: 'EXO-45 Patriot Exosuit', sequence: ['LEFT', 'DOWN', 'RIGHT', 'UP', 'LEFT', 'DOWN', 'DOWN'], icon: '/icons/EXO-45 Patriot Exosuit.png' },
    { name: 'EXO-49 Emancipator Exosuit', sequence: ['LEFT', 'DOWN', 'RIGHT', 'UP', 'LEFT', 'DOWN', 'DOWN'], icon: '/icons/EXO-45 Emancipator Exosuit.png' },

    { name: 'Gatling Sentry', sequence: ['DOWN', 'UP', 'RIGHT', 'LEFT'], icon: '/icons/Gatling Sentry.png' },
    { name: 'Autocannon Sentry', sequence: ['DOWN', 'UP', 'RIGHT', 'UP', 'LEFT', 'UP'], icon: '/icons/Autocannon Sentry.png' },
    { name: 'EMS Mortar Sentry', sequence: ['DOWN', 'UP', 'RIGHT', 'DOWN', 'RIGHT'], icon: '/icons/EMS Sentry.png' },
    { name: 'Orbital 120MM Barrage', sequence: ['RIGHT', 'RIGHT', 'DOWN', 'LEFT', 'RIGHT', 'DOWN'], icon: `${import.meta.env.BASE_URL}icons/120MM.png` },
    { name: 'Autocannon', sequence: ['DOWN', 'LEFT', 'DOWN', 'UP', 'UP', 'RIGHT'], icon: `${import.meta.env.BASE_URL}icons/Autocannon.png` },
    { name: 'M-102 Fast Recon vehicle', sequence: ['LEFT', 'DOWN', 'RIGHT', 'UP', 'LEFT', 'DOWN', 'DOWN'], icon: `${import.meta.env.BASE_URL}icons/Car.png` },
    { name: 'Orbital Gas Strike', sequence: ['RIGHT', 'RIGHT', 'DOWN', 'RIGHT'], icon: '/icons/Gas Strike.png' },
    { name: 'Machine Gun Sentry', sequence: ['DOWN', 'UP', 'RIGHT', 'RIGHT', 'UP'], icon: `${import.meta.env.BASE_URL}icons/Gatling.png` },
    { name: 'LIFT-850 Jump Pack', sequence: ['DOWN', 'UP', 'UP', 'DOWN', 'UP'], icon: `${import.meta.env.BASE_URL}icons/Jump.png` },
    { name: 'ARC-3 Tesla Tower', sequence: ['DOWN', 'UP', 'RIGHT', 'UP', 'LEFT', 'RIGHT'], icon: '/icons/Tesla Tower.png' },

    // New Stratagems
    { name: 'Super Earth Flag', sequence: ['DOWN', 'UP', 'DOWN', 'UP'], icon: `${import.meta.env.BASE_URL}icons/Superflag.png` },
    { name: 'GR-8 Recoilless Rifle', sequence: ['DOWN', 'LEFT', 'RIGHT', 'RIGHT', 'LEFT'], icon: `${import.meta.env.BASE_URL}icons/Recoil.png` },
    { name: 'GL-21 Grenade Launcher', sequence: ['DOWN', 'LEFT', 'UP', 'LEFT', 'DOWN'], icon: `${import.meta.env.BASE_URL}icons/Grenade.png` },
    { name: 'Eagle Smoke Strike', sequence: ['UP', 'RIGHT', 'UP', 'DOWN'], icon: '/icons/Eagle Smoke.png' },
    { name: 'Orbital Laser', sequence: ['RIGHT', 'DOWN', 'UP', 'RIGHT', 'DOWN'], icon: '/icons/Orbital Laser.png' },
    { name: 'Orbital 380MM HE Barrage', sequence: ['RIGHT', 'DOWN', 'UP', 'UP', 'LEFT', 'DOWN', 'DOWN'], icon: `${import.meta.env.BASE_URL}icons/380MM.png` },
    { name: 'Orbital Railcannon Strike', sequence: ['RIGHT', 'UP', 'DOWN', 'DOWN', 'RIGHT'], icon: '/icons/Orbital Railcannon Strike.png' },
    { name: 'Eagle 110MM Rocket Pods', sequence: ['UP', 'RIGHT', 'UP', 'LEFT'], icon: '/icons/110MM Pod.png' },

    // Requested Additions
    { name: 'TX-41 Sterilizer', sequence: ['DOWN', 'LEFT', 'UP', 'DOWN', 'LEFT'], icon: '/icons/TX-41 Sterilizer.png' },
    { name: 'MG-43 Machine Gun', sequence: ['DOWN', 'LEFT', 'DOWN', 'UP', 'RIGHT'], icon: '/icons/MG-43 Machine Gun.png' },
    { name: 'M-105 Stalwart', sequence: ['DOWN', 'LEFT', 'DOWN', 'UP', 'UP', 'LEFT'], icon: '/icons/M-105 Stalwart.png' },
    { name: 'Eagle Napalm Airstrike', sequence: ['UP', 'RIGHT', 'DOWN', 'UP'], icon: '/icons/Eagle Napalm Airstrike.png' },
    { name: 'AX/AR-23 "Guard Dog"', sequence: ['DOWN', 'UP', 'LEFT', 'UP', 'RIGHT', 'DOWN'], icon: '/icons/AX AR-23 Guard Dog.png' },
    { name: 'SSSD Delivery', sequence: ['DOWN', 'DOWN', 'DOWN', 'UP', 'UP'], icon: '/icons/SSSD Delivery.png' },
    { name: 'Upload Data', sequence: ['LEFT', 'RIGHT', 'UP', 'UP', 'UP'], icon: '/icons/SSSD Delivery.png' },
    { name: 'Eagle Rearm', sequence: ['UP', 'UP', 'LEFT', 'UP', 'RIGHT'], icon: '/icons/Eagle Rearm.png' },
    { name: 'SEAF Artillery', sequence: ['RIGHT', 'UP', 'UP', 'DOWN'], icon: '/icons/SEAF Artillery.png' },
    { name: 'Hive Breaker Drill', sequence: ['LEFT', 'UP', 'DOWN', 'RIGHT', 'DOWN', 'DOWN'], icon: '/icons/Hive Breaker Drill.png' },
    { name: 'Seismic Probe', sequence: ['UP', 'UP', 'LEFT', 'RIGHT', 'DOWN', 'DOWN'], icon: '/icons/Seismic Probe.png' },
    { name: 'MD-I4 Incendiary Mines', sequence: ['DOWN', 'LEFT', 'LEFT', 'DOWN'], icon: '/icons/MD-I4 Incendiary Mines.png' },
    { name: 'MD-17 Anti-Tank Mines', sequence: ['DOWN', 'LEFT', 'UP'], icon: '/icons/MD-17 Anti-Tank Mines.png' },
    { name: 'MD-8 Gas Mines', sequence: ['DOWN', 'LEFT', 'RIGHT'], icon: '/icons/MD-8 Gas Mines.png' },
    { name: 'MD-6 Anti-Personnel Minefield', sequence: ['DOWN', 'LEFT', 'UP', 'RIGHT'], icon: '/icons/MD-6 Anti-Personnel Minefield.png' },
    { name: 'E/GL-21 Grenadier Battlement', sequence: ['DOWN', 'RIGHT', 'DOWN', 'LEFT', 'RIGHT'], icon: '/icons/E GL-21 Grenadier Battlement.png' },
    { name: 'E/FLAM-40 Flame Sentry', sequence: ['DOWN', 'UP', 'RIGHT', 'DOWN', 'UP'], icon: '/icons/E FLAM-40 Flame Sentry.png' },
    { name: 'A/MLS-4X Rocket Sentry', sequence: ['DOWN', 'UP', 'RIGHT', 'LEFT'], icon: '/icons/A MLS-4X Rocket Sentry.png' },
    { name: 'E/MG-101 HMG Emplacement', sequence: ['DOWN', 'UP', 'LEFT', 'RIGHT', 'RIGHT', 'LEFT'], icon: '/icons/E MG-101 HMG Emplacement.png' },
    //{ name: 'Emergency Shield', sequence: ['DOWN', 'DOWN', 'LEFT', 'RIGHT'], icon: '/icons/Emergency Shield.png' },
    //{ name: 'Orbital Hellbomb', sequence: ['DOWN', 'UP', 'LEFT', 'DOWN', 'UP', 'RIGHT', 'DOWN', 'UP'], icon: '/icons/Orbital Hellbomb.png' },
];
