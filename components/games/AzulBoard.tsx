"use client";

import React, { useState } from "react";
import { AzulState, TileColor, WALL_PATTERN, AzulPlayer } from "@/lib/games/Azul";

interface AzulBoardProps {
    gameState: AzulState | null;
    onAction: (action: any) => void;
    playerUsername: string;
}

const TILE_COLORS: Record<string, string> = {
    BLUE: "bg-blue-500 shadow-blue-500/50",
    YELLOW: "bg-amber-400 shadow-amber-400/50",
    RED: "bg-red-600 shadow-red-600/50",
    BLACK: "bg-zinc-800 shadow-zinc-800/50",
    WHITE: "bg-slate-100 shadow-slate-100/50 text-black",
    FIRST_PLAYER: "bg-emerald-400 shadow-emerald-400/50 text-black font-bold flex items-center justify-center text-xs"
};

const WALL_COLORS: Record<string, string> = {
    BLUE: "bg-blue-900/40 border-blue-500/30",
    YELLOW: "bg-amber-900/40 border-amber-500/30",
    RED: "bg-red-900/40 border-red-500/30",
    BLACK: "bg-zinc-900/40 border-zinc-500/30",
    WHITE: "bg-slate-800/40 border-slate-500/30"
};

const FLOOR_PENALTIES = [-1, -1, -2, -2, -2, -3, -3];

const GRID_COLS_MAP: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5"
};

const COL_START_MAP: Record<number, string> = {
    1: "col-start-1",
    2: "col-start-2",
    3: "col-start-3",
    4: "col-start-4",
    5: "col-start-5"
};

const COL_SPAN_MAP: Record<number, string> = {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5"
};

export default function AzulBoard({ gameState, onAction, playerUsername }: AzulBoardProps) {
    const [selectedDraft, setSelectedDraft] = useState<{ source: "FACTORY" | "CENTER", index?: number, color: TileColor } | null>(null);

    if (!gameState || !gameState.players) return <div className="text-white">Loading Azul...</div>;

    const me = gameState.players[playerUsername];
    const isMyTurn = gameState.turnOrder[gameState.currentTurnIndex] === playerUsername;

    const handleDraftSelect = (source: "FACTORY" | "CENTER", color: TileColor, index?: number) => {
        if (!isMyTurn) return;
        if (gameState.phase !== "DRAFTING") return;
        if (selectedDraft?.source === source && selectedDraft?.color === color && selectedDraft?.index === index) {
            setSelectedDraft(null); // Deselect
        } else {
            setSelectedDraft({ source, color, index });
        }
    };

    const handlePlaceTiles = (patternLineIndex: number | "FLOOR") => {
        if (!isMyTurn || !selectedDraft) return;

        onAction({
            type: "DRAFT_TILES",
            payload: {
                source: selectedDraft.source,
                factoryIndex: selectedDraft.index,
                color: selectedDraft.color,
                patternLineIndex,
                username: playerUsername
            }
        });
        setSelectedDraft(null);
    };

    const getTilePattern = (color: TileColor) => {
        switch (color) {
            case "BLUE":
                return (
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay pointer-events-none">
                        <path d="M0,50 Q25,25 50,50 T100,50 T50,50 T0,50 M50,0 Q25,25 50,50 T50,100 T50,50 T50,0" stroke="white" strokeWidth="8" fill="none" />
                        <circle cx="50" cy="50" r="15" fill="white" />
                        <circle cx="50" cy="50" r="5" fill="#3b82f6" />
                    </svg>
                );
            case "YELLOW":
                return (
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-40 mix-blend-overlay pointer-events-none text-white">
                        <polygon points="50,5 60,35 95,35 65,55 75,90 50,70 25,90 35,55 5,35 40,35" fill="currentColor" />
                    </svg>
                );
            case "RED":
                return (
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay pointer-events-none">
                        <path d="M10,10 L90,90 M10,90 L90,10" stroke="white" strokeWidth="15" strokeLinecap="round" />
                        <rect x="35" y="35" width="30" height="30" fill="white" transform="rotate(45 50 50)" />
                    </svg>
                );
            case "BLACK":
                return (
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay pointer-events-none">
                        <rect x="20" y="20" width="60" height="60" stroke="white" strokeWidth="6" fill="none" />
                        <rect x="35" y="35" width="30" height="30" stroke="white" strokeWidth="6" fill="none" />
                        <circle cx="50" cy="50" r="5" fill="white" />
                    </svg>
                );
            case "WHITE":
                return (
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-10 mix-blend-overlay pointer-events-none">
                        <circle cx="20" cy="20" r="40" fill="black" />
                        <circle cx="80" cy="80" r="50" fill="black" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const renderTile = (
        color: TileColor,
        count: number = 1,
        isButton: boolean = false,
        onClick?: () => void,
        isSelected: boolean = false,
        sizeClass?: string,
        isMeBoard: boolean = true
    ) => {
        const finalSizeClass = sizeClass || "w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12";
        return (
            <>
                {Array(count).fill(0).map((_, i) => (
                    <div
                        key={`${color}-${i}`}
                        className={`${finalSizeClass} shrink-0 rounded sm:rounded-lg shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3),0_2px_3px_rgba(0,0,0,0.4)] sm:shadow-[inset_0_-3px_6px_rgba(0,0,0,0.3),0_4px_6px_rgba(0,0,0,0.4)] border flex items-center justify-center transition-all ${TILE_COLORS[color]} ${isSelected ? "border-white ring-2 sm:ring-4 ring-white animate-pulse scale-105 sm:scale-110 z-10" : "border-white/30"} ${isButton && !isSelected ? "hover:scale-110 hover:-translate-y-1 hover:border-white hover:shadow-[0_10px_15px_rgba(0,0,0,0.5)] cursor-pointer" : ""}`}
                        onClick={isButton ? onClick : undefined}
                    >
                        <div className="w-full h-full rounded-[4px] sm:rounded-[6px] border-t border-white/50 border-l border-white/40 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/30"></div>
                            {getTilePattern(color)}
                            {color === "FIRST_PLAYER" && (
                                <span className={`font-extrabold text-black drop-shadow-md ${sizeClass === "w-full aspect-square" ? (isMeBoard ? "text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-xs" : "text-[8px] sm:text-[10px]") : "text-xs sm:text-lg"}`}>
                                    {count > 1 ? `-${count}` : "-1"}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </>
        );
    };

    const renderPlayerBoard = (player: AzulPlayer, isMe: boolean) => {
        const gapClass = isMe ? "gap-2 sm:gap-4 md:gap-8" : "gap-1 sm:gap-1.5 md:gap-2 lg:gap-3";
        const paddingClass = isMe ? "p-3 sm:p-4 md:p-6" : "p-2 sm:p-3 lg:p-4";
        const patternLinePadding = isMe ? "p-1 sm:p-2" : "p-0.5 sm:p-1";
        const patternLineGap = isMe ? "gap-1 sm:gap-2" : "gap-0.5 sm:gap-1";
        const wallGap = isMe ? "gap-1 sm:gap-2" : "gap-0.5 sm:gap-1";
        
        const floorMinHeight = isMe ? "min-h-[3rem] sm:min-h-[4.5rem]" : "min-h-[2rem] sm:min-h-[3rem]";
        const floorPadding = isMe ? "p-2 sm:p-3" : "p-1 sm:p-2";
        const floorGap = isMe ? "gap-1 sm:gap-2" : "gap-0.5 sm:gap-1";
        const floorMargin = isMe ? "mt-4 sm:mt-8" : "mt-2 sm:mt-4";
        const floorCellGap = isMe ? "gap-0.5 sm:gap-1" : "gap-0";
        const penaltyTextSize = isMe ? "text-[8px] sm:text-[10px]" : "text-[7px] sm:text-[8px]";

        const boardPartMaxWidth = isMe 
            ? "w-full max-w-[160px] sm:max-w-[220px] md:max-w-[260px] xl:max-w-[200px] 2xl:max-w-[260px]" 
            : "w-full max-w-[110px] sm:max-w-[150px] md:max-w-[180px] xl:max-w-[130px] 2xl:max-w-[160px]";

        const floorLineMaxWidth = isMe 
            ? "w-full max-w-[220px] sm:max-w-[300px] md:max-w-[360px] xl:max-w-[280px] 2xl:max-w-[360px]" 
            : "w-full max-w-[150px] sm:max-w-[210px] md:max-w-[250px] xl:max-w-[180px] 2xl:max-w-[220px]";

        return (
            <div className={`flex flex-col ${paddingClass} rounded-2xl bg-gradient-to-br from-zinc-900 to-black border-2 shadow-2xl transition-all ${isMe ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "border-white/10"} h-full`}>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h3 className={`text-base sm:text-xl font-bold ${isMe ? "text-indigo-400" : "text-white"}`}>
                        {player.username} {isMe && "(You)"}
                    </h3>
                    <div className="px-2.5 sm:px-4 py-1 sm:py-2 bg-black/50 rounded-lg border border-white/10 flex items-center">
                        <span className="text-gray-400 text-xs sm:text-sm mr-1.5 sm:mr-2">Score</span>
                        <span className="text-lg sm:text-2xl font-bold text-white">{player.score}</span>
                    </div>
                </div>

                <div className={`flex flex-row ${gapClass} justify-center items-center flex-1`}>
                    {/* Pattern Lines */}
                    <div className={`flex flex-col gap-1.5 sm:gap-2 shrink-0 ${boardPartMaxWidth}`}>
                        {player.patternLines.map((line, i) => {
                            const capacity = i + 1;
                            const emptySpaces = capacity - line.length;

                            const isValidTarget = selectedDraft &&
                                (line.length === 0 || line[0] === selectedDraft.color) &&
                                line.length < capacity &&
                                !player.wall[i][WALL_PATTERN[i].indexOf(selectedDraft.color)];

                            const gridColsClass = GRID_COLS_MAP[capacity];
                            const colStartClass = COL_START_MAP[6 - capacity];
                            const colSpanClass = COL_SPAN_MAP[capacity];

                            const totalSlots = 5;
                            const invisibleSpaces = totalSlots - capacity;

                            return (
                                <div
                                    key={`pattern-${i}`}
                                    className={`grid grid-cols-5 ${patternLineGap} rounded-lg sm:rounded-xl relative ${isValidTarget ? "cursor-pointer" : ""}`}
                                    onClick={() => isValidTarget ? handlePlaceTiles(i) : undefined}
                                >
                                    {/* Absolute Background covering only the active columns */}
                                    <div
                                        className={`absolute ${colStartClass} col-end-6 -inset-[2px] sm:-inset-[3px] rounded-lg sm:rounded-xl transition-colors pointer-events-none ${isValidTarget ? "bg-white/10 ring-2 ring-[#9b51e0]" : "bg-black/20"}`}
                                    />

                                    {/* Grid Items (rendered on top of absolute background) */}
                                    {Array(invisibleSpaces).fill(0).map((_, j) => (
                                        <div key={`inv-${j}`} className="invisible aspect-square"></div>
                                    ))}
                                    {Array(emptySpaces).fill(0).map((_, j) => (
                                        <div key={`empty-${j}`} className="w-full aspect-square rounded sm:rounded-lg border-2 border-dashed border-white/20 bg-white/5 shrink-0 z-10 pointer-events-none"></div>
                                    ))}
                                    {line.map((color, j) => (
                                        <React.Fragment key={`tile-${j}`}>
                                            {renderTile(color, 1, false, undefined, false, "w-full aspect-square z-10 pointer-events-none", isMe)}
                                        </React.Fragment>
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    {/* Wall */}
                    <div className={`grid grid-cols-5 ${wallGap} bg-black/40 ${isMe ? "p-2 sm:p-3" : "p-1 sm:p-2"} rounded-lg sm:rounded-xl border border-white/5 shrink-0 ${boardPartMaxWidth}`}>
                        {player.wall.map((row, i) =>
                            row.map((isFilled, j) => {
                                const color = WALL_PATTERN[i][j];
                                return (
                                    <div key={`wall-${i}-${j}`} className={`w-full aspect-square shrink-0 rounded sm:rounded-lg border-2 flex items-center justify-center transition-all ${isFilled ? TILE_COLORS[color] : WALL_COLORS[color]}`}>
                                        <div className="w-full h-full rounded sm:rounded-md border-t border-white/30 mix-blend-overlay"></div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Floor Line */}
                <div className={`${floorMargin} flex justify-center w-full`}>
                    <div
                        className={`grid grid-cols-7 ${floorGap} ${floorPadding} rounded-lg sm:rounded-xl transition-colors ${floorMinHeight} w-full ${floorLineMaxWidth} ${selectedDraft && isMe ? "bg-red-900/20 cursor-pointer hover:bg-red-900/40 ring-2 ring-red-500/50" : "bg-black/20"}`}
                        onClick={() => (selectedDraft && isMe) ? handlePlaceTiles("FLOOR") : undefined}
                    >
                        {Array(7).fill(0).map((_, i) => {
                            const tile = player.floorLine[i];
                            return (
                                <div key={`floor-${i}`} className={`flex flex-col items-center ${floorCellGap} w-full`}>
                                    {tile ? (
                                        renderTile(tile, 1, false, undefined, false, "w-full aspect-square", isMe)
                                    ) : (
                                        <div className="w-full aspect-square rounded sm:rounded-lg border-2 border-dashed border-red-500/30 bg-red-500/5 flex-shrink-0"></div>
                                    )}
                                    <span className={`${penaltyTextSize} text-red-400 font-bold whitespace-nowrap`}>{FLOOR_PENALTIES[i]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const marketTileSize = "w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 xl:w-7 xl:h-7 2xl:w-8 2xl:h-8";

    return (
        <div className="w-full h-full bg-deep-navy overflow-y-auto p-2 sm:p-4 md:p-8 flex flex-col custom-scrollbar">
            {/* Mobile Header & Status (hidden on desktop) */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3 sm:gap-4 bg-warm-black/80 p-3 sm:p-4 rounded-xl border border-white/10 backdrop-blur-sm xl:hidden w-full shrink-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-amber-300 to-red-500">
                        AZUL
                    </h2>
                    <div className="h-6 sm:h-8 w-px bg-white/20 hidden sm:block"></div>
                    <div className="text-xs sm:text-sm text-gray-300">Phase: <span className="text-white font-bold">{gameState.phase}</span></div>
                    <div className="text-xs sm:text-sm text-gray-300">Bag: <span className="text-white font-bold">{gameState.bag.length}</span></div>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 flex flex-col xl:flex-row gap-6 sm:gap-8 items-start xl:items-stretch w-full">
                {/* Factories and Center (Left Column) */}
                <div className="w-full xl:w-[25%] 2xl:w-[22%] flex flex-col gap-4 bg-black/20 p-3 sm:p-4 md:p-6 rounded-3xl border border-white/5 shrink-0">
                    <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-[#4b90ff] to-[#9b51e0] font-bold text-center text-lg sm:text-xl tracking-widest uppercase shadow-black/50 drop-shadow-md mb-1 sm:mb-2">Market</h3>

                    {/* Market Layout */}
                    <div className="flex flex-col gap-3 sm:gap-4 w-full flex-1 justify-center">
                        {/* Center Pool */}
                        <div className="bg-warm-black p-2 sm:p-4 xl:p-3 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg mx-auto w-full mb-1 sm:mb-2 min-h-[100px] sm:min-h-[140px] xl:min-h-[100px] 2xl:min-h-[120px]">
                            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3">
                                {/* Group center tiles by color for easier drafting */}
                                {["FIRST_PLAYER", "BLUE", "YELLOW", "RED", "BLACK", "WHITE"].map(c => {
                                    const color = c as TileColor;
                                    const count = gameState.center.filter(t => t === color).length;
                                    if (count === 0) return null;

                                    const isSelected = selectedDraft?.source === "CENTER" && selectedDraft?.color === color;

                                    return (
                                        <React.Fragment key={`center-${color}`}>
                                            {renderTile(color, count, isMyTurn, () => handleDraftSelect("CENTER", color), isSelected, marketTileSize)}
                                        </React.Fragment>
                                    );
                                })}
                                {gameState.center.length === 0 && (
                                    <span className="text-white/20 text-xs sm:text-sm font-medium tracking-widest uppercase">Center Empty</span>
                                )}
                            </div>
                        </div>

                        {/* Factories */}
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                            {gameState.factories.map((factory, index) => (
                                <div key={`factory-${index}`} className="bg-black/40 rounded-xl w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 xl:w-20 xl:h-20 2xl:w-24 2xl:h-24 p-1.5 sm:p-3 xl:p-1.5 2xl:p-2 border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-wrap place-content-center gap-1 sm:gap-1.5 xl:gap-0.5 2xl:gap-1 relative transition-transform hover:-translate-y-1 cursor-pointer">
                                    {factory.length > 0 ? (
                                        // Group factory tiles
                                        ["BLUE", "YELLOW", "RED", "BLACK", "WHITE"].map(c => {
                                            const color = c as TileColor;
                                            const count = factory.filter(t => t === color).length;
                                            if (count === 0) return null;

                                            const isSelected = selectedDraft?.source === "FACTORY" && selectedDraft?.index === index && selectedDraft?.color === color;

                                            return (
                                                <React.Fragment key={`factory-${index}-${color}`}>
                                                    {renderTile(color, count, isMyTurn, () => handleDraftSelect("FACTORY", color, index), isSelected, marketTileSize)}
                                                </React.Fragment>
                                            );
                                        })
                                    ) : (
                                        <span className="text-white/20 text-[9px] sm:text-xs font-medium text-center w-full uppercase tracking-widest absolute self-center">Empty</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Player Board (Middle Column) */}
                <div className="w-full xl:flex-1 flex flex-col gap-6">
                    {me && renderPlayerBoard(me, true)}
                </div>

                {/* Opponents Boards (Right Column on xl, bottom stack otherwise) */}
                <div className="w-full xl:w-[32%] 2xl:w-[28%] shrink-0 flex flex-col gap-6">
                    {/* Desktop Header & Status (hidden on mobile) */}
                    <div className="hidden xl:flex flex-col sm:flex-row justify-between items-center gap-3 bg-warm-black/80 p-3 sm:p-4 rounded-xl border border-white/10 backdrop-blur-sm shrink-0 w-full">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-amber-300 to-red-500">
                                AZUL
                            </h2>
                            <div className="h-6 sm:h-8 w-px bg-white/20 hidden sm:block"></div>
                            <div className="text-xs sm:text-sm text-gray-300">Phase: <span className="text-white font-bold">{gameState.phase}</span></div>
                            <div className="text-xs sm:text-sm text-gray-300">Bag: <span className="text-white font-bold">{gameState.bag.length}</span></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1 gap-6">
                        {gameState.turnOrder.filter(u => u !== playerUsername).map(username => (
                            <div key={username} className="opacity-80 hover:opacity-100 transition-opacity">
                                {renderPlayerBoard(gameState.players[username], false)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
