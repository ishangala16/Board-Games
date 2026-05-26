"use client";
import { useState } from "react";
import { SplendorState, Card, Noble, Gem, Tier, canBuyCard } from "../../lib/games/Splendor";
import SplendorPlayer from "./SplendorPlayer";

interface SplendorBoardProps {
    gameState: SplendorState;
    onAction: (action: any) => void;
    playerUsername: string;
}

export default function SplendorBoard({ gameState, onAction, playerUsername }: SplendorBoardProps) {
    const [selectedTokens, setSelectedTokens] = useState<Gem[]>([]);

    if (!gameState) return <div className="text-white">Loading Splendor...</div>;

    const me = gameState.players[playerUsername];
    const opponentName = Object.keys(gameState.players).find(p => p !== playerUsername);
    const opponent = opponentName ? gameState.players[opponentName] : null;
    const isMyTurn = gameState.turnOrder[gameState.currentTurnIndex] === playerUsername;

    const GEM_STYLES: Record<Gem, string> = {
        WHITE: "bg-gradient-to-br from-gray-100 to-gray-300 text-gray-900 border-gray-400 ring-gray-200",
        BLUE: "bg-gradient-to-br from-blue-500 to-blue-700 text-white border-blue-400 ring-blue-300",
        GREEN: "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-emerald-400 ring-emerald-300",
        RED: "bg-gradient-to-br from-red-600 to-red-800 text-white border-red-400 ring-red-300",
        BLACK: "bg-gradient-to-br from-gray-800 to-black text-white border-gray-600 ring-gray-500",
        GOLD: "bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 border-yellow-300 ring-yellow-200"
    };

    const isSelectionValid = (selection = selectedTokens) => {
        if (selection.length === 2) {
            return selection[0] === selection[1] && gameState.bank[selection[0]] >= 4;
        }
        if (selection.length === 3) {
            const distinct = new Set(selection);
            return distinct.size === 3;
        }
        return false;
    };

    const handleConfirmTokens = () => {
        if (!isSelectionValid()) return;
        onAction({ type: "TAKE_TOKENS", playerId: playerUsername, tokens: selectedTokens });
        setSelectedTokens([]);
    };

    const handleTakeToken = (gem: Gem) => {
        if (!isMyTurn || gem === "GOLD") return;

        let newSelection = [...selectedTokens];
        const firstColor = newSelection[0];

        if (newSelection.includes(gem)) {
            // Already in selection
            if (newSelection.length === 1) {
                // If selected once, clicking again can add second one if bank >= 4
                if (gameState.bank[gem] >= 4) {
                    newSelection.push(gem);
                } else {
                    newSelection = []; // Deselect
                }
            } else if (newSelection.length === 2 && newSelection[0] === newSelection[1]) {
                // Selected twice, click again to deselect
                newSelection = [];
            } else {
                // Part of a distinct set, click to remove
                newSelection = newSelection.filter(g => g !== gem);
            }
        } else {
            // Not in selection
            if (newSelection.length === 0) {
                newSelection.push(gem);
            } else if (newSelection.length === 1) {
                if (firstColor === gem) {
                    // Handled above
                } else {
                    newSelection.push(gem);
                }
            } else if (newSelection.length === 2) {
                if (newSelection[0] === newSelection[1]) {
                    // Already have 2 of same, can't add another color
                } else {
                    newSelection.push(gem);
                }
            }
        }

        setSelectedTokens(newSelection);
    };

    const handleBuyCard = (card: Card) => {
        if (!isMyTurn) return;
        onAction({ type: "BUY_CARD", playerId: playerUsername, cardId: card.id });
    };

    const handleReserveCard = (card: Card) => {
        if (!isMyTurn) return;
        if (me.reserved.length >= 3) {
            alert("You cannot reserve more than 3 cards.");
            return;
        }
        onAction({ type: "RESERVE_CARD", playerId: playerUsername, cardId: card.id });
    };

    const renderCard = (card: Card, tier: Tier, isReservedList = false) => {
        const { canBuy } = me ? canBuyCard(me, card) : { canBuy: false };
        const canReserve = me && me.reserved.length < 3 && !isReservedList;

        return (
            <div
                key={card.id}
                className={`relative bg-warm-black border rounded-md sm:rounded-lg p-1 sm:p-2 w-16 h-24 sm:w-24 sm:h-32 flex flex-col justify-between hover:scale-105 transition-all shadow-xl group overflow-hidden
                    ${isMyTurn && canBuy 
                        ? "border-emerald-500/80 shadow-emerald-500/10 ring-1 ring-emerald-500/30 scale-[1.02]" 
                        : isMyTurn 
                            ? "border-white/10 opacity-70 hover:opacity-100" 
                            : "border-white/10 opacity-80"
                    }`}
            >
                {/* Header: Points & Bonus */}
                <div className="flex justify-between items-start">
                    <span className="text-xs sm:text-xl font-bold text-white drop-shadow-md">{card.points || ""}</span>
                    <div className={`w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full ${GEM_STYLES[card.bonus as Gem].split(" ")[0]} shadow-sm border border-white/20`} />
                </div>

                {/* Tier Indicator (Subtle) - Only show if in market */}
                {!isReservedList && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 text-xl sm:text-4xl font-bold select-none pointer-events-none">
                        {tier === 1 ? "•" : tier === 2 ? "••" : "•••"}
                    </div>
                )}

                {/* Footer: Cost */}
                <div className="flex flex-row gap-0.5 sm:gap-1 mt-auto">
                    {(Object.keys(card.cost) as Gem[]).map(gem => {
                        const cost = card.cost[gem as keyof typeof card.cost];
                        if (!cost) return null;
                        return (
                            <div key={gem} className={`flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded-full text-[7px] sm:text-[9px] font-bold ${GEM_STYLES[gem].split(" ")[0]} text-white border border-white/40 leading-none`}>
                                {cost}
                            </div>
                        );
                    })}
                </div>

                {/* Buy & Reserve Action Overlay (Only on turn) */}
                {isMyTurn && (
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-[3px] rounded-md sm:rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-1 sm:gap-1.5 p-1 sm:p-2 border border-indigo-500/30">
                        {canBuy && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleBuyCard(card);
                                }}
                                className="w-full py-0.5 sm:py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[8px] sm:text-[11px] font-extrabold rounded shadow-md shadow-emerald-950/50 transition-all hover:scale-105 active:scale-95 leading-none truncate px-0.5"
                            >
                                Buy
                            </button>
                        )}
                        {canReserve && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleReserveCard(card);
                                }}
                                className="w-full py-0.5 sm:py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-[8px] sm:text-[11px] font-extrabold rounded shadow-md shadow-amber-950/50 transition-all hover:scale-105 active:scale-95 leading-none truncate px-0.5"
                            >
                                Reserve
                            </button>
                        )}
                        {!canBuy && !canReserve && (
                            <span className="text-[8px] sm:text-[10px] text-gray-400 text-center font-semibold bg-black/50 px-1 py-0.5 rounded border border-white/5">Locked</span>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row h-full w-full gap-4 lg:gap-6 p-2 sm:p-6 max-w-7xl mx-auto overflow-y-auto lg:overflow-y-visible">
            {/* Left: Players Dashboard */}
            <div className="w-full lg:w-1/4 flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-col gap-3 sm:gap-4">
                {opponent && <SplendorPlayer player={opponent} isMe={false} isActive={!isMyTurn} />}
                <div className="flex flex-col gap-3 sm:gap-4 justify-between h-full">
                    <SplendorPlayer player={me} isMe={true} isActive={isMyTurn} />

                    {/* Action Hint */}
                    <div className="p-3 bg-black/30 border border-white/5 rounded-lg text-xs text-gray-400 min-h-[60px] sm:min-h-[80px]">
                        <div className="font-bold text-gray-300 mb-1">
                            Current Action: {isMyTurn ? <span className="text-green-400 animate-pulse">Your Turn</span> : "Waiting..."}
                        </div>
                        {selectedTokens.length > 0 ? (
                            <div className="flex items-center gap-2 mt-2">
                                <span>Selected:</span>
                                <div className="flex gap-1">
                                    {selectedTokens.map((t, i) => (
                                        <div key={i} className={`w-4 h-4 rounded-full ${GEM_STYLES[t].split(" ")[0]}`} />
                                    ))}
                                </div>
                                <div className="flex gap-2 ml-auto items-center">
                                    <button onClick={() => setSelectedTokens([])} className="text-red-400 hover:underline">Clear</button>
                                    {isSelectionValid() && (
                                        <button 
                                            onClick={handleConfirmTokens} 
                                            className="px-2 py-0.5 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-[10px] transition-all hover:scale-105 active:scale-95 shadow-md border border-green-400"
                                        >
                                            Confirm
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            isMyTurn && <p>Select tokens, reserve a card, or buy a card.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Center: The Board */}
            <div className="flex-1 flex flex-col gap-4 sm:gap-6">

                {/* Nobles (Achievements) Row */}
                <div className="flex justify-center gap-2 sm:gap-4 min-h-[60px] sm:min-h-[100px] flex-wrap sm:flex-nowrap">
                    {gameState.nobles.map(noble => (
                        <div 
                            key={noble.id} 
                            className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-b from-[#3a1a5e]/90 to-[#120824]/95 border border-[#9b51e0]/40 rounded-lg flex flex-col items-center justify-between p-1 sm:p-2 shadow-xl hover:shadow-indigo-500/10 transform hover:scale-105 transition-all" 
                            title="Noble Achievement (3 Prestige Points)"
                        >
                            <div className="flex justify-between w-full items-center">
                                <span className="text-[10px] sm:text-xs text-purple-300 font-bold uppercase tracking-wider">👑 Noble</span>
                                <span className="text-xs sm:text-lg font-extrabold text-amber-400 drop-shadow">{noble.points}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 w-full mt-1">
                                {(Object.keys(noble.cost) as Gem[]).map(gem => {
                                    const cost = noble.cost[gem as keyof typeof noble.cost];
                                    if (!cost) return null;
                                    return (
                                        <div 
                                            key={gem} 
                                            className={`flex items-center justify-center gap-0.5 rounded px-1 py-0.5 text-[8px] sm:text-[10px] font-bold ${GEM_STYLES[gem].split(" ")[0]} text-white border border-white/20 leading-none`}
                                            title={`${cost} ${gem} Cards required`}
                                        >
                                            {cost}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Market Levels */}
                <div className="flex-1 flex flex-col justify-center gap-2 sm:gap-4">
                    {[3, 2, 1].map((tier) => (
                        <div key={tier} className="flex items-center justify-center gap-1.5 sm:gap-4">
                            {/* Deck */}
                            <div 
                                onClick={() => {
                                    if (isMyTurn && me && me.reserved.length < 3) {
                                        onAction({ type: "RESERVE_CARD", playerId: playerUsername, cardId: `deck_${tier}` });
                                    }
                                }}
                                className={`w-16 h-24 sm:w-24 sm:h-32 rounded sm:rounded-lg border flex flex-col items-center justify-center text-xs sm:text-lg font-semibold select-none shadow-md transition-all
                                    ${isMyTurn && me && me.reserved.length < 3 ? "border-indigo-400 hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-indigo-500/20" : "border-white/10"}
                                    ${tier === 3 ? "bg-cyan-900/60" : tier === 2 ? "bg-amber-900/60" : "bg-emerald-900/60"}`}
                                title={isMyTurn && me && me.reserved.length < 3 ? `Click to reserve top card of Tier ${tier} Deck` : `Tier ${tier} Deck`}
                            >
                                <span className="text-[9px] sm:text-xs text-white/50 uppercase tracking-widest font-sans">Tier {tier}</span>
                                <span className="text-base sm:text-3xl font-bold font-serif text-white/90 mt-1">{gameState.decks[tier as Tier].length}</span>
                            </div>

                            {/* Visible Cards */}
                            {gameState.market[tier as Tier].map(card => renderCard(card, tier as Tier))}
                        </div>
                    ))}
                </div>

                {/* Token Bank */}
                <div className="flex justify-center gap-3 sm:gap-6 pb-2">
                    {(["WHITE", "BLUE", "GREEN", "RED", "BLACK", "GOLD"] as Gem[]).map(gem => (
                        <div
                            key={gem}
                            onClick={() => handleTakeToken(gem)}
                            className={`
                                flex flex-col items-center group cursor-pointer 
                                ${gem === "GOLD" ? "opacity-45 cursor-not-allowed" : ""}
                            `}
                        >
                            <div className={`
                                w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm sm:text-xl font-bold shadow-md sm:shadow-2xl transition-all
                                ${GEM_STYLES[gem]}
                                border-2 sm:border-4 ${selectedTokens.includes(gem) ? "ring-2 sm:ring-4 ring-offset-2 ring-offset-warm-black scale-110" : "group-hover:scale-105"}
                            `}>
                                {gameState.bank[gem]}
                            </div>
                            <span className="text-[8px] sm:text-[10px] uppercase font-bold text-gray-400 mt-1 sm:mt-2 tracking-wider sm:tracking-widest">{gem}</span>
                        </div>
                    ))}
                </div>

                {/* Reserved Cards Section */}
                {me && me.reserved && me.reserved.length > 0 && (
                    <div className="mt-2 p-3 bg-black/40 border border-white/10 rounded-xl">
                        <h4 className="text-xs sm:text-sm font-bold text-indigo-400 mb-2.5 flex items-center gap-1.5">
                            🔒 Your Reserved Cards <span className="text-[10px] text-gray-500 font-normal">({me.reserved.length}/3)</span>
                        </h4>
                        <div className="flex gap-3 justify-center sm:justify-start">
                            {me.reserved.map(card => renderCard(card, card.tier, true))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
