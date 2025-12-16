import React from 'react';
import { Timer, LogOut, Coffee } from 'lucide-react';

const SessionTimeoutModal = ({ open, onKeepSession, onLogout, timeLeft }) => {
    if (!open) return null;

    // Convert timeLeft (seconds) to MM:SS format
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-900 border border-red-500/30 rounded-lg p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
                {/* Background decorative glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>

                <div className="flex items-start space-x-4 relative z-10">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                        <Timer className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Session Expiring</h3>
                        <p className="text-gray-400 mb-4">
                            Your session has been idle for a while. For security reasons, you will be logged out in:
                        </p>
                        <div className="text-3xl font-mono text-center font-bold text-red-400 mb-6 bg-gray-800/50 py-2 rounded border border-red-500/20">
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>

                <div className="flex space-x-3 mt-2 relative z-10">
                    <button
                        onClick={onLogout}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                        <LogOut size={18} />
                        <span>Log Out</span>
                    </button>
                    <button
                        onClick={onKeepSession}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-md transition-all shadow-lg hover:shadow-red-500/25"
                    >
                        <Coffee size={18} />
                        <span>I'm Here</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionTimeoutModal;
