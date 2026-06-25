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
exports.INITIAL_CARCASSONNE_STATE = exports.TILE_DEFINITIONS = void 0;
exports.getRotatedEdges = getRotatedEdges;
exports.isValidPlacement = isValidPlacement;
exports.carcassonneReducer = carcassonneReducer;
exports._shuffleDeck = shuffleDeck;
// Minimal set of tiles for MVP
exports.TILE_DEFINITIONS = {
    "START": { id: "START", edges: ["CITY", "ROAD", "FIELD", "ROAD"], center: "ROAD" }, // Card D
    "CITY_CAP": { id: "CITY_CAP", edges: ["CITY", "FIELD", "FIELD", "FIELD"], center: "FIELD" }, // Card C
    "ROAD_STRAIGHT": { id: "ROAD_STRAIGHT", edges: ["FIELD", "ROAD", "FIELD", "ROAD"], center: "ROAD" }, // Card V
    "ROAD_CURVE": { id: "ROAD_CURVE", edges: ["FIELD", "FIELD", "ROAD", "ROAD"], center: "ROAD" }, // Card L
    "MONASTERY": { id: "MONASTERY", edges: ["FIELD", "FIELD", "FIELD", "FIELD"], center: "MONASTERY" }, // Card B
    "CITY_FULL": { id: "CITY_FULL", edges: ["CITY", "CITY", "CITY", "CITY"], center: "CITY_FULL", shield: true }, // Shield?
};
// Helper: Get edges of a tile after rotation
function getRotatedEdges(tileId, rotation) {
    var def = exports.TILE_DEFINITIONS[tileId];
    if (!def)
        return ["FIELD", "FIELD", "FIELD", "FIELD"];
    var src = def.edges;
    if (rotation === 0)
        return __spreadArray([], src, true);
    if (rotation === 1)
        return [src[3], src[0], src[1], src[2]];
    if (rotation === 2)
        return [src[2], src[3], src[0], src[1]];
    if (rotation === 3)
        return [src[1], src[2], src[3], src[0]];
    return __spreadArray([], src, true);
}
function isValidPlacement(board, tileId, rot, x, y) {
    if (board["".concat(x, ",").concat(y)])
        return false;
    var edges = getRotatedEdges(tileId, rot);
    var neighbors = [
        { nx: x, ny: y - 1, side: 0, opp: 2 }, // Top
        { nx: x + 1, ny: y, side: 1, opp: 3 }, // Right
        { nx: x, ny: y + 1, side: 2, opp: 0 }, // Bottom
        { nx: x - 1, ny: y, side: 3, opp: 1 } // Left
    ];
    var hasNeighbor = false;
    for (var _i = 0, neighbors_1 = neighbors; _i < neighbors_1.length; _i++) {
        var n = neighbors_1[_i];
        var neighbor = board["".concat(n.nx, ",").concat(n.ny)];
        if (neighbor) {
            hasNeighbor = true;
            var nEdges = getRotatedEdges(neighbor.tileId, neighbor.rotation);
            if (edges[n.side] !== nEdges[n.opp])
                return false;
        }
    }
    // Must touch at least one existing tile
    return hasNeighbor;
}
var INITIAL_CARCASSONNE_STATE = function () { return ({
    board: { "0,0": { x: 0, y: 0, tileId: "START", rotation: 0 } },
    deck: shuffleDeck(),
    players: {}, // Populated by GameManager
    turnOrder: [],
    currentTurnIndex: 0,
    currentTileId: null, // Will draw first tile on game start
    currentTileRotation: 0,
    phase: "PLACING_TILE",
    lastPlacedTile: null,
    placedMeeples: [],
    winner: null,
    lastAction: "Game Started"
}); };
exports.INITIAL_CARCASSONNE_STATE = INITIAL_CARCASSONNE_STATE;
function shuffleDeck() {
    var _a;
    var counts = {
        "CITY_CAP": 15,
        "ROAD_STRAIGHT": 12,
        "ROAD_CURVE": 12,
        "MONASTERY": 6,
        "CITY_FULL": 4
    };
    var deck = [];
    for (var _i = 0, _b = Object.entries(counts); _i < _b.length; _i++) {
        var _c = _b[_i], id = _c[0], count = _c[1];
        for (var i = 0; i < count; i++)
            deck.push(id);
    }
    // Fisher-Yates shuffle
    for (var i = deck.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        _a = [deck[j], deck[i]], deck[i] = _a[0], deck[j] = _a[1];
    }
    return deck;
}
function carcassonneReducer(state, action) {
    var currentPlayer = state.turnOrder[state.currentTurnIndex];
    if (action.playerId !== currentPlayer && state.deck.length > 0)
        return state;
    var newState = JSON.parse(JSON.stringify(state));
    switch (action.type) {
        case "ROTATE_TILE":
            newState.currentTileRotation = (newState.currentTileRotation + 1) % 4;
            return newState;
        case "PLACE_TILE":
            var _a = action.payload, x = _a.x, y = _a.y;
            if (newState.phase !== "PLACING_TILE")
                return state;
            if (!isValidPlacement(newState.board, newState.currentTileId, newState.currentTileRotation, x, y)) {
                newState.lastAction = "Invalid placement!";
                return newState;
            }
            // PLACE
            newState.board["".concat(x, ",").concat(y)] = {
                x: x,
                y: y,
                tileId: newState.currentTileId,
                rotation: newState.currentTileRotation
            };
            newState.lastPlacedTile = { x: x, y: y };
            newState.phase = "PLACING_MEEPLE";
            newState.lastAction = "".concat(action.playerId, " placed a tile at ").concat(x, ",").concat(y, ". Now place a meeple or skip.");
            return newState;
        case "PLACE_MEEPLE":
            if (newState.phase !== "PLACING_MEEPLE")
                return state;
            var featureIndex = action.payload; // 0-4
            var playerM = newState.players[action.playerId];
            if (playerM && playerM.meeples > 0) {
                playerM.meeples--;
                newState.placedMeeples.push({
                    ownerId: action.playerId,
                    x: newState.lastPlacedTile.x,
                    y: newState.lastPlacedTile.y,
                    featureIndex: featureIndex
                });
                newState.lastAction = "".concat(action.playerId, " placed a meeple on feature ").concat(featureIndex);
            }
            // Proceed to next turn
            return endTurn(newState);
        case "SKIP_MEEPLE":
            if (newState.phase !== "PLACING_MEEPLE")
                return state;
            newState.lastAction = "".concat(action.playerId, " skipped meeple placement.");
            return endTurn(newState);
        case "SKIP_TURN":
            if (newState.phase === "PLACING_TILE") {
                newState.lastAction = "".concat(action.playerId, " skipped their turn.");
                return endTurn(newState);
            }
            return state;
    }
    return newState;
}
function endTurn(state) {
    // 1. Check for completed features and score them
    scoreMonasteries(state);
    scoreRoads(state);
    scoreCities(state);
    state.currentTurnIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;
    state.phase = "PLACING_TILE";
    state.lastPlacedTile = null;
    if (state.deck.length > 0) {
        state.currentTileId = state.deck.pop() || null;
        state.currentTileRotation = 0;
    }
    else {
        state.currentTileId = null;
        state.lastAction = "Game Over - No more tiles!";
    }
    return state;
}
function scoreMonasteries(state) {
    var meeplesOnMonasteries = state.placedMeeples.filter(function (m) {
        var tile = state.board["".concat(m.x, ",").concat(m.y)];
        return exports.TILE_DEFINITIONS[tile.tileId].center === "MONASTERY" && m.featureIndex === 4;
    });
    var _loop_1 = function (meeple) {
        var count = 0;
        for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
                if (state.board["".concat(meeple.x + dx, ",").concat(meeple.y + dy)]) {
                    count++;
                }
            }
        }
        if (count === 9) {
            // Monastery complete!
            var player = state.players[meeple.ownerId];
            if (player) {
                player.score += 9;
                player.meeples++; // Return meeple
            }
            // Remove from placed meeples
            state.placedMeeples = state.placedMeeples.filter(function (m) { return m !== meeple; });
            state.lastAction = "".concat(meeple.ownerId, " completed a Monastery for 9 points!");
        }
    };
    for (var _i = 0, meeplesOnMonasteries_1 = meeplesOnMonasteries; _i < meeplesOnMonasteries_1.length; _i++) {
        var meeple = meeplesOnMonasteries_1[_i];
        _loop_1(meeple);
    }
}
function scoreRoads(state) {
    // Collect all unique road networks with meeples
    var roadMeeples = state.placedMeeples.filter(function (m) {
        var tile = state.board["".concat(m.x, ",").concat(m.y)];
        var edges = getRotatedEdges(tile.tileId, tile.rotation);
        return m.featureIndex < 4 && edges[m.featureIndex] === "ROAD";
    });
    var processedMeeples = new Set();
    var _loop_2 = function (meeple) {
        if (processedMeeples.has(meeple))
            return "continue";
        var _a = findRoadNetwork(state, meeple.x, meeple.y, meeple.featureIndex), tiles = _a.tiles, isCompleted = _a.isCompleted, meeplesInNetwork = _a.meeplesInNetwork;
        if (isCompleted) {
            // Score the network
            var score = tiles.size;
            // Carcassonne rules for sharing: player with most meeples gets full points. If tie, both get full.
            var meepleCounts_1 = {};
            meeplesInNetwork.forEach(function (m) {
                meepleCounts_1[m.ownerId] = (meepleCounts_1[m.ownerId] || 0) + 1;
            });
            var maxMeeples_1 = Math.max.apply(Math, Object.values(meepleCounts_1));
            var winners = Object.keys(meepleCounts_1).filter(function (id) { return meepleCounts_1[id] === maxMeeples_1; });
            for (var _b = 0, winners_1 = winners; _b < winners_1.length; _b++) {
                var winnerId = winners_1[_b];
                if (state.players[winnerId])
                    state.players[winnerId].score += score;
            }
            // Return all meeples in the network
            meeplesInNetwork.forEach(function (m) {
                if (state.players[m.ownerId])
                    state.players[m.ownerId].meeples++;
                state.placedMeeples = state.placedMeeples.filter(function (pm) { return pm !== m; });
                processedMeeples.add(m);
            });
            state.lastAction = "Road completed! ".concat(winners.join(", "), " scored ").concat(score, " points.");
        }
    };
    for (var _i = 0, roadMeeples_1 = roadMeeples; _i < roadMeeples_1.length; _i++) {
        var meeple = roadMeeples_1[_i];
        _loop_2(meeple);
    }
}
function findRoadNetwork(state, startX, startY, startEdge) {
    var tilesInNetwork = new Set();
    var meeplesInNetwork = [];
    var isCompleted = true;
    var queue = [[startX, startY, startEdge]];
    var visitedEdges = new Set();
    var _loop_3 = function () {
        var _a = queue.shift(), x = _a[0], y = _a[1], edge = _a[2];
        var edgeKey = "".concat(x, ",").concat(y, ",").concat(edge);
        if (visitedEdges.has(edgeKey))
            return "continue";
        visitedEdges.add(edgeKey);
        var tile = state.board["".concat(x, ",").concat(y)];
        if (!tile) {
            isCompleted = false;
            return "continue";
        }
        tilesInNetwork.add("".concat(x, ",").concat(y));
        // Find meeple on this edge
        var meeple = state.placedMeeples.find(function (m) { return m.x === x && m.y === y && m.featureIndex === edge; });
        if (meeple)
            meeplesInNetwork.push(meeple);
        // On this tile, find where the road goes
        // START is Card D: Road from edge 1 to 3 (Right to Left)
        // Def: [CITY, ROAD, FIELD, ROAD]
        var def = exports.TILE_DEFINITIONS[tile.tileId];
        var rotatedEdges = getRotatedEdges(tile.tileId, tile.rotation);
        // Find connected edges on the SAME tile
        // ROAD CURVE: edges [F, F, R, R] (2 and 3 connected)
        // ROAD STRAIGHT: edges [F, R, F, R] (1 and 3 connected)
        // START: edges [C, R, F, R] (1 and 3 connected)
        // Simplified heuristic: if it's a road crossing (center CROSSING), edges don't connect.
        // If center is ROAD, edges of type ROAD are connected.
        if (def.center === "ROAD") {
            for (var i = 0; i < 4; i++) {
                if (rotatedEdges[i] === "ROAD" && i !== edge) {
                    queue.push([x, y, i]);
                }
            }
        }
        // Now go to the neighbor across the current edge
        var neighbors = [
            { dx: 0, dy: -1, opp: 2 }, // 0: Top
            { dx: 1, dy: 0, opp: 3 }, // 1: Right
            { dx: 0, dy: 1, opp: 0 }, // 2: Bottom
            { dx: -1, dy: 0, opp: 1 } // 3: Left
        ];
        var n = neighbors[edge];
        queue.push([x + n.dx, y + n.dy, n.opp]);
    };
    while (queue.length > 0) {
        _loop_3();
    }
    return { tiles: tilesInNetwork, isCompleted: isCompleted, meeplesInNetwork: meeplesInNetwork };
}
function scoreCities(state) {
    var cityMeeples = state.placedMeeples.filter(function (m) {
        var tile = state.board["".concat(m.x, ",").concat(m.y)];
        var edges = getRotatedEdges(tile.tileId, tile.rotation);
        return m.featureIndex < 4 && edges[m.featureIndex] === "CITY";
    });
    var processedMeeples = new Set();
    var _loop_4 = function (meeple) {
        if (processedMeeples.has(meeple))
            return "continue";
        var _a = findCityNetwork(state, meeple.x, meeple.y, meeple.featureIndex), tiles = _a.tiles, isCompleted = _a.isCompleted, meeplesInNetwork = _a.meeplesInNetwork, shields = _a.shields;
        if (isCompleted) {
            var score = (tiles.size * 2) + (shields * 2);
            var meepleCounts_2 = {};
            meeplesInNetwork.forEach(function (m) {
                meepleCounts_2[m.ownerId] = (meepleCounts_2[m.ownerId] || 0) + 1;
            });
            var maxMeeples_2 = Math.max.apply(Math, Object.values(meepleCounts_2));
            var winners = Object.keys(meepleCounts_2).filter(function (id) { return meepleCounts_2[id] === maxMeeples_2; });
            for (var _b = 0, winners_2 = winners; _b < winners_2.length; _b++) {
                var winnerId = winners_2[_b];
                if (state.players[winnerId])
                    state.players[winnerId].score += score;
            }
            meeplesInNetwork.forEach(function (m) {
                if (state.players[m.ownerId])
                    state.players[m.ownerId].meeples++;
                state.placedMeeples = state.placedMeeples.filter(function (pm) { return pm !== m; });
                processedMeeples.add(m);
            });
            state.lastAction = "City completed! ".concat(winners.join(", "), " scored ").concat(score, " points.");
        }
    };
    for (var _i = 0, cityMeeples_1 = cityMeeples; _i < cityMeeples_1.length; _i++) {
        var meeple = cityMeeples_1[_i];
        _loop_4(meeple);
    }
}
function findCityNetwork(state, startX, startY, startEdge) {
    var tilesInNetwork = new Set();
    var meeplesInNetwork = [];
    var isCompleted = true;
    var shields = 0;
    var queue = [[startX, startY, startEdge]];
    var visitedEdges = new Set();
    var _loop_5 = function () {
        var _a = queue.shift(), x = _a[0], y = _a[1], edge = _a[2];
        var edgeKey = "".concat(x, ",").concat(y, ",").concat(edge);
        if (visitedEdges.has(edgeKey))
            return "continue";
        visitedEdges.add(edgeKey);
        var tile = state.board["".concat(x, ",").concat(y)];
        if (!tile) {
            isCompleted = false;
            return "continue";
        }
        if (!tilesInNetwork.has("".concat(x, ",").concat(y))) {
            tilesInNetwork.add("".concat(x, ",").concat(y));
            if (exports.TILE_DEFINITIONS[tile.tileId].shield)
                shields++;
        }
        var meeple = state.placedMeeples.find(function (m) { return m.x === x && m.y === y && m.featureIndex === edge; });
        if (meeple)
            meeplesInNetwork.push(meeple);
        var def = exports.TILE_DEFINITIONS[tile.tileId];
        var rotatedEdges = getRotatedEdges(tile.tileId, tile.rotation);
        // Connectivity within tile
        if (def.center === "CITY_FULL") {
            for (var i = 0; i < 4; i++) {
                if (rotatedEdges[i] === "CITY" && i !== edge) {
                    queue.push([x, y, i]);
                }
            }
        }
        // Caps or special tiles would need more complex logic, but for these definitions
        // START and CITY_CAP are just single edge cities.
        // Across edge
        var neighbors = [
            { dx: 0, dy: -1, opp: 2 },
            { dx: 1, dy: 0, opp: 3 },
            { dx: 0, dy: 1, opp: 0 },
            { dx: -1, dy: 0, opp: 1 }
        ];
        var n = neighbors[edge];
        queue.push([x + n.dx, y + n.dy, n.opp]);
    };
    while (queue.length > 0) {
        _loop_5();
    }
    return { tiles: tilesInNetwork, isCompleted: isCompleted, meeplesInNetwork: meeplesInNetwork, shields: shields };
}
