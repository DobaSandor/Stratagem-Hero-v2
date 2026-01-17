import { useState, useEffect } from 'react';
import { type DialogueLine } from '../data/campaignMissions';

interface DialogueOverlayProps {
    dialogue: DialogueLine[];
    onComplete: () => void;
    username: string;
}

const DialogueOverlay = ({ dialogue, onComplete, username }: DialogueOverlayProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [show, setShow] = useState(false);

    const currentLine = dialogue[currentIndex];

    // Animation on mount
    useEffect(() => {
        setShow(true);
    }, []);

    // Handle typing effect
    useEffect(() => {
        if (!currentLine) return;

        // Reset for new line
        setDisplayedText('');
        setIsTyping(true);
    }, [currentIndex, currentLine]);

    useEffect(() => {
        if (!isTyping || !currentLine) return;

        if (displayedText.length < currentLine.text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(currentLine.text.slice(0, displayedText.length + 1));
            }, 30);
            return () => clearTimeout(timeout);
        } else {
            setIsTyping(false);
        }
    }, [displayedText, isTyping, currentLine]);

    const handleClick = () => {
        if (isTyping) {
            // Complete text immediately
            setDisplayedText(currentLine.text);
            setIsTyping(false);
        } else {
            // Next line
            if (currentIndex < dialogue.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                // End dialogue
                setShow(false);
                setTimeout(onComplete, 500); // Wait for fade out
            }
        }
    };

    if (!currentLine) return null;

    // Resolve speaker name
    const isHelldiver = currentLine.speaker.trim().toLowerCase() === 'helldiver';
    const speakerName = isHelldiver ? (username || 'Unknown Helldiver') : currentLine.speaker;

    return (
        <div
            className={`fixed inset-0 z-50 flex flex-col items-center justify-end pb-10 bg-black/80 transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={handleClick}
        >
            <div className="w-full max-w-4xl px-4 flex flex-col items-end">
                {/* Character Info (Right Side) */}
                <div className={`flex flex-col items-center mb-4 transition-all duration-300 transform ${isTyping ? 'translate-y-0 opacity-100' : 'translate-y-0 opacity-100'}`}>
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-yellow-500 bg-gray-900 overflow-hidden shadow-[0_0_20px_rgba(234,179,8,0.5)] mb-2">
                        <img
                            src={currentLine.icon}
                            alt={speakerName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback if image missing
                                (e.target as HTMLImageElement).src = `https://placehold.co/128x128/1a1a1a/eab308?text=${speakerName.charAt(0)}`;
                            }}
                        />
                    </div>
                    <div className="bg-yellow-500 text-black font-bold uppercase tracking-widest px-4 py-1 rounded text-sm md:text-base shadow-lg">
                        {speakerName}
                    </div>
                </div>

                {/* Dialogue Box */}
                <div className="w-full bg-gray-900/95 border-2 border-yellow-500/50 rounded-lg p-6 md:p-8 shadow-2xl relative overflow-hidden group cursor-pointer">
                    {/* Decorative Corner Elements */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-500"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-500"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500"></div>

                    {/* Text */}
                    <p className="text-gray-100 text-lg md:text-xl font-mono leading-relaxed min-h-[3em]">
                        {displayedText}
                        <span className={`inline-block w-2 h-5 ml-1 bg-yellow-500 ${isTyping ? 'animate-pulse' : 'opacity-0'}`}></span>
                    </p>

                    {/* Click prompt */}
                    <div className={`absolute bottom-2 right-4 text-yellow-500/50 text-xs uppercase tracking-widest transition-opacity duration-300 ${!isTyping ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>
                        Click to continue
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DialogueOverlay;
