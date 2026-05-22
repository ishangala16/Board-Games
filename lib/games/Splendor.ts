export type Gem = "WHITE" | "BLUE" | "GREEN" | "RED" | "BLACK" | "GOLD";
export type Tier = 1 | 2 | 3;

export interface Cost {
    WHITE?: number;
    BLUE?: number;
    GREEN?: number;
    RED?: number;
    BLACK?: number;
}

export interface Card {
    id: string;
    tier: Tier;
    points: number;
    bonus: Exclude<Gem, "GOLD">;
    cost: Cost;
}

export interface Noble {
    id: string;
    points: number;
    cost: Cost;
}

export interface SplendorPlayer {
    username: string;
    tokens: Record<Gem, number>;
    reserved: Card[];
    tableau: Card[];
    nobles: Noble[];
    points: number;
}

export interface SplendorState {
    market: Record<Tier, Card[]>;
    decks: Record<Tier, Card[]>;
    nobles: Noble[];
    bank: Record<Gem, number>;
    players: Record<string, SplendorPlayer>;
    turnOrder: string[];
    currentTurnIndex: number;
    winner: string | null;
    lastAction: string | null;
}

export type SplendorAction =
    | { type: "TAKE_TOKENS"; playerId: string; tokens: Gem[] }
    | { type: "BUY_CARD"; playerId: string; cardId: string } // Checks reserved then market
    | { type: "RESERVE_CARD"; playerId: string; cardId: string };

// --- DATA ---
const GENERATE_CARDS = (): Record<Tier, Card[]> => {
    // Basic set for MVP
    const t1: Card[] = [
        { id: "1_1", tier: 1, points: 0, bonus: "BLACK", cost: { WHITE: 1, BLUE: 1, GREEN: 1, RED: 1 } },
        { id: "1_2", tier: 1, points: 0, bonus: "BLUE", cost: { WHITE: 1, GREEN: 1, RED: 1, BLACK: 1 } },
        { id: "1_3", tier: 1, points: 0, bonus: "WHITE", cost: { BLUE: 1, GREEN: 1, RED: 1, BLACK: 1 } },
        { id: "1_4", tier: 1, points: 0, bonus: "GREEN", cost: { WHITE: 1, BLUE: 1, RED: 1, BLACK: 1 } },
        { id: "1_5", tier: 1, points: 0, bonus: "RED", cost: { WHITE: 1, BLUE: 1, GREEN: 1, BLACK: 1 } },
        { id: "1_6", tier: 1, points: 1, bonus: "BLACK", cost: { BLUE: 4 } },
        { id: "1_7", tier: 1, points: 1, bonus: "BLUE", cost: { RED: 4 } },
        { id: "1_8", tier: 1, points: 0, bonus: "WHITE", cost: { GREEN: 2, RED: 1 } },
        { id: "1_9", tier: 1, points: 0, bonus: "GREEN", cost: { WHITE: 2, BLUE: 1 } },
        { id: "1_10", tier: 1, points: 0, bonus: "RED", cost: { GREEN: 2, BLACK: 1 } },
        { id: "1_11", tier: 1, points: 0, bonus: "WHITE", cost: { BLUE: 2, GREEN: 1 } }, // Added filler
        { id: "1_12", tier: 1, points: 0, bonus: "BLUE", cost: { WHITE: 2, BLACK: 1 } },
    ];
    const t2: Card[] = [
        { id: "2_1", tier: 2, points: 1, bonus: "BLUE", cost: { BLUE: 2, GREEN: 2, RED: 3 } },
        { id: "2_2", tier: 2, points: 1, bonus: "GREEN", cost: { WHITE: 2, BLUE: 3, BLACK: 2 } },
        { id: "2_3", tier: 2, points: 2, bonus: "RED", cost: { BLACK: 5 } },
        { id: "2_4", tier: 2, points: 2, bonus: "WHITE", cost: { RED: 5 } },
        { id: "2_5", tier: 2, points: 2, bonus: "BLACK", cost: { WHITE: 4, BLUE: 2, BLACK: 1 } },
        { id: "2_6", tier: 2, points: 3, bonus: "WHITE", cost: { WHITE: 6 } },
        { id: "2_7", tier: 2, points: 1, bonus: "BLACK", cost: { WHITE: 3, BLUE: 2, GREEN: 2 } },
        { id: "2_8", tier: 2, points: 2, bonus: "GREEN", cost: { BLUE: 5 } },
    ];
    const t3: Card[] = [
        { id: "3_1", tier: 3, points: 3, bonus: "BLUE", cost: { WHITE: 3, GREEN: 3, RED: 3, BLACK: 5 } },
        { id: "3_2", tier: 3, points: 4, bonus: "BLACK", cost: { RED: 7 } },
        { id: "3_3", tier: 3, points: 4, bonus: "WHITE", cost: { BLACK: 7 } },
        { id: "3_4", tier: 3, points: 5, bonus: "GREEN", cost: { BLUE: 7, GREEN: 3 } },
        { id: "3_5", tier: 3, points: 3, bonus: "RED", cost: { WHITE: 3, BLUE: 3, GREEN: 5, RED: 3 } },
        { id: "3_6", tier: 3, points: 4, bonus: "BLUE", cost: { WHITE: 6, BLUE: 3, BLACK: 3 } },
        { id: "3_7", tier: 3, points: 5, bonus: "WHITE", cost: { WHITE: 3, BLACK: 7 } },
    ];

    return { 1: shuffle(t1), 2: shuffle(t2), 3: shuffle(t3) };
};

const NOBLES: Noble[] = [
    { id: "n1", points: 3, cost: { RED: 4, GREEN: 4 } },
    { id: "n2", points: 3, cost: { BLUE: 4, WHITE: 4 } },
    { id: "n3", points: 3, cost: { BLACK: 4, RED: 4 } },
    { id: "n4", points: 3, cost: { GREEN: 3, BLUE: 3, WHITE: 3 } },
    { id: "n5", points: 3, cost: { BLACK: 3, RED: 3, GREEN: 3 } },
];

function shuffle<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
}

export const INITIAL_SPLENDOR_STATE = (): SplendorState => {
    const cards = GENERATE_CARDS();
    return {
        market: {
            1: cards[1].splice(0, 4),
            2: cards[2].splice(0, 4),
            3: cards[3].splice(0, 4),
        },
        decks: cards,
        nobles: shuffle(NOBLES).slice(0, 3),
        bank: { WHITE: 4, BLUE: 4, GREEN: 4, RED: 4, BLACK: 4, GOLD: 5 },
        players: {},
        turnOrder: [],
        currentTurnIndex: 0,
        winner: null,
        lastAction: "Game Started"
    };
};

// --- HELPER FUNCTIONS ---

export function canBuyCard(player: SplendorPlayer, card: Card): { canBuy: boolean, finalCost: Record<Gem, number> } {
    let goldNeeded = 0;
    const finalCost: any = { WHITE: 0, BLUE: 0, GREEN: 0, RED: 0, BLACK: 0 };

    (["WHITE", "BLUE", "GREEN", "RED", "BLACK"] as const).forEach(gem => {
        const cost = card.cost[gem] || 0;
        // Discount based on tableau
        const discount = player.tableau.filter(c => c.bonus === gem).length;
        const actualCost = Math.max(0, cost - discount);

        finalCost[gem] = actualCost;

        if (player.tokens[gem] < actualCost) {
            goldNeeded += (actualCost - player.tokens[gem]);
        }
    });

    if (player.tokens.GOLD >= goldNeeded) {
        return { canBuy: true, finalCost };
    }
    return { canBuy: false, finalCost };
}

function checkNobles(player: SplendorPlayer, nobles: Noble[]): Noble | null {
    // Check if player qualifies for any noble they don't already have
    // (Simpler: check visible nobles only, logic simplifies state management)
    // Actually nobles are shared global.
    // Return the FIRST noble they qualify for.

    // Calculate player total bonuses
    const bonuses: Record<string, number> = { WHITE: 0, BLUE: 0, GREEN: 0, RED: 0, BLACK: 0 };
    player.tableau.forEach(c => bonuses[c.bonus]++);

    for (const noble of nobles) {
        let qual = true;
        (["WHITE", "BLUE", "GREEN", "RED", "BLACK"] as const).forEach(gem => {
            if (bonuses[gem] < (noble.cost[gem as keyof Cost] || 0)) {
                qual = false;
            }
        });
        if (qual) return noble;
    }
    return null;
}

// --- REDUCER ---

export function splendorReducer(state: SplendorState, action: SplendorAction): SplendorState {
    const currentPlayerId = state.turnOrder[state.currentTurnIndex];
    if (action.playerId !== currentPlayerId && state.winner === null) {
        console.warn("Not player's turn");
        return state;
    }
    if (state.winner) return state;

    let newState = JSON.parse(JSON.stringify(state)); // Deep copy for safety
    const player = newState.players[action.playerId];
    let actionDescription = "";

    switch (action.type) {
        case "TAKE_TOKENS": {
            const { tokens } = action;

            // Validation
            if (tokens.includes("GOLD")) return state; // Cannot take Gold directly

            if (tokens.length === 2) {
                if (tokens[0] !== tokens[1]) return state; // Must be same
                if (newState.bank[tokens[0]] < 4) return state; // Rule: Stack must be >= 4
            } else if (tokens.length === 3) {
                const distinct = new Set(tokens);
                if (distinct.size !== 3) return state; // Must be distinct
                for (const t of tokens) {
                    if (newState.bank[t] < 1) return state; // Must exist
                }
            } else {
                return state; // Invalid amount
            }

            // Execute
            tokens.forEach((t: Gem) => {
                newState.bank[t]--;
                player.tokens[t]++;
            });
            actionDescription = `took ${tokens.join(", ")}`;
            break;
        }

        case "BUY_CARD": {
            const { cardId } = action;
            let card: Card | undefined;
            let source: "MARKET" | "RESERVED" = "MARKET";

            // Find Card
            card = player.reserved.find((c: Card) => c.id === cardId);
            if (card) {
                source = "RESERVED";
            } else {
                // Check Market
                for (const tier of [1, 2, 3] as Tier[]) {
                    const found = newState.market[tier].find((c: Card) => c.id === cardId);
                    if (found) {
                        card = found;
                        break;
                    }
                }
            }

            if (!card) return state;

            // Check Cost
            const { canBuy, finalCost } = canBuyCard(player, card);
            if (!canBuy) return state;

            // Pay Tokens
            let totalPaid = 0;
            (["WHITE", "BLUE", "GREEN", "RED", "BLACK"] as const).forEach(gem => {
                const amountOwed = finalCost[gem];
                const paidFromTokens = Math.min(player.tokens[gem], amountOwed);
                const paidFromGold = Math.max(0, amountOwed - paidFromTokens);

                // Update Player
                player.tokens[gem] -= paidFromTokens;
                player.tokens.GOLD -= paidFromGold;

                // Update Bank
                newState.bank[gem] += paidFromTokens;
                newState.bank.GOLD += paidFromGold;

                totalPaid += (paidFromTokens + paidFromGold);
            });

            // Move Card
            if (source === "RESERVED") {
                player.reserved = player.reserved.filter((c: Card) => c.id !== cardId);
            } else {
                // Remove from Market and Refill
                const tier = card.tier;
                newState.market[tier] = newState.market[tier].filter((c: Card) => c.id !== cardId);
                if (newState.decks[tier].length > 0) {
                    newState.market[tier].push(newState.decks[tier].pop());
                }
            }

            player.tableau.push(card);
            player.points += card.points;
            actionDescription = `bought a card (${card.points} pts)`;
            break;
        }

        case "RESERVE_CARD": {
            const { cardId } = action;
            if (player.reserved.length >= 3) return state; // Limit 3

            // Find in Market
            let card: Card | undefined;
            let foundTier: Tier | null = null;
            for (const tier of [1, 2, 3] as Tier[]) {
                const found = newState.market[tier].find((c: Card) => c.id === cardId);
                if (found) {
                    card = found;
                    foundTier = tier;
                    break;
                }
            }
            if (!card || !foundTier) return state;

            // Take Gold if available
            if (newState.bank.GOLD > 0) {
                newState.bank.GOLD--;
                player.tokens.GOLD++;
            }

            // Move Card
            player.reserved.push(card);
            newState.market[foundTier] = newState.market[foundTier].filter((c: Card) => c.id !== cardId);
            if (newState.decks[foundTier].length > 0) {
                newState.market[foundTier].push(newState.decks[foundTier].pop());
            }

            actionDescription = "reserved a card";
            break;
        }
    }

    // --- END OF TURN CHECKS ---

    // Visit Nobles (Automatic)
    const noble = checkNobles(player, newState.nobles);
    if (noble) {
        player.nobles.push(noble);
        player.points += noble.points;
        // Remove from board
        newState.nobles = newState.nobles.filter((n: Noble) => n.id !== noble.id);
        actionDescription += ` & visited a Noble (+${noble.points})`;
    }

    // Check Win Condition (>= 15 pts)
    // In real Splendor, you finish the round. For MVP, instant win check.
    if (player.points >= 15) {
        newState.winner = player.username;
        actionDescription += " and WON THE GAME!";
    }

    newState.lastAction = `${player.username} ${actionDescription}`;

    // Next Turn
    newState.players[action.playerId] = player;
    newState.currentTurnIndex = (newState.currentTurnIndex + 1) % newState.turnOrder.length;

    return newState;
}
