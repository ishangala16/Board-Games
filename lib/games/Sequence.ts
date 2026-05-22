export type Team = "RED" | "BLUE";
export type PlayerId = string;

export interface SequenceState {
    board: (Team | null)[][]; // 10x10 grid
    players: Record<string, Team>;
    currentTurn: Team;
    winner: Team | null;
    hands: Record<string, string[]>; // card codes e.g. "JD", "10H"
    deck: string[];
    lastMove: { x: number, y: number } | null;
    pendingAction: { type: "REMOVE_CHIP", playerId: string } | null;
}

// Simplified Deck generation (2 standard decks)
function createDeck(): string[] {
    const suits = ['H', 'D', 'C', 'S'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Q', 'K', 'A']; // No Jacks in traversal (handled separately usually) or Jacks included
    // In actual Sequence, Jacks are wild, so they are in the deck.
    const allRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    let deck: string[] = [];
    // 2 decks
    for (let i = 0; i < 2; i++) {
        for (const suit of suits) {
            for (const rank of allRanks) {
                deck.push(rank + suit);
            }
        }
    }
    return shuffle(deck);
}

function shuffle(array: string[]) {
    return array.sort(() => Math.random() - 0.5);
}

export const INITIAL_STATE: SequenceState = {
    board: Array(10).fill(null).map(() => Array(10).fill(null)),
    players: {},
    currentTurn: "BLUE", // Blue starts usually
    winner: null,
    hands: {},
    deck: createDeck(),
    lastMove: null,
    pendingAction: null
};

// Board mapping (Card -> Position) would be complex to hardcode here, 
// for MVP we might randomly assign or just assume a simple grid for testing.
// Real Sequence board has a specific layout.
export const BOARD_LAYOUT = [
    ["XX", "2S", "3S", "4S", "5S", "6S", "7S", "8S", "9S", "XX"],
    ["6C", "5C", "4C", "3C", "2C", "AH", "KH", "QH", "10H", "10S"],
    ["7C", "AS", "2D", "3D", "4D", "5D", "6D", "7D", "9H", "QS"],
    ["8C", "KS", "6C", "5C", "4C", "3C", "2C", "8D", "8H", "KS"],
    ["9C", "QS", "7C", "6H", "5H", "4H", "AH", "9D", "7H", "AS"],
    ["10C", "10S", "8C", "7H", "2H", "3H", "KH", "10D", "6H", "2D"],
    ["QC", "9S", "9C", "8H", "9H", "10H", "QH", "QD", "5H", "3D"],
    ["KC", "8S", "10C", "QC", "KC", "AC", "AD", "KD", "4H", "4D"],
    ["AC", "7S", "6S", "5S", "4S", "3S", "2S", "2H", "3H", "5D"],
    ["XX", "AD", "KD", "QD", "10D", "9D", "8D", "7D", "6D", "XX"]
];
// Note: This layout is approximate/example. XX are corners (Free).

export type SequenceAction =
    | {
        type: "PLAY_CARD";
        payload: {
            playerId: string;
            card: string;
            x: number;
            y: number;
        };
    }
    | {
        type: "REMOVE_CHIP";
        payload: {
            playerId: string;
            x: number;
            y: number;
        };
    };

export function sequenceReducer(state: SequenceState, action: SequenceAction): SequenceState {
    switch (action.type) {
        case "PLAY_CARD": {
            const { playerId, card, x, y } = action.payload;
            const playerTeam = state.players[playerId];

            // 1. Validate Turn
            if (state.currentTurn !== playerTeam) {
                throw new Error("Not your turn");
            }

            // 2. Validate Card in Hand
            const hand = state.hands[playerId];
            if (!hand.includes(card)) {
                throw new Error("You don't hold this card");
            }

            // --- ONE-EYED JACK (REMOVE CHIP) ---
            if (isOneEyedJack(card)) {
                // Remove card from hand immediately
                const newHand = [...hand];
                newHand.splice(newHand.indexOf(card), 1);

                return {
                    ...state,
                    hands: { ...state.hands, [playerId]: newHand },
                    pendingAction: { type: "REMOVE_CHIP", playerId },
                    lastMove: null // No board move yet
                };
            }

            // --- NORMAL / TWO-EYED JACK PLACEMENT ---
            // 3. Validate Board Position
            if (state.board[y][x] !== null) {
                throw new Error("Space occupied");
            }

            const targetSpace = BOARD_LAYOUT[y][x];

            // Validation
            if (isTwoEyedJack(card)) {
                // Wild: Can place anywhere empty (that isn't a corner)
            } else {
                // Normal
                if (targetSpace !== card) {
                    throw new Error(`Card ${card} does not match board space ${targetSpace}`);
                }
            }

            if (targetSpace === "XX") {
                throw new Error("Cannot play on free space");
            }

            // Execute Move
            const newBoard = state.board.map(row => [...row]);
            newBoard[y][x] = playerTeam;

            // Remove card from hand
            const newHand = [...hand];
            const cardIndex = newHand.indexOf(card);
            newHand.splice(cardIndex, 1);

            // Draw new card
            const newDeck = [...state.deck];
            if (newDeck.length > 0) {
                newHand.push(newDeck.pop()!);
            }

            // Check Win
            const winner = checkWin(newBoard, playerTeam) ? playerTeam : null;

            return {
                ...state,
                board: newBoard,
                hands: {
                    ...state.hands,
                    [playerId]: newHand
                },
                deck: newDeck,
                currentTurn: playerTeam === "RED" ? "BLUE" : "RED",
                lastMove: { x, y },
                winner
            };
        }
        case "REMOVE_CHIP": {
            const { playerId, x, y } = action.payload;
            const playerTeam = state.players[playerId];

            if (!state.pendingAction || state.pendingAction.type !== "REMOVE_CHIP" || state.pendingAction.playerId !== playerId) {
                return state; // Not waiting for removal
            }

            // Validate Target: Must be occupied by OPPONENT
            const targetCell = state.board[y][x];
            if (!targetCell || targetCell === playerTeam) {
                throw new Error("Target cell must be occupied by an opponent's chip");
            }

            // 2. Validate Locked Chips (Cannot remove from completed sequence)
            if (isPartOfSequence(state.board, x, y, targetCell)) {
                throw new Error("Chip is part of a locked sequence");
            }

            // Remove Chip
            const newBoard = state.board.map(row => [...row]);
            newBoard[y][x] = null;

            // Draw replacement card now (since we delayed it)
            const newDeck = [...state.deck];
            const newHand = [...state.hands[playerId]];
            if (newDeck.length > 0) newHand.push(newDeck.pop()!);

            return {
                ...state,
                board: newBoard,
                hands: { ...state.hands, [playerId]: newHand },
                deck: newDeck,
                currentTurn: playerTeam === "RED" ? "BLUE" : "RED", // End turn
                pendingAction: null
            };
        }
        default:
            return state;
    }
}

// Two-Eyed Jacks: Clubs (C) and Diamonds (D)
// One-Eyed Jacks: Spades (S) and Hearts (H)
function isTwoEyedJack(card: string) {
    return card === "JC" || card === "JD";
}

function isOneEyedJack(card: string) {
    return card === "JS" || card === "JH";
}

function isWild(card: string) {
    return isTwoEyedJack(card);
}

export function checkWin(board: (Team | null)[][], team: Team): boolean {
    // Check for 2 sequences of 5.
    // Simplifying: Check for ANY sequence of 5 for MVP.
    return hasSequence(board, team);
}

function hasSequence(board: (Team | null)[][], team: Team): boolean {
    const size = 10;
    // Horizontal
    for (let r = 0; r < size; r++) {
        let count = 0;
        for (let c = 0; c < size; c++) {
            if (board[r][c] === team || isCorner(r, c)) count++;
            else count = 0;
            if (count >= 5) return true;
        }
    }
    // Vertical
    for (let c = 0; c < size; c++) {
        let count = 0;
        for (let r = 0; r < size; r++) {
            if (board[r][c] === team || isCorner(r, c)) count++;
            else count = 0;
            if (count >= 5) return true;
        }
    }
    // Diagonals (Top-Left to Bottom-Right)
    for (let r = 0; r <= size - 5; r++) {
        for (let c = 0; c <= size - 5; c++) {
            let count = 0;
            for (let i = 0; i < 5; i++) {
                if (board[r + i][c + i] === team || isCorner(r + i, c + i)) count++;
                else break;
            }
            if (count === 5) return true;
        }
    }

    // Diagonals (Top-Right to Bottom-Left)
    for (let r = 0; r <= size - 5; r++) {
        for (let c = 4; c < size; c++) {
            let count = 0;
            for (let i = 0; i < 5; i++) {
                if (board[r + i][c - i] === team || isCorner(r + i, c - i)) count++;
                else break;
            }
            if (count === 5) return true;
        }
    }

    return false;
}

function isCorner(r: number, c: number) {
    return (r === 0 && c === 0) || (r === 0 && c === 9) || (r === 9 && c === 0) || (r === 9 && c === 9);
}

export function isPartOfSequence(board: (Team | null)[][], x: number, y: number, team: Team): boolean {
    const size = 10;

    // Check all window positions that could include (x,y)
    // Offset i from -4 to 0 (relative to the sequence start)

    // Horizontal
    for (let i = 0; i < 5; i++) {
        const startX = x - i;
        const endX = startX + 4;
        if (startX >= 0 && endX < size) {
            let match = true;
            for (let k = 0; k < 5; k++) {
                const cell = board[y][startX + k];
                if (cell !== team && !isCorner(y, startX + k)) {
                    match = false;
                    break;
                }
            }
            if (match) return true;
        }
    }

    // Vertical
    for (let i = 0; i < 5; i++) {
        const startY = y - i;
        const endY = startY + 4;
        if (startY >= 0 && endY < size) {
            let match = true;
            for (let k = 0; k < 5; k++) {
                const cell = board[startY + k][x];
                if (cell !== team && !isCorner(startY + k, x)) {
                    match = false;
                    break;
                }
            }
            if (match) return true;
        }
    }

    // Diagonal (Top-Left to Bottom-Right)
    for (let i = 0; i < 5; i++) {
        const startX = x - i;
        const startY = y - i;
        const endX = startX + 4;
        const endY = startY + 4;

        if (startX >= 0 && startY >= 0 && endX < size && endY < size) {
            let match = true;
            for (let k = 0; k < 5; k++) {
                const cell = board[startY + k][startX + k];
                if (cell !== team && !isCorner(startY + k, startX + k)) {
                    match = false;
                    break;
                }
            }
            if (match) return true;
        }
    }

    // Diagonal (Top-Right to Bottom-Left)
    for (let i = 0; i < 5; i++) {
        const startX = x + i; // Moving LEFT means start X is higher? No.
        // Sequence: (r, c), (r+1, c-1)...
        // We want to find a sequence starting at (startR, startC) such that (y, x) is the k-th element.
        // (y, x) = (startR + k, startC - k)
        // => startR = y - k
        // => startC = x + k

        const startY = y - i;
        const startX_ = x + i;

        // Sequence goes down-left:
        // (startY, startX_), (startY+1, startX_-1) ...

        // Bounds check for the whole sequence
        // Start point
        // End point: (startY+4, startX_-4)

        if (startY >= 0 && startX_ < size && (startY + 4) < size && (startX_ - 4) >= 0) {
            let match = true;
            for (let k = 0; k < 5; k++) {
                const cell = board[startY + k][startX_ - k];
                if (cell !== team && !isCorner(startY + k, startX_ - k)) {
                    match = false;
                    break;
                }
            }
            if (match) return true;
        }
    }

    return false;
}
