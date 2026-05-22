"use client";
import React, { useState } from 'react';
import SequenceBoard from '../../../components/games/SequenceBoard';

export default function RemovalTestPage() {
    // Mock 10x10 Board
    const initialBoard = Array(10).fill(null).map(() => Array(10).fill(null));
    initialBoard[4][4] = "RED"; // Place a red chip to remove

    const [mockState, setMockState] = useState<any>({
        board: initialBoard,
        players: { "me": "BLUE", "opponent": "RED" }, // I am Blue
        currentTurn: "BLUE",
        winner: null,
        hands: {},
        lastMove: null,
        pendingAction: { type: "REMOVE_CHIP", playerId: "me" } // Pending Removal
    });

    const handleCellClick = (x: number, y: number) => {
        const cell = mockState.board[y][x];

        // This logic mimics the Reducer essentially for the visual test
        if (mockState.pendingAction?.type === "REMOVE_CHIP") {
            if (cell && cell !== "BLUE") {
                const newBoard = mockState.board.map((r: any[]) => [...r]);
                newBoard[y][x] = null;

                setMockState({
                    ...mockState,
                    board: newBoard,
                    pendingAction: null
                });
                alert(`Removed chip at ${x},${y}!`);
            } else {
                alert("Invalid target! Must be opponent chip.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-deep-navy flex flex-col items-center justify-center p-4">
            <h1 className="text-white text-3xl font-bold mb-4">Removal Interaction Test</h1>
            <p className="text-gray-400 mb-8 max-w-md text-center">
                You are <strong>BLUE</strong>. I have placed a <strong>RED</strong> chip at the center (4,4).
                Try to remove it! (You are in 'pending removal' mode).
            </p>

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
