"use client";

const SUITS: Record<string, { symbol: string, color: string, path: string }> = {
    'H': {
        symbol: '♥',
        color: 'text-red-600',
        path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
    },
    'D': {
        symbol: '♦',
        color: 'text-red-600',
        path: "M12 2L4 12l8 10 8-10L12 2z" // Simplified Diamond
    },
    'C': {
        symbol: '♣',
        color: 'text-gray-900',
        path: "M19 13.5c0-1.28-1.01-2.33-2.45-2.4 1.05-.91 1.63-2.18 1.43-3.62C17.65 5.58 15.7 4.5 14 5.26c.22-1.32-.47-2.61-1.66-3.08-1.19-.48-2.55-.05-3.23 1.05-.68-1.1-2.04-1.54-3.23-1.06-1.18.47-1.88 1.76-1.66 3.08-1.7-.76-3.65.32-3.98 2.22-.2 1.44.38 2.71 1.43 3.62C.26 11.17-.75 12.23.75 13.5c1.47 1.25 3.51 1.15 4.96-.06l.79.78v3.68H5v2h4v-2h-.5c1.93 0 3.5-1.57 3.5-3.5 0-1.93-1.57-3.5-3.5-3.5v-2.09c1.9 1.9 5.25 2.15 7.03 2.15 1.54 0 2.5-1.28 2.5-2.82h1z" // Complex Club? No, let's use a simpler path or relying on unicode for now if path is hard, but user wants visuals. Let's try to make a nice SVG.
    },
    'S': {
        symbol: '♠',
        color: 'text-gray-900',
        path: "M12 2C9 2 7 4 7 6c0 1.5 1 2.5 2 3 .5-2 2-3 3-3s2.5 1 3 3c1-.5 2-1.5 2-3 0-2-2-4-5-4z M12 22s-6-5-6-10c0-3 3-5 6-5s6 2 6 5c0 5-6 10-6 10z" // Terrible spade path, let's rely on standard icons or unicode for specific shapes if I can't generate perfect paths.
        // Actually, let's use a standard Unicode character with large font-size and "text-fill-transparent background-clip" trick or just big clean text for now, but formatted nicely.
        // Wait, user asked for visuals. I will try to render a nice layout.
        // Plan: Middle is the suit count or large suit. Corners are Rank + Suit.
    }
};

// Better Paths
const PATHS = {
    H: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    S: "M12,2C9,2,6,3.5,6,6c0,1,0.5,1.5,1.5,2.5c-2.5,1-3.5,3.5-3.5,5.5c0,3.5,3,6,8,8c5-2,8-4.5,8-8c0-2-1-4.5-3.5-5.5 C17.5,7.5,18,7,18,6C18,3.5,15,2,12,2z M12,22c-0.5,0-1,0-1,0v-2c0,0,2,0,2,0V22z", // Approx spade
    D: "M12 2L4 12l8 10 8-10L12 2z",
    C: "M16.5,9c-1.5,0-2.5,1-3,2c0.5-2,0-4-2-5c-2,1-2.5,3-2,5c-0.5-1-1.5-2-3-2C5,9,4,10.5,4,12c0,1.5,1,2.5,2.5,2.5c1,0,2-0.5,2.5-1 c-0.5,2.5,1,4.5,3,4.5v3h4v-3c2,0,3.5-2,3-4.5c0.5,0.5,1.5,1,2.5,1C23,14.5,24,13.5,24,12C24,10.5,23,9,16.5,9z"
};

export default function PlayingCard({ code, mini = false, selected = false, onClick }: { code: string, mini?: boolean, selected?: boolean, onClick?: () => void }) {
    if (code === "XX" || !code) {
        return (
            <div className={`
                ${mini ? "w-full h-full" : "w-24 h-36"} 
                bg-indigo-500/20 flex items-center justify-center rounded border border-indigo-500/30
            `}>
                <span className="text-indigo-400 font-bold text-xs">FREE</span>
            </div>
        )
    }

    const rank = code.slice(0, -1);
    const suitCode = code.slice(-1);
    const suit = SUITS[suitCode] || { symbol: '?', color: 'text-gray-500' };
    const path = (PATHS as any)[suitCode];

    const bgColor = "bg-gray-100";  // Classic paper look
    const borderColor = selected ? "border-[#9b51e0] ring-4 ring-[#9b51e0]/40" : "border-gray-300";

    // Mini-mode for board grid
    if (mini) {
        return (
            <div onClick={onClick} className={`
                w-full h-full ${bgColor} rounded border ${borderColor} 
                flex flex-col items-center justify-center shadow-sm relative overflow-hidden
            `}>
                <span className={`text-[10px] md:text-xs font-bold leading-none ${suit.color} absolute top-0.5 left-0.5`}>{rank}</span>
                <span className={`text-[10px] md:text-sm leading-none ${suit.color}`}>{suit.symbol}</span>
                <span className={`text-[10px] md:text-xs font-bold leading-none ${suit.color} absolute bottom-0.5 right-0.5 transform rotate-180`}>{rank}</span>
            </div>
        );
    }

    // Full-mode for Hand
    return (
        <div onClick={onClick} className={`
            w-16 h-24 sm:w-20 sm:h-30 md:w-24 md:h-36 ${bgColor} rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl border-2 ${borderColor}
            flex flex-col relative justify-between p-1 sm:p-2 cursor-pointer
            transform transition-all active:scale-95 hover:scale-105
        `}>
            {/* Top Left */}
            <div className={`flex flex-col items-center leading-none ${suit.color}`}>
                <span className="text-sm sm:text-base md:text-xl font-bold font-serif">{rank}</span>
                <span className="text-xs sm:text-sm md:text-lg">{suit.symbol}</span>
            </div>

            {/* Center Image */}
            <div className={`absolute inset-0 flex items-center justify-center opacity-20 ${suit.color}`}>
                {path ? (
                    <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 fill-current">
                        <path d={path} />
                    </svg>
                ) : (
                    <span className="text-2xl sm:text-4xl md:text-6xl">{suit.symbol}</span>
                )}
            </div>

            {/* Bottom Right */}
            <div className={`flex flex-col items-center leading-none transform rotate-180 ${suit.color}`}>
                <span className="text-sm sm:text-base md:text-xl font-bold font-serif">{rank}</span>
                <span className="text-xs sm:text-sm md:text-lg">{suit.symbol}</span>
            </div>
        </div>
    );
}
