"use client";
import { useState } from "react";
import { SplendorState, Card, Noble, Gem, Tier } from "../../lib/games/Splendor";
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

    const handleTakeToken = (gem: Gem) => {
        if (!isMyTurn || gem === "GOLD") return;

        let newSelection = [...selectedTokens, gem];

        // Validation Logic for UI Feedback
        // Case 1: Taking 2 of same
        if (newSelection.length === 2 && newSelection[0] === newSelection[1]) {
            if (gameState.bank[gem] < 4) {
                alert("Cannot take 2 tokens unless there are 4 available.");
                setSelectedTokens([]);
                return;
            }
            // Valid move -> Execute
            onAction({ type: "TAKE_TOKENS", playerId: playerUsername, tokens: newSelection });
            setSelectedTokens([]);
            return;
        }

        // Case 2: Taking 3 distinct
        if (newSelection.length === 3) {
            const distinct = new Set(newSelection);
            if (distinct.size !== 3) {
                alert("If taking 3 tokens, they must all be different.");
                setSelectedTokens([]);
                return;
            }
            // Valid move -> Execute
            onAction({ type: "TAKE_TOKENS", playerId: playerUsername, tokens: newSelection });
            setSelectedTokens([]);
            return;
        }

        // Just add to selection
        setSelectedTokens(newSelection);
    };

    const handleBuyCard = (card: Card) => {
        if (!isMyTurn) return;
        // Simple click to buy for MVP
        onAction({ type: "BUY_CARD", playerId: playerUsername, cardId: card.id });
    };

    const renderCard = (card: Card, tier: Tier) => {
        // Determine if affordable (Simple check)
        // ... (Logic can be added for visual feedback)

        return (
            <div
                key={card.id}
                onClick={() => handleBuyCard(card)}
                className={`relative bg-warm-black border border-white/20 rounded-md sm:rounded-lg p-1 sm:p-2 w-14 h-20 sm:w-24 sm:h-32 flex flex-col justify-between hover:scale-105 transition-transform cursor-pointer group shadow-xl`}
            >
                {/* Header: Points & Bonus */}
                <div className="flex justify-between items-start">
                    <span className="text-xs sm:text-xl font-bold text-white drop-shadow-md">{card.points || ""}</span>
                    <div className={`w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full ${GEM_STYLES[card.bonus as Gem].split(" ")[0]} shadow-sm border border-white/20`} />
                </div>

                {/* Tier Indicator (Subtle) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 text-xl sm:text-4xl font-bold select-none pointer-events-none">
                    {tier === 1 ? "•" : tier === 2 ? "••" : "•••"}
                </div>

                {/* Footer: Cost */}
                <div className="flex flex-row flex-wrap sm:flex-col gap-0.5 sm:space-y-1">
                    {(Object.keys(card.cost) as Gem[]).map(gem => {
                        const cost = card.cost[gem as keyof typeof card.cost];
                        if (!cost) return null;
                        return (
                            <div key={gem} className={`flex items-center justify-center w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full text-[8px] sm:text-[10px] font-bold ${GEM_STYLES[gem].split(" ")[0]} text-white border border-white/40`}>
                                {cost}
                            </div>
                        );
                    })}
                </div>

                {/* Buy Overlay */}
                <div className="absolute inset-0 bg-indigo-500/20 rounded-md sm:rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-black/80 text-white text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded">Buy</span>
                </div>
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
                    <div className="p-3 bg-black/30 rounded-lg text-xs text-gray-400 min-h-[60px] sm:min-h-[80px]">
                        <div className="font-bold text-gray-300 mb-1">
                            Current Action: {isMyTurn ? <span className="text-green-400">Your Turn</span> : "Waiting..."}
                        </div>
                        {selectedTokens.length > 0 ? (
                            <div className="flex items-center gap-2 mt-2">
                                <span>Selected:</span>
                                <div className="flex gap-1">
                                    {selectedTokens.map((t, i) => (
                                        <div key={i} className={`w-4 h-4 rounded-full ${GEM_STYLES[t].split(" ")[0]}`} />
                                    ))}
                                </div>
                                <button onClick={() => setSelectedTokens([])} className="text-red-400 ml-auto hover:underline">Clear</button>
                            </div>
                        ) : (
                            isMyTurn && <p>Select tokens or click a card to buy.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Center: The Board */}
            <div className="flex-1 flex flex-col gap-4 sm:gap-6">

                {/* Nobles Row */}
                <div className="flex justify-center gap-2 sm:gap-4 min-h-[60px] sm:min-h-[100px] flex-wrap sm:flex-nowrap">
                    {gameState.nobles.map(noble => (
                        <div key={noble.id} className="w-14 h-14 sm:w-20 sm:h-20 bg-purple-900 border border-[#9b51e0] sm:border-2 rounded flex flex-col items-center justify-center shadow-lg transform hover:scale-105 transition-transform" title="Noble (3 pts)">
                            <span className="text-base sm:text-2xl font-bold text-white drop-shadow">{noble.points}</span>
                            <div className="grid grid-cols-2 gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                                {(Object.keys(noble.cost) as Gem[]).map(gem => {
                                    const cost = noble.cost[gem as keyof typeof noble.cost];
                                    if (!cost) return null;
                                    return (
                                        <div key={gem} className={`w-2.5 h-3.5 sm:w-3 sm:h-4 rounded text-[6px] sm:text-[8px] flex items-center justify-center bg-gray-800 text-white border border-${gem === "RED" ? "red-500" : gem === "GREEN" ? "green-500" : gem === "BLUE" ? "blue-500" : gem === "BLACK" ? "gray-600" : "gray-400"}`}>
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
                            <div className={`w-14 h-20 sm:w-24 sm:h-32 rounded sm:rounded-lg border border-white/10 flex items-center justify-center text-lg sm:text-2xl font-serif text-white/20 select-none 
                                ${tier === 3 ? "bg-cyan-900" : tier === 2 ? "bg-amber-900" : "bg-emerald-900"}`}>
                                {gameState.decks[tier as Tier].length}
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
                                ${gem === "GOLD" ? "opacity-30 cursor-not-allowed" : ""} 
                                /* Gold logic not fully implemented for take tokens */
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
            </div>
        </div>
    );
}
