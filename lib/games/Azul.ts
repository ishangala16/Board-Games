// Removed lodash, using native structuredClone for deep copy.

export type TileColor = "BLUE" | "YELLOW" | "RED" | "BLACK" | "WHITE" | "FIRST_PLAYER";

export const COLORS: TileColor[] = ["BLUE", "YELLOW", "RED", "BLACK", "WHITE"];

export const WALL_PATTERN: TileColor[][] = [
    ["BLUE", "YELLOW", "RED", "BLACK", "WHITE"],
    ["WHITE", "BLUE", "YELLOW", "RED", "BLACK"],
    ["BLACK", "WHITE", "BLUE", "YELLOW", "RED"],
    ["RED", "BLACK", "WHITE", "BLUE", "YELLOW"],
    ["YELLOW", "RED", "BLACK", "WHITE", "BLUE"],
];

const FLOOR_PENALTIES = [-1, -1, -2, -2, -2, -3, -3];

export interface AzulPlayer {
    username: string;
    score: number;
    patternLines: TileColor[][]; // 5 lines, max capacities: 1, 2, 3, 4, 5
    wall: boolean[][]; // 5x5
    floorLine: TileColor[]; // max 7
}

export interface AzulState {
    players: Record<string, AzulPlayer>;
    turnOrder: string[];
    currentTurnIndex: number;
    factories: TileColor[][];
    center: TileColor[];
    bag: TileColor[];
    discard: TileColor[];
    firstPlayerNextRound: string | null;
    phase: "DRAFTING" | "TILING" | "GAME_OVER";
    winner: string | null;
}

export const INITIAL_AZUL_STATE = (): AzulState => {
    const bag: TileColor[] = [];
    COLORS.forEach(color => {
        for (let i = 0; i < 20; i++) bag.push(color);
    });

    // Shuffle bag
    for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
    }

    return {
        players: {},
        turnOrder: [],
        currentTurnIndex: 0,
        factories: [],
        center: ["FIRST_PLAYER"],
        bag,
        discard: [],
        firstPlayerNextRound: null,
        phase: "DRAFTING",
        winner: null
    };
};

export type AzulAction =
    | { type: "START_GAME" }
    | { type: "DRAFT_TILES"; payload: { source: "FACTORY" | "CENTER", factoryIndex?: number, color: TileColor, patternLineIndex: number | "FLOOR", username: string } };

function replenishFactories(state: AzulState) {
    const numPlayers = state.turnOrder.length;
    let numFactories = 5;
    if (numPlayers === 3) numFactories = 7;
    if (numPlayers === 4) numFactories = 9;

    state.factories = Array(numFactories).fill([]).map(() => []);

    for (let i = 0; i < numFactories; i++) {
        for (let j = 0; j < 4; j++) {
            if (state.bag.length === 0) {
                // Refill from discard
                state.bag = state.discard.sort(() => Math.random() - 0.5);
                state.discard = [];
            }
            if (state.bag.length > 0) {
                state.factories[i].push(state.bag.pop()!);
            }
        }
    }
}

function processTilingPhase(state: AzulState) {
    // For each player, move tiles from completed pattern lines to wall, score, and clear floor line
    let gameOver = false;

    state.turnOrder.forEach(username => {
        const player = state.players[username];

        for (let i = 0; i < 5; i++) {
            const line = player.patternLines[i];
            const capacity = i + 1;

            if (line.length === capacity) {
                const color = line[0];
                const colIndex = WALL_PATTERN[i].indexOf(color);

                // Move to wall
                player.wall[i][colIndex] = true;

                // Score placement
                let horizontalMatches = 1;
                let verticalMatches = 1;

                // Check right
                for (let c = colIndex + 1; c < 5; c++) { if (player.wall[i][c]) horizontalMatches++; else break; }
                // Check left
                for (let c = colIndex - 1; c >= 0; c--) { if (player.wall[i][c]) horizontalMatches++; else break; }

                // Check down
                for (let r = i + 1; r < 5; r++) { if (player.wall[r][colIndex]) verticalMatches++; else break; }
                // Check up
                for (let r = i - 1; r >= 0; r--) { if (player.wall[r][colIndex]) verticalMatches++; else break; }

                if (horizontalMatches === 1 && verticalMatches === 1) {
                    player.score += 1; // no adjacent
                } else {
                    if (horizontalMatches > 1) player.score += horizontalMatches;
                    if (verticalMatches > 1) player.score += verticalMatches;
                }

                // Discard the rest
                for (let t = 1; t < line.length; t++) {
                    state.discard.push(color);
                }
                player.patternLines[i] = [];

                // Check game over
                let rowComplete = true;
                for (let c = 0; c < 5; c++) {
                    if (!player.wall[i][c]) {
                        rowComplete = false;
                        break;
                    }
                }
                if (rowComplete) gameOver = true;
            }
        }

        // Floor line penalties
        player.floorLine.forEach((tile, index) => {
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
        let highestScore = -1;
        let winner = null;

        state.turnOrder.forEach(username => {
            const player = state.players[username];
            // +2 per complete row
            for (let r = 0; r < 5; r++) {
                if (player.wall[r].every((v: boolean) => v)) player.score += 2;
            }
            // +7 per complete col
            for (let c = 0; c < 5; c++) {
                let colComplete = true;
                for (let r = 0; r < 5; r++) {
                    if (!player.wall[r][c]) colComplete = false;
                }
                if (colComplete) player.score += 7;
            }
            // +10 per 5 of same color
            COLORS.forEach(color => {
                let count = 0;
                for (let r = 0; r < 5; r++) {
                    const c = WALL_PATTERN[r].indexOf(color);
                    if (player.wall[r][c]) count++;
                }
                if (count === 5) player.score += 10;
            });

            if (player.score > highestScore) {
                highestScore = player.score;
                winner = username;
            }
        });

        state.winner = winner;
    } else {
        // Setup next round
        state.center = ["FIRST_PLAYER"];
        replenishFactories(state);

        if (state.firstPlayerNextRound) {
            state.currentTurnIndex = state.turnOrder.indexOf(state.firstPlayerNextRound);
            state.firstPlayerNextRound = null;
        } else {
            state.currentTurnIndex = 0; // fallback
        }
    }
}

export function azulReducer(state: AzulState, action: AzulAction): AzulState {
    const draftState = structuredClone(state);

    if (action.type === "START_GAME") {
        draftState.turnOrder = Object.keys(draftState.players);
        // Ensure starting player state
        draftState.turnOrder.forEach((u: string) => {
            draftState.players[u] = {
                username: u,
                score: 0,
                patternLines: [[], [], [], [], []],
                wall: Array(5).fill([]).map(() => Array(5).fill(false)),
                floorLine: []
            };
        });
        replenishFactories(draftState);
        draftState.currentTurnIndex = 0;
        return draftState;
    }

    if (action.type === "DRAFT_TILES") {
        if (draftState.phase !== "DRAFTING") throw new Error("Not drafting phase");

        const { source, factoryIndex, color, patternLineIndex, username } = action.payload;
        if (draftState.turnOrder[draftState.currentTurnIndex] !== username) throw new Error("Not your turn");

        const player = draftState.players[username];
        let draftedTiles: TileColor[] = [];

        if (source === "FACTORY") {
            if (factoryIndex === undefined) throw new Error("Factory index required");
            const factory = draftState.factories[factoryIndex];
            if (!factory.includes(color)) throw new Error("Color not in factory");

            draftedTiles = factory.filter((t: TileColor) => t === color);
            const remainingTiles = factory.filter((t: TileColor) => t !== color);

            draftState.center.push(...remainingTiles);
            draftState.factories[factoryIndex] = [];
        } else {
            // CENTER
            if (!draftState.center.includes(color)) throw new Error("Color not in center");

            if (draftState.center.includes("FIRST_PLAYER")) {
                player.floorLine.push("FIRST_PLAYER");
                draftState.firstPlayerNextRound = username;
                draftState.center = draftState.center.filter((t: TileColor) => t !== "FIRST_PLAYER");
            }

            draftedTiles = draftState.center.filter((t: TileColor) => t === color);
            draftState.center = draftState.center.filter((t: TileColor) => t !== color);
        }

        // Place tiles
        if (patternLineIndex === "FLOOR") {
            player.floorLine.push(...draftedTiles);
        } else {
            const line = player.patternLines[patternLineIndex];
            const capacity = patternLineIndex + 1;

            // Validate placement
            if (line.length > 0 && line[0] !== color) throw new Error("Pattern line has different color");
            if (player.wall[patternLineIndex][WALL_PATTERN[patternLineIndex].indexOf(color)]) {
                throw new Error("Color already on wall in this row");
            }

            // Fill line, overflow to floor
            while (draftedTiles.length > 0) {
                if (line.length < capacity) {
                    line.push(draftedTiles.pop()!);
                } else {
                    player.floorLine.push(draftedTiles.pop()!);
                }
            }
        }

        // Trim floor line to max 7
        while (player.floorLine.length > 7) {
            const extra = player.floorLine.pop()!;
            if (extra !== "FIRST_PLAYER") draftState.discard.push(extra);
        }

        // Check round end
        const roundEnded = draftState.factories.every((f: TileColor[]) => f.length === 0) && draftState.center.length === 0;

        if (roundEnded) {
            processTilingPhase(draftState);
        } else {
            // Next turn
            draftState.currentTurnIndex = (draftState.currentTurnIndex + 1) % draftState.turnOrder.length;
        }

        return draftState;
    }

    return draftState;
}
