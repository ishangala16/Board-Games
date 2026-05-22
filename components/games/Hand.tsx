import PlayingCard from "./PlayingCard";

export default function Hand({ cards, onCardSelect, selectedCards }: { cards: string[], onCardSelect: (card: string) => void, selectedCards: string[] }) {
    if (!cards || cards.length === 0) return <div className="text-gray-400">No cards dealing...</div>;

    return (
        <div className="flex -space-x-6 sm:-space-x-4 overflow-x-auto p-2 sm:p-4 justify-center">
            {cards.map((card, i) => {
                const suit = card.slice(-1);
                const color = (suit === 'H' || suit === 'D') ? 'text-red-600' : 'text-gray-900';
                const isSelected = selectedCards.includes(card);

                return (
                    <div key={i} className={`relative ${isSelected ? "-translate-y-4 z-10" : ""}`}>
                        <PlayingCard
                            code={card}
                            onClick={() => onCardSelect(card)}
                            selected={isSelected}
                        />
                    </div>
                );
            })}
        </div>
    );
}
