"use client";

const SUITS: Record<string, { symbol: string, color: string }> = {
    'H': {
        symbol: '♥',
        color: 'text-red-600'
    },
    'D': {
        symbol: '♦',
        color: 'text-red-600'
    },
    'C': {
        symbol: '♣',
        color: 'text-gray-900'
    },
    'S': {
        symbol: '♠',
        color: 'text-gray-900'
    }
};

// High-fidelity standard Bootstrap card suit paths (viewBox "0 0 16 16")
const PATHS = {
    H: "M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1",
    S: "M7.184 11.246A3.5 3.5 0 0 1 1 9c0-1.602 1.14-2.633 2.66-4.008C4.986 3.792 6.602 2.33 8 0c1.398 2.33 3.014 3.792 4.34 4.992C13.86 6.367 15 7.398 15 9a3.5 3.5 0 0 1-6.184 2.246 20 20 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a20 20 0 0 0 1.582-2.907",
    D: "M2.45 7.4 7.2 1.067a1 1 0 0 1 1.6 0L13.55 7.4a1 1 0 0 1 0 1.2L8.8 14.933a1 1 0 0 1-1.6 0L2.45 8.6a1 1 0 0 1 0-1.2z",
    C: "M11.5 12.5a3.5 3.5 0 0 1-2.684-1.254 20 20 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a20 20 0 0 0 1.582-2.907 3.5 3.5 0 1 1-2.538-5.743 3.5 3.5 0 1 1 6.708 0A3.5 3.5 0 1 1 11.5 12.5"
};

// Material design visibility/eye icon SVG path (viewBox "0 0 24 24")
const EYE_PATH = "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z";

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

    const isJack = rank === "J";
    const isOneEyedJack = isJack && (suitCode === "S" || suitCode === "H");
    const isTwoEyedJack = isJack && (suitCode === "C" || suitCode === "D");

    const bgColor = "bg-gray-100";  // Classic paper look
    const borderColor = selected ? "border-[#9b51e0] ring-4 ring-[#9b51e0]/40" : "border-gray-300";

    // Mini-mode for board grid (keeps it very simple, rank absolute in corners, suit symbol center)
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

    // Full-mode for Hand: Rank (+ eye icons if Jack) + Suit symbol in corners, shape in middle (100% consistent layout)
    return (
        <div onClick={onClick} className={`
            w-16 h-24 sm:w-20 sm:h-30 md:w-24 md:h-36 ${bgColor} rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl border-2 ${borderColor}
            relative cursor-pointer overflow-hidden
            transform transition-all active:scale-95 hover:scale-105
        `}>
            {/* Top Left Corner: 2-Column layout for Jacks (J+Suit shape in left col, eyes side-by-side in right col aligned with J) */}
            <div className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2.5 flex items-start gap-1 sm:gap-1.5 ${suit.color}`}>
                {/* Column 1: Rank + Suit shape */}
                <div className="flex flex-col items-center">
                    {/* Rank container for height matching */}
                    <div className="h-4 sm:h-5 md:h-6 flex items-center justify-center">
                        <span className="text-sm sm:text-base md:text-xl font-bold font-serif leading-none">{rank}</span>
                    </div>
                    {path ? (
                        <svg viewBox="0 0 16 16" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 fill-current mt-0.5 sm:mt-1">
                            <path d={path} />
                        </svg>
                    ) : (
                        <span className="text-xs sm:text-sm md:text-lg leading-none">{suit.symbol}</span>
                    )}
                </div>

                {/* Column 2: Side-by-Side Eye Icons (Aligned vertically with Rank text) */}
                {isJack && (
                    <div className="h-4 sm:h-5 md:h-6 flex items-center gap-0.5">
                        <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-current">
                            <path d={EYE_PATH} />
                        </svg>
                        {isTwoEyedJack && (
                            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-current">
                                <path d={EYE_PATH} />
                            </svg>
                        )}
                    </div>
                )}
            </div>

            {/* Center Image (Standard suit in center, slightly smaller for cleaner visual balance) */}
            <div className={`absolute inset-0 flex items-center justify-center opacity-25 ${suit.color} pointer-events-none`}>
                {path ? (
                    <svg viewBox="0 0 16 16" className="w-6 h-6 sm:w-9 sm:h-9 md:w-12 md:h-12 fill-current">
                        <path d={path} />
                    </svg>
                ) : (
                    <span className="text-2xl sm:text-4xl md:text-6xl">{suit.symbol}</span>
                )}
            </div>

            {/* Bottom Right Corner (rotated and mirrored) */}
            <div className={`absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2.5 flex items-start gap-1 sm:gap-1.5 transform rotate-180 ${suit.color}`}>
                {/* Column 1: Rank + Suit shape */}
                <div className="flex flex-col items-center">
                    {/* Rank container for height matching */}
                    <div className="h-4 sm:h-5 md:h-6 flex items-center justify-center">
                        <span className="text-sm sm:text-base md:text-xl font-bold font-serif leading-none">{rank}</span>
                    </div>
                    {path ? (
                        <svg viewBox="0 0 16 16" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 fill-current mt-0.5 sm:mt-1">
                            <path d={path} />
                        </svg>
                    ) : (
                        <span className="text-xs sm:text-sm md:text-lg leading-none">{suit.symbol}</span>
                    )}
                </div>

                {/* Column 2: Side-by-Side Eye Icons (Aligned vertically with Rank text) */}
                {isJack && (
                    <div className="h-4 sm:h-5 md:h-6 flex items-center gap-0.5">
                        <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-current">
                            <path d={EYE_PATH} />
                        </svg>
                        {isTwoEyedJack && (
                            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-current">
                                <path d={EYE_PATH} />
                            </svg>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
