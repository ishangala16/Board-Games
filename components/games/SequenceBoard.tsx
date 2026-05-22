"use client";

import { useEffect, useState } from "react";
import PlayingCard from "./PlayingCard";
// We should import types but for frontend speed we'll inline or use 'any' if types not shared perfectly yet
// import { BOARD_LAYOUT } from "@/lib/games/Sequence";  // We need to move logic to shared location or copy

// Temporary Copy of Layout for Rendering
const BOARD_LAYOUT = [
    ["XX", "2S", "3S", "4S", "5S", "6S", "7S", "8S", "9S", "XX"],
    ["6C", "5C", "4C", "3C", "2C", "AH", "KH", "QH", "10H", "10S"],
    ["7C", "AS", "2D", "3D", "4D", "5D", "6D", "7D", "9H", "QS"],
    ["8C", "KS", "6C", "5C", "4C", "3C", "2C", "8D", "8H", "KS"],
    ["9C", "QS", "7C", "6H", "5H", "4H", "AH", "9D", "7H", "AS"],
    ["10C", "10S", "8C", "7H", "2H", "3H", "KH", "10D", "6H", "2D"],
    ["QC", "9S", "9C", "8H", "9H", "10H", "QH", "QD", "5H", "3D"],
    ["KC", "8S", "10C", "QC", "KC", "AC", "AD", "KD", "4H", "4D"],
    ["AC", "7S", "6S", "5S", "4S", "3S", "2S", "2H", "3H", "5D"],
    ["XX", "AD", "KD", "QD", "10D", "9D", "8D", "7D", "6D", "XX"]
];

export default function SequenceBoard({ gameState, onCellClick, playerTeam, selectedCard = null, shakingCell = null }: { gameState: any, onCellClick: (x: number, y: number) => void, playerTeam: string, selectedCard?: string | null, shakingCell?: { x: number, y: number } | null }) {
    if (!gameState) return <div className="text-white">Waiting for game state...</div>;

    const isTwoEyedJack = (c: string) => c === "JC" || c === "JD";
    const isOneEyedJack = (c: string) => c === "JS" || c === "JH";

    return (
        <div className="grid grid-cols-10 gap-1 p-2 bg-warm-black rounded-lg border-2 border-indigo-500/30 shadow-2xl relative">
            {gameState.board.map((row: any[], y: number) => (
                row.map((cell: any, x: number) => {
                    const cardCode = BOARD_LAYOUT[y][x];
                    const isCorner = cardCode === "XX";
                    const suit = cardCode.slice(-1);
                    const color = (suit === 'H' || suit === 'D') ? 'text-red-500' : 'text-gray-200';

                    const isPendingRemoval = gameState.pendingAction?.type === "REMOVE_CHIP" && gameState.pendingAction?.playerId === playerTeam;
                    const isOpponentChip = cell && cell !== playerTeam;
                    const isRemoveMatch = isPendingRemoval && isOpponentChip;

                    const isPlaceMatch = !isPendingRemoval && selectedCard && (
                        (isTwoEyedJack(selectedCard) && cell === null && !isCorner) ||
                        (selectedCard === cardCode && cell === null)
                    );

                    const isRemoverSelected = !isPendingRemoval && selectedCard && isOneEyedJack(selectedCard);
                    const isSelectableRemoval = isRemoverSelected && isOpponentChip;

                    const highlightClass = isRemoveMatch || isSelectableRemoval
                        ? "cursor-pointer ring-2 sm:ring-4 ring-red-500 animate-pulse z-30"
                        : isPlaceMatch
                            ? "cursor-pointer ring-2 sm:ring-4 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.6)] scale-105 z-20"
                            : "";

                    const isShaking = shakingCell && shakingCell.x === x && shakingCell.y === y;
                    const shakeClass = isShaking ? "animate-shake ring-2 ring-red-600 scale-95 z-30" : "";

                    return (
                        <div
                            key={`${x}-${y}`}
                            className={`
                                w-[8.5vw] h-[12vw] sm:w-[6vmin] sm:h-[8.5vmin] md:w-[4vw] md:h-[5.6vw] lg:w-[4.2vh] lg:h-[6vh] 
                                relative transition-all
                                ${highlightClass}
                                ${shakeClass}
                            `}
                        >
                            {/* Card Visual */}
                            <PlayingCard code={cardCode} mini onClick={() => onCellClick(x, y)} />

                            {/* Chip Overlay */}
                            {cell && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                    <div className={`
                                        w-3/4 h-3/4 max-w-[48px] max-h-[48px] rounded-full shadow-lg border-2 border-white/20
                                        ${cell === "BLUE" ? "bg-blue-600 shadow-blue-500/50" : "bg-red-600 shadow-red-500/50"}
                                        animate-bounce-in
                                    `}></div>
                                </div>
                            )}

                            {/* Last Move Indicator */}
                            {gameState.lastMove?.x === x && gameState.lastMove?.y === y && (
                                <div className="absolute inset-0 border-2 border-yellow-400 animate-pulse rounded pointer-events-none z-20"></div>
                            )}
                        </div>
                    );
                })
            ))}
        </div>
    );
}
