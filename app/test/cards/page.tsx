"use client";
import React from 'react';
import PlayingCard from '../../../components/games/PlayingCard';

export default function CardsTestPage() {
    const cards = [
        "JS", // One-Eyed Spade Jack
        "JH", // One-Eyed Heart Jack
        "JC", // Two-Eyed Club Jack
        "JD", // Two-Eyed Diamond Jack
        "AS", // Ace of Spades (to verify fixed spade shape)
        "KH", // King of Hearts (to verify heart shape)
        "10C", // Ten of Clubs (to verify club shape)
        "2D"  // Two of Diamonds (to verify diamond shape)
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#080b11] via-[#121824] to-[#1a1128] text-white p-8">
            <h1 className="text-4xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5]">
                Card Visual Verification Page
            </h1>
            <p className="text-gray-400 text-center mb-8">
                Verify the high-fidelity suit shapes and one-eyed/two-eyed Jack eye icons in the corner and center.
            </p>

            <div className="max-w-4xl mx-auto bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-indigo-400">Hand Card Display (Full-mode)</h2>
                <div className="flex flex-wrap gap-6 justify-center mb-12">
                    {cards.map((card) => (
                        <div key={card} className="flex flex-col items-center gap-2">
                            <PlayingCard code={card} />
                            <span className="text-sm text-gray-400 font-mono font-bold bg-white/5 px-2 py-1 rounded">
                                {card} ({card.startsWith("J") ? (card.endsWith("S") || card.endsWith("H") ? "1-Eye Jack" : "2-Eye Jack") : "Normal"})
                            </span>
                        </div>
                    ))}
                </div>

                <hr className="border-white/10 my-8" />

                <h2 className="text-2xl font-bold mb-6 text-indigo-400">Mini Card Display (Board-mode)</h2>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 justify-center">
                    {cards.map((card) => (
                        <div key={card} className="flex flex-col items-center gap-2">
                            <div className="w-12 h-16">
                                <PlayingCard code={card} mini />
                            </div>
                            <span className="text-xs text-gray-500 font-mono font-bold">
                                {card}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center mt-8">
                <a href="/test" className="px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors">
                    Back to Test Suite
                </a>
            </div>
        </div>
    );
}
