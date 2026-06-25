import { SequenceState, checkWin, BOARD_LAYOUT, isPartOfSequence, isDeadCard } from "./Sequence";
import { SplendorState, canBuyCard, Gem, Card } from "./Splendor";
import { CarcassonneState, isValidPlacement, TILE_DEFINITIONS } from "./Carcassonne";
import { AzulState, COLORS, WALL_PATTERN, TileColor } from "./Azul";

export function generateAIMove(
    gameType: "SEQUENCE" | "SPLENDOR" | "CARCASSONNE" | "AZUL",
    state: any,
    aiPlayerId: string,
    difficulty: "EASY" | "HARD" = "HARD"
): any {
    switch (gameType) {
        case "SEQUENCE":
            return generateSequenceMove(state, aiPlayerId, difficulty);
        case "SPLENDOR":
            return generateSplendorMove(state, aiPlayerId);
        case "CARCASSONNE":
            return generateCarcassonneMove(state, aiPlayerId);
        case "AZUL":
            return generateAzulMove(state, aiPlayerId, difficulty);
        default:
            throw new Error(`Unknown game type: ${gameType}`);
    }
}

// --- SEQUENCE AI ---
function evaluateSequenceLength(board: (any)[][], team: string, x: number, y: number): number {
    const isCorner = (r: number, c: number) => (r === 0 && c === 0) || (r === 0 && c === 9) || (r === 9 && c === 0) || (r === 9 && c === 9);
    const getCell = (r: number, c: number) => {
        if (r < 0 || r >= 10 || c < 0 || c >= 10) return null;
        if (r === y && c === x) return team;
        return board[r][c];
    };
    let maxLength = 0;
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dy, dx] of dirs) {
        let count = 1;
        for (let i = 1; i < 5; i++) {
            const r = y + dy * i;
            const c = x + dx * i;
            const cell = getCell(r, c);
            if (cell === team || isCorner(r, c)) count++;
            else break;
        }
        for (let i = 1; i < 5; i++) {
            const r = y - dy * i;
            const c = x - dx * i;
            const cell = getCell(r, c);
            if (cell === team || isCorner(r, c)) count++;
            else break;
        }
        if (count > maxLength) maxLength = count;
    }
    return maxLength;
}

function generateSequenceMove(state: SequenceState, aiPlayerId: string, difficulty: "EASY" | "HARD"): any {
    const aiTeam = state.players[aiPlayerId];
    const opponentTeam = aiTeam === "BLUE" ? "RED" : "BLUE";

    // 1. Handle pending REMOVE_CHIP action
    if (state.pendingAction && state.pendingAction.type === "REMOVE_CHIP" && state.pendingAction.playerId === aiPlayerId) {
        // Find opponent chips that are not part of a completed sequence
        const validTargets: { x: number, y: number, score: number }[] = [];
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                if (state.board[y][x] === opponentTeam) {
                    if (!isPartOfSequence(state.board, x, y, opponentTeam)) {
                        let score = 0;
                        if (difficulty === "HARD") {
                            score = evaluateSequenceLength(state.board, opponentTeam, x, y);
                        }
                        validTargets.push({ x, y, score });
                    }
                }
            }
        }

        if (validTargets.length > 0) {
            if (difficulty === "HARD") validTargets.sort((a, b) => b.score - a.score);
            const target = validTargets[0];
            return {
                type: "REMOVE_CHIP",
                payload: {
                    playerId: aiPlayerId,
                    x: target.x,
                    y: target.y
                }
            };
        }
        // Fallback if no valid targets (should not happen normally)
        return null;
    }

    // 2. Play card action
    const hand = state.hands[aiPlayerId] || [];
    if (hand.length === 0) return null;

    // Check if AI holds any dead card, discard it first.
    for (const card of hand) {
        if (isDeadCard(card, state.board)) {
            return {
                type: "DISCARD_DEAD_CARD",
                payload: {
                    playerId: aiPlayerId,
                    card
                }
            };
        }
    }

    let bestPlay: { card: string; x: number; y: number; score: number } | null = null;

    // Helper to check if a card is a Jack
    const isOneEyedJack = (card: string) => card === "JS" || card === "JH";
    const isTwoEyedJack = (card: string) => card === "JC" || card === "JD";

    // Separate hand into Normal, Two-Eyed Jacks, and One-Eyed Jacks
    for (const card of hand) {
        if (isOneEyedJack(card)) {
            // One-Eyed Jack: can remove any opponent chip.
            // If there's an opponent chip to remove, play it!
            const validTargets: { x: number, y: number, score: number }[] = [];
            for (let y = 0; y < 10; y++) {
                for (let x = 0; x < 10; x++) {
                    if (state.board[y][x] === opponentTeam && !isPartOfSequence(state.board, x, y, opponentTeam)) {
                        let score = 50;
                        if (difficulty === "HARD") {
                            const oppSeqLen = evaluateSequenceLength(state.board, opponentTeam, x, y);
                            if (oppSeqLen >= 4) score += 5000;
                            else if (oppSeqLen === 3) score += 500;
                            else if (oppSeqLen === 2) score += 50;
                        }
                        validTargets.push({ x, y, score });
                    }
                }
            }
            if (validTargets.length > 0) {
                if (difficulty === "HARD") validTargets.sort((a, b) => b.score - a.score);
                const playScore = validTargets[0].score;
                if (!bestPlay || playScore > bestPlay.score) {
                    bestPlay = { card, x: validTargets[0].x, y: validTargets[0].y, score: playScore };
                }
            }
            continue;
        }

        // Find candidate spaces for placement
        const candidates: { x: number, y: number }[] = [];
        const isWild = isTwoEyedJack(card);

        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                // Skip corners
                const isCorner = (y === 0 && x === 0) || (y === 0 && x === 9) || (y === 9 && x === 0) || (y === 9 && x === 9);
                if (isCorner) continue;

                if (state.board[y][x] === null) {
                    if (isWild || BOARD_LAYOUT[y][x] === card) {
                        candidates.push({ x, y });
                    }
                }
            }
        }

        // Score each candidate
        for (const cand of candidates) {
            let score = 0;

            if (difficulty === "EASY") {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = cand.x + dx;
                        const ny = cand.y + dy;
                        if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
                            const cell = state.board[ny][nx];
                            if (cell === aiTeam) score += 10;
                            else if (cell === opponentTeam) score += 5;
                        }
                    }
                }
                const tempBoard = state.board.map(row => [...row]);
                tempBoard[cand.y][cand.x] = aiTeam;
                if (checkWin(tempBoard, aiTeam)) score += 1000;
            } else {
                const mySeqLen = evaluateSequenceLength(state.board, aiTeam, cand.x, cand.y);
                const oppSeqLen = evaluateSequenceLength(state.board, opponentTeam, cand.x, cand.y);

                if (mySeqLen >= 5) score += 10000;
                else if (mySeqLen === 4) score += 1000;
                else if (mySeqLen === 3) score += 100;
                else if (mySeqLen === 2) score += 10;

                if (oppSeqLen >= 5) score += 8000;
                else if (oppSeqLen === 4) score += 800;
                else if (oppSeqLen === 3) score += 80;
                else if (oppSeqLen === 2) score += 8;
            }

            if (isWild) {
                score -= (difficulty === "HARD" ? 200 : 2);
            }

            if (!bestPlay || score > bestPlay.score) {
                bestPlay = { card, x: cand.x, y: cand.y, score };
            }
        }
    }

    if (bestPlay) {
        return {
            type: "PLAY_CARD",
            payload: {
                playerId: aiPlayerId,
                card: bestPlay.card,
                x: bestPlay.x,
                y: bestPlay.y
            }
        };
    }

    // Fallback: If no cards are playable (e.g. all dead cards in hand), we have to play a card anyway
    // (though in actual Sequence you can discard dead cards, but the reducer doesn't support that).
    // Let's just play the first card in hand at some empty space to avoid getting stuck.
    const emptySpaces: { x: number, y: number }[] = [];
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            const isCorner = (y === 0 && x === 0) || (y === 0 && x === 9) || (y === 9 && x === 0) || (y === 9 && x === 9);
            if (!isCorner && state.board[y][x] === null) {
                emptySpaces.push({ x, y });
            }
        }
    }
    if (hand.length > 0 && emptySpaces.length > 0) {
        return {
            type: "PLAY_CARD",
            payload: {
                playerId: aiPlayerId,
                card: hand[0],
                x: emptySpaces[0].x,
                y: emptySpaces[0].y
            }
        };
    }

    return null;
}

// --- SPLENDOR AI ---
function generateSplendorMove(state: SplendorState, aiPlayerId: string): any {
    const player = state.players[aiPlayerId];
    if (!player) return null;

    // 1. Gather all cards from market and reserved
    const marketCards: Card[] = [];
    for (const tier of [1, 2, 3] as const) {
        if (state.market[tier]) {
            marketCards.push(...state.market[tier].filter(c => c !== null && c !== undefined));
        }
    }
    const reservedCards = player.reserved || [];
    const allAvailableCards = [...marketCards, ...reservedCards];

    // 2. Score and pick best buyable card
    let bestBuyableCard: { card: Card; score: number } | null = null;
    for (const card of allAvailableCards) {
        const { canBuy } = canBuyCard(player, card);
        if (canBuy) {
            let score = card.points * 15 + card.tier * 2;
            // Add priority if matching any noble requirements
            for (const noble of state.nobles) {
                if (noble.cost[card.bonus as keyof typeof noble.cost]) {
                    score += 5;
                }
            }
            if (!bestBuyableCard || score > bestBuyableCard.score) {
                bestBuyableCard = { card, score };
            }
        }
    }

    if (bestBuyableCard) {
        return {
            type: "BUY_CARD",
            playerId: aiPlayerId,
            cardId: bestBuyableCard.card.id
        };
    }

    // 3. Take tokens
    // Target the Tier 1 card with the lowest token deficit
    const t1Market = state.market[1] || [];
    let bestTargetCard: { card: Card; deficit: number } | null = null;

    for (const card of t1Market) {
        // Calculate deficit
        let deficit = 0;
        const gemTypes: (Exclude<Gem, "GOLD">)[] = ["WHITE", "BLUE", "GREEN", "RED", "BLACK"];
        for (const gem of gemTypes) {
            const cost = card.cost[gem] || 0;
            const discount = player.tableau.filter(c => c.bonus === gem).length;
            const actualCost = Math.max(0, cost - discount);
            if (player.tokens[gem] < actualCost) {
                deficit += (actualCost - player.tokens[gem]);
            }
        }

        if (deficit > 0) {
            if (!bestTargetCard || deficit < bestTargetCard.deficit) {
                bestTargetCard = { card, deficit };
            }
        }
    }

    if (bestTargetCard) {
        const card = bestTargetCard.card;
        const gemTypes: (Exclude<Gem, "GOLD">)[] = ["WHITE", "BLUE", "GREEN", "RED", "BLACK"];
        const neededGems: Gem[] = [];

        for (const gem of gemTypes) {
            const cost = card.cost[gem] || 0;
            const discount = player.tableau.filter(c => c.bonus === gem).length;
            const actualCost = Math.max(0, cost - discount);
            if (player.tokens[gem] < actualCost) {
                neededGems.push(gem);
            }
        }

        // Try to take 2 of the same if needed >= 2 and bank has >= 4
        for (const gem of neededGems) {
            const cost = card.cost[gem as Exclude<Gem, "GOLD">] || 0;
            const discount = player.tableau.filter(c => c.bonus === gem).length;
            const actualCost = Math.max(0, cost - discount);
            const deficit = actualCost - player.tokens[gem as Exclude<Gem, "GOLD">];

            if (deficit >= 2 && state.bank[gem] >= 4) {
                return {
                    type: "TAKE_TOKENS",
                    playerId: aiPlayerId,
                    tokens: [gem, gem]
                };
            }
        }

        // Try to take 3 distinct needed gems
        const availableNeeded = neededGems.filter(g => state.bank[g] >= 1);
        if (availableNeeded.length >= 3) {
            return {
                type: "TAKE_TOKENS",
                playerId: aiPlayerId,
                tokens: availableNeeded.slice(0, 3)
            };
        }

        // If we can't get 3 distinct needed, just take whatever needed are available
        if (availableNeeded.length > 0) {
            // Fill with other available gems from bank to make it 3 if possible
            const otherGems = gemTypes.filter(g => !availableNeeded.includes(g) && state.bank[g] >= 1);
            const taken = [...availableNeeded];
            while (taken.length < 3 && otherGems.length > 0) {
                taken.push(otherGems.pop()!);
            }
            if (taken.length > 0) {
                // Must be either 3 distinct, or 2 of same. If we got 1 or 2 distinct,
                // taking 3 distinct might not be possible, but taking distinct gems is fine as long as they are distinct.
                // Wait! Splendor rules say you can take 3 distinct, or 2 of the same. You cannot take exactly 2 distinct.
                // But wait: if the bank only has 2 distinct gems left, you CAN take 2 distinct.
                // However, the reducer requires:
                // "If tokens.length === 2: must be same"
                // "If tokens.length === 3: must be distinct"
                // So the AI MUST take exactly 3 distinct, or 2 of the same.
                // If we have less than 3 distinct gems in the bank, we cannot take 3.
                // Let's check how many distinct gems are in the bank.
                const distinctInBank = gemTypes.filter(g => state.bank[g] >= 1);
                if (distinctInBank.length >= 3) {
                    // We can take 3 distinct
                    // Prioritize our needed gems
                    const choice = [...availableNeeded];
                    const remainingBank = distinctInBank.filter(g => !choice.includes(g));
                    while (choice.length < 3 && remainingBank.length > 0) {
                        choice.push(remainingBank.pop()!);
                    }
                    return {
                        type: "TAKE_TOKENS",
                        playerId: aiPlayerId,
                        tokens: choice.slice(0, 3)
                    };
                } else if (distinctInBank.length > 0) {
                    // Can we take 2 of the same?
                    const doubleTarget = distinctInBank.find(g => state.bank[g] >= 4);
                    if (doubleTarget) {
                        return {
                            type: "TAKE_TOKENS",
                            playerId: aiPlayerId,
                            tokens: [doubleTarget, doubleTarget]
                        };
                    }
                }
            }
        }
    }

    // Fallback if token taking is blocked/impossible: reserve a card if we have space
    if (player.reserved.length < 3) {
        // Pick the first Tier 1 card in the market to reserve
        const t1Market = state.market[1] || [];
        if (t1Market.length > 0) {
            return {
                type: "RESERVE_CARD",
                playerId: aiPlayerId,
                cardId: t1Market[0].id
            };
        }
    }

    // Ultimate fallback: take any 3 distinct tokens if bank has them
    const gemTypes: (Exclude<Gem, "GOLD">)[] = ["WHITE", "BLUE", "GREEN", "RED", "BLACK"];
    const distinctInBank = gemTypes.filter(g => state.bank[g] >= 1);
    if (distinctInBank.length >= 3) {
        return {
            type: "TAKE_TOKENS",
            playerId: aiPlayerId,
            tokens: distinctInBank.slice(0, 3)
        };
    } else {
        const doubleTarget = distinctInBank.find(g => state.bank[g] >= 4);
        if (doubleTarget) {
            return {
                type: "TAKE_TOKENS",
                playerId: aiPlayerId,
                tokens: [doubleTarget, doubleTarget]
            };
        }
    }

    return null;
}

// --- CARCASSONNE AI ---
function generateCarcassonneMove(state: CarcassonneState, aiPlayerId: string): any {
    if (state.phase === "PLACING_TILE") {
        if (!state.currentTileId) return null;

        // Find all candidate spaces on the board (neighbors of existing tiles)
        const candidates: string[] = [];
        for (const key of Object.keys(state.board)) {
            const tile = state.board[key];
            const neighbors = [
                { x: tile.x, y: tile.y - 1 },
                { x: tile.x + 1, y: tile.y },
                { x: tile.x, y: tile.y + 1 },
                { x: tile.x - 1, y: tile.y }
            ];
            for (const n of neighbors) {
                const nKey = `${n.x},${n.y}`;
                if (!state.board[nKey] && !candidates.includes(nKey)) {
                    candidates.push(nKey);
                }
            }
        }

        // Try to place the tile at any candidate with any rotation
        for (const cKey of candidates) {
            const [x, y] = cKey.split(",").map(Number);
            for (let rot = 0; rot < 4; rot++) {
                if (isValidPlacement(state.board, state.currentTileId, rot as any, x, y)) {
                    // Found a valid placement!
                    return {
                        type: "PLACE_TILE",
                        playerId: aiPlayerId,
                        payload: { x, y, rotation: rot }
                    };
                }
            }
        }

        // If no valid placement is possible, skip turn
        return {
            type: "SKIP_TURN",
            playerId: aiPlayerId
        };
    }

    if (state.phase === "PLACING_MEEPLE") {
        const meepleCount = state.players[aiPlayerId]?.meeples || 0;
        const lastPlaced = state.lastPlacedTile;

        if (meepleCount > 0 && lastPlaced) {
            const tile = state.board[`${lastPlaced.x},${lastPlaced.y}`];
            if (tile) {
                const def = TILE_DEFINITIONS[tile.tileId];
                // Heuristic: If it is a monastery, place meeple on the center (index 4)
                if (def && def.center === "MONASTERY") {
                    return {
                        type: "PLACE_MEEPLE",
                        playerId: aiPlayerId,
                        payload: 4
                    };
                }
            }
        }

        // Otherwise skip placing meeple
        return {
            type: "SKIP_MEEPLE",
            playerId: aiPlayerId
        };
    }

    return null;
}

// --- AZUL AI ---
function simulateWallScore(wall: boolean[][], row: number, col: number): number {
    let horizontalMatches = 1;
    let verticalMatches = 1;
    for (let c = col + 1; c < 5; c++) { if (wall[row][c]) horizontalMatches++; else break; }
    for (let c = col - 1; c >= 0; c--) { if (wall[row][c]) horizontalMatches++; else break; }
    for (let r = row + 1; r < 5; r++) { if (wall[r][col]) verticalMatches++; else break; }
    for (let r = row - 1; r >= 0; r--) { if (wall[r][col]) verticalMatches++; else break; }

    if (horizontalMatches === 1 && verticalMatches === 1) return 1;
    let score = 0;
    if (horizontalMatches > 1) score += horizontalMatches;
    if (verticalMatches > 1) score += verticalMatches;
    
    if (horizontalMatches === 5) score += 2;
    if (verticalMatches === 5) score += 7;
    return score;
}

function generateAzulMove(state: AzulState, aiPlayerId: string, difficulty: "EASY" | "HARD"): any {
    const player = state.players[aiPlayerId];
    if (!player) return null;

    // 1. Compile all available choices from factories and center
    const choices: { source: "FACTORY" | "CENTER"; factoryIndex?: number; color: TileColor; count: number }[] = [];

    // Factories
    state.factories.forEach((factory, idx) => {
        if (factory.length > 0) {
            const uniqueColors = Array.from(new Set(factory));
            uniqueColors.forEach(color => {
                const count = factory.filter(c => c === color).length;
                choices.push({ source: "FACTORY", factoryIndex: idx, color, count });
            });
        }
    });

    // Center
    if (state.center.length > 0) {
        // Exclude first player token from direct color selection
        const centerColors = Array.from(new Set(state.center.filter(c => c !== "FIRST_PLAYER")));
        centerColors.forEach(color => {
            const count = state.center.filter(c => c === color).length;
            choices.push({ source: "CENTER", color, count });
        });
    }

    if (choices.length === 0) return null;

    // 2. Generate all valid destination moves and score them
    let bestMove: {
        source: "FACTORY" | "CENTER";
        factoryIndex?: number;
        color: TileColor;
        patternLineIndex: number | "FLOOR";
        score: number;
    } | null = null;

    // Floor penalties helper
    const getFloorPenalty = (currentFloorCount: number, additionalCount: number) => {
        const floorPenalties = [-1, -1, -2, -2, -2, -3, -3];
        let penalty = 0;
        for (let i = 0; i < additionalCount; i++) {
            const idx = currentFloorCount + i;
            if (idx < floorPenalties.length) {
                penalty += floorPenalties[idx];
            }
        }
        return penalty; // returns a negative number or 0
    };

    for (const choice of choices) {
        // Destination options: 0, 1, 2, 3, 4, and "FLOOR"
        const destOptions: (number | "FLOOR")[] = [0, 1, 2, 3, 4, "FLOOR"];

        for (const dest of destOptions) {
            // Validate destination
            if (dest !== "FLOOR") {
                const line = player.patternLines[dest];
                const capacity = dest + 1;

                // Color mismatch check
                if (line.length > 0 && line[0] !== choice.color) continue;

                // Color already on wall check
                const colIdxOnWall = WALL_PATTERN[dest].indexOf(choice.color);
                if (player.wall[dest][colIdxOnWall]) continue;
            }

            // Valid! Now score it
            let score = 0;
            const draftedCount = choice.count;

            if (dest === "FLOOR") {
                score = getFloorPenalty(player.floorLine.length, draftedCount);
            } else {
                const line = player.patternLines[dest];
                const capacity = dest + 1;
                const remaining = capacity - line.length;

                if (draftedCount <= remaining) {
                    if (draftedCount === remaining) {
                        if (difficulty === "HARD") {
                            const colIdxOnWall = WALL_PATTERN[dest].indexOf(choice.color);
                            score = simulateWallScore(player.wall, dest, colIdxOnWall);
                        } else {
                            score = 10 + dest;
                        }
                    } else {
                        score = draftedCount;
                    }
                } else {
                    const overflow = draftedCount - remaining;
                    let completionScore = 10 + dest;
                    if (difficulty === "HARD") {
                        const colIdxOnWall = WALL_PATTERN[dest].indexOf(choice.color);
                        completionScore = simulateWallScore(player.wall, dest, colIdxOnWall);
                    }
                    const floorPenalty = getFloorPenalty(player.floorLine.length, overflow);
                    score = completionScore + floorPenalty;
                }
                
            }

            // Center drafts might give the first player token, which adds an automatic -1/2 penalty
            if (choice.source === "CENTER" && state.center.includes("FIRST_PLAYER")) {
                score += getFloorPenalty(player.floorLine.length + (dest === "FLOOR" ? draftedCount : Math.max(0, draftedCount - (dest + 1 - player.patternLines[dest].length))), 1);
            }

            if (!bestMove || score > bestMove.score) {
                bestMove = {
                    source: choice.source,
                    factoryIndex: choice.factoryIndex,
                    color: choice.color,
                    patternLineIndex: dest,
                    score
                };
            }
        }
    }

    if (bestMove) {
        return {
            type: "DRAFT_TILES",
            payload: {
                source: bestMove.source,
                factoryIndex: bestMove.factoryIndex,
                color: bestMove.color,
                patternLineIndex: bestMove.patternLineIndex,
                username: aiPlayerId
            }
        };
    }

    return null;
}
