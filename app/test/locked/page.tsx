"use client";
import React, { useState } from 'react';
import SequenceBoard from '../../../components/games/SequenceBoard';
import { isPartOfSequence } from '../../../lib/games/Sequence';

export default function LockedTestPage() {
    // Mock 10x10 Board
    const initialBoard = Array(10).fill(null).map(() => Array(10).fill(null));

    // Create a horizontal sequence for RED at row 2
    for (let i = 1; i <= 5; i++) {
        initialBoard[2][i] = "RED";
    }
    // Place a loose RED chip at 5,5
    initialBoard[5][5] = "RED";

    // Player is BLUE, holding a One-Eyed Jack (Removal Pending)
    const [mockState, setMockState] = useState<any>({
        board: initialBoard,
        players: { "me": "BLUE", "opponent": "RED" },
        currentTurn: "BLUE",
        winner: null,
        hands: {},
        lastMove: null,
        pendingAction: { type: "REMOVE_CHIP", playerId: "me" }
    });

    const [message, setMessage] = useState("Try to remove the RED chips!");

    const handleCellClick = (x: number, y: number) => {
        const cell = mockState.board[y][x];

        if (mockState.pendingAction?.type === "REMOVE_CHIP") {
            if (cell && cell !== "BLUE") {
                // Check Locked Logic using the REAL function
                if (isPartOfSequence(mockState.board, x, y, cell)) {
                    setMessage("❌ BLOCKED! That chip is part of a LOCKED SEQUENCE.");
                    return;
                }

                // Remove
                const newBoard = mockState.board.map((r: any[]) => [...r]);
                newBoard[y][x] = null;

                setMockState({
                    ...mockState,
                    board: newBoard,
                    pendingAction: null
                });
                setMessage("✅ SUCCESS! Chip removed.");
            } else {
                setMessage("Invalid target. Must be an opponent's chip.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-deep-navy flex flex-col items-center justify-center p-4">
            <h1 className="text-white text-3xl font-bold mb-4">Locked Chip Protection Test</h1>

            <div className="bg-warm-black p-4 rounded-lg border border-white/10 mb-6 max-w-lg text-center">
                <p className="text-gray-300 mb-2">
                    Start State: <span className="text-red-400 font-bold">RED</span> has a 5-in-a-row (Row 2).
                    There is also a loose chip at (5,5).
                </p>
                <p className="text-blue-300 font-bold text-xl animate-pulse">
                    {message}
                </p>
            </div>

            <div className="scale-90 md:scale-100">
                <SequenceBoard
                    gameState={mockState}
                    onCellClick={handleCellClick}
                    playerTeam="BLUE"
                />
            </div>

            <button
                onClick={() => window.location.reload()}
                className="mt-8 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
                Reset Test
            </button>
        </div>
    );
}
