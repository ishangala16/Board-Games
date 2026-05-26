import PlayingCard from "./PlayingCard";

export default function Hand({ 
    cards, 
    onCardSelect, 
    selectedCards, 
    deadCards = [] 
}: { 
    cards: string[], 
    onCardSelect: (card: string) => void, 
    selectedCards: string[],
    deadCards?: string[]
}) {
    if (!cards || cards.length === 0) return <div className="text-gray-400">No cards dealing...</div>;

    return (
        <div className="flex -space-x-6 sm:-space-x-4 overflow-x-auto p-2 sm:p-4 justify-center">
            {cards.map((card, i) => {
                const suit = card.slice(-1);
                const color = (suit === 'H' || suit === 'D') ? 'text-red-600' : 'text-gray-900';
                const isSelected = selectedCards.includes(card);
                const isDead = deadCards.includes(card);

                return (
                    <div key={i} className={`relative transition-all duration-200 ${isSelected ? "-translate-y-4 z-10" : ""} ${isDead ? "opacity-60 saturate-50" : ""}`}>
                        <PlayingCard
                            code={card}
                            onClick={() => onCardSelect(card)}
                            selected={isSelected}
                        />
                        {isDead && (
                            <div className="absolute inset-0 bg-red-950/20 border-2 border-red-600/30 rounded-lg sm:rounded-xl pointer-events-none flex items-center justify-center z-20">
                                <span className="text-[8px] sm:text-[10px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded shadow uppercase tracking-widest scale-90 sm:scale-100">Dead</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
