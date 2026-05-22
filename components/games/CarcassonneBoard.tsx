"use client";
import { useState } from "react";
import {
    CarcassonneState,
    TILE_DEFINITIONS,
    Direction,
    CarcassonneAction,
    getRotatedEdges,
    isValidPlacement
} from "../../lib/games/Carcassonne";

interface CarcassonneBoardProps {
    gameState: CarcassonneState;
    onAction: (action: CarcassonneAction | any) => void;
    playerUsername: string;
}

export default function CarcassonneBoard({ gameState, onAction, playerUsername }: CarcassonneBoardProps) {
    // Canvas State
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragStartCoords, setDragStartCoords] = useState({ x: 0, y: 0 });

    // Ghost Tile State
    const [hoverPos, setHoverPos] = useState<{ x: number, y: number } | null>(null);

    const TILE_SIZE = 150; // Bigger tiles for more detail
    const isMyTurn = gameState?.turnOrder?.[gameState?.currentTurnIndex] === playerUsername;

    // --- Interaction Handlers ---

    const handleWheel = (e: React.WheelEvent) => {
        setZoom(z => Math.max(0.2, Math.min(2, z + e.deltaY * -0.001)));
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button === 0) { // Left click to drag
            setIsDragging(true);
            setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
            setDragStartCoords({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) {
            setOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const curX = e.clientX - rect.left - rect.width / 2 - offset.x;
        const curY = e.clientY - rect.top - rect.height / 2 - offset.y;

        const gridX = Math.round(curX / (TILE_SIZE * zoom));
        const gridY = Math.round(curY / (TILE_SIZE * zoom));

        if (gridX !== hoverPos?.x || gridY !== hoverPos?.y) {
            setHoverPos({ x: gridX, y: gridY });
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(false);
        const dx = e.clientX - dragStartCoords.x;
        const dy = e.clientY - dragStartCoords.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 8) {
            handleTap(e.clientX, e.clientY, e.currentTarget);
        }
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            setIsDragging(true);
            setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
            setDragStartCoords({ x: touch.clientX, y: touch.clientY });
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (isDragging && e.touches.length === 1) {
            const touch = e.touches[0];
            setOffset({
                x: touch.clientX - dragStart.x,
                y: touch.clientY - dragStart.y
            });
        }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        setIsDragging(false);
        if (e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            const dx = touch.clientX - dragStartCoords.x;
            const dy = touch.clientY - dragStartCoords.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 8) {
                handleTap(touch.clientX, touch.clientY, e.currentTarget);
            }
        }
    };

    const handleTap = (clientX: number, clientY: number, target: HTMLDivElement) => {
        const rect = target.getBoundingClientRect();
        const curX = clientX - rect.left - rect.width / 2 - offset.x;
        const curY = clientY - rect.top - rect.height / 2 - offset.y;

        const gridX = Math.round(curX / (TILE_SIZE * zoom));
        const gridY = Math.round(curY / (TILE_SIZE * zoom));

        setHoverPos({ x: gridX, y: gridY });
    };

    const handlePlaceTile = () => {
        if (!isMyTurn || !hoverPos || gameState.phase !== "PLACING_TILE") return;

        // Final validation before sending
        if (!isValidPlacement(gameState.board, gameState.currentTileId!, gameState.currentTileRotation, hoverPos.x, hoverPos.y)) {
            return;
        }

        onAction({
            type: "PLACE_TILE",
            playerId: playerUsername,
            payload: { x: hoverPos.x, y: hoverPos.y }
        });
    };

    const handlePlaceMeeple = (featureIndex: number) => {
        if (!isMyTurn || gameState.phase !== "PLACING_MEEPLE") return;
        onAction({
            type: "PLACE_MEEPLE",
            playerId: playerUsername,
            payload: featureIndex
        });
    };

    const handleSkipMeeple = () => {
        if (!isMyTurn || gameState.phase !== "PLACING_MEEPLE") return;
        onAction({
            type: "SKIP_MEEPLE",
            playerId: playerUsername
        });
    };

    // --- Renderers ---

    const renderTileContent = (tileId: string, rot: Direction, isGhost = false, isValid = true, x?: number, y?: number) => {
        const def = TILE_DEFINITIONS[tileId];
        if (!def) return <rect width="100%" height="100%" fill="#333" />;

        const edges = getRotatedEdges(tileId, rot);
        const GRASS = "#166534"; // green-800
        const STONE = "#78350f"; // amber-900 (City)
        const ROAD_COLOR = "#cbd5e1"; // slate-300

        const isLastPlaced = gameState.lastPlacedTile?.x === x && gameState.lastPlacedTile?.y === y;
        const isMeeplePhase = gameState.phase === "PLACING_MEEPLE" && isLastPlaced && isMyTurn;

        return (
            <svg viewBox="0 0 100 100" className={`w-full h-full transition-all duration-300 ${isGhost && !isValid ? "opacity-40 grayscale" : ""}`}>
                <rect width="100" height="100" fill={GRASS} />

                {/* Visual Feedback for Valid/Invalid placement in Ghost mode */}
                {isGhost && (
                    <rect width="100" height="100" fill={isValid ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.3)"} />
                )}

                {/* Center Feature */}
                {def.center === "MONASTERY" && (
                    <g transform="translate(30,30)">
                        <rect width="40" height="40" fill="#a8a29e" rx="4" />
                        <path d="M 20,5 L 20,35 M 5,20 L 35,20" stroke="white" strokeWidth="2" opacity="0.5" />
                    </g>
                )}
                {def.center === "CITY_FULL" && (
                    <circle cx="50" cy="50" r="45" fill={STONE} />
                )}

                {/* Edges */}
                {edges.map((type, side) => {
                    const rotations = [0, 90, 180, 270];
                    return (
                        <g key={side} transform={`rotate(${rotations[side]}, 50, 50)`}>
                            {type === "ROAD" && <rect x="45" y="0" width="10" height="50" fill={ROAD_COLOR} />}
                            {type === "CITY" && <path d="M 0,0 Q 50,40 100,0 Z" fill={STONE} />}
                        </g>
                    );
                })}

                {/* Shield Icon if applicable */}
                {def.shield && (
                    <circle cx="50" cy="50" r="8" fill="#3b82f6" stroke="white" strokeWidth="2" />
                )}

                {/* Meeple Hotspots if in placement phase */}
                {isMeeplePhase && (
                    <>
                        <circle cx="50" cy="15" r="8" fill="white" fillOpacity="0.4" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={(e) => { e.stopPropagation(); handlePlaceMeeple(0); }} />
                        <circle cx="85" cy="50" r="8" fill="white" fillOpacity="0.4" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={(e) => { e.stopPropagation(); handlePlaceMeeple(1); }} />
                        <circle cx="50" cy="85" r="8" fill="white" fillOpacity="0.4" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={(e) => { e.stopPropagation(); handlePlaceMeeple(2); }} />
                        <circle cx="15" cy="50" r="8" fill="white" fillOpacity="0.4" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={(e) => { e.stopPropagation(); handlePlaceMeeple(3); }} />
                        <circle cx="50" cy="50" r="10" fill="white" fillOpacity="0.4" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={(e) => { e.stopPropagation(); handlePlaceMeeple(4); }} />
                    </>
                )}

                {/* Placed Meeples on this tile */}
                {gameState.placedMeeples.filter(m => m.x === x && m.y === y).map((m, idx) => {
                    const positions = [
                        { cx: 50, cy: 15 }, // Top
                        { cx: 85, cy: 50 }, // Right
                        { cx: 50, cy: 85 }, // Bottom
                        { cx: 15, cy: 50 }, // Left
                        { cx: 50, cy: 50 }  // Center
                    ];
                    const pos = positions[m.featureIndex];
                    const playerColor = gameState.players[m.ownerId]?.color || "white";
                    return (
                        <g key={idx} transform={`translate(${pos.cx - 10}, ${pos.cy - 12})`}>
                            <path d="M 10,2 C 7,2 5,4 5,7 L 5,10 L 2,12 L 2,18 L 18,18 L 18,12 L 15,10 L 15,7 C 15,4 13,2 10,2 Z" fill={playerColor} stroke="black" strokeWidth="1" />
                            <circle cx="10" cy="6" r="3" fill={playerColor} stroke="black" strokeWidth="1" />
                        </g>
                    );
                })}

                {/* Border */}
                <rect width="100" height="100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            </svg>
        );
    };

    const isHoverValid = hoverPos && gameState.currentTileId && isValidPlacement(gameState.board, gameState.currentTileId, gameState.currentTileRotation, hoverPos.x, hoverPos.y);

    return (
        <div className="flex h-full w-full bg-warm-black relative overflow-hidden select-none font-sans">
            {/* Map Interaction Layer */}
            <div
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
            >
                <div
                    className="absolute top-1/2 left-1/2"
                    style={{
                        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`
                    }}
                >
                    {/* Grid Guide (Subtle) */}
                    <div className="absolute opacity-10 pointer-events-none" style={{ width: 5000, height: 5000, transform: 'translate(-50%, -50%)', backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px` }} />

                    {/* Placed Tiles */}
                    {Object.values(gameState.board).map(tile => (
                        <div
                            key={`${tile.x},${tile.y}`}
                            className="absolute shadow-lg"
                            style={{
                                width: TILE_SIZE,
                                height: TILE_SIZE,
                                left: tile.x * TILE_SIZE,
                                top: tile.y * TILE_SIZE,
                            }}
                        >
                            {renderTileContent(tile.tileId, tile.rotation, false, true, tile.x, tile.y)}
                        </div>
                    ))}

                    {/* Ghost Tile */}
                    {isMyTurn && hoverPos && !gameState.board[`${hoverPos.x},${hoverPos.y}`] && (
                        <div
                            className={`absolute z-10 cursor-pointer overflow-hidden rounded-sm transition-all duration-200 ${isHoverValid ? "ring-4 ring-green-500 shadow-2xl scale-105" : "ring-4 ring-red-500 opacity-50 grayscale cursor-not-allowed"}`}
                            onClick={handlePlaceTile}
                            style={{
                                width: TILE_SIZE,
                                height: TILE_SIZE,
                                left: hoverPos.x * TILE_SIZE,
                                top: hoverPos.y * TILE_SIZE,
                            }}
                        >
                            {renderTileContent(gameState.currentTileId!, gameState.currentTileRotation, true, !!isHoverValid)}
                            {isHoverValid && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="bg-black/60 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-widest animate-pulse">Click to Place</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Player Info (Top Right) */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col items-end gap-2 z-30 pointer-events-none max-w-[calc(100%-2rem)]">
                <div className="flex flex-row md:flex-col flex-wrap justify-end gap-2 pointer-events-auto">
                    {Object.values(gameState.players).map(p => (
                        <div key={p.username} className={`flex items-center gap-1.5 sm:gap-3 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full border-2 transition-all backdrop-blur-md shadow-lg ${p.username === gameState.turnOrder[gameState.currentTurnIndex] ? "bg-indigo-500/20 border-indigo-500/50 text-white ring-2 ring-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.25)]" : "bg-warm-black/60 border-white/10 opacity-70 hover:opacity-100"}`}>
                            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: p.color }} />
                            <span className="text-[10px] sm:text-xs font-bold truncate max-w-[80px] sm:max-w-none">{p.username}</span>

                            {/* Meeples */}
                            <div className="flex items-center gap-0.5 sm:gap-1 bg-black/30 px-1.5 sm:px-2 py-0.5 rounded-full">
                                <span className="text-[8px] sm:text-[9px] text-stone-400">♟</span>
                                <span className="text-[10px] sm:text-xs font-mono font-bold">{p.meeples}</span>
                            </div>

                            {/* Score */}
                            <span className="text-[10px] sm:text-xs font-bold text-indigo-400 bg-indigo-500/10 px-1.5 sm:px-2 py-0.5 rounded-full min-w-[24px] sm:min-w-[30px] text-center">{p.score}</span>
                        </div>
                    ))}
                </div>
                {/* Tiles Left Badge */}
                <div className="bg-warm-black/80 backdrop-blur border border-white/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] text-stone-500 font-bold uppercase tracking-widest shadow-lg">
                    Tiles Left: <span className="text-white">{gameState.deck.length}</span>
                </div>
            </div>

            <div className="absolute bottom-4 left-4 hidden sm:block bg-stone-900/40 backdrop-blur text-[10px] text-stone-500 uppercase tracking-widest px-3 py-1 rounded-full border border-white/5 pointer-events-none z-30">
                Wheel: Zoom | Drag: Pan
            </div>
            <div className="absolute bottom-4 left-4 block sm:hidden bg-stone-900/40 backdrop-blur text-[9px] text-stone-500 uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/5 pointer-events-none z-30">
                Drag: Pan | Tap to Select
            </div>

            {/* Zoom Controls for Mobile/Touchscreens */}
            <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 flex flex-col gap-2 z-30 pointer-events-auto">
                <button
                    onClick={() => setZoom(z => Math.min(2, z + 0.15))}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warm-black/80 backdrop-blur border border-white/10 text-white text-base sm:text-xl font-bold flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:text-indigo-400 hover:border-indigo-500/30"
                >
                    ＋
                </button>
                <button
                    onClick={() => setZoom(z => Math.max(0.3, z - 0.15))}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warm-black/80 backdrop-blur border border-white/10 text-white text-base sm:text-xl font-bold flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:text-indigo-400 hover:border-indigo-500/30"
                >
                    －
                </button>
            </div>

            {/* Current Tile & Controls (Bottom Center Console) */}
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center gap-2 sm:gap-4 z-40 max-w-[95%]">
                {/* Main Control Deck */}
                <div className="bg-warm-black/95 backdrop-blur-xl border-2 border-indigo-500/30 p-2.5 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl pointer-events-auto flex items-center gap-4 sm:gap-8 relative overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 via-transparent to-transparent pointer-events-none" />

                    {gameState.phase === "PLACING_TILE" ? (
                        <>
                            {/* Left: Rotate */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onAction({ type: "ROTATE_TILE", playerId: playerUsername }); }}
                                disabled={!isMyTurn}
                                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all ${isMyTurn ? "bg-stone-800 hover:bg-stone-700 text-white hover:scale-105 active:scale-95 shadow-lg border border-white/10" : "bg-stone-900/50 text-stone-700 border border-white/5 cursor-not-allowed"}`}
                                title="Rotate Tile"
                            >
                                <span className="text-lg sm:text-2xl mb-0.5 sm:mb-1">↺</span>
                                <span className="text-[7px] sm:text-[8px] uppercase font-bold tracking-widest">Rotate</span>
                            </button>

                            {/* Center: The Tile */}
                            <div className="flex flex-col items-center gap-1 sm:gap-2">
                                <span className="text-[8px] sm:text-[9px] uppercase font-black text-indigo-400 tracking-[0.2em]">Current Tile</span>
                                <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl ring-2 sm:ring-4 ring-black/50 bg-stone-800 transform hover:scale-105 transition-transform cursor-grab active:cursor-grabbing relative">
                                    {gameState.currentTileId
                                        ? renderTileContent(gameState.currentTileId!, gameState.currentTileRotation)
                                        : <div className="flex items-center justify-center h-full text-stone-600 animate-pulse text-xs">No Tile</div>
                                    }
                                    {/* Glass reflection effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                                </div>
                            </div>

                            {/* Right: Skip */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onAction({ type: "SKIP_TURN", playerId: playerUsername }); }}
                                disabled={!isMyTurn}
                                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all ${isMyTurn ? "bg-stone-800 hover:bg-red-900/40 text-stone-400 hover:text-red-200 hover:scale-105 active:scale-95 border border-white/10" : "bg-stone-900/50 text-stone-700 border border-white/5 cursor-not-allowed"}`}
                                title="Skip Turn"
                            >
                                <span className="text-base sm:text-xl mb-0.5 sm:mb-1">⏭</span>
                                <span className="text-[7px] sm:text-[8px] uppercase font-bold tracking-widest">Skip</span>
                            </button>
                        </>
                    ) : (
                        /* Meeple Phase Controls */
                        <div className="flex flex-col items-center gap-2 sm:gap-4 px-4 sm:px-8 py-1 sm:py-2">
                            <span className="text-indigo-400 font-bold text-xs sm:text-sm tracking-widest uppercase animate-pulse">Place Your Meeple</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSkipMeeple(); }}
                                disabled={!isMyTurn}
                                className={`px-4 sm:px-8 py-1.5 sm:py-3 rounded-lg sm:rounded-xl font-bold transition-all shadow-lg text-xs sm:text-sm uppercase tracking-wider ${isMyTurn ? "bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 border border-emerald-400" : "bg-stone-800 text-stone-600 cursor-not-allowed"}`}
                            >
                                Done / No Meeple
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Turn Status Toast */}
            <div className={`absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 px-3 sm:px-6 py-1 sm:py-2 rounded-full border-2 transition-all duration-300 z-30 ${isMyTurn ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" : "bg-warm-black border-white/10 text-stone-500"}`}>
                <span className="font-bold tracking-widest text-[10px] sm:text-sm uppercase whitespace-nowrap">
                    {isMyTurn
                        ? (gameState?.phase === "PLACING_TILE" ? "✦ Place Your Tile ✦" : "✦ Place a Meeple ✦")
                        : `Waiting for ${gameState?.turnOrder?.[gameState?.currentTurnIndex] || "opponent"}`
                    }
                </span>
            </div>
        </div>
    );
}
