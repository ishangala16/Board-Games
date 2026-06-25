"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.BOARD_LAYOUT = exports.INITIAL_STATE = void 0;
exports.sequenceReducer = sequenceReducer;
exports.isDeadCard = isDeadCard;
exports.checkWin = checkWin;
exports.isPartOfSequence = isPartOfSequence;
// Simplified Deck generation (2 standard decks)
function createDeck() {
    var suits = ['H', 'D', 'C', 'S'];
    var ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Q', 'K', 'A']; // No Jacks in traversal (handled separately usually) or Jacks included
    // In actual Sequence, Jacks are wild, so they are in the deck.
    var allRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    var deck = [];
    // 2 decks
    for (var i = 0; i < 2; i++) {
        for (var _i = 0, suits_1 = suits; _i < suits_1.length; _i++) {
            var suit = suits_1[_i];
            for (var _a = 0, allRanks_1 = allRanks; _a < allRanks_1.length; _a++) {
                var rank = allRanks_1[_a];
                deck.push(rank + suit);
            }
        }
    }
    return shuffle(deck);
}
function shuffle(array) {
    return array.sort(function () { return Math.random() - 0.5; });
}
exports.INITIAL_STATE = {
    board: Array(10).fill(null).map(function () { return Array(10).fill(null); }),
    players: {},
    currentTurn: "BLUE", // Blue starts usually
    winner: null,
    hands: {},
    deck: createDeck(),
    lastMove: null,
    lastAction: null,
    pendingAction: null
};
// Board mapping (Card -> Position) would be complex to hardcode here, 
// for MVP we might randomly assign or just assume a simple grid for testing.
// Real Sequence board has a specific layout.
exports.BOARD_LAYOUT = [
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
function sequenceReducer(state, action) {
    var _a, _b, _c, _d;
    switch (action.type) {
        case "PLAY_CARD": {
            var _e = action.payload, playerId = _e.playerId, card = _e.card, x = _e.x, y = _e.y;
            var playerTeam = state.players[playerId];
            // 1. Validate Turn
            if (state.currentTurn !== playerTeam) {
                throw new Error("Not your turn");
            }
            // 2. Validate Card in Hand
            var hand = state.hands[playerId];
            if (!hand.includes(card)) {
                throw new Error("You don't hold this card");
            }
            // --- ONE-EYED JACK (REMOVE CHIP) ---
            if (isOneEyedJack(card)) {
                if (x === undefined || y === undefined) {
                    throw new Error("No target selected for removal");
                }
                // Validate Target: Must be occupied by OPPONENT
                var targetCell = state.board[y][x];
                if (!targetCell || targetCell === playerTeam) {
                    throw new Error("Target cell must be occupied by an opponent's chip");
                }
                // Validate Locked Chips (Cannot remove from completed sequence)
                if (isPartOfSequence(state.board, x, y, targetCell)) {
                    throw new Error("Chip is part of a locked sequence");
                }
                // Execute removal
                var newBoard_1 = state.board.map(function (row) { return __spreadArray([], row, true); });
                newBoard_1[y][x] = null;
                // Remove card from hand
                var newHand_1 = __spreadArray([], hand, true);
                newHand_1.splice(newHand_1.indexOf(card), 1);
                // Draw new card
                var newDeck_1 = __spreadArray([], state.deck, true);
                if (newDeck_1.length > 0) {
                    newHand_1.push(newDeck_1.pop());
                }
                return __assign(__assign({}, state), { board: newBoard_1, hands: __assign(__assign({}, state.hands), (_a = {}, _a[playerId] = newHand_1, _a)), deck: newDeck_1, currentTurn: playerTeam === "RED" ? "BLUE" : "RED", lastMove: null, lastAction: {
                        type: "REMOVE_CHIP",
                        playerId: playerId,
                        x: x,
                        y: y
                    }, pendingAction: null });
            }
            // --- NORMAL / TWO-EYED JACK PLACEMENT ---
            // 3. Validate Board Position
            if (state.board[y][x] !== null) {
                throw new Error("Space occupied");
            }
            var targetSpace = exports.BOARD_LAYOUT[y][x];
            // Validation
            if (isTwoEyedJack(card)) {
                // Wild: Can place anywhere empty (that isn't a corner)
            }
            else {
                // Normal
                if (targetSpace !== card) {
                    throw new Error("Card ".concat(card, " does not match board space ").concat(targetSpace));
                }
            }
            if (targetSpace === "XX") {
                throw new Error("Cannot play on free space");
            }
            // Execute Move
            var newBoard = state.board.map(function (row) { return __spreadArray([], row, true); });
            newBoard[y][x] = playerTeam;
            // Remove card from hand
            var newHand = __spreadArray([], hand, true);
            var cardIndex = newHand.indexOf(card);
            newHand.splice(cardIndex, 1);
            // Draw new card
            var newDeck = __spreadArray([], state.deck, true);
            if (newDeck.length > 0) {
                newHand.push(newDeck.pop());
            }
            // Check Win
            var winner = checkWin(newBoard, playerTeam) ? playerTeam : null;
            return __assign(__assign({}, state), { board: newBoard, hands: __assign(__assign({}, state.hands), (_b = {}, _b[playerId] = newHand, _b)), deck: newDeck, currentTurn: playerTeam === "RED" ? "BLUE" : "RED", lastMove: { x: x, y: y }, lastAction: {
                    type: "PLAY_CARD",
                    playerId: playerId,
                    card: card,
                    x: x,
                    y: y
                }, winner: winner });
        }
        case "REMOVE_CHIP": {
            var _f = action.payload, playerId = _f.playerId, x = _f.x, y = _f.y;
            var playerTeam = state.players[playerId];
            if (!state.pendingAction || state.pendingAction.type !== "REMOVE_CHIP" || state.pendingAction.playerId !== playerId) {
                return state; // Not waiting for removal
            }
            // Validate Target: Must be occupied by OPPONENT
            var targetCell = state.board[y][x];
            if (!targetCell || targetCell === playerTeam) {
                throw new Error("Target cell must be occupied by an opponent's chip");
            }
            // 2. Validate Locked Chips (Cannot remove from completed sequence)
            if (isPartOfSequence(state.board, x, y, targetCell)) {
                throw new Error("Chip is part of a locked sequence");
            }
            // Remove Chip
            var newBoard = state.board.map(function (row) { return __spreadArray([], row, true); });
            newBoard[y][x] = null;
            // Draw replacement card now (since we delayed it)
            var newDeck = __spreadArray([], state.deck, true);
            var newHand = __spreadArray([], state.hands[playerId], true);
            if (newDeck.length > 0)
                newHand.push(newDeck.pop());
            return __assign(__assign({}, state), { board: newBoard, hands: __assign(__assign({}, state.hands), (_c = {}, _c[playerId] = newHand, _c)), deck: newDeck, currentTurn: playerTeam === "RED" ? "BLUE" : "RED", lastAction: {
                    type: "REMOVE_CHIP",
                    playerId: playerId,
                    x: x,
                    y: y
                }, pendingAction: null });
        }
        case "DISCARD_DEAD_CARD": {
            var _g = action.payload, playerId = _g.playerId, card = _g.card;
            var playerTeam = state.players[playerId];
            if (state.currentTurn !== playerTeam) {
                throw new Error("Not your turn");
            }
            var hand = state.hands[playerId];
            if (!hand.includes(card)) {
                throw new Error("You don't hold this card");
            }
            if (!isDeadCard(card, state.board)) {
                throw new Error("This card is not dead");
            }
            // Remove card from hand
            var newHand = __spreadArray([], hand, true);
            newHand.splice(newHand.indexOf(card), 1);
            // Draw replacement
            var newDeck = __spreadArray([], state.deck, true);
            if (newDeck.length > 0) {
                newHand.push(newDeck.pop());
            }
            return __assign(__assign({}, state), { hands: __assign(__assign({}, state.hands), (_d = {}, _d[playerId] = newHand, _d)), deck: newDeck, currentTurn: playerTeam === "RED" ? "BLUE" : "RED", lastMove: null, lastAction: {
                    type: "DISCARD_DEAD_CARD",
                    playerId: playerId,
                    card: card
                } });
        }
        default:
            return state;
    }
}
function isDeadCard(card, board) {
    if (card === "XX" || card === "JC" || card === "JD" || card === "JS" || card === "JH") {
        return false; // Jacks are wild / removers, never dead
    }
    var totalSpaces = 0;
    var occupiedSpaces = 0;
    for (var y = 0; y < 10; y++) {
        for (var x = 0; x < 10; x++) {
            if (exports.BOARD_LAYOUT[y][x] === card) {
                totalSpaces++;
                if (board[y][x] !== null) {
                    occupiedSpaces++;
                }
            }
        }
    }
    return totalSpaces > 0 && occupiedSpaces === totalSpaces;
}
// Two-Eyed Jacks: Clubs (C) and Diamonds (D)
// One-Eyed Jacks: Spades (S) and Hearts (H)
function isTwoEyedJack(card) {
    return card === "JC" || card === "JD";
}
function isOneEyedJack(card) {
    return card === "JS" || card === "JH";
}
function isWild(card) {
    return isTwoEyedJack(card);
}
function checkWin(board, team) {
    // Check for 2 sequences of 5.
    // Simplifying: Check for ANY sequence of 5 for MVP.
    return hasSequence(board, team);
}
function hasSequence(board, team) {
    var size = 10;
    // Horizontal
    for (var r = 0; r < size; r++) {
        var count = 0;
        for (var c = 0; c < size; c++) {
            if (board[r][c] === team || isCorner(r, c))
                count++;
            else
                count = 0;
            if (count >= 5)
                return true;
        }
    }
    // Vertical
    for (var c = 0; c < size; c++) {
        var count = 0;
        for (var r = 0; r < size; r++) {
            if (board[r][c] === team || isCorner(r, c))
                count++;
            else
                count = 0;
            if (count >= 5)
                return true;
        }
    }
    // Diagonals (Top-Left to Bottom-Right)
    for (var r = 0; r <= size - 5; r++) {
        for (var c = 0; c <= size - 5; c++) {
            var count = 0;
            for (var i = 0; i < 5; i++) {
                if (board[r + i][c + i] === team || isCorner(r + i, c + i))
                    count++;
                else
                    break;
            }
            if (count === 5)
                return true;
        }
    }
    // Diagonals (Top-Right to Bottom-Left)
    for (var r = 0; r <= size - 5; r++) {
        for (var c = 4; c < size; c++) {
            var count = 0;
            for (var i = 0; i < 5; i++) {
                if (board[r + i][c - i] === team || isCorner(r + i, c - i))
                    count++;
                else
                    break;
            }
            if (count === 5)
                return true;
        }
    }
    return false;
}
function isCorner(r, c) {
    return (r === 0 && c === 0) || (r === 0 && c === 9) || (r === 9 && c === 0) || (r === 9 && c === 9);
}
function isPartOfSequence(board, x, y, team) {
    var size = 10;
    var isMatching = function (r, c) {
        if (r < 0 || r >= size || c < 0 || c >= size)
            return false;
        return board[r][c] === team || isCorner(r, c);
    };
    var directions = [
        [[0, -1], [0, 1]], // Horizontal: Left, Right
        [[-1, 0], [1, 0]], // Vertical: Up, Down
        [[-1, -1], [1, 1]], // Diagonal: Top-Left, Bottom-Right
        [[-1, 1], [1, -1]] // Diagonal: Top-Right, Bottom-Left
    ];
    for (var _i = 0, directions_1 = directions; _i < directions_1.length; _i++) {
        var axis = directions_1[_i];
        var contiguous = 1; // Count the target chip itself
        for (var _a = 0, axis_1 = axis; _a < axis_1.length; _a++) {
            var _b = axis_1[_a], dy = _b[0], dx = _b[1];
            var step = 1;
            while (true) {
                var r = y + dy * step;
                var c = x + dx * step;
                if (isMatching(r, c)) {
                    contiguous++;
                    step++;
                }
                else {
                    break;
                }
            }
        }
        if (contiguous >= 5)
            return true;
    }
    return false;
}
