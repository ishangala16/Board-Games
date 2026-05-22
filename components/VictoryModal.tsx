"use client";

// import { useEffect } from "react";
// import confetti from "canvas-confetti"; // Verify install first

export default function VictoryModal({ winner, onReset }: { winner: string, onReset: () => void }) {


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-gradient-to-br from-warm-black to-deep-navy border-2 border-[#9b51e0]/80 p-8 rounded-xl shadow-2xl text-center transform scale-110 animate-bounce-in max-w-md w-full shadow-[0_0_25px_rgba(155,81,224,0.35)]">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5]">
                    VICTORY!
                </h2>
                <p className="text-gray-300 text-lg mb-8">
                    <span className={`font-bold text-2xl ${winner === "BLUE" ? "text-blue-400" : "text-red-400"}`}>
                        {winner} TEAM
                    </span>
                    {" "}HAS WON THE GAME!
                </p>

                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onReset}
                        className="px-6 py-3 bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] text-white font-bold rounded hover:opacity-90 active:scale-95 transition-all shadow-lg"
                    >
                        Play Again
                    </button>
                </div>
            </div>
        </div>
    );
}
