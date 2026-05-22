"use client";
import { SplendorPlayer as PlayerType, Gem } from "../../lib/games/Splendor";

export default function SplendorPlayer({ player, isMe, isActive }: { player: PlayerType, isMe: boolean, isActive: boolean }) {
    if (!player) return null;

    const GEM_COLORS: Record<Gem, string> = {
        WHITE: "bg-gray-100 text-black border-gray-300",
        BLUE: "bg-blue-600 text-white border-blue-400",
        GREEN: "bg-emerald-600 text-white border-emerald-400",
        RED: "bg-red-700 text-white border-red-500",
        BLACK: "bg-gray-900 text-white border-gray-700",
        GOLD: "bg-yellow-500 text-yellow-900 border-yellow-300"
    };

    // Calculate Bonuses from Tableau
    const bonuses: Record<string, number> = { WHITE: 0, BLUE: 0, GREEN: 0, RED: 0, BLACK: 0 };
    player.tableau.forEach(c => bonuses[c.bonus]++);

    return (
        <div className={`p-2 sm:p-4 rounded-xl border-2 transition-all ${isActive ? "border-indigo-500 bg-white/5 shadow-lg shadow-indigo-500/10" : "border-white/10 bg-black/20"}`}>
            <div className="flex justify-between items-center mb-2 sm:mb-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-gray-600"}`} />
                    <span className={`text-xs sm:text-sm md:text-base font-bold truncate max-w-[100px] sm:max-w-none ${isMe ? "text-indigo-400" : "text-gray-300"}`}>{player.username} {isMe && "(You)"}</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-white flex items-center gap-0.5 sm:gap-1">
                    {player.points} <span className="text-[10px] sm:text-xs font-normal text-gray-500 uppercase">pts</span>
                </div>
            </div>

            {/* Nobles */}
            {player.nobles.length > 0 && (
                <div className="flex gap-1.5 mb-2 sm:mb-3 flex-wrap">
                    {player.nobles.map(n => (
                        <div 
                            key={n.id} 
                            className="px-1.5 py-0.5 bg-gradient-to-br from-yellow-500/20 to-amber-600/30 border border-yellow-500/40 rounded flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-yellow-300 shadow-sm" 
                            title="Noble Visited (+3 pts)"
                        >
                            <span>👑</span>
                            <span>+3</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Resources Grid */}
            <div className="grid grid-cols-6 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs">
                {(["WHITE", "BLUE", "GREEN", "RED", "BLACK", "GOLD"] as Gem[]).map(gem => (
                    <div key={gem} className="flex flex-col items-center">
                        {/* Token Count */}
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold shadow-sm mb-1 ${GEM_COLORS[gem]} text-[10px] sm:text-xs leading-none`}>
                            {player.tokens[gem]}
                        </div>

                        {/* Bonus Card Count (Not for Gold) */}
                        {gem !== "GOLD" && (
                            <div className="w-5 h-6 sm:w-6 sm:h-8 bg-white/10 border border-white/20 rounded flex items-center justify-center text-[8px] sm:text-[10px] text-gray-300 leading-none" title={`${gem} Bonus`}>
                                {bonuses[gem]}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Reserved Cards */}
            <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-gray-500 flex justify-between">
                <span>Reserved: {player.reserved.length}/3</span>
                <span>Tableau: {player.tableau.length}</span>
            </div>
        </div>
    );
}
