import React, { useState, useRef, useEffect } from 'react';

interface DraggableDeskItemProps {
    children: React.ReactNode;
    className?: string; // For initial positioning (absolute, top/left, rotation)
    onTap?: () => void;
}

const DraggableDeskItem: React.FC<DraggableDeskItemProps> = ({ children, className = '', onTap }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [zIndex, setZIndex] = useState(10); // Default z-index

    // Refs for drag logic
    const dragStartPos = useRef({ x: 0, y: 0 });
    const itemStartPos = useRef({ x: 0, y: 0 });
    const hasMoved = useRef(false);

    const handlePointerDown = (e: React.PointerEvent) => {
        // Prevent default to avoid text selection etc
        e.preventDefault();
        e.stopPropagation();

        setIsDragging(true);
        setZIndex(50); // Pop to front when grabbed
        hasMoved.current = false;

        dragStartPos.current = { x: e.clientX, y: e.clientY };
        itemStartPos.current = { ...position };
    };

    useEffect(() => {
        if (!isDragging) return;

        const handlePointerMove = (e: PointerEvent) => {
            const deltaX = e.clientX - dragStartPos.current.x;
            const deltaY = e.clientY - dragStartPos.current.y;

            // Threshold for click vs drag
            if (!hasMoved.current && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
                hasMoved.current = true;
            }

            setPosition({
                x: itemStartPos.current.x + deltaX,
                y: itemStartPos.current.y + deltaY
            });
        };

        const handlePointerUp = () => {
            setIsDragging(false);
            setZIndex(hasMoved.current ? 20 : 10); // Drop back down slightly if permitted, or keep high? 
            // Better to keep it reasonably high if it was just interacted with, but maybe reset specifically?
            // For now, let's leave it at 20 (above resting items) if dropped.

            if (!hasMoved.current && onTap) {
                onTap();
            }
        };

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);

        return () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDragging, onTap]);

    return (
        <div
            onPointerDown={handlePointerDown}
            className={`${className} cursor-grab active:cursor-grabbing touch-none`}
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                zIndex: isDragging ? 50 : zIndex,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out' // Slight smooth fix for jitter, but mostly raw
            }}
        >
            {children}
        </div>
    );
};

export default DraggableDeskItem;
