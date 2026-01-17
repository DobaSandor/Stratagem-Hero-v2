export interface ShipConfig {
    name: string;
    count: number;
}

export interface DialogueLine {
    speaker: string;
    text: string;
    icon: string;
}

export interface MissionConfig {
    id: number;
    name: string;
    description: string;
    gridSize: number;
    ships: ShipConfig[];
    enemyShips: ShipConfig[];
    stratagems?: { name: string; count: number; icon: string; cooldown?: number }[];
    enemyStratagems?: { name: string; count: number }[];
    enemyAi: 'passive' | 'aggressive' | 'smart';
    aiSmartness: number; // 0-100 percentage of making the optimal move
    allowStratagemReload?: boolean;
    dialogue?: DialogueLine[];
    afterMissionDialogue?: DialogueLine[];
}

export const campaignMissions: MissionConfig[] = [
    {
        id: 1,
        name: "The First ship of many",
        description: "An unknown Saucer type Entity appeared on the Horizon. It's unknown origin and purpose is unknown, but it's clear that it's not friendly.",
        gridSize: 5,
        ships: [
            { name: 'Eagle-1', count: 2 },
            { name: 'Pelican-1', count: 1 },
        ],
        enemyShips: [

            { name: 'Dropship', count: 1 },
        ],
        stratagems: [

        ],
        enemyAi: 'passive',
        aiSmartness: 10,
        dialogue: [
            {
                speaker: "Democracy Officer",
                text: "Helldiver, we have detected an unknown vessel on the horizon. It does not match any known Super Earth configurations. But it's definitely not friendly.",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Democracy Officer",
                text: "I know this is not neccessarily a job for a Helldiver, but we need to stop it. So buckle up soldier.",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Helldiver",
                text: "Understood. Preparing to engage. For Super Earth!",
                icon: `${import.meta.env.BASE_URL}helldiver_portrait.png`
            },

        ]
    },





    {
        id: 2,
        name: "Skirmish at Veld",
        description: "Small scale engagement. Tight maneuvering required.",
        gridSize: 5,
        ships: [
            { name: 'Eagle-1', count: 2 },
            { name: 'Pelican-1', count: 1 },
        ],
        enemyShips: [
            { name: 'Stingray', count: 2 },
            { name: 'Dropship', count: 1 },
        ],
        stratagems: [

        ],
        enemyAi: 'passive',
        aiSmartness: 20,
        dialogue: [
            {
                speaker: "Democracy Officer",
                text: "We detected a similar ship like the last one. Prepare for a skirmish. Our brothers have enough to worry about down there at Veld",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Helldiver",
                text: "Understood sir. We're ready for anything.",
                icon: `${import.meta.env.BASE_URL}helldiver_portrait.png`
            },
            {
                speaker: "Democracy Officer",
                text: "Exercise caution. A group of smaller vessels were reported to be accompanying the ship. I'll contact High Command for reinforcements. Because now it is clear that it's not a normal monday stroll in the park.",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            }
        ]
    },






    {
        id: 3,
        name: "Defense of Angel's Venture",
        description: "Standard engagement protocols. We got permission for using defensive stratagems. We can't risk losing any ships.",
        gridSize: 6,
        ships: [
            { name: 'Eagle-1', count: 2 },
            { name: 'Pelican-1', count: 1 },

        ],
        enemyShips: [
            { name: 'Stingray', count: 3 },
            { name: 'Dropship', count: 2 },

        ],
        stratagems: [

            { name: 'Emergency Shield', count: 2, icon: `${import.meta.env.BASE_URL}icons/Emergency Shield.png` }
        ],
        enemyAi: 'passive',
        aiSmartness: 30,
        dialogue: [
            {
                speaker: "Democracy Officer",
                text: "Helldiver, High Command has given us permission to use defensive stratagems. And the reinforcements are on their way.",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Helldiver",
                text: "Amazing news sir. We'll hold the line until the reinforcements arrive.",
                icon: `${import.meta.env.BASE_URL}helldiver_portrait.png`
            },

        ]
    },






    {
        id: 4,
        name: "Assault on Calypso",
        description: "The planet requires heavy firepower. High Command allowed the use of orbital stratagems. Godspeed.",
        gridSize: 6,
        ships: [
            { name: 'Eagle-1', count: 3 },
            { name: 'Pelican-1', count: 2 },

        ],
        enemyShips: [
            { name: 'Stingray', count: 3 },
            { name: 'Dropship', count: 2 },

        ],
        stratagems: [
            { name: 'Orbital Laser', count: 1, icon: `${import.meta.env.BASE_URL}stratagems/orbital-laser.png` },
            { name: 'Emergency Shield', count: 2, icon: `${import.meta.env.BASE_URL}icons/Emergency Shield.png` }
        ],
        enemyAi: 'aggressive',
        aiSmartness: 40,
        allowStratagemReload: true,
        dialogue: [
            {
                speaker: "Democracy Officer",
                text: "The first badge of reinforcements has arrived, and we are allowed to use orbital stratagems now. They launched an all out attack against Calypso, There are far more of them than we expected.",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Democracy Officer",
                text: "The Council also confirmed the alien threat as our long lost enemy. The Squ'ith or more known as the Illuminates. They seem to have gathered up some strength after their loss in the first Galactic War.",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Helldiver",
                text: "I've learned about them from my great-grandfather, He said they were once a powerful race, but they were destroyed by their own kind.",
                icon: `${import.meta.env.BASE_URL}helldiver_portrait.png`
            },
            {
                speaker: "Democracy Officer",
                text: "They thought they were invincible, but they underestimated us. We've shown them what true power is, And we'll show them now again!",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Helldiver",
                text: "For the glory of democracy!",
                icon: `${import.meta.env.BASE_URL}helldiver_portrait.png`
            },

        ]
    },





    {
        id: 5,
        name: "The brink of war",
        description: "Leadership confirmed the alien threat. Altough they seem to be remnants of a war long ago, the Illuminates are not to be underestimated.",
        gridSize: 8,
        ships: [
            { name: 'Eagle-1', count: 4 },
            { name: 'Pelican-1', count: 3 },

        ],
        enemyShips: [
            { name: 'Stingray', count: 3 },
            { name: 'Dropship', count: 3 },

        ],
        stratagems: [
            { name: 'Orbital Laser', count: 2, icon: `${import.meta.env.BASE_URL}stratagems/orbital-laser.png` },

            { name: 'Emergency Shield', count: 4, icon: `${import.meta.env.BASE_URL}icons/Emergency Shield.png` }
        ],
        enemyStratagems: [
            { name: 'Fusion Cannon', count: 2 },
        ],
        enemyAi: 'aggressive',
        aiSmartness: 50,
        allowStratagemReload: true,
        dialogue: [
            {
                speaker: "Democracy Officer",
                text: "The siege of Calypso is still ongoing, Families are being abducted, and turned into husks we've begun to call, 'Voteless'. Also a group of Truth Enforcers have been caught in all this and are willing to help us.",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Truth Enforcer",
                text: "Greetings Helldiver, it seems like you are in need of some assistance, We've overclocked our reactors to provide you with some extra Shields, trust me you'll definietly need them.",
                icon: `${import.meta.env.BASE_URL}Truth Enforcer.png`
            },
            {
                speaker: "Truth Enforcer",
                text: "The Ministry of Defense has intel that the Illuminates begun to use offensive stratagems, that is the main reason why we are here. We must hold the line Helldiver.",
                icon: `${import.meta.env.BASE_URL}Truth Enforcer.png`
            },
            {
                speaker: "Helldiver",
                text: "Much appreciated Sir. We'll surely be the victors with your help. For Super Earth!",
                icon: `${import.meta.env.BASE_URL}helldiver_portrait.png`
            },

        ]
    },





    {
        id: 6,
        name: "Liberty's Call",
        description: "Super Destroyers are on the horizon. The enemy seems to be deploying stratagtems, be prepared",
        gridSize: 8,
        ships: [
            { name: 'Eagle-1', count: 5 },
            { name: 'Pelican-1', count: 3 },
            { name: 'Super Destroyer', count: 1 },
        ],
        enemyShips: [
            { name: 'Stingray', count: 5 },
            { name: 'Dropship', count: 3 },

        ],
        stratagems: [
            { name: 'Orbital Laser', count: 3, icon: `${import.meta.env.BASE_URL}stratagems/orbital-laser.png` },

            { name: 'Emergency Shield', count: 4, icon: `${import.meta.env.BASE_URL}icons/Emergency Shield.png` }
        ],
        enemyAi: 'aggressive',
        aiSmartness: 60,
        allowStratagemReload: true,
        enemyStratagems: [
            { name: 'Fusion Cannon', count: 3 },
        ],
        dialogue: [
            {
                speaker: "Truth Enforcer",
                text: "It seems like they are focusing a lot on the collapsed planet of Meridia. I have no idea what they want with a Black Hole but we better stop it before it happens!",
                icon: `${import.meta.env.BASE_URL}Truth Enforcer.png`
            },
            {
                speaker: "Truth Enforcer",
                text: "Also, Super Earth is sending more reinforcements. A Super Destroyer is on the horizon.",
                icon: `${import.meta.env.BASE_URL}Truth Enforcer.png`
            },
            {
                speaker: "Democracy Officer",
                text: "You've proven yourself as an excellent Admiral, Helldiver. But the Medal of honor and ceremony has to wait, because this is far from over...",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Helldiver",
                text: "I'll do anything it takes to stop them, no matter the cost.",
                icon: `${import.meta.env.BASE_URL}helldiver_portrait.png`
            },
            {
                speaker: "Democracy Officer",
                text: "Good luck, Helldiver. We'll be counting on you.",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },

        ]
    },






    {
        id: 7,
        name: "Stratagems Jammed",
        description: "Illuminite are jamming our stratagems. We must hold the line. Extra Defensive stratagems are available. A Leviathan was spotted, expect extra offensive",
        gridSize: 10,
        ships: [
            { name: 'Eagle-1', count: 5 },
            { name: 'Pelican-1', count: 4 },
            { name: 'Super Destroyer', count: 2 },
        ],
        enemyShips: [
            { name: 'Stingray', count: 5 },
            { name: 'Dropship', count: 4 },
            { name: 'Leviathan', count: 1 },
        ],
        stratagems: [
            { name: 'Orbital Laser', count: 6, icon: `${import.meta.env.BASE_URL}stratagems/orbital-laser.png` },

            { name: 'Emergency Shield', count: 4, icon: `${import.meta.env.BASE_URL}icons/Emergency Shield.png` }
        ],
        enemyAi: 'smart',
        aiSmartness: 75,
        enemyStratagems: [
            { name: 'Fusion Cannon', count: 5 },
        ],

        dialogue: [
            {
                speaker: "Truth Enforcer",
                text: "Something's Blocking our stratagem resources! Exercise caution Helldiver, We've managed to pull some extra energy for more orbital lasers, from our docking bay. So aim precisely.",
                icon: `${import.meta.env.BASE_URL}Truth Enforcer.png`
            },
            {
                speaker: "Helldiver",
                text: "What could be blocking our stratagem resources? ",
                icon: `${import.meta.env.BASE_URL}helldiver_portrait.png`
            },
            {
                speaker: "Truth Enforcer",
                text: "The Ministry believes that it's just a normal jamming signal and they'll have it resolved in minutes, but the illuminite is definietly protecting something with it. We better be prepared.",

                icon: `${import.meta.env.BASE_URL}Truth Enforcer.png`
            },
            {
                speaker: "Helldiver",
                text: "Thank you Sir. I'll make sure they don't get through our blockade.",
                icon: `${import.meta.env.BASE_URL}helldiver_portrait.png`
            },


        ]
    },






    {
        id: 8,
        name: "Meridian Conflict",
        description: "The enemy is at the gates. Hold the line. They seem to be using a lot of offensive stratagems. For some reason they do not want to move from Meridia's vicinity.",
        gridSize: 10,
        ships: [
            { name: 'Eagle-1', count: 6 },
            { name: 'Pelican-1', count: 4 },
            { name: 'Super Destroyer', count: 3 },
        ],
        enemyShips: [
            { name: 'Stingray', count: 6 },
            { name: 'Dropship', count: 4 },
            { name: 'Leviathan', count: 3 },
        ],
        stratagems: [
            { name: 'Orbital Laser', count: 3, icon: `${import.meta.env.BASE_URL}stratagems/orbital-laser.png` },

            { name: 'Emergency Shield', count: 4, icon: `${import.meta.env.BASE_URL}icons/Emergency Shield.png` }
        ], enemyStratagems: [
            { name: 'Fusion Cannon', count: 4 },
            { name: 'Artificial Black Hole', count: 1 },
        ],
        dialogue: [
            {
                speaker: "Democracy Officer",
                text: "Systems are back online, as well as new reinforcements have arrived near Meridia, The Illuminates are not backing down at all.",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Helldiver",
                text: "I wonder what they're planning. But whatever it is, we'll have to stop it, otherwise this could be a Galactical disaster.",
                icon: `${import.meta.env.BASE_URL}helldiver_portrait.png`
            },
            {
                speaker: "Truth Enforcer",
                text: "The Ministry comfirmed the ship we encountered earlier was a Leviathan, it's strange EMP signal was blocking our stratagem resources, but our teams have already managed to find a way to bypass it.",
                icon: `${import.meta.env.BASE_URL}Truth Enforcer.png`
            },
            {
                speaker: "Truth Enforcer",
                text: "The Squids are also preparing something big, some of their ships' Cannons were seen glowing of dark purple light, I believe it is definietly linked to Meridia.",
                icon: `${import.meta.env.BASE_URL}Truth Enforcer.png`
            },
            {
                speaker: "Democracy Officer",
                text: "They shall perish, no matter their weapon or equipment. We'll stop them.",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Helldiver",
                text: "We'll send them back to dark space! I'll make sure of it. For Democracy!",
                icon: `${import.meta.env.BASE_URL}helldiver_portrait.png`
            },




        ],
        enemyAi: 'smart',
        aiSmartness: 85,
        allowStratagemReload: true
    },







    {
        id: 9,
        name: "Operation Swift Disassembly",
        description: "Surgical strikes against key targets. Leviathans are the main targets. The Ministry of Defense allowed the use of the Orbital Hellbomb stratagem. Godspeed.",
        gridSize: 10,
        ships: [
            { name: 'Eagle-1', count: 6 },
            { name: 'Pelican-1', count: 5 },
            { name: 'Super Destroyer', count: 3 },
        ],
        enemyShips: [
            { name: 'Stingray', count: 6 },
            { name: 'Dropship', count: 5 },
            { name: 'Leviathan', count: 3 },
        ],
        stratagems: [
            { name: 'Orbital Laser', count: 4, icon: `${import.meta.env.BASE_URL}stratagems/orbital-laser.png` },
            { name: 'Orbital Hellbomb', count: 1, icon: `${import.meta.env.BASE_URL}icons/Orbital Hellbomb.png` },
            { name: 'Emergency Shield', count: 6, icon: `${import.meta.env.BASE_URL}icons/Emergency Shield.png` }
        ], dialogue: [
            {
                speaker: "Democracy Officer",
                text: "They breached our blockade! They are all around Meridia!",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Truth Enforcer",
                text: "They are using small Black Holes against our ships. They are ripping us apart!",
                icon: `${import.meta.env.BASE_URL}Truth Enforcer.png`
            },
            {
                speaker: "Helldiver",
                text: "We'll need to alert the Council and the Ministry of Defense! We need more resources!",
                icon: `${import.meta.env.BASE_URL}helldiver_portrait.png`
            },
            {
                speaker: "Democracy Officer",
                text: "The Ministry has already been alerted, And we just got docked by a Courier ship which brought us a new stratagem",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Democracy Officer",
                text: "You know what to do, Helldiver. Godspeed. May Liberty save us all.",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },


        ],

        enemyAi: 'smart',
        aiSmartness: 95,
        allowStratagemReload: true,
        enemyStratagems: [
            { name: 'Fusion Cannon', count: 7 },
            { name: 'Artificial Black Hole', count: 2 }
        ]

    },







    {
        id: 10,
        name: "The Meridian Conflict",
        description: "It feels too calm to be true. Something fast is moving.Prepare for a fast and furious battle.",
        gridSize: 12,
        ships: [
            { name: 'Eagle-1', count: 8 },
            { name: 'Pelican-1', count: 6 },
            { name: 'Super Destroyer', count: 4 },
        ],
        enemyShips: [
            { name: 'Stingray', count: 0 },
            { name: 'Dropship', count: 0 },
            { name: 'Leviathan', count: 0 },
            { name: 'Harbinger Ship', count: 1 },
        ],
        stratagems: [
            { name: 'Orbital Laser', count: 8, icon: `${import.meta.env.BASE_URL}stratagems/orbital-laser.png` },
            { name: 'Orbital Hellbomb', count: 6, icon: `${import.meta.env.BASE_URL}icons/Orbital Hellbomb.png` },
            { name: 'Emergency Shield', count: 10, icon: `${import.meta.env.BASE_URL}icons/Emergency Shield.png` }
        ],
        enemyStratagems: [
            { name: 'Fusion Cannon', count: 12 },
            { name: 'Artificial Black Hole', count: 5 }
        ],
        dialogue: [
            {
                speaker: "Democracy Officer",
                text: "The enemy overwhelmed us. at Meridia but now they suddenly seem to be retreating somewhere.",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Helldiver",
                text: "I don't think I like this....",
                icon: `${import.meta.env.BASE_URL}helldiver_portrait.png`
            },
            {
                speaker: "Truth Enforcer",
                text: "It's too quiet... Something's definietly not right! I'll order the fleet to generate more shields!",
                icon: `${import.meta.env.BASE_URL}Truth Enforcer.png`
            },
            {
                speaker: "Democracy Officer",
                text: "Helldiver, Whatever happens here, we'll have to alert Super Earth afterwards and the Council. We'll need to regroup.",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },

            {
                speaker: "Helldiver",
                text: "Agreed sir. It is sure now that we cannot win this fight alone, Super Earth needs to send all we can spare. Otherwise we'll have a Galaxy wide disaster on our hands.",
                icon: `${import.meta.env.BASE_URL}helldiver_portrait.png`
            },
            {
                speaker: "Truth Enforcer",
                text: "The fleets are ready!",
                icon: `${import.meta.env.BASE_URL}Truth Enforcer.png`
            },
            {
                speaker: "Democracy Officer",
                text: "Look! Meridia is pulsating! It's getting bigger and bigger! ",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Truth Enforcer",
                text: "Something's coming! Prepare everyone, I have a bad feeling about this.",
                icon: `${import.meta.env.BASE_URL}Truth Enforcer.png`
            },



        ],
        enemyAi: 'smart',
        aiSmartness: 100,
        allowStratagemReload: true,
        afterMissionDialogue: [
            {
                speaker: "Democracy Officer",
                text: "The Harbinger has been destroyed! But the Illuminate fleet is regrouping!",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            },
            {
                speaker: "Helldiver",
                text: "Initiating an FTL jump to Super Earth. We'll need to regroup there.",
                icon: `${import.meta.env.BASE_URL}helldiver_portrait.png`
            },
            {
                speaker: "Truth Enforcer",
                text: "An impressive display of managed democracy. The Ministry will be pleased. Altough we'll have a lot to do now. But apart from all that I am pleased to have fought by your side Helldiver.",
                icon: `${import.meta.env.BASE_URL}Truth Enforcer.png`
            },
            {
                speaker: "Democracy Officer",
                text: "Return to base, Helldiver. It's time for that ceremony. And a few drinks maybe.",
                icon: `${import.meta.env.BASE_URL}Democracy Officer.png`
            }
        ]
    }







];
