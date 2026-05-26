"use client";

import { useState } from "react";

export default function VictoryModal({ winner, onReset }: { winner: string, onReset: () => void }) {
    const [minimized, setMinimized] = useState(false);

    if (minimized) {
        return (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-warm-black/95 border-2 border-[#9b51e0]/80 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-fade-in backdrop-blur-md shadow-[0_0_20px_rgba(155,81,224,0.3)] pointer-events-auto">
                <span className="text-yellow-400 text-lg">🏆</span>
                <span className={`font-bold text-sm ${winner === "BLUE" ? "text-blue-400" : winner === "RED" ? "text-red-400" : "text-purple-400"}`}>
                    {winner}
                </span>
                <span className="text-gray-300 text-sm">
                    {(winner === "BLUE" || winner === "RED") ? " TEAM WON!" : " WON!"}
                </span>
                <button
                    onClick={onReset}
                    className="px-4 py-1.5 bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] text-white text-xs font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md"
                >
                    Play Again
                </button>
                <button
                    onClick={() => setMinimized(false)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full transition-all"
                >
                    Show Details
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs animate-fade-in">
            <div className="bg-gradient-to-br from-warm-black to-deep-navy border-2 border-[#9b51e0]/80 p-8 rounded-xl shadow-2xl text-center transform scale-110 animate-bounce-in max-w-md w-full shadow-[0_0_25px_rgba(155,81,224,0.35)]">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5]">
                    VICTORY!
                </h2>
                <p className="text-gray-300 text-lg mb-8">
                    <span className={`font-bold text-2xl ${
                        winner === "BLUE" ? "text-blue-400" :
                        winner === "RED" ? "text-red-400" : "text-purple-400"
                    }`}>
                        {winner}
                    </span>
                    {winner === "BLUE" || winner === "RED" ? " TEAM HAS WON THE GAME!" : " HAS WON THE GAME!"}
                </p>

                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onReset}
                        className="px-6 py-3 bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] text-white font-bold rounded hover:opacity-90 active:scale-95 transition-all shadow-lg"
                    >
                        Play Again
                    </button>
                    <button
                        onClick={() => setMinimized(true)}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded active:scale-95 hover:opacity-90 transition-all shadow-md"
                    >
                        Inspect Board
                    </button>
                </div>
            </div>
        </div>
    );
}
