import React, { useEffect, useState } from 'react';
import { db, type Announcement } from '../services/db';

interface NewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
}

const NewsModal: React.FC<NewsModalProps> = ({ isOpen, onClose, username }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('NewsModal username prop:', username);
        if (isOpen) {
            loadAnnouncements();
        }
    }, [isOpen, username]);

    const loadAnnouncements = async () => {
        setLoading(true);
        const data = await db.getAnnouncements();
        setAnnouncements(data);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this transmission?')) {
            await db.deleteAnnouncement(id);
            loadAnnouncements(); // Refresh list
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-8 pointer-events-none">
            {/* Backdrop (Click to close) */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-[1px] pointer-events-auto"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className={`
                relative pointer-events-auto
                w-full max-w-md bg-gray-900/90 border-2 border-yellow-500/50 
                rounded-tl-2xl rounded-tr-lg rounded-bl-lg rounded-br-2xl
                shadow-[0_0_30px_rgba(234,179,8,0.2)]
                flex flex-col max-h-[80vh]
                animate-in slide-in-from-bottom-8 duration-300
                overflow-hidden
            `}>
                {/* Header */}
                <div className="bg-linear-to-r from-yellow-900/80 to-gray-900/90 p-4 border-b border-yellow-500/30 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center border border-yellow-500 overflow-hidden">
                            <img src={`${import.meta.env.BASE_URL}datapad_header_icon.png`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-yellow-500 uppercase tracking-widest leading-none">Datapad</h2>
                            <p className="text-[10px] text-yellow-600/80 font-mono tracking-wider font-bold">MINISTRY OF TRUTH CONNECTED</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-yellow-500/50 hover:text-yellow-500 transition-colors p-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto custom-scrollbar space-y-4 min-h-[300px]">
                    {loading ? (
                        <div className="flex justify-center items-center h-40 text-yellow-500/50 animate-pulse font-mono uppercase">
                            Establishing Uplink...
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 italic text-sm">
                            No active transmissions.
                        </div>
                    ) : (
                        announcements.map((item) => (
                            <div
                                key={item.id}
                                className={`
                                    relative p-4 rounded-lg border-l-4 overflow-hidden group transition-all hover:scale-[1.02]
                                    ${item.color === 'red' ? 'bg-red-900/20 border-l-red-500 border-t border-r border-b border-white/5' : ''}
                                    ${item.color === 'yellow' ? 'bg-yellow-900/20 border-l-yellow-500 border-t border-r border-b border-white/5' : ''}
                                    ${item.color === 'blue' ? 'bg-blue-900/20 border-l-blue-500 border-t border-r border-b border-white/5' : ''}
                                    ${item.color === 'purple' ? 'bg-purple-900/20 border-l-purple-500 border-t border-r border-b border-white/5' : ''}
                                `}
                            >
                                {/* Admin Delete Button */}
                                {username?.toLowerCase() === 'admin' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(item.id);
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-red-900/80 text-red-200 rounded hover:bg-red-700 transition-colors z-20"
                                        title="Delete Transmission"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}

                                <div className="flex gap-4">
                                    {/* Icon Column */}
                                    <div className="shrink-0">
                                        <div className={`
                                            w-12 h-12 rounded-full flex items-center justify-center overflow-hidden
                                            ${item.color === 'red' ? 'bg-red-500/10 border border-red-500/30' : ''}
                                            ${item.color === 'yellow' ? 'bg-yellow-500/10 border border-yellow-500/30' : ''}
                                            ${item.color === 'blue' ? 'bg-blue-500/10 border border-blue-500/30' : ''}
                                            ${item.color === 'purple' ? 'bg-purple-500/10 border border-purple-500/30' : ''}
                                        `}>
                                            {item.icon ? (
                                                <img src={item.icon} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className={`text-xl font-bold ${item.color === 'red' ? 'text-red-500' :
                                                    item.color === 'yellow' ? 'text-yellow-500' :
                                                        item.color === 'blue' ? 'text-blue-500' :
                                                            'text-purple-500'
                                                    }`}>!</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Text Column */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-bold uppercase tracking-wider text-sm ${item.color === 'red' ? 'text-red-400' :
                                                item.color === 'yellow' ? 'text-yellow-400' :
                                                    item.color === 'blue' ? 'text-blue-400' :
                                                        'text-purple-400'
                                                }`}>
                                                {item.title}
                                            </h3>
                                            <span className="text-[10px] text-gray-500 font-mono">
                                                {new Date(item.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                            {item.content}
                                        </p>
                                        <div className="mt-2 flex justify-end">
                                            <span className="text-[10px] text-gray-600 uppercase tracking-widest">
                                                Authored by: {item.author}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-950/80 p-3 text-center border-t border-gray-800">
                    <p className="text-[10px] text-gray-600 uppercase">
                        Version 0.2.1-Alpha // Stratagem Hero
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NewsModal;
