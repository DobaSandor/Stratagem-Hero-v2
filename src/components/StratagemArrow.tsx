import React from 'react';
import type { Direction } from '../data/stratagems';

interface StratagemArrowProps {
    direction: Direction;
    state: 'inactive' | 'active' | 'completed' | 'error';
}

const StratagemArrow: React.FC<StratagemArrowProps> = ({ direction, state }) => {
    const getRotation = () => {
        switch (direction) {
            case 'UP': return 'rotate-0';
            case 'DOWN': return 'rotate-180';
            case 'LEFT': return '-rotate-90';
            case 'RIGHT': return 'rotate-90';
        }
    };

    const getColor = () => {
        switch (state) {
            case 'inactive': return 'text-gray-500 bg-gray-800 border-gray-600';
            case 'active': return 'text-white bg-gray-700 border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]';
            case 'completed': return 'text-yellow-400 bg-yellow-900/30 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]';
            case 'error': return 'text-red-500 bg-red-900/30 border-red-500 animate-shake';
        }
    };

    return (
        <div className={`
      w-12 h-12 flex items-center justify-center rounded-lg border-2 transition-all duration-200
      ${getColor()}
    `}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className={`w-8 h-8 transform transition-transform ${getRotation()}`}
            >
                <path
                    d="M12 3L21 12H16V21H8V12H3L12 3Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
};

export default StratagemArrow;
