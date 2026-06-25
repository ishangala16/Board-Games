"use strict";
// Removed lodash, using native structuredClone for deep copy.
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_AZUL_STATE = exports.WALL_PATTERN = exports.COLORS = void 0;
exports.azulReducer = azulReducer;
exports.COLORS = ["BLUE", "YELLOW", "RED", "BLACK", "WHITE"];
exports.WALL_PATTERN = [
    ["BLUE", "YELLOW", "RED", "BLACK", "WHITE"],
    ["WHITE", "BLUE", "YELLOW", "RED", "BLACK"],
    ["BLACK", "WHITE", "BLUE", "YELLOW", "RED"],
    ["RED", "BLACK", "WHITE", "BLUE", "YELLOW"],
    ["YELLOW", "RED", "BLACK", "WHITE", "BLUE"],
];
var FLOOR_PENALTIES = [-1, -1, -2, -2, -2, -3, -3];
var INITIAL_AZUL_STATE = function () {
    var _a;
    var bag = [];
    exports.COLORS.forEach(function (color) {
        for (var i = 0; i < 20; i++)
            bag.push(color);
    });
    // Shuffle bag
    for (var i = bag.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        _a = [bag[j], bag[i]], bag[i] = _a[0], bag[j] = _a[1];
    }
    return {
        players: {},
        turnOrder: [],
        currentTurnIndex: 0,
        factories: [],
        center: ["FIRST_PLAYER"],
        bag: bag,
        discard: [],
        firstPlayerNextRound: null,
        phase: "DRAFTING",
        winner: null
    };
};
exports.INITIAL_AZUL_STATE = INITIAL_AZUL_STATE;
function replenishFactories(state) {
    var numPlayers = state.turnOrder.length;
    var numFactories = 5;
    if (numPlayers === 3)
        numFactories = 7;
    if (numPlayers === 4)
        numFactories = 9;
    state.factories = Array(numFactories).fill([]).map(function () { return []; });
    for (var i = 0; i < numFactories; i++) {
        for (var j = 0; j < 4; j++) {
            if (state.bag.length === 0) {
                // Refill from discard
                state.bag = state.discard.sort(function () { return Math.random() - 0.5; });
                state.discard = [];
            }
            if (state.bag.length > 0) {
                var tile = state.bag.pop();
                if (tile)
                    state.factories[i].push(tile);
            }
        }
    }
}
function processTilingPhase(state) {
    // For each player, move tiles from completed pattern lines to wall, score, and clear floor line
    var gameOver = false;
    state.turnOrder.forEach(function (username) {
        var player = state.players[username];
        for (var i = 0; i < 5; i++) {
            var line = player.patternLines[i];
            var capacity = i + 1;
            if (line.length === capacity) {
                var color = line[0];
                var colIndex = exports.WALL_PATTERN[i].indexOf(color);
                // Move to wall
                player.wall[i][colIndex] = true;
                // Score placement
                var horizontalMatches = 1;
                var verticalMatches = 1;
                // Check right
                for (var c = colIndex + 1; c < 5; c++) {
                    if (player.wall[i][c])
                        horizontalMatches++;
                    else
                        break;
                }
                // Check left
                for (var c = colIndex - 1; c >= 0; c--) {
                    if (player.wall[i][c])
                        horizontalMatches++;
                    else
                        break;
                }
                // Check down
                for (var r = i + 1; r < 5; r++) {
                    if (player.wall[r][colIndex])
                        verticalMatches++;
                    else
                        break;
                }
                // Check up
                for (var r = i - 1; r >= 0; r--) {
                    if (player.wall[r][colIndex])
                        verticalMatches++;
                    else
                        break;
                }
                if (horizontalMatches === 1 && verticalMatches === 1) {
                    player.score += 1; // no adjacent
                }
                else {
                    if (horizontalMatches > 1)
                        player.score += horizontalMatches;
                    if (verticalMatches > 1)
                        player.score += verticalMatches;
                }
                // Discard the rest
                for (var t = 1; t < line.length; t++) {
                    state.discard.push(color);
                }
                player.patternLines[i] = [];
                // Check game over
                var rowComplete = true;
                for (var c = 0; c < 5; c++) {
                    if (!player.wall[i][c]) {
                        rowComplete = false;
                        break;
                    }
                }
                if (rowComplete)
                    gameOver = true;
            }
        }
        // Floor line penalties
        player.floorLine.forEach(function (tile, index) {
            if (index < FLOOR_PENALTIES.length) {
                player.score += FLOOR_PENALTIES[index];
            }
            if (tile !== "FIRST_PLAYER") {
                state.discard.push(tile);
            }
        });
        player.score = Math.max(0, player.score); // Score can't be negative
        player.floorLine = [];
    });
    if (gameOver) {
        state.phase = "GAME_OVER";
        // Final Scoring
        var highestScore_1 = -1;
        var winner_1 = null;
        state.turnOrder.forEach(function (username) {
            var player = state.players[username];
            // +2 per complete row
            for (var r = 0; r < 5; r++) {
                if (player.wall[r].every(function (v) { return v; }))
                    player.score += 2;
            }
            // +7 per complete col
            for (var c = 0; c < 5; c++) {
                var colComplete = true;
                for (var r = 0; r < 5; r++) {
                    if (!player.wall[r][c])
                        colComplete = false;
                }
                if (colComplete)
                    player.score += 7;
            }
            // +10 per 5 of same color
            exports.COLORS.forEach(function (color) {
                var count = 0;
                for (var r = 0; r < 5; r++) {
                    var c = exports.WALL_PATTERN[r].indexOf(color);
                    if (player.wall[r][c])
                        count++;
                }
                if (count === 5)
                    player.score += 10;
            });
            if (player.score > highestScore_1) {
                highestScore_1 = player.score;
                winner_1 = username;
            }
        });
        state.winner = winner_1;
    }
    else {
        // Setup next round
        state.center = ["FIRST_PLAYER"];
        replenishFactories(state);
        if (state.firstPlayerNextRound) {
            state.currentTurnIndex = state.turnOrder.indexOf(state.firstPlayerNextRound);
            state.firstPlayerNextRound = null;
        }
        else {
            state.currentTurnIndex = 0; // fallback
        }
    }
}
function azulReducer(state, action) {
    var _a, _b;
    var draftState = structuredClone(state);
    if (action.type === "START_GAME") {
        draftState.turnOrder = Object.keys(draftState.players);
        // Ensure starting player state
        draftState.turnOrder.forEach(function (u) {
            draftState.players[u] = {
                username: u,
                score: 0,
                patternLines: [[], [], [], [], []],
                wall: Array(5).fill([]).map(function () { return Array(5).fill(false); }),
                floorLine: []
            };
        });
        replenishFactories(draftState);
        draftState.currentTurnIndex = 0;
        return draftState;
    }
    if (action.type === "DRAFT_TILES") {
        if (draftState.phase !== "DRAFTING")
            throw new Error("Not drafting phase");
        var _c = action.payload, source = _c.source, factoryIndex = _c.factoryIndex, color_1 = _c.color, patternLineIndex = _c.patternLineIndex, username = _c.username;
        if (draftState.turnOrder[draftState.currentTurnIndex] !== username)
            throw new Error("Not your turn");
        var player = draftState.players[username];
        var draftedTiles = [];
        if (source === "FACTORY") {
            if (factoryIndex === undefined)
                throw new Error("Factory index required");
            var factory = draftState.factories[factoryIndex];
            if (!factory.includes(color_1))
                throw new Error("Color not in factory");
            draftedTiles = factory.filter(function (t) { return t === color_1; });
            var remainingTiles = factory.filter(function (t) { return t !== color_1; });
            (_a = draftState.center).push.apply(_a, remainingTiles);
            draftState.factories[factoryIndex] = [];
        }
        else {
            // CENTER
            if (!draftState.center.includes(color_1))
                throw new Error("Color not in center");
            if (draftState.center.includes("FIRST_PLAYER")) {
                player.floorLine.push("FIRST_PLAYER");
                draftState.firstPlayerNextRound = username;
                draftState.center = draftState.center.filter(function (t) { return t !== "FIRST_PLAYER"; });
            }
            draftedTiles = draftState.center.filter(function (t) { return t === color_1; });
            draftState.center = draftState.center.filter(function (t) { return t !== color_1; });
        }
        // Place tiles
        if (patternLineIndex === "FLOOR") {
            (_b = player.floorLine).push.apply(_b, draftedTiles);
        }
        else {
            var line = player.patternLines[patternLineIndex];
            var capacity = patternLineIndex + 1;
            // Validate placement
            if (line.length > 0 && line[0] !== color_1)
                throw new Error("Pattern line has different color");
            if (player.wall[patternLineIndex][exports.WALL_PATTERN[patternLineIndex].indexOf(color_1)]) {
                throw new Error("Color already on wall in this row");
            }
            // Fill line, overflow to floor
            while (draftedTiles.length > 0) {
                if (line.length < capacity) {
                    line.push(draftedTiles.pop());
                }
                else {
                    player.floorLine.push(draftedTiles.pop());
                }
            }
        }
        // Trim floor line to max 7
        while (player.floorLine.length > 7) {
            var extra = player.floorLine.pop();
            if (extra !== "FIRST_PLAYER")
                draftState.discard.push(extra);
        }
        // Check round end
        var roundEnded = draftState.factories.every(function (f) { return f.length === 0; }) && draftState.center.length === 0;
        if (roundEnded) {
            processTilingPhase(draftState);
        }
        else {
            // Next turn
            draftState.currentTurnIndex = (draftState.currentTurnIndex + 1) % draftState.turnOrder.length;
        }
        return draftState;
    }
    return draftState;
}
