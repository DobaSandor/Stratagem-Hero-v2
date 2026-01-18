// Sound utility using official audio files

const playSound = (path: string, volume: number = 1.0) => {
    try {
        const audio = new Audio(path);
        audio.volume = volume;
        audio.play().catch(e => console.error("Audio play failed", e));
    } catch (e) {
        console.error("Audio error", e);
    }
};

const getRandomSound = (baseName: string, count: number) => {
    const index = Math.floor(Math.random() * count) + 1;
    return `${import.meta.env.BASE_URL}sounds/${baseName}${index}.wav`;
};

export const playInputSound = () => {
    const sound = getRandomSound('correct', 4);
    playSound(sound, 0.6);
};

export const playErrorSound = () => {
    const sound = getRandomSound('error', 4);
    playSound(sound, 0.8);
};

export const playCompletionSound = () => {
    const sound = getRandomSound('hit', 4);
    playSound(sound, 0.7);
};

export const playRoundWonSound = () => {
    const sound = getRandomSound('success', 3);
    playSound(sound, 0.7);
};

export const playFailureSound = () => {
    playSound(`${import.meta.env.BASE_URL}sounds/failure.wav`, 0.8);
};

export const playStartSound = () => {
    playSound(`${import.meta.env.BASE_URL}sounds/start.wav`, 0.8);
    // Play coin sound shortly after
    setTimeout(() => {
        const coin = Math.random() > 0.5 ? 'coin1.wav' : 'coin2.wav';
        playSound(`${import.meta.env.BASE_URL}sounds/${coin}`, 0.7);
    }, 800);
};

let bgmAudio: HTMLAudioElement | null = null;

export const playBGM = () => {
    if (!bgmAudio) {
        bgmAudio = new Audio(`${import.meta.env.BASE_URL}sounds/stratagem_hero.wav`);
        bgmAudio.loop = true;
        bgmAudio.volume = 0.3; // Lower volume for background
    }
    bgmAudio.play().catch(e => console.error("BGM play failed", e));
};


export const stopBGM = () => {
    if (bgmAudio) {
        bgmAudio.pause();
        bgmAudio.currentTime = 0;
    }
};

export const playCampaignSelectSound = () => {
    playSound(`${import.meta.env.BASE_URL}sounds/pickupCoin.wav`, 0.8);
};
