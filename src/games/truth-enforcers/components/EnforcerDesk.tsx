import React, { useState } from 'react';
import { type NPC } from '../types';
import GuideBook from './GuideBook';
import DraggableDeskItem from './DraggableDeskItem';

// Icons (SVG placeholders for now, can be replaced with images or Lucid icons later)
const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
);

const SkullIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 opacity-50" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm-3 8a1 1 0 112 0 1 1 0 01-2 0zm6 0a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
    </svg>
);


interface DraggableDrawerProps {
    label: string;
    children?: React.ReactNode;
}

const DraggableDrawer: React.FC<DraggableDrawerProps> = ({ label, children }) => {
    const [offsetY, setOffsetY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = React.useRef(0);
    const startOffset = React.useRef(0);
    const hasMoved = React.useRef(false);

    const OPEN_Y = -150;
    const SNAP_THRESHOLD = -50;

    const handlePointerDown = (e: React.PointerEvent) => {
        // Start tracking drag but don't capture yet
        dragStartY.current = e.clientY;
        startOffset.current = offsetY;
        setIsDragging(true);
        hasMoved.current = false;
        // Don't prevent default to allow focus/input events if needed
    };

    React.useEffect(() => {
        if (!isDragging) return;

        const handlePointerMove = (e: PointerEvent) => {
            const deltaY = e.clientY - dragStartY.current;

            // Threshold for distinguishing click vs drag
            if (!hasMoved.current && Math.abs(deltaY) < 5) return;

            hasMoved.current = true;
            let newY = startOffset.current + deltaY;

            // Elastic dampening
            if (newY > 0) newY = newY * 0.2;
            if (newY < OPEN_Y) newY = OPEN_Y + (newY - OPEN_Y) * 0.2;

            setOffsetY(newY);
        };

        const handlePointerUp = () => {
            setIsDragging(false);

            if (hasMoved.current) {
                // Snap logic only if we actually dragged
                if (offsetY < SNAP_THRESHOLD) {
                    setOffsetY(OPEN_Y);
                } else {
                    setOffsetY(0);
                }
            } else {
                // It was a click, do nothing (let event propagate to children)
            }
        };

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);

        return () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDragging, offsetY, OPEN_Y, SNAP_THRESHOLD]);

    return (
        <div
            onPointerDown={handlePointerDown}
            style={{
                transform: `translateY(${offsetY}px)`,
                transition: isDragging && hasMoved.current ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            className="w-1/3 h-16 bg-linear-to-b from-gray-700 to-gray-800 rounded-t-lg border-t border-x border-gray-600 shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center relative touch-none pointer-events-auto"
        >
            {/* Handle / Grip */}
            <div className="w-8 h-8 rounded-full bg-black/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border-b border-gray-600 mb-2 pointer-events-none"></div>

            {/* Drawer Body (Hidden initially) */}
            <div className="absolute top-16 -left-px -right-px h-[150px] bg-gray-800 border-x border-b border-gray-700 flex flex-col items-center justify-start pt-4 shadow-xl">
                <span className="text-gray-500 font-bold tracking-widest text-sm mb-2 opacity-50">{label}</span>
                <div className="relative w-full h-full flex items-center justify-center p-4">
                    {children}
                </div>
            </div>
        </div>
    );
};


interface EnforcerDeskProps {
    day: number;
    totalNPCs: number;
    currentNPCIndex: number;
    npc: NPC | null;
    onAllow: () => void;
    onDeny: () => void;
    onExterminate?: () => void; // Optional for now
}

const EnforcerDesk: React.FC<EnforcerDeskProps> = ({ day, totalNPCs, currentNPCIndex, npc, onAllow, onDeny }) => {
    const [isIdCardBig, setIsIdCardBig] = useState(false);
    const [showDialogue, setShowDialogue] = useState(true);
    const [showGuideBook, setShowGuideBook] = useState(false);

    // Reset dialogue when NPC changes
    React.useEffect(() => {
        if (npc) setShowDialogue(true);
    }, [npc]);

    if (!npc) {
        return <div className="w-full h-full bg-black flex items-center justify-center text-white">SHIFT OVER...</div>
    }

    const { idCard } = npc;

    return (
        <div className="relative w-full h-screen bg-gray-800 overflow-hidden flex flex-col items-center justify-end font-sans select-none cursor-glove">

            {/* --- TOP BAR --- */}
            <div className="absolute top-0 w-full h-16 bg-gray-900 border-b-4 border-gray-700 flex justify-between items-center px-8 z-20 shadow-lg">

                {/* Day / Queue Counter */}
                <div className="bg-black/50 px-4 py-1 rounded-full border border-blue-900 shadow-[0_0_10px_rgba(30,58,138,0.5)]">
                    <span className="text-blue-400 text-xl font-mono tracking-widest font-bold">
                        DAY {day} | {currentNPCIndex}/{totalNPCs}
                    </span>
                </div>

                {/* Center Skull Decoration */}
                <div className="absolute left-1/2 transform -translate-x-1/2 -top-2">
                    <SkullIcon />
                </div>

                {/* Speaker Icon (Placeholder) */}
                <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center border border-gray-600">
                    <div className="w-4 h-4 bg-gray-600 rounded-full animate-pulse"></div>
                </div>
            </div>


            {/* --- SIDE BANNERS --- */}
            <div className="absolute left-12 top-0 h-[70vh] w-24 bg-red-700 clip-banner-bottom shadow-2xl z-10 flex flex-col items-center justify-center border-x-4 border-red-900">
                <div className="h-full w-2 bg-black/20 absolute left-4"></div>
                <div className="h-full w-2 bg-black/20 absolute right-4"></div>
                <SkullIcon />
            </div>
            <div className="absolute right-12 top-0 h-[70vh] w-24 bg-red-700 clip-banner-bottom shadow-2xl z-10 flex flex-col items-center justify-center border-x-4 border-red-900">
                <div className="h-full w-2 bg-black/20 absolute left-4"></div>
                <div className="h-full w-2 bg-black/20 absolute right-4"></div>
                <SkullIcon />
            </div>

            <style>{`
                .clip-banner-bottom {
                    clip-path: polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%);
                }
                .desk-perspective {
                     transform: perspective(1000px) rotateX(10deg) translateY(20px);
                }
            `}</style>


            {/* --- NPC WINDOW (The Void) --- */}
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-[60%] h-[60vh] bg-black border-x-8 border-gray-700 shadow-[inset_0_0_50px_rgba(0,0,0,1)] z-0 flex items-end justify-center overflow-hidden">
                <div className="w-full h-8 bg-gray-800/50 absolute top-5 grid grid-cols-12 gap-1 px-2">
                    {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-full bg-black/30 rounded"></div>)}
                </div>

                {/* NPC PLACEHOLDER */}
                <div className="w-[300px] h-[400px] bg-gray-700/20 rounded-t-full relative animate-pulse flex items-center justify-center">
                    <span className="text-white/20 text-4xl font-bold uppercase tracking-widest text-center">{npc.appearance.image}</span>
                </div>
            </div>


            {/* --- DESK SURFACE --- */}
            <div className="relative w-full h-[35vh] bg-[#2a2a2a] z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] border-t-8 border-gray-600 flex flex-col items-center">

                {/* Desk Trapezoid Shape Illusion needs more complex CSS, simplified here as a flat surface with borders */}

                {/* Controls Area */}
                <div className="w-[70%] h-full relative flex justify-between px-10 pt-10">

                    {/* LEFT SIDE CONTROLS */}
                    <div className="flex flex-col gap-6 items-center">
                        {/* Mic Button */}
                        <button className="w-16 h-16 rounded-full bg-linear-to-br from-gray-700 to-gray-900 border-2 border-cyan-900 shadow-[0_5px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 hover:brightness-125 transition-all flex items-center justify-center group">
                            <MicIcon />
                        </button>

                        {/* Lock Button (Shift End/Start) */}
                        <button className="w-16 h-16 rounded-full bg-linear-to-br from-gray-700 to-gray-900 border-2 border-yellow-900 shadow-[0_5px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 hover:brightness-125 transition-all flex items-center justify-center group">
                            <LockIcon />
                        </button>
                    </div>


                    {/* CENTER DESK (Documents Area) */}
                    <div className="flex-1 mx-10 bg-black/10 rounded-lg border-2 border-dashed border-gray-600/30 flex items-center justify-center relative">
                        <span className="text-gray-600 font-bold uppercase tracking-widest opacity-20 pointer-events-none">Document Inspection Area</span>

                        {/* ID Card */}
                        {idCard && idCard.exists && (
                            <DraggableDeskItem
                                onTap={() => setIsIdCardBig(true)}
                                className="absolute top-1/2 left-1/3 group"
                            >
                                <div
                                    className="w-40 h-24 bg-blue-600 rounded-lg shadow-md -rotate-6 hover:scale-110 transition-transform border border-blue-400 p-2 flex gap-2 select-none"
                                >
                                    {/* Photo slot */}
                                    <div className="w-10 h-12 bg-gray-300 border border-gray-400"></div>
                                    {/* Text lines */}
                                    <div className="flex-1 flex flex-col gap-1">
                                        <div className="h-2 w-3/4 bg-white/30 rounded"></div>
                                        <div className="h-1 w-full bg-white/20 rounded"></div>
                                        <div className="h-1 w-1/2 bg-white/20 rounded"></div>
                                    </div>
                                    <div className="absolute bottom-1 right-2 text-[8px] text-white/50 font-mono tracking-tighter">SEAF-ID</div>
                                </div>
                            </DraggableDeskItem>
                        )}
                    </div>


                    {/* RIGHT SIDE CONTROLS (Allow/Deny) */}
                    <div className="flex items-start gap-12 mt-4">

                        {/* ALLOW BUTTON */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-green-500 blur-xl opacity-0 group-hover:opacity-20 transition-opacity rounded-full"></div>
                            <button
                                onClick={onAllow}
                                className="w-32 h-32 rounded-full bg-linear-to-b from-green-600 to-green-800 border-4 border-green-900 shadow-[0_10px_0_#14532d,0_15px_20px_rgba(0,0,0,0.5)] active:shadow-[0_2px_0_#14532d] active:translate-y-2 active:border-green-950 transition-all flex flex-col items-center justify-center"
                            >
                                <div className="w-24 h-24 rounded-full border-2 border-green-500/30 flex items-center justify-center">
                                    <span className="text-white font-bold uppercase tracking-wider text-sm drop-shadow-md">Allow</span>
                                </div>
                            </button>
                        </div>

                        {/* DENY BUTTON */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-red-500 blur-xl opacity-0 group-hover:opacity-20 transition-opacity rounded-full"></div>
                            <button
                                onClick={onDeny}
                                className="w-32 h-32 rounded-full bg-linear-to-b from-red-600 to-red-800 border-4 border-red-900 shadow-[0_10px_0_#7f1d1d,0_15px_20px_rgba(0,0,0,0.5)] active:shadow-[0_2px_0_#7f1d1d] active:translate-y-2 active:border-red-950 transition-all flex flex-col items-center justify-center"
                            >
                                <div className="w-24 h-24 rounded-full border-2 border-red-500/30 flex items-center justify-center">
                                    <span className="text-white font-bold uppercase tracking-wider text-sm drop-shadow-md">Deny</span>
                                </div>
                            </button>
                        </div>

                    </div>

                </div>

                {/* --- DRAWERS --- */}
                <div className="w-full flex justify-center gap-4 mt-auto mb-[-10px] pointer-events-none"> {/* Container pointer-events-none so drags pass through gaps? No, drawers need events. */}
                    <DraggableDrawer label="REFERENCE">
                        <div
                            onClick={() => setShowGuideBook(true)}
                            className="relative w-64 h-40 cursor-pointer hover:-translate-y-4 transition-transform group mt-2"
                        >
                            {/* Folder Back */}
                            <div className="absolute inset-0 bg-yellow-700 rounded-sm -skew-x-2 shadow-lg border-2 border-yellow-800"></div>

                            {/* Folder Tab */}
                            <div className="absolute -top-4 left-0 w-24 h-8 bg-yellow-700 rounded-t-sm -skew-x-2 border-t-2 border-l-2 border-r-2 border-yellow-800"></div>

                            {/* Paper Insert */}
                            <div className="absolute top-2 left-4 w-56 h-32 bg-gray-100 shadow-md flex flex-col items-center justify-center -rotate-1 p-4 text-center">
                                <img src="/seaf_logo.png" className="w-16 h-16 opacity-30 mb-2" alt="" />
                                <div className="h-2 w-full bg-gray-300 rounded mb-2"></div>
                                <div className="h-2 w-3/4 bg-gray-300 rounded mb-2"></div>
                                <div className="h-2 w-1/2 bg-gray-300 rounded"></div>
                            </div>

                            {/* Folder Front */}
                            <div className="absolute bottom-0 left-0 w-64 h-24 bg-yellow-600/95 backdrop-blur-sm rounded-b-sm shadow-inner flex items-center justify-center z-10 border-t-2 border-yellow-500/50">
                                <span className="text-yellow-900 font-bold text-lg uppercase tracking-widest bg-yellow-500/80 px-4 py-1 rounded shadow-sm group-hover:bg-yellow-400 transition-colors">SEAF MANUAL</span>
                            </div>
                        </div>
                    </DraggableDrawer>

                    <DraggableDrawer label="WEAPON" />
                </div>
            </div>

            {/* GUIDE BOOK MODAL */}
            <GuideBook
                isOpen={showGuideBook}
                onClose={() => setShowGuideBook(false)}
                logo="/seaf_logo.png"
                title="Enforcer Protocol"
                pages={[
                    {
                        title: "Introduction",
                        content: "Welcome, Enforcer.\n\nYour duty is to protect Super Earth from threats, both external and internal. Accuracy is paramount. Leniency is treason."
                    },
                    {
                        title: "Entry Requirements",
                        content: "- All citizens must present a valid SEAF-ID.\n- Verify the expiry date has not passed. ( Current year: 2184 )\n- Ensure the face matches the appearance.\n- Check for any active warrants or discrepancies."
                    },
                    {
                        title: "Daily Codes",
                        content: "DAY 1: Clearance Level 1\n\n- Valid ID Card required for all transit.\n- No other documents currently mandatory."
                    }
                ]}
            />

            {/* DIALOGUE BOX (Overlay) */}
            {showDialogue && (
                <div
                    onClick={() => setShowDialogue(false)}
                    className="absolute bottom-0 w-full h-32 bg-red-900/90 border-t-4 border-red-600 backdrop-blur-md z-40 p-4 shadow-[0_-5px_20px_rgba(220,38,38,0.3)] cursor-pointer hover:bg-red-900/95 transition-colors group"
                >
                    <div className="max-w-4xl mx-auto relative">
                        <h3 className="text-yellow-400 font-bold uppercase tracking-widest text-sm mb-1">{idCard?.details?.name || 'Unknown Citizen'}</h3>
                        <p className="text-white text-lg font-mono leading-relaxed">
                            "{npc.dialogue.greeting} {npc.dialogue.purpose}"
                        </p>
                        <div className="absolute right-0 bottom-0 text-red-300 text-xs uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">
                            [Click to Dismiss]
                        </div>
                    </div>
                </div>
            )}


            {/* --- ID CARD INSPECTION MODAL --- */}
            {isIdCardBig && idCard && (
                <div
                    className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-8 backdrop-blur-sm cursor-zoom-out"
                    onClick={() => setIsIdCardBig(false)}
                >
                    <div
                        className="w-[600px] h-[380px] bg-blue-600 rounded-2xl shadow-2xl border-4 border-blue-300 relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()} // Prevent close on card click
                    >
                        {/* Header */}
                        <div className="w-full h-12 bg-blue-800 flex items-center justify-between px-6 border-b border-blue-400">
                            <span className="text-white font-bold tracking-widest uppercase">Super Earth Citizenship ID</span>
                            <span className="font-mono text-blue-200">{idCard.details.idNumber}</span>
                        </div>

                        <div className="flex p-6 gap-8 h-full">
                            {/* Portrait */}
                            <div className="w-40 h-48 bg-gray-200 border-2 border-white shadow-inner shrink-0">
                                {/* Placeholder Portrait */}
                            </div>

                            {/* Details */}
                            <div className="flex-1 text-white font-mono space-y-4">
                                <h2 className="text-3xl font-bold uppercase mb-4 text-yellow-300">{idCard.details.name}</h2>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="opacity-50 text-xs uppercase">DOB</div>
                                        <div className="text-lg">{idCard.details.dob}</div>
                                    </div>
                                    <div>
                                        <div className="opacity-50 text-xs uppercase">Gender</div>
                                        <div className="text-lg">{idCard.details.gender}</div>
                                    </div>
                                    <div>
                                        <div className="opacity-50 text-xs uppercase">Home Planet</div>
                                        <div className="text-lg">{idCard.details.homePlanet}</div>
                                    </div>
                                    <div>
                                        <div className="text-red-300 opacity-80 text-xs uppercase">Expiry Date</div>
                                        <div className="text-xl font-bold text-red-100">{idCard.details.expiry}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Watermark */}
                        <div className="absolute bottom-4 right-6 opacity-30">
                            <SkullIcon />
                        </div>
                        <div className="absolute bottom-6 left-6 text-xs text-blue-200 uppercase tracking-widest">
                            Official SEAF Document
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default EnforcerDesk;
