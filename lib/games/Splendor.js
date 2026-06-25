"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_SPLENDOR_STATE = void 0;
exports.canBuyCard = canBuyCard;
exports.splendorReducer = splendorReducer;
// --- DATA ---
var GENERATE_CARDS = function () {
    // Basic set for MVP
    var t1 = [
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
    var t2 = [
        { id: "2_1", tier: 2, points: 1, bonus: "BLUE", cost: { BLUE: 2, GREEN: 2, RED: 3 } },
        { id: "2_2", tier: 2, points: 1, bonus: "GREEN", cost: { WHITE: 2, BLUE: 3, BLACK: 2 } },
        { id: "2_3", tier: 2, points: 2, bonus: "RED", cost: { BLACK: 5 } },
        { id: "2_4", tier: 2, points: 2, bonus: "WHITE", cost: { RED: 5 } },
        { id: "2_5", tier: 2, points: 2, bonus: "BLACK", cost: { WHITE: 4, BLUE: 2, BLACK: 1 } },
        { id: "2_6", tier: 2, points: 3, bonus: "WHITE", cost: { WHITE: 6 } },
        { id: "2_7", tier: 2, points: 1, bonus: "BLACK", cost: { WHITE: 3, BLUE: 2, GREEN: 2 } },
        { id: "2_8", tier: 2, points: 2, bonus: "GREEN", cost: { BLUE: 5 } },
    ];
    var t3 = [
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
var NOBLES = [
    { id: "n1", points: 3, cost: { RED: 4, GREEN: 4 } },
    { id: "n2", points: 3, cost: { BLUE: 4, WHITE: 4 } },
    { id: "n3", points: 3, cost: { BLACK: 4, RED: 4 } },
    { id: "n4", points: 3, cost: { GREEN: 3, BLUE: 3, WHITE: 3 } },
    { id: "n5", points: 3, cost: { BLACK: 3, RED: 3, GREEN: 3 } },
];
function shuffle(array) {
    return array.sort(function () { return Math.random() - 0.5; });
}
var INITIAL_SPLENDOR_STATE = function () {
    var cards = GENERATE_CARDS();
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
exports.INITIAL_SPLENDOR_STATE = INITIAL_SPLENDOR_STATE;
// --- HELPER FUNCTIONS ---
function canBuyCard(player, card) {
    var goldNeeded = 0;
    var finalCost = { WHITE: 0, BLUE: 0, GREEN: 0, RED: 0, BLACK: 0 };
    ["WHITE", "BLUE", "GREEN", "RED", "BLACK"].forEach(function (gem) {
        var cost = card.cost[gem] || 0;
        // Discount based on tableau
        var discount = player.tableau.filter(function (c) { return c.bonus === gem; }).length;
        var actualCost = Math.max(0, cost - discount);
        finalCost[gem] = actualCost;
        if (player.tokens[gem] < actualCost) {
            goldNeeded += (actualCost - player.tokens[gem]);
        }
    });
    if (player.tokens.GOLD >= goldNeeded) {
        return { canBuy: true, finalCost: finalCost };
    }
    return { canBuy: false, finalCost: finalCost };
}
function checkNobles(player, nobles) {
    // Check if player qualifies for any noble they don't already have
    // (Simpler: check visible nobles only, logic simplifies state management)
    // Actually nobles are shared global.
    // Return the FIRST noble they qualify for.
    // Calculate player total bonuses
    var bonuses = { WHITE: 0, BLUE: 0, GREEN: 0, RED: 0, BLACK: 0 };
    player.tableau.forEach(function (c) { return bonuses[c.bonus]++; });
    var _loop_1 = function (noble) {
        var qual = true;
        ["WHITE", "BLUE", "GREEN", "RED", "BLACK"].forEach(function (gem) {
            if (bonuses[gem] < (noble.cost[gem] || 0)) {
                qual = false;
            }
        });
        if (qual)
            return { value: noble };
    };
    for (var _i = 0, nobles_1 = nobles; _i < nobles_1.length; _i++) {
        var noble = nobles_1[_i];
        var state_1 = _loop_1(noble);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    return null;
}
// --- REDUCER ---
function splendorReducer(state, action) {
    var currentPlayerId = state.turnOrder[state.currentTurnIndex];
    if (action.playerId !== currentPlayerId && state.winner === null) {
        console.warn("Not player's turn");
        return state;
    }
    if (state.winner)
        return state;
    var newState = JSON.parse(JSON.stringify(state)); // Deep copy for safety
    var player = newState.players[action.playerId];
    var actionDescription = "";
    switch (action.type) {
        case "TAKE_TOKENS": {
            var tokens = action.tokens;
            // Validation
            if (tokens.includes("GOLD"))
                return state; // Cannot take Gold directly
            if (tokens.length === 2) {
                if (tokens[0] !== tokens[1])
                    return state; // Must be same
                if (newState.bank[tokens[0]] < 4)
                    return state; // Rule: Stack must be >= 4
            }
            else if (tokens.length === 3) {
                var distinct = new Set(tokens);
                if (distinct.size !== 3)
                    return state; // Must be distinct
                for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
                    var t = tokens_1[_i];
                    if (newState.bank[t] < 1)
                        return state; // Must exist
                }
            }
            else {
                return state; // Invalid amount
            }
            // Execute
            var currentTotal = 0;
            for (var t in player.tokens) {
                currentTotal += player.tokens[t];
            }
            if (currentTotal + tokens.length > 10)
                return state; // Token limit is 10
            tokens.forEach(function (t) {
                newState.bank[t]--;
                player.tokens[t]++;
            });
            actionDescription = "took ".concat(tokens.join(", "));
            break;
        }
        case "BUY_CARD": {
            var cardId_1 = action.cardId;
            var card = void 0;
            var source = "MARKET";
            // Find Card
            card = player.reserved.find(function (c) { return c.id === cardId_1; });
            if (card) {
                source = "RESERVED";
            }
            else {
                // Check Market
                for (var _a = 0, _b = [1, 2, 3]; _a < _b.length; _a++) {
                    var tier = _b[_a];
                    var found = newState.market[tier].find(function (c) { return c.id === cardId_1; });
                    if (found) {
                        card = found;
                        break;
                    }
                }
            }
            if (!card)
                return state;
            // Check Cost
            var _c = canBuyCard(player, card), canBuy = _c.canBuy, finalCost_1 = _c.finalCost;
            if (!canBuy)
                return state;
            // Pay Tokens
            var totalPaid_1 = 0;
            ["WHITE", "BLUE", "GREEN", "RED", "BLACK"].forEach(function (gem) {
                var amountOwed = finalCost_1[gem];
                var paidFromTokens = Math.min(player.tokens[gem], amountOwed);
                var paidFromGold = Math.max(0, amountOwed - paidFromTokens);
                // Update Player
                player.tokens[gem] -= paidFromTokens;
                player.tokens.GOLD -= paidFromGold;
                // Update Bank
                newState.bank[gem] += paidFromTokens;
                newState.bank.GOLD += paidFromGold;
                totalPaid_1 += (paidFromTokens + paidFromGold);
            });
            // Move Card
            if (source === "RESERVED") {
                player.reserved = player.reserved.filter(function (c) { return c.id !== cardId_1; });
            }
            else {
                // Remove from Market and Refill
                var tier = card.tier;
                newState.market[tier] = newState.market[tier].filter(function (c) { return c.id !== cardId_1; });
                if (newState.decks[tier].length > 0) {
                    newState.market[tier].push(newState.decks[tier].pop());
                }
            }
            player.tableau.push(card);
            player.points += card.points;
            actionDescription = "bought a card (".concat(card.points, " pts)");
            break;
        }
        case "RESERVE_CARD": {
            var cardId_2 = action.cardId;
            if (player.reserved.length >= 3)
                return state; // Limit 3
            var card = void 0;
            var foundTier = null;
            if (cardId_2.startsWith("deck_")) {
                var tier = parseInt(cardId_2.split("_")[1], 10);
                if (tier === 1 || tier === 2 || tier === 3) {
                    if (newState.decks[tier].length === 0)
                        return state; // Empty deck
                    card = newState.decks[tier].pop();
                    foundTier = tier;
                }
            }
            else {
                // Find in Market
                for (var _d = 0, _e = [1, 2, 3]; _d < _e.length; _d++) {
                    var tier = _e[_d];
                    var found = newState.market[tier].find(function (c) { return c.id === cardId_2; });
                    if (found) {
                        card = found;
                        foundTier = tier;
                        break;
                    }
                }
            }
            if (!card || !foundTier)
                return state;
            // Take Gold if available
            if (newState.bank.GOLD > 0) {
                newState.bank.GOLD--;
                player.tokens.GOLD++;
            }
            // Move Card
            player.reserved.push(card);
            if (!cardId_2.startsWith("deck_")) {
                newState.market[foundTier] = newState.market[foundTier].filter(function (c) { return c.id !== cardId_2; });
                if (newState.decks[foundTier].length > 0) {
                    newState.market[foundTier].push(newState.decks[foundTier].pop());
                }
            }
            actionDescription = "reserved a Tier ".concat(foundTier, " card from the ").concat(cardId_2.startsWith("deck_") ? "deck" : "market");
            break;
        }
    }
    // --- END OF TURN CHECKS ---
    // Visit Nobles (Automatic)
    var noble = checkNobles(player, newState.nobles);
    if (noble) {
        player.nobles.push(noble);
        player.points += noble.points;
        // Remove from board
        newState.nobles = newState.nobles.filter(function (n) { return n.id !== noble.id; });
        actionDescription += " & visited a Noble (+".concat(noble.points, ")");
    }
    // Check Win Condition (>= 15 pts)
    // In real Splendor, you finish the round. For MVP, instant win check.
    if (player.points >= 15) {
        newState.winner = player.username;
        actionDescription += " and WON THE GAME!";
    }
    newState.lastAction = "".concat(player.username, " ").concat(actionDescription);
    // Next Turn
    newState.players[action.playerId] = player;
    newState.currentTurnIndex = (newState.currentTurnIndex + 1) % newState.turnOrder.length;
    return newState;
}
