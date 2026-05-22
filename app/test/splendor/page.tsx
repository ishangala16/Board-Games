"use client";
import { useState } from "react";
import SplendorBoard from "@/components/games/SplendorBoard";
import { INITIAL_SPLENDOR_STATE, splendorReducer, SplendorAction } from "@/lib/games/Splendor";

export default function SplendorTestPage() {
    const [gameState, setGameState] = useState(() => {
        const state = INITIAL_SPLENDOR_STATE();
        // Setup a test player
        state.players["Tester"] = {
            username: "Tester",
            tokens: { WHITE: 0, BLUE: 0, GREEN: 0, RED: 0, BLACK: 0, GOLD: 0 },
            reserved: [],
            tableau: [],
            nobles: [],
            points: 0
        };
        state.turnOrder = ["Tester"];
        return state;
    });

    const handleAction = (action: SplendorAction) => {
        console.log("Action:", action);
        try {
            const newState = splendorReducer(gameState, action);
            setGameState(newState);
        } catch (e) {
            console.error(e);
            alert("Error executing move (check console)");
        }
    };

    return (
        <div className="min-h-screen bg-deep-navy text-white p-8">
            <h1 className="text-3xl font-bold text-soft-gold mb-6">Splendor Mechanics Test</h1>

            <div className="mb-4 space-x-4">
                <button
                    onClick={() => setGameState(INITIAL_SPLENDOR_STATE())}
                    className="px-4 py-2 bg-red-900 border border-red-500 rounded hover:bg-red-800"
                >
                    Reset State
                </button>
                <span className="text-gray-400 text-sm">
                    Current Turn: {gameState.turnOrder[gameState.currentTurnIndex]}
                </span>
                <span className="text-gray-400 text-sm ml-4">
                    Winner: {gameState.winner || "None"}
                </span>
            </div>

            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20 h-[800px]">
                <SplendorBoard
                    gameState={gameState}
                    onAction={handleAction}
                    playerUsername="Tester"
                />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-8">
                <div className="bg-warm-black p-4 rounded border border-white/10">
                    <h3 className="font-bold mb-2">Test Scenarios</h3>
                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-2">
                        <li><strong>Take Tokens:</strong> Try taking 3 distinct gems. Try taking 2 same (should fail if stack &lt; 4).</li>
                        <li><strong>Buy Card:</strong> Accumulate tokens and buy a Tier 1 card. Check if bonuses update.</li>
                        <li><strong>Nobles:</strong> (Advanced) Try to buy enough cards to trigger a Noble visit.</li>
                    </ul>
                </div>
                <div className="bg-warm-black p-4 rounded border border-white/10 font-mono text-xs overflow-auto max-h-48">
                    <h3 className="font-bold mb-2 font-sans">Debug State (Player)</h3>
                    <pre>{JSON.stringify(gameState.players["Tester"], null, 2)}</pre>
                </div>
            </div>
        </div>
    );
}
