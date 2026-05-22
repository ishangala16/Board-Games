export type EdgeType = "FIELD" | "ROAD" | "CITY";
export type Direction = 0 | 1 | 2 | 3; // 0=Top, 1=Right, 2=Bottom, 3=Left (Clockwise)

export interface TileDefinition {
    id: string;
    edges: [EdgeType, EdgeType, EdgeType, EdgeType]; // [Top, Right, Bottom, Left] unrotated
    center: "MONASTERY" | "CROSSING" | "CITY_FULL" | "FIELD" | "ROAD"; // Simplified center feature
    shield?: boolean; // For city scoring double points
}

export interface PlacedTile {
    x: number;
    y: number;
    tileId: string;
    rotation: Direction;
}

export interface Meeple {
    ownerId: string;
    x: number;
    y: number;
    featureIndex: number; // 0=Top, 1=Right, 2=Bottom, 3=Left, 4=Center
}

export interface CarcassonnePlayer {
    username: string;
    score: number;
    meeples: number; // Start with 7
    color: string;
}

export interface CarcassonneState {
    board: Record<string, PlacedTile>; // Key "x,y"
    deck: string[]; // List of TileDef IDs
    players: Record<string, CarcassonnePlayer>;
    turnOrder: string[];
    currentTurnIndex: number;

    currentTileId: string | null;
    currentTileRotation: Direction;

    phase: "PLACING_TILE" | "PLACING_MEEPLE";
    lastPlacedTile: { x: number, y: number } | null;
    placedMeeples: Meeple[];

    winner: string | null;
    lastAction: string | null;
}

export interface CarcassonneAction {
    type: "ROTATE_TILE" | "PLACE_TILE" | "PLACE_MEEPLE" | "SKIP_MEEPLE" | "SKIP_TURN";
    playerId: string;
    payload?: any;
}

// Minimal set of tiles for MVP
export const TILE_DEFINITIONS: Record<string, TileDefinition> = {
    "START": { id: "START", edges: ["CITY", "ROAD", "FIELD", "ROAD"], center: "ROAD" }, // Card D
    "CITY_CAP": { id: "CITY_CAP", edges: ["CITY", "FIELD", "FIELD", "FIELD"], center: "FIELD" }, // Card C
    "ROAD_STRAIGHT": { id: "ROAD_STRAIGHT", edges: ["FIELD", "ROAD", "FIELD", "ROAD"], center: "ROAD" }, // Card V
    "ROAD_CURVE": { id: "ROAD_CURVE", edges: ["FIELD", "FIELD", "ROAD", "ROAD"], center: "ROAD" }, // Card L
    "MONASTERY": { id: "MONASTERY", edges: ["FIELD", "FIELD", "FIELD", "FIELD"], center: "MONASTERY" }, // Card B
    "CITY_FULL": { id: "CITY_FULL", edges: ["CITY", "CITY", "CITY", "CITY"], center: "CITY_FULL", shield: true }, // Shield?
};

// Helper: Get edges of a tile after rotation
export function getRotatedEdges(tileId: string, rotation: Direction): [EdgeType, EdgeType, EdgeType, EdgeType] {
    const def = TILE_DEFINITIONS[tileId];
    if (!def) return ["FIELD", "FIELD", "FIELD", "FIELD"];
    const src = def.edges;
    if (rotation === 0) return [...src];
    if (rotation === 1) return [src[3], src[0], src[1], src[2]];
    if (rotation === 2) return [src[2], src[3], src[0], src[1]];
    if (rotation === 3) return [src[1], src[2], src[3], src[0]];
    return [...src];
}

export function isValidPlacement(board: Record<string, PlacedTile>, tileId: string, rot: Direction, x: number, y: number): boolean {
    if (board[`${x},${y}`]) return false;

    const edges = getRotatedEdges(tileId, rot);
    const neighbors = [
        { nx: x, ny: y - 1, side: 0, opp: 2 }, // Top
        { nx: x + 1, ny: y, side: 1, opp: 3 }, // Right
        { nx: x, ny: y + 1, side: 2, opp: 0 }, // Bottom
        { nx: x - 1, ny: y, side: 3, opp: 1 }  // Left
    ];

    let hasNeighbor = false;
    for (const n of neighbors) {
        const neighbor = board[`${n.nx},${n.ny}`];
        if (neighbor) {
            hasNeighbor = true;
            const nEdges = getRotatedEdges(neighbor.tileId, neighbor.rotation);
            if (edges[n.side] !== nEdges[n.opp]) return false;
        }
    }
    // Must touch at least one existing tile
    return hasNeighbor;
}

export const INITIAL_CARCASSONNE_STATE = (): CarcassonneState => ({
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
});

function shuffleDeck(): string[] {
    const counts: Record<string, number> = {
        "CITY_CAP": 15,
        "ROAD_STRAIGHT": 12,
        "ROAD_CURVE": 12,
        "MONASTERY": 6,
        "CITY_FULL": 4
    };
    let deck: string[] = [];
    for (const [id, count] of Object.entries(counts)) {
        for (let i = 0; i < count; i++) deck.push(id);
    }
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

export function carcassonneReducer(state: CarcassonneState, action: CarcassonneAction): CarcassonneState {
    const currentPlayer = state.turnOrder[state.currentTurnIndex];
    if (action.playerId !== currentPlayer && state.deck.length > 0) return state;

    let newState = JSON.parse(JSON.stringify(state));

    switch (action.type) {
        case "ROTATE_TILE":
            newState.currentTileRotation = (newState.currentTileRotation + 1) % 4;
            return newState;

        case "PLACE_TILE":
            const { x, y } = action.payload;

            if (newState.phase !== "PLACING_TILE") return state;
            if (!isValidPlacement(newState.board, newState.currentTileId!, newState.currentTileRotation, x, y)) {
                newState.lastAction = "Invalid placement!";
                return newState;
            }

            // PLACE
            newState.board[`${x},${y}`] = {
                x, y,
                tileId: newState.currentTileId!,
                rotation: newState.currentTileRotation
            };

            newState.lastPlacedTile = { x, y };
            newState.phase = "PLACING_MEEPLE";
            newState.lastAction = `${action.playerId} placed a tile at ${x},${y}. Now place a meeple or skip.`;
            return newState;

        case "PLACE_MEEPLE":
            if (newState.phase !== "PLACING_MEEPLE") return state;
            const featureIndex = action.payload; // 0-4
            const playerM = newState.players[action.playerId];

            if (playerM && playerM.meeples > 0) {
                playerM.meeples--;
                newState.placedMeeples.push({
                    ownerId: action.playerId,
                    x: newState.lastPlacedTile!.x,
                    y: newState.lastPlacedTile!.y,
                    featureIndex
                });
                newState.lastAction = `${action.playerId} placed a meeple on feature ${featureIndex}`;
            }

            // Proceed to next turn
            return endTurn(newState);

        case "SKIP_MEEPLE":
            if (newState.phase !== "PLACING_MEEPLE") return state;
            newState.lastAction = `${action.playerId} skipped meeple placement.`;
            return endTurn(newState);

        case "SKIP_TURN":
            if (newState.phase === "PLACING_TILE") {
                newState.lastAction = `${action.playerId} skipped their turn.`;
                return endTurn(newState);
            }
            return state;
    }

    return newState;
}

function endTurn(state: CarcassonneState): CarcassonneState {
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
    } else {
        state.currentTileId = null;
        state.lastAction = "Game Over - No more tiles!";
    }

    return state;
}

function scoreMonasteries(state: CarcassonneState) {
    const meeplesOnMonasteries = state.placedMeeples.filter(m => {
        const tile = state.board[`${m.x},${m.y}`];
        return TILE_DEFINITIONS[tile.tileId].center === "MONASTERY" && m.featureIndex === 4;
    });

    for (const meeple of meeplesOnMonasteries) {
        let count = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (state.board[`${meeple.x + dx},${meeple.y + dy}`]) {
                    count++;
                }
            }
        }

        if (count === 9) {
            // Monastery complete!
            const player = state.players[meeple.ownerId];
            if (player) {
                player.score += 9;
                player.meeples++; // Return meeple
            }
            // Remove from placed meeples
            state.placedMeeples = state.placedMeeples.filter(m => m !== meeple);
            state.lastAction = `${meeple.ownerId} completed a Monastery for 9 points!`;
        }
    }
}

function scoreRoads(state: CarcassonneState) {
    // Collect all unique road networks with meeples
    const roadMeeples = state.placedMeeples.filter(m => {
        const tile = state.board[`${m.x},${m.y}`];
        const edges = getRotatedEdges(tile.tileId, tile.rotation);
        return m.featureIndex < 4 && edges[m.featureIndex] === "ROAD";
    });

    const processedMeeples = new Set<Meeple>();

    for (const meeple of roadMeeples) {
        if (processedMeeples.has(meeple)) continue;

        const { tiles, isCompleted, meeplesInNetwork } = findRoadNetwork(state, meeple.x, meeple.y, meeple.featureIndex);

        if (isCompleted) {
            // Score the network
            const score = tiles.size;
            // Carcassonne rules for sharing: player with most meeples gets full points. If tie, both get full.
            const meepleCounts: Record<string, number> = {};
            meeplesInNetwork.forEach(m => {
                meepleCounts[m.ownerId] = (meepleCounts[m.ownerId] || 0) + 1;
            });

            const maxMeeples = Math.max(...Object.values(meepleCounts));
            const winners = Object.keys(meepleCounts).filter(id => meepleCounts[id] === maxMeeples);

            for (const winnerId of winners) {
                if (state.players[winnerId]) state.players[winnerId].score += score;
            }

            // Return all meeples in the network
            meeplesInNetwork.forEach(m => {
                if (state.players[m.ownerId]) state.players[m.ownerId].meeples++;
                state.placedMeeples = state.placedMeeples.filter(pm => pm !== m);
                processedMeeples.add(m);
            });

            state.lastAction = `Road completed! ${winners.join(", ")} scored ${score} points.`;
        }
    }
}

interface RoadNetworkResult {
    tiles: Set<string>;
    isCompleted: boolean;
    meeplesInNetwork: Meeple[];
}

function findRoadNetwork(state: CarcassonneState, startX: number, startY: number, startEdge: number): RoadNetworkResult {
    const tilesInNetwork = new Set<string>();
    const meeplesInNetwork: Meeple[] = [];
    let isCompleted = true;

    const queue: [number, number, number][] = [[startX, startY, startEdge]];
    const visitedEdges = new Set<string>();

    while (queue.length > 0) {
        const [x, y, edge] = queue.shift()!;
        const edgeKey = `${x},${y},${edge}`;
        if (visitedEdges.has(edgeKey)) continue;
        visitedEdges.add(edgeKey);

        const tile = state.board[`${x},${y}`];
        if (!tile) {
            isCompleted = false;
            continue;
        }

        tilesInNetwork.add(`${x},${y}`);

        // Find meeple on this edge
        const meeple = state.placedMeeples.find(m => m.x === x && m.y === y && m.featureIndex === edge);
        if (meeple) meeplesInNetwork.push(meeple);

        // On this tile, find where the road goes
        // START is Card D: Road from edge 1 to 3 (Right to Left)
        // Def: [CITY, ROAD, FIELD, ROAD]
        const def = TILE_DEFINITIONS[tile.tileId];
        const rotatedEdges = getRotatedEdges(tile.tileId, tile.rotation);

        // Find connected edges on the SAME tile
        // ROAD CURVE: edges [F, F, R, R] (2 and 3 connected)
        // ROAD STRAIGHT: edges [F, R, F, R] (1 and 3 connected)
        // START: edges [C, R, F, R] (1 and 3 connected)
        // Simplified heuristic: if it's a road crossing (center CROSSING), edges don't connect.
        // If center is ROAD, edges of type ROAD are connected.
        if (def.center === "ROAD") {
            for (let i = 0; i < 4; i++) {
                if (rotatedEdges[i] === "ROAD" && i !== edge) {
                    queue.push([x, y, i]);
                }
            }
        }

        // Now go to the neighbor across the current edge
        const neighbors = [
            { dx: 0, dy: -1, opp: 2 }, // 0: Top
            { dx: 1, dy: 0, opp: 3 },  // 1: Right
            { dx: 0, dy: 1, opp: 0 },  // 2: Bottom
            { dx: -1, dy: 0, opp: 1 }  // 3: Left
        ];
        const n = neighbors[edge];
        queue.push([x + n.dx, y + n.dy, n.opp]);
    }

    return { tiles: tilesInNetwork, isCompleted, meeplesInNetwork };
}

function scoreCities(state: CarcassonneState) {
    const cityMeeples = state.placedMeeples.filter(m => {
        const tile = state.board[`${m.x},${m.y}`];
        const edges = getRotatedEdges(tile.tileId, tile.rotation);
        return m.featureIndex < 4 && edges[m.featureIndex] === "CITY";
    });

    const processedMeeples = new Set<Meeple>();

    for (const meeple of cityMeeples) {
        if (processedMeeples.has(meeple)) continue;

        const { tiles, isCompleted, meeplesInNetwork, shields } = findCityNetwork(state, meeple.x, meeple.y, meeple.featureIndex);

        if (isCompleted) {
            const score = (tiles.size * 2) + (shields * 2);

            const meepleCounts: Record<string, number> = {};
            meeplesInNetwork.forEach(m => {
                meepleCounts[m.ownerId] = (meepleCounts[m.ownerId] || 0) + 1;
            });

            const maxMeeples = Math.max(...Object.values(meepleCounts));
            const winners = Object.keys(meepleCounts).filter(id => meepleCounts[id] === maxMeeples);

            for (const winnerId of winners) {
                if (state.players[winnerId]) state.players[winnerId].score += score;
            }

            meeplesInNetwork.forEach(m => {
                if (state.players[m.ownerId]) state.players[m.ownerId].meeples++;
                state.placedMeeples = state.placedMeeples.filter(pm => pm !== m);
                processedMeeples.add(m);
            });

            state.lastAction = `City completed! ${winners.join(", ")} scored ${score} points.`;
        }
    }
}

interface CityNetworkResult {
    tiles: Set<string>;
    isCompleted: boolean;
    meeplesInNetwork: Meeple[];
    shields: number;
}

function findCityNetwork(state: CarcassonneState, startX: number, startY: number, startEdge: number): CityNetworkResult {
    const tilesInNetwork = new Set<string>();
    const meeplesInNetwork: Meeple[] = [];
    let isCompleted = true;
    let shields = 0;

    const queue: [number, number, number][] = [[startX, startY, startEdge]];
    const visitedEdges = new Set<string>();

    while (queue.length > 0) {
        const [x, y, edge] = queue.shift()!;
        const edgeKey = `${x},${y},${edge}`;
        if (visitedEdges.has(edgeKey)) continue;
        visitedEdges.add(edgeKey);

        const tile = state.board[`${x},${y}`];
        if (!tile) {
            isCompleted = false;
            continue;
        }

        if (!tilesInNetwork.has(`${x},${y}`)) {
            tilesInNetwork.add(`${x},${y}`);
            if (TILE_DEFINITIONS[tile.tileId].shield) shields++;
        }

        const meeple = state.placedMeeples.find(m => m.x === x && m.y === y && m.featureIndex === edge);
        if (meeple) meeplesInNetwork.push(meeple);

        const def = TILE_DEFINITIONS[tile.tileId];
        const rotatedEdges = getRotatedEdges(tile.tileId, tile.rotation);

        // Connectivity within tile
        if (def.center === "CITY_FULL") {
            for (let i = 0; i < 4; i++) {
                if (rotatedEdges[i] === "CITY" && i !== edge) {
                    queue.push([x, y, i]);
                }
            }
        }
        // Caps or special tiles would need more complex logic, but for these definitions
        // START and CITY_CAP are just single edge cities.

        // Across edge
        const neighbors = [
            { dx: 0, dy: -1, opp: 2 },
            { dx: 1, dy: 0, opp: 3 },
            { dx: 0, dy: 1, opp: 0 },
            { dx: -1, dy: 0, opp: 1 }
        ];
        const n = neighbors[edge];
        queue.push([x + n.dx, y + n.dy, n.opp]);
    }

    return { tiles: tilesInNetwork, isCompleted, meeplesInNetwork, shields };
}

// Ensure explicit exports for better compatibility with some build systems
export {
    shuffleDeck as _shuffleDeck
};
