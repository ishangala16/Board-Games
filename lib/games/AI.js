"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIMove = generateAIMove;
var Sequence_1 = require("./Sequence");
var Splendor_1 = require("./Splendor");
var Carcassonne_1 = require("./Carcassonne");
var Azul_1 = require("./Azul");
function generateAIMove(gameType, state, aiPlayerId, difficulty) {
    if (difficulty === void 0) { difficulty = "HARD"; }
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
            throw new Error("Unknown game type: ".concat(gameType));
    }
}
// --- SEQUENCE AI ---
function evaluateSequenceLength(board, team, x, y) {
    var isCorner = function (r, c) { return (r === 0 && c === 0) || (r === 0 && c === 9) || (r === 9 && c === 0) || (r === 9 && c === 9); };
    var getCell = function (r, c) {
        if (r < 0 || r >= 10 || c < 0 || c >= 10)
            return null;
        if (r === y && c === x)
            return team;
        return board[r][c];
    };
    var maxLength = 0;
    var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (var _i = 0, dirs_1 = dirs; _i < dirs_1.length; _i++) {
        var _a = dirs_1[_i], dy = _a[0], dx = _a[1];
        var count = 1;
        for (var i = 1; i < 5; i++) {
            var r = y + dy * i;
            var c = x + dx * i;
            var cell = getCell(r, c);
            if (cell === team || isCorner(r, c))
                count++;
            else
                break;
        }
        for (var i = 1; i < 5; i++) {
            var r = y - dy * i;
            var c = x - dx * i;
            var cell = getCell(r, c);
            if (cell === team || isCorner(r, c))
                count++;
            else
                break;
        }
        if (count > maxLength)
            maxLength = count;
    }
    return maxLength;
}
function generateSequenceMove(state, aiPlayerId, difficulty) {
    var aiTeam = state.players[aiPlayerId];
    var opponentTeam = aiTeam === "BLUE" ? "RED" : "BLUE";
    // 1. Handle pending REMOVE_CHIP action
    if (state.pendingAction && state.pendingAction.type === "REMOVE_CHIP" && state.pendingAction.playerId === aiPlayerId) {
        // Find opponent chips that are not part of a completed sequence
        var validTargets = [];
        for (var y = 0; y < 10; y++) {
            for (var x = 0; x < 10; x++) {
                if (state.board[y][x] === opponentTeam) {
                    if (!(0, Sequence_1.isPartOfSequence)(state.board, x, y, opponentTeam)) {
                        var score = 0;
                        if (difficulty === "HARD") {
                            score = evaluateSequenceLength(state.board, opponentTeam, x, y);
                        }
                        validTargets.push({ x: x, y: y, score: score });
                    }
                }
            }
        }
        if (validTargets.length > 0) {
            if (difficulty === "HARD")
                validTargets.sort(function (a, b) { return b.score - a.score; });
            var target = validTargets[0];
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
    var hand = state.hands[aiPlayerId] || [];
    if (hand.length === 0)
        return null;
    // Check if AI holds any dead card, discard it first.
    for (var _i = 0, hand_1 = hand; _i < hand_1.length; _i++) {
        var card = hand_1[_i];
        if ((0, Sequence_1.isDeadCard)(card, state.board)) {
            return {
                type: "DISCARD_DEAD_CARD",
                payload: {
                    playerId: aiPlayerId,
                    card: card
                }
            };
        }
    }
    var bestPlay = null;
    // Helper to check if a card is a Jack
    var isOneEyedJack = function (card) { return card === "JS" || card === "JH"; };
    var isTwoEyedJack = function (card) { return card === "JC" || card === "JD"; };
    // Separate hand into Normal, Two-Eyed Jacks, and One-Eyed Jacks
    for (var _a = 0, hand_2 = hand; _a < hand_2.length; _a++) {
        var card = hand_2[_a];
        if (isOneEyedJack(card)) {
            // One-Eyed Jack: can remove any opponent chip.
            // If there's an opponent chip to remove, play it!
            var validTargets = [];
            for (var y = 0; y < 10; y++) {
                for (var x = 0; x < 10; x++) {
                    if (state.board[y][x] === opponentTeam && !(0, Sequence_1.isPartOfSequence)(state.board, x, y, opponentTeam)) {
                        var score = 50;
                        if (difficulty === "HARD") {
                            var oppSeqLen = evaluateSequenceLength(state.board, opponentTeam, x, y);
                            if (oppSeqLen >= 4)
                                score += 5000;
                            else if (oppSeqLen === 3)
                                score += 500;
                            else if (oppSeqLen === 2)
                                score += 50;
                        }
                        validTargets.push({ x: x, y: y, score: score });
                    }
                }
            }
            if (validTargets.length > 0) {
                if (difficulty === "HARD")
                    validTargets.sort(function (a, b) { return b.score - a.score; });
                var playScore = validTargets[0].score;
                if (!bestPlay || playScore > bestPlay.score) {
                    bestPlay = { card: card, x: validTargets[0].x, y: validTargets[0].y, score: playScore };
                }
            }
            continue;
        }
        // Find candidate spaces for placement
        var candidates = [];
        var isWild = isTwoEyedJack(card);
        for (var y = 0; y < 10; y++) {
            for (var x = 0; x < 10; x++) {
                // Skip corners
                var isCorner = (y === 0 && x === 0) || (y === 0 && x === 9) || (y === 9 && x === 0) || (y === 9 && x === 9);
                if (isCorner)
                    continue;
                if (state.board[y][x] === null) {
                    if (isWild || Sequence_1.BOARD_LAYOUT[y][x] === card) {
                        candidates.push({ x: x, y: y });
                    }
                }
            }
        }
        // Score each candidate
        for (var _b = 0, candidates_1 = candidates; _b < candidates_1.length; _b++) {
            var cand = candidates_1[_b];
            var score = 0;
            if (difficulty === "EASY") {
                for (var dy = -1; dy <= 1; dy++) {
                    for (var dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0)
                            continue;
                        var nx = cand.x + dx;
                        var ny = cand.y + dy;
                        if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
                            var cell = state.board[ny][nx];
                            if (cell === aiTeam)
                                score += 10;
                            else if (cell === opponentTeam)
                                score += 5;
                        }
                    }
                }
                var tempBoard = state.board.map(function (row) { return __spreadArray([], row, true); });
                tempBoard[cand.y][cand.x] = aiTeam;
                if ((0, Sequence_1.checkWin)(tempBoard, aiTeam))
                    score += 1000;
            }
            else {
                var mySeqLen = evaluateSequenceLength(state.board, aiTeam, cand.x, cand.y);
                var oppSeqLen = evaluateSequenceLength(state.board, opponentTeam, cand.x, cand.y);
                if (mySeqLen >= 5)
                    score += 10000;
                else if (mySeqLen === 4)
                    score += 1000;
                else if (mySeqLen === 3)
                    score += 100;
                else if (mySeqLen === 2)
                    score += 10;
                if (oppSeqLen >= 5)
                    score += 8000;
                else if (oppSeqLen === 4)
                    score += 800;
                else if (oppSeqLen === 3)
                    score += 80;
                else if (oppSeqLen === 2)
                    score += 8;
            }
            if (isWild) {
                score -= (difficulty === "HARD" ? 200 : 2);
            }
            if (!bestPlay || score > bestPlay.score) {
                bestPlay = { card: card, x: cand.x, y: cand.y, score: score };
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
    var emptySpaces = [];
    for (var y = 0; y < 10; y++) {
        for (var x = 0; x < 10; x++) {
            var isCorner = (y === 0 && x === 0) || (y === 0 && x === 9) || (y === 9 && x === 0) || (y === 9 && x === 9);
            if (!isCorner && state.board[y][x] === null) {
                emptySpaces.push({ x: x, y: y });
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
function generateSplendorMove(state, aiPlayerId) {
    var player = state.players[aiPlayerId];
    if (!player)
        return null;
    // 1. Gather all cards from market and reserved
    var marketCards = [];
    for (var _i = 0, _a = [1, 2, 3]; _i < _a.length; _i++) {
        var tier = _a[_i];
        if (state.market[tier]) {
            marketCards.push.apply(marketCards, state.market[tier].filter(function (c) { return c !== null && c !== undefined; }));
        }
    }
    var reservedCards = player.reserved || [];
    var allAvailableCards = __spreadArray(__spreadArray([], marketCards, true), reservedCards, true);
    // 2. Score and pick best buyable card
    var bestBuyableCard = null;
    for (var _b = 0, allAvailableCards_1 = allAvailableCards; _b < allAvailableCards_1.length; _b++) {
        var card = allAvailableCards_1[_b];
        var canBuy = (0, Splendor_1.canBuyCard)(player, card).canBuy;
        if (canBuy) {
            var score = card.points * 15 + card.tier * 2;
            // Add priority if matching any noble requirements
            for (var _c = 0, _d = state.nobles; _c < _d.length; _c++) {
                var noble = _d[_c];
                if (noble.cost[card.bonus]) {
                    score += 5;
                }
            }
            if (!bestBuyableCard || score > bestBuyableCard.score) {
                bestBuyableCard = { card: card, score: score };
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
    var t1Market = state.market[1] || [];
    var bestTargetCard = null;
    for (var _e = 0, t1Market_1 = t1Market; _e < t1Market_1.length; _e++) {
        var card = t1Market_1[_e];
        // Calculate deficit
        var deficit = 0;
        var gemTypes_3 = ["WHITE", "BLUE", "GREEN", "RED", "BLACK"];
        var _loop_1 = function (gem) {
            var cost = card.cost[gem] || 0;
            var discount = player.tableau.filter(function (c) { return c.bonus === gem; }).length;
            var actualCost = Math.max(0, cost - discount);
            if (player.tokens[gem] < actualCost) {
                deficit += (actualCost - player.tokens[gem]);
            }
        };
        for (var _f = 0, gemTypes_1 = gemTypes_3; _f < gemTypes_1.length; _f++) {
            var gem = gemTypes_1[_f];
            _loop_1(gem);
        }
        if (deficit > 0) {
            if (!bestTargetCard || deficit < bestTargetCard.deficit) {
                bestTargetCard = { card: card, deficit: deficit };
            }
        }
    }
    if (bestTargetCard) {
        var card = bestTargetCard.card;
        var gemTypes_4 = ["WHITE", "BLUE", "GREEN", "RED", "BLACK"];
        var neededGems = [];
        var _loop_2 = function (gem) {
            var cost = card.cost[gem] || 0;
            var discount = player.tableau.filter(function (c) { return c.bonus === gem; }).length;
            var actualCost = Math.max(0, cost - discount);
            if (player.tokens[gem] < actualCost) {
                neededGems.push(gem);
            }
        };
        for (var _g = 0, gemTypes_2 = gemTypes_4; _g < gemTypes_2.length; _g++) {
            var gem = gemTypes_2[_g];
            _loop_2(gem);
        }
        var _loop_3 = function (gem) {
            var cost = card.cost[gem] || 0;
            var discount = player.tableau.filter(function (c) { return c.bonus === gem; }).length;
            var actualCost = Math.max(0, cost - discount);
            var deficit = actualCost - player.tokens[gem];
            if (deficit >= 2 && state.bank[gem] >= 4) {
                return { value: {
                        type: "TAKE_TOKENS",
                        playerId: aiPlayerId,
                        tokens: [gem, gem]
                    } };
            }
        };
        // Try to take 2 of the same if needed >= 2 and bank has >= 4
        for (var _h = 0, neededGems_1 = neededGems; _h < neededGems_1.length; _h++) {
            var gem = neededGems_1[_h];
            var state_1 = _loop_3(gem);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        // Try to take 3 distinct needed gems
        var availableNeeded_1 = neededGems.filter(function (g) { return state.bank[g] >= 1; });
        if (availableNeeded_1.length >= 3) {
            return {
                type: "TAKE_TOKENS",
                playerId: aiPlayerId,
                tokens: availableNeeded_1.slice(0, 3)
            };
        }
        // If we can't get 3 distinct needed, just take whatever needed are available
        if (availableNeeded_1.length > 0) {
            // Fill with other available gems from bank to make it 3 if possible
            var otherGems = gemTypes_4.filter(function (g) { return !availableNeeded_1.includes(g) && state.bank[g] >= 1; });
            var taken = __spreadArray([], availableNeeded_1, true);
            while (taken.length < 3 && otherGems.length > 0) {
                taken.push(otherGems.pop());
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
                var distinctInBank_1 = gemTypes_4.filter(function (g) { return state.bank[g] >= 1; });
                if (distinctInBank_1.length >= 3) {
                    // We can take 3 distinct
                    // Prioritize our needed gems
                    var choice_1 = __spreadArray([], availableNeeded_1, true);
                    var remainingBank = distinctInBank_1.filter(function (g) { return !choice_1.includes(g); });
                    while (choice_1.length < 3 && remainingBank.length > 0) {
                        choice_1.push(remainingBank.pop());
                    }
                    return {
                        type: "TAKE_TOKENS",
                        playerId: aiPlayerId,
                        tokens: choice_1.slice(0, 3)
                    };
                }
                else if (distinctInBank_1.length > 0) {
                    // Can we take 2 of the same?
                    var doubleTarget = distinctInBank_1.find(function (g) { return state.bank[g] >= 4; });
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
        var t1Market_2 = state.market[1] || [];
        if (t1Market_2.length > 0) {
            return {
                type: "RESERVE_CARD",
                playerId: aiPlayerId,
                cardId: t1Market_2[0].id
            };
        }
    }
    // Ultimate fallback: take any 3 distinct tokens if bank has them
    var gemTypes = ["WHITE", "BLUE", "GREEN", "RED", "BLACK"];
    var distinctInBank = gemTypes.filter(function (g) { return state.bank[g] >= 1; });
    if (distinctInBank.length >= 3) {
        return {
            type: "TAKE_TOKENS",
            playerId: aiPlayerId,
            tokens: distinctInBank.slice(0, 3)
        };
    }
    else {
        var doubleTarget = distinctInBank.find(function (g) { return state.bank[g] >= 4; });
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
function generateCarcassonneMove(state, aiPlayerId) {
    var _a;
    if (state.phase === "PLACING_TILE") {
        if (!state.currentTileId)
            return null;
        // Find all candidate spaces on the board (neighbors of existing tiles)
        var candidates = [];
        for (var _i = 0, _b = Object.keys(state.board); _i < _b.length; _i++) {
            var key = _b[_i];
            var tile = state.board[key];
            var neighbors = [
                { x: tile.x, y: tile.y - 1 },
                { x: tile.x + 1, y: tile.y },
                { x: tile.x, y: tile.y + 1 },
                { x: tile.x - 1, y: tile.y }
            ];
            for (var _c = 0, neighbors_1 = neighbors; _c < neighbors_1.length; _c++) {
                var n = neighbors_1[_c];
                var nKey = "".concat(n.x, ",").concat(n.y);
                if (!state.board[nKey] && !candidates.includes(nKey)) {
                    candidates.push(nKey);
                }
            }
        }
        // Try to place the tile at any candidate with any rotation
        for (var _d = 0, candidates_2 = candidates; _d < candidates_2.length; _d++) {
            var cKey = candidates_2[_d];
            var _e = cKey.split(",").map(Number), x = _e[0], y = _e[1];
            for (var rot = 0; rot < 4; rot++) {
                if ((0, Carcassonne_1.isValidPlacement)(state.board, state.currentTileId, rot, x, y)) {
                    // Found a valid placement!
                    return {
                        type: "PLACE_TILE",
                        playerId: aiPlayerId,
                        payload: { x: x, y: y, rotation: rot }
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
        var meepleCount = ((_a = state.players[aiPlayerId]) === null || _a === void 0 ? void 0 : _a.meeples) || 0;
        var lastPlaced = state.lastPlacedTile;
        if (meepleCount > 0 && lastPlaced) {
            var tile = state.board["".concat(lastPlaced.x, ",").concat(lastPlaced.y)];
            if (tile) {
                var def = Carcassonne_1.TILE_DEFINITIONS[tile.tileId];
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
function simulateWallScore(wall, row, col) {
    var horizontalMatches = 1;
    var verticalMatches = 1;
    for (var c = col + 1; c < 5; c++) {
        if (wall[row][c])
            horizontalMatches++;
        else
            break;
    }
    for (var c = col - 1; c >= 0; c--) {
        if (wall[row][c])
            horizontalMatches++;
        else
            break;
    }
    for (var r = row + 1; r < 5; r++) {
        if (wall[r][col])
            verticalMatches++;
        else
            break;
    }
    for (var r = row - 1; r >= 0; r--) {
        if (wall[r][col])
            verticalMatches++;
        else
            break;
    }
    if (horizontalMatches === 1 && verticalMatches === 1)
        return 1;
    var score = 0;
    if (horizontalMatches > 1)
        score += horizontalMatches;
    if (verticalMatches > 1)
        score += verticalMatches;
    if (horizontalMatches === 5)
        score += 2;
    if (verticalMatches === 5)
        score += 7;
    return score;
}
function generateAzulMove(state, aiPlayerId, difficulty) {
    var player = state.players[aiPlayerId];
    if (!player)
        return null;
    // 1. Compile all available choices from factories and center
    var choices = [];
    // Factories
    state.factories.forEach(function (factory, idx) {
        if (factory.length > 0) {
            var uniqueColors = Array.from(new Set(factory));
            uniqueColors.forEach(function (color) {
                var count = factory.filter(function (c) { return c === color; }).length;
                choices.push({ source: "FACTORY", factoryIndex: idx, color: color, count: count });
            });
        }
    });
    // Center
    if (state.center.length > 0) {
        // Exclude first player token from direct color selection
        var centerColors = Array.from(new Set(state.center.filter(function (c) { return c !== "FIRST_PLAYER"; })));
        centerColors.forEach(function (color) {
            var count = state.center.filter(function (c) { return c === color; }).length;
            choices.push({ source: "CENTER", color: color, count: count });
        });
    }
    if (choices.length === 0)
        return null;
    // 2. Generate all valid destination moves and score them
    var bestMove = null;
    // Floor penalties helper
    var getFloorPenalty = function (currentFloorCount, additionalCount) {
        var floorPenalties = [-1, -1, -2, -2, -2, -3, -3];
        var penalty = 0;
        for (var i = 0; i < additionalCount; i++) {
            var idx = currentFloorCount + i;
            if (idx < floorPenalties.length) {
                penalty += floorPenalties[idx];
            }
        }
        return penalty; // returns a negative number or 0
    };
    for (var _i = 0, choices_1 = choices; _i < choices_1.length; _i++) {
        var choice = choices_1[_i];
        // Destination options: 0, 1, 2, 3, 4, and "FLOOR"
        var destOptions = [0, 1, 2, 3, 4, "FLOOR"];
        for (var _a = 0, destOptions_1 = destOptions; _a < destOptions_1.length; _a++) {
            var dest = destOptions_1[_a];
            // Validate destination
            if (dest !== "FLOOR") {
                var line = player.patternLines[dest];
                var capacity = dest + 1;
                // Color mismatch check
                if (line.length > 0 && line[0] !== choice.color)
                    continue;
                // Color already on wall check
                var colIdxOnWall = Azul_1.WALL_PATTERN[dest].indexOf(choice.color);
                if (player.wall[dest][colIdxOnWall])
                    continue;
            }
            // Valid! Now score it
            var score = 0;
            var draftedCount = choice.count;
            if (dest === "FLOOR") {
                score = getFloorPenalty(player.floorLine.length, draftedCount);
            }
            else {
                var line = player.patternLines[dest];
                var capacity = dest + 1;
                var remaining = capacity - line.length;
                if (draftedCount <= remaining) {
                    if (draftedCount === remaining) {
                        if (difficulty === "HARD") {
                            var colIdxOnWall = Azul_1.WALL_PATTERN[dest].indexOf(choice.color);
                            score = simulateWallScore(player.wall, dest, colIdxOnWall);
                        }
                        else {
                            score = 10 + dest;
                        }
                    }
                    else {
                        score = draftedCount;
                    }
                }
                else {
                    var overflow = draftedCount - remaining;
                    var completionScore = 10 + dest;
                    if (difficulty === "HARD") {
                        var colIdxOnWall = Azul_1.WALL_PATTERN[dest].indexOf(choice.color);
                        completionScore = simulateWallScore(player.wall, dest, colIdxOnWall);
                    }
                    var floorPenalty = getFloorPenalty(player.floorLine.length, overflow);
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
                    score: score
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
