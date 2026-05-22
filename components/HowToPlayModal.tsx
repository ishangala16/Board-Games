"use client";

import React from "react";

interface HowToPlayModalProps {
    onClose: () => void;
    gameType: "SEQUENCE" | "SPLENDOR" | "CARCASSONNE" | "AZUL";
}

export default function HowToPlayModal({ onClose, gameType }: HowToPlayModalProps) {
    const title = gameType.charAt(0) + gameType.slice(1).toLowerCase();

    const renderSequenceRules = () => (
        <>
            <section>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                    Objective
                </h3>
                <p>
                    Form a <strong>connected row of 5 chips</strong> of your color.
                    This can be horizontal, vertical, or diagonal.
                </p>
            </section>

            <section>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                    On Your Turn
                </h3>
                <ul className="list-disc list-inside ml-8 space-y-1 text-sm">
                    <li>Select a card from your hand.</li>
                    <li>Click the matching space on the board to place your chip.</li>
                    <li>A new card will be drawn automatically.</li>
                </ul>
            </section>

            <section>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">3</span>
                    Special Cards (The Jacks)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center mb-2">
                            <span className="text-2xl mr-2">👁️👁️</span>
                            <div>
                                <div className="text-red-400 font-bold">Two-Eyed Jacks</div>
                                <div className="text-[10px] uppercase opacity-60">Clubs ♣ & Diamonds ♦</div>
                            </div>
                        </div>
                        <p className="text-sm">
                            <strong>Wild Card!</strong> Place a chip on ANY empty space on the board.
                        </p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center mb-2">
                            <span className="text-2xl mr-2">👁️</span>
                            <div>
                                <div className="text-blue-400 font-bold">One-Eyed Jacks</div>
                                <div className="text-[10px] uppercase opacity-60">Spades ♠ & Hearts ♥</div>
                            </div>
                        </div>
                        <p className="text-sm">
                            <strong>Attack!</strong> Remove ANY opponent chip from the board (unless it's locked).
                        </p>
                    </div>
                </div>
            </section>
        </>
    );

    const renderSplendorRules = () => (
        <>
            <section>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                    Objective
                </h3>
                <p>
                    Be the first player to reach <strong>15 Prestige Points</strong>.
                    Points come from Buying Development Cards and attracting Nobles.
                </p>
            </section>

            <section>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                    On Your Turn (Choose One)
                </h3>
                <ul className="list-disc list-inside ml-8 space-y-2 text-sm">
                    <li><strong>Take Tokens:</strong> Click gemstone stacks to collect color tokens.</li>
                    <li><strong>Buy a Card:</strong> Use tokens and permanent bonuses to purchase cards.</li>
                </ul>
            </section>

            <section>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">3</span>
                    Bonuses & Nobles
                </h3>
                <p className="ml-8 text-sm">
                    Each card provides a permanent bonus. Nobles automatically visit you when you have enough bonuses, granting 3 points each.
                </p>
            </section>
        </>
    );

    const renderCarcassonneRules = () => (
        <>
            <section>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                    Objective
                </h3>
                <p>
                    Create a medieval landscape of <strong>Cities, Roads, and Monasteries</strong>.
                    Score points by placing tiles that extend and complete these features.
                </p>
            </section>

            <section>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                    Tile Placement
                </h3>
                <p className="ml-8 text-sm">
                    Draw a tile and place it adjacent to an existing tile.
                    <strong>Crucially:</strong> All touching edges must match (City to City, Road to Road, Grass to Grass).
                </p>
            </section>

            <section>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">3</span>
                    Controls & Map Navigation
                </h3>
                <div className="grid grid-cols-1 gap-4 ml-8 text-sm">
                    <div className="bg-white/5 p-3 rounded border border-white/10">
                        <strong>Rotate:</strong> Use the ↻ button in the bottom right to spin your current tile.
                    </div>
                    <div className="bg-white/5 p-3 rounded border border-white/10">
                        <strong>Place:</strong> Hover over the map to see a "Ghost Tile". If the edges match, it turns green—click to place!
                    </div>
                    <div className="bg-white/5 p-3 rounded border border-white/10">
                        <strong>Navigate:</strong> Use your <strong>Mouse Wheel to Zoom</strong> and <strong>Left Click + Drag to Pan</strong> the map.
                    </div>
                </div>
            </section>
        </>
    );

    const renderAzulRules = () => (
        <>
            <section>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                    Objective
                </h3>
                <p>
                    Be the player with the most points at the end of the game by claiming tiles and arranging them on your board to score points. The game ends after a player completes a horizontal line on their wall.
                </p>
            </section>

            <section>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                    On Your Turn
                </h3>
                <ul className="list-disc list-inside ml-8 space-y-2 text-sm">
                    <li><strong>Drafting:</strong> Pick all tiles of ONE color from any Factory or the Center pool. Any leftover tiles go to the Center pool.</li>
                    <li><strong>Placement:</strong> Place all picked tiles into ONE pattern line on your board. Excess tiles fall to the Floor Line, costing you points!</li>
                </ul>
            </section>

            <section>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">3</span>
                    Tiling Phase
                </h3>
                <p className="ml-8 text-sm">
                    At the end of the round, completed pattern lines move one tile to your Wall, scoring points based on adjacent tiles. The rest of the tiles in that line are discarded.
                </p>
            </section>
        </>
    );

    const renderContent = () => {
        switch (gameType) {
            case "SEQUENCE": return renderSequenceRules();
            case "SPLENDOR": return renderSplendorRules();
            case "CARCASSONNE": return renderCarcassonneRules();
            case "AZUL": return renderAzulRules();
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4" onClick={onClose}>
            <div
                className="bg-gradient-to-br from-warm-black to-deep-navy border border-[#9b51e0]/40 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-warm-black/95 backdrop-blur z-10">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5]">How to Play: {title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8 text-gray-300">
                    {renderContent()}
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 text-center">
                    <button
                        onClick={onClose}
                        className="px-8 py-2 bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] text-white font-bold rounded hover:opacity-90 active:scale-95 transition-all shadow-lg"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
}
