"use client";

import { useEffect, useState, useRef } from "react";
import Chat from "./Chat";
import SequenceBoard from "./games/SequenceBoard";
import PlayingCard from "./games/PlayingCard";
import SplendorBoard from "./games/SplendorBoard";
import CarcassonneBoard from "./games/CarcassonneBoard";
import AzulBoard from "./games/AzulBoard";
import Hand from "./games/Hand";
import VictoryModal from "./VictoryModal";
import HowToPlayModal from "./HowToPlayModal";
import InteractiveBackground from "./InteractiveBackground";

import { BOARD_LAYOUT, isDeadCard } from "../lib/games/Sequence";

export default function GameRoom({ socket, username, roomId, onLeave, gameState, setGameState }: { socket: any, username: string, roomId: string, onLeave: () => void, gameState: any, setGameState: React.Dispatch<React.SetStateAction<any>> }) {
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [hasAutoClosedChat, setHasAutoClosedChat] = useState(false);

    const [localGameState, setLocalGameState] = useState<any>(null);
    const prevGameStateRef = useRef<any>(null);
    const [animatingCard, setAnimatingCard] = useState<{
        card: string;
        type: "PLAY" | "REMOVE" | "DISCARD";
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        width: number;
        height: number;
        team?: string;
        active: boolean;
        opponentName: string;
    } | null>(null);
    const [animationProgress, setAnimationProgress] = useState<"start" | "end">("start");

    const getCardName = (code: string) => {
        if (!code || code === "XX") return "Free Corner";
        const rank = code.slice(0, -1);
        const suitCode = code.slice(-1);
        const suits: Record<string, string> = { H: "♥", D: "♦", C: "♣", S: "♠" };
        return `${rank}${suits[suitCode] || ""}`;
    };

    const handleCopyRoomId = () => {
        navigator.clipboard.writeText(roomId).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleCopyInviteLink = () => {
        if (typeof window !== "undefined") {
            const inviteUrl = `${window.location.origin}/?room=${roomId}`;
            navigator.clipboard.writeText(inviteUrl).then(() => {
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
            });
        }
    };

    const [errorNotification, setErrorNotification] = useState<string | null>(null);
    const [shakingCell, setShakingCell] = useState<{ x: number, y: number } | null>(null);
    const [shakeHand, setShakeHand] = useState(false);

    const triggerValidationError = (message: string, options?: { x?: number, y?: number, shakeHand?: boolean }) => {
        setErrorNotification(message);
        if (options?.x !== undefined && options?.y !== undefined) {
            setShakingCell({ x: options.x, y: options.y });
            setTimeout(() => setShakingCell(null), 400);
        }
        if (options?.shakeHand) {
            setShakeHand(true);
            setTimeout(() => setShakeHand(false), 400);
        }
    };

    useEffect(() => {
        if (!errorNotification) return;
        const timer = setTimeout(() => {
            setErrorNotification(null);
        }, 4000);
        return () => clearTimeout(timer);
    }, [errorNotification]);


    useEffect(() => {
        if (!socket) return;

        socket.on("error", (errorMessage: string) => {
            triggerValidationError(errorMessage);
        });

        return () => {
            socket.off("error");
        };
    }, [socket]);

    useEffect(() => {
        if (gameState?.players && "AI_PLAYER" in gameState.players && !hasAutoClosedChat) {
            setShowChat(false);
            setHasAutoClosedChat(true);
        }
    }, [gameState, hasAutoClosedChat]);

    useEffect(() => {
        if (!gameState) return;

        const isSplendor = gameState?.market !== undefined;
        const isAzul = gameState?.factories !== undefined;
        const isCarcassonne = gameState?.placedMeeples !== undefined || gameState?.currentTileId !== undefined;
        const isSequence = (gameState?.currentTurn === "BLUE" || gameState?.currentTurn === "RED") && !isSplendor && !isCarcassonne && !isAzul;

        if (!localGameState) {
            setLocalGameState(gameState);
            prevGameStateRef.current = gameState;
            return;
        }

        const prev = prevGameStateRef.current;

        if (isSequence && prev && gameState.lastAction && gameState.lastAction.playerId !== username) {
            const isNewAction = !prev.lastAction ||
                prev.lastAction.playerId !== gameState.lastAction.playerId ||
                prev.lastAction.type !== gameState.lastAction.type ||
                prev.lastAction.card !== gameState.lastAction.card ||
                prev.lastAction.x !== gameState.lastAction.x ||
                prev.lastAction.y !== gameState.lastAction.y;

            if (isNewAction) {
                const action = gameState.lastAction;
                const opponentName = action.playerId === "AI_PLAYER" ? "AI Player" : action.playerId || "Opponent";
                const opponentTeam = gameState.players?.[action.playerId] || (playerTeam === "BLUE" ? "RED" : "BLUE");
                
                const startX = typeof window !== "undefined" ? window.innerWidth / 2 : 500;
                const startY = 80;

                let endX = startX;
                let endY = typeof window !== "undefined" ? window.innerHeight / 2 : 500;
                let targetWidth = 40;
                let targetHeight = 40;

                if (action.x !== undefined && action.y !== undefined) {
                    const cellElement = document.getElementById(`sequence-cell-${action.x}-${action.y}`);
                    if (cellElement) {
                        const rect = cellElement.getBoundingClientRect();
                        endX = rect.left + rect.width / 2;
                        endY = rect.top + rect.height / 2;
                        targetWidth = Math.min(rect.width * 0.75, 48);
                        targetHeight = Math.min(rect.height * 0.75, 48);
                    }
                }

                setAnimatingCard({
                    card: action.card || "",
                    type: action.type === "PLAY_CARD" ? "PLAY" : action.type === "REMOVE_CHIP" ? "REMOVE" : "DISCARD",
                    startX,
                    startY,
                    endX,
                    endY,
                    width: targetWidth,
                    height: targetHeight,
                    team: opponentTeam,
                    active: true,
                    opponentName
                });
                setAnimationProgress("start");

                const animTimer = setTimeout(() => {
                    setAnimationProgress("end");
                }, 50);

                const stateTimer = setTimeout(() => {
                    setLocalGameState(gameState);
                    setAnimatingCard(null);
                }, 600);

                prevGameStateRef.current = gameState;
                return () => {
                    clearTimeout(animTimer);
                    clearTimeout(stateTimer);
                };
            }
        }

        setLocalGameState(gameState);
        prevGameStateRef.current = gameState;
    }, [gameState, username, localGameState]);

    const handleSequenceMove = (x: number, y: number) => {
        const cardCode = BOARD_LAYOUT[y]?.[x];
        const cell = gameState?.board?.[y]?.[x];

        // 1. Handle Chip Removal
        if (gameState?.pendingAction?.type === "REMOVE_CHIP" && gameState.pendingAction.playerId === username) {
            if (!cell || cell === playerTeam) {
                triggerValidationError("Choose an opponent's chip to remove!", { x, y });
                return;
            }
            socket.emit("make_move", {
                roomId,
                action: {
                    type: "REMOVE_CHIP",
                    payload: {
                        playerId: username,
                        x,
                        y
                    }
                }
            });
            return;
        }

        // 2. Handle Normal Play
        if (!selectedCard) {
            triggerValidationError("Select a card first!", { shakeHand: true });
            return;
        }

        const isTwoEyed = selectedCard === "JC" || selectedCard === "JD";
        const isOneEyed = selectedCard === "JS" || selectedCard === "JH";

        if (isOneEyed) {
            if (!cell || cell === playerTeam) {
                triggerValidationError("Select an opponent's chip to remove!", { x, y });
                return;
            }
        } else {
            if (cell !== null) {
                triggerValidationError("Space is occupied!", { x, y });
                return;
            }
            if (cardCode === "XX") {
                triggerValidationError("Cannot play on free spaces!", { x, y });
                return;
            }
            if (!isTwoEyed && cardCode !== selectedCard) {
                triggerValidationError(`Selected card (${selectedCard}) does not match board space (${cardCode})!`, { x, y, shakeHand: true });
                return;
            }
        }

        socket.emit("make_move", {
            roomId,
            action: {
                type: "PLAY_CARD",
                payload: {
                    playerId: username,
                    card: selectedCard,
                    x,
                    y
                }
            }
        });

        setSelectedCard(null);
    };

    const handleSplendorAction = (action: any) => {
        socket.emit("make_move", { roomId, action });
    };

    const currentRenderState = localGameState || gameState;
    const myHand = gameState?.hands?.[username] || [];
    const playerTeam = gameState?.players?.[username]; // Only for Sequence (string like "BLUE")

    // Game Type Detection - Use unique properties for each game
    const isSplendor = gameState?.market !== undefined;
    const isAzul = gameState?.factories !== undefined;
    // Carcassonne has turnOrder (array) and placedMeeples
    const isCarcassonne = gameState?.placedMeeples !== undefined || gameState?.currentTileId !== undefined;
    // Sequence has currentTurn as a team string ("BLUE"/"RED") and board as 2D array
    const isSequence = (gameState?.currentTurn === "BLUE" || gameState?.currentTurn === "RED") && !isSplendor && !isCarcassonne && !isAzul;

    const isMyTurn = (isSplendor || isCarcassonne || isAzul)
        ? gameState.turnOrder?.[gameState.currentTurnIndex] === username
        : currentRenderState?.currentTurn === playerTeam;

    return (
        <div className="flex bg-gradient-to-br from-[#080b11] via-[#121824] to-[#1a1128] animate-gradient h-screen w-full overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
            <InteractiveBackground />

            {/* Mobile Chat Backdrop Overlay */}
            {showChat && (
                <button
                    onClick={() => setShowChat(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden block w-full h-full text-left cursor-default focus:outline-none"
                    aria-label="Close Chat"
                />
            )}

            {/* Main Game Area */}
            <div className="flex-1 flex flex-col relative h-full min-w-0 z-10">
                <header className="h-16 bg-warm-black border-b border-white/10 flex items-center justify-between px-3 sm:px-6 shrink-0 gap-2">
                    <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0">
                        <span className="text-gray-400 text-xs font-semibold hidden sm:inline">Room:</span>
                        <button
                            onClick={handleCopyRoomId}
                            className="flex items-center space-x-1 sm:space-x-1.5 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 transition-all group max-w-[100px] sm:max-w-none min-w-0"
                            title="Click to copy Room ID"
                        >
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] font-bold text-xs sm:text-sm truncate">
                                {copied ? "Copied!" : roomId}
                            </span>
                            {!copied && (
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 group-hover:text-white transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                            )}
                            {copied && (
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={handleCopyInviteLink}
                            className="flex items-center space-x-1 sm:space-x-1.5 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-md px-1.5 sm:px-2.5 py-0.5 sm:py-1 transition-all group max-w-[100px] sm:max-w-none min-w-0"
                            title="Copy Invitation Link to share with friends"
                        >
                            <span className="text-indigo-300 group-hover:text-indigo-200 font-bold text-xs sm:text-sm truncate">
                                {copiedLink ? "Link Copied!" : "Invite Link"}
                            </span>
                            {!copiedLink ? (
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400 group-hover:text-indigo-300 transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.1 1.1" />
                                </svg>
                            ) : (
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </button>
                        {isSequence && (
                            <span className={`px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold shrink-0 ${playerTeam === "BLUE" ? "bg-blue-900 text-blue-200" : "bg-red-900 text-red-200"}`}>
                                {playerTeam}
                            </span>
                        )}
                        {isSequence && gameState?.pendingAction?.type === "REMOVE_CHIP" && gameState.pendingAction.playerId === username && (
                            <div className="bg-red-600 text-white px-1.5 sm:px-4 py-0.5 sm:py-1 rounded-full animate-bounce text-[9px] sm:text-xs font-bold border border-red-400 truncate">
                                REMOVE CHIP!
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
                        <button
                            onClick={() => setShowHelp(true)}
                            className="w-7 h-7 sm:w-8 h-8 rounded-full border border-indigo-400 text-indigo-400 font-serif font-bold hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all hover:shadow-[0_0_12px_rgba(99,102,241,0.3)] flex items-center justify-center text-xs sm:text-sm shrink-0"
                            title="How to Play"
                        >
                            i
                        </button>
                        <div className="flex items-center space-x-1 shrink-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isMyTurn ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
                            <span className={`text-[10px] sm:text-xs font-bold ${isMyTurn ? "text-green-400" : "text-gray-500"} hidden sm:inline`}>
                                {isMyTurn ? "YOUR TURN" : "OPPONENT'S"}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`px-2 py-1 sm:px-3 sm:py-1 rounded text-[10px] sm:text-xs font-semibold border flex items-center gap-1 sm:gap-1.5 transition-all shrink-0 ${showChat
                                    ? "bg-[#9b51e0]/20 text-[#a855f7] border-[#9b51e0]/40 shadow-[0_0_12px_rgba(155,81,224,0.25)]"
                                    : "border-white/10 text-gray-400 hover:text-white hover:border-white/30 bg-white/5"
                                }`}
                            title={showChat ? "Close Chat Panel" : "Open Chat Panel"}
                        >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="1.5" />
                                <path d="M16 3v18" />
                            </svg>
                            <span className="hidden sm:inline">Chat</span>
                        </button>
                        <button
                            onClick={onLeave}
                            className="text-[10px] sm:text-xs text-red-400 hover:text-red-300 border border-red-900/50 px-2 sm:px-3 py-1 rounded shrink-0 transition-all hover:bg-red-950/20"
                        >
                            Leave
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex flex-col items-center justify-center bg-black/20 p-2 sm:p-4 overflow-hidden relative">
                    {errorNotification && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-500/50 text-red-200 px-5 py-2.5 rounded-xl shadow-[0_4px_24px_rgba(239,68,68,0.5)] flex items-center space-x-3 animate-fade-in backdrop-blur-md max-w-sm sm:max-w-md pointer-events-auto">
                            <span className="text-red-400 text-lg leading-none">⚠️</span>
                            <span className="text-xs sm:text-sm font-medium tracking-wide">{errorNotification}</span>
                            <button
                                onClick={() => setErrorNotification(null)}
                                className="text-red-400 hover:text-white font-bold ml-2 transition-colors focus:outline-none"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    <div className="flex-1 flex items-center justify-center w-full z-10 h-full min-w-0">
                        {isSplendor ? (
                            <div className="w-full h-full">
                                <SplendorBoard
                                    gameState={gameState}
                                    onAction={handleSplendorAction}
                                    playerUsername={username}
                                />
                            </div>
                        ) : isCarcassonne ? (
                            <div className="w-full h-full">
                                <CarcassonneBoard
                                    gameState={gameState}
                                    onAction={(action: any) => socket.emit("make_move", { roomId, action })}
                                    playerUsername={username}
                                />
                            </div>
                        ) : isAzul ? (
                            <div className="w-full h-full">
                                <AzulBoard
                                    gameState={gameState}
                                    onAction={(action: any) => socket.emit("make_move", { roomId, action })}
                                    playerUsername={username}
                                />
                            </div>
                        ) : (
                            <div className="shadow-2xl max-w-full max-h-full overflow-auto">
                                <SequenceBoard
                                    gameState={currentRenderState}
                                    onCellClick={handleSequenceMove}
                                    playerTeam={playerTeam}
                                    username={username}
                                    selectedCard={selectedCard}
                                    shakingCell={shakingCell}
                                />
                            </div>
                        )}
                    </div>

                    {isSequence && ( // Only show Hand for Sequence
                        <div className="w-full shrink-0 relative overflow-visible">
                            {selectedCard && isDeadCard(selectedCard, currentRenderState?.board || []) && (
                                <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-30 animate-fade-in flex flex-col items-center gap-1.5 pointer-events-auto">
                                    <span className="text-[10px] text-red-400 font-bold bg-red-950/80 border border-red-500/30 px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">Dead Card Detected</span>
                                    {isMyTurn && (
                                        <button
                                            onClick={() => {
                                                socket.emit("make_move", {
                                                    roomId,
                                                    action: {
                                                        type: "DISCARD_DEAD_CARD",
                                                        payload: {
                                                            playerId: username,
                                                            card: selectedCard
                                                        }
                                                    }
                                                });
                                                setSelectedCard(null);
                                            }}
                                            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold rounded-full shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] active:scale-95 transition-all text-xs uppercase tracking-widest border border-red-400/50"
                                        >
                                            🗑️ Discard & Draw
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className={`h-28 sm:h-40 w-full bg-gradient-to-t from-deep-navy to-transparent overflow-visible transition-transform duration-300 ${shakeHand ? "animate-shake" : ""}`}>
                                <Hand
                                    cards={myHand}
                                    onCardSelect={(c) => setSelectedCard(c === selectedCard ? null : c)}
                                    selectedCards={selectedCard ? [selectedCard] : []}
                                    deadCards={myHand.filter((c: string) => isDeadCard(c, currentRenderState?.board || []))}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Intimate Sidebar */}
            {showChat && (
                <div className="border-l border-white/10 bg-warm-black shadow-xl z-50 absolute right-0 top-0 h-full w-80 max-w-[85vw] sm:relative sm:shrink-0 animate-fade-in overflow-hidden">
                    <div className="w-80 max-w-[85vw] h-full"> {/* Inner container to prevent content squashing */}
                        <Chat socket={socket} username={username} room={roomId} onClose={() => setShowChat(false)} />
                    </div>
                </div>
            )}

            {/* Victory Modal */}
            {gameState?.winner && (
                <VictoryModal
                    winner={gameState.winner}
                    onReset={() => socket.emit("restart_game", { roomId })}
                />
            )}

            {/* How to Play Modal */}
            {showHelp && (
                <HowToPlayModal
                    onClose={() => setShowHelp(false)}
                    gameType={isSplendor ? "SPLENDOR" : isCarcassonne ? "CARCASSONNE" : isAzul ? "AZUL" : "SEQUENCE"}
                />
            )}
            {/* Opponent Playing Flying Chip Overlay (No Popup) */}
            {animatingCard && animatingCard.active && (
                <div
                    className={`fixed z-50 pointer-events-none ${animatingCard.type === "PLAY" ? "animate-chip-fall" : animatingCard.type === "REMOVE" ? "animate-chip-remove" : ""}`}
                    style={animatingCard.type === "PLAY" || animatingCard.type === "REMOVE" ? {
                        left: `${animatingCard.endX}px`,
                        top: `${animatingCard.endY}px`,
                        width: `${animatingCard.width}px`,
                        height: `${animatingCard.height}px`,
                    } : {
                        left: animationProgress === "start" ? `${animatingCard.startX}px` : `${animatingCard.endX}px`,
                        top: animationProgress === "start" ? `${animatingCard.startY}px` : `${animatingCard.endY}px`,
                        width: animationProgress === "start" ? `${animatingCard.width * 1.5}px` : `${animatingCard.width}px`,
                        height: animationProgress === "start" ? `${animatingCard.height * 1.5}px` : `${animatingCard.height}px`,
                        transform: "translate(-50%, -50%)",
                        opacity: 1,
                        transition: "left 600ms ease-out, top 600ms ease-out, width 600ms ease-out, height 600ms ease-out",
                    }}
                >
                    {animatingCard.type === "REMOVE" ? (
                        <div className="w-full h-full rounded-full border-2 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] bg-red-950/60 flex items-center justify-center">
                            <span className="text-red-500 font-extrabold text-sm sm:text-base leading-none">×</span>
                        </div>
                    ) : animatingCard.type === "PLAY" ? (
                        <div className={`w-full h-full rounded-full border-2 border-white/20 shadow-lg
                            ${animatingCard.team === "BLUE" ? "bg-blue-600 shadow-blue-500/50" : "bg-red-600 shadow-red-500/50"}`}
                        />
                    ) : (
                        <div className="shadow-2xl rounded-xl overflow-hidden bg-white w-16 h-24">
                            <PlayingCard code={animatingCard.card} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
