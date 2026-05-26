import { INITIAL_STATE, sequenceReducer, SequenceState, SequenceAction } from "./games/Sequence";
import { INITIAL_SPLENDOR_STATE, splendorReducer, SplendorState, SplendorAction } from "./games/Splendor";

interface SimpleGameState {
    players: Record<string, any>;
    // ... union of shapes or unknown
}

export interface GameInstance {
    id: string;
    type: "SEQUENCE" | "SPLENDOR" | "CARCASSONNE" | "AZUL";
    state: any; // SequenceState | SplendorState | CarcassonneState | CatanState
    players: string[]; // [p1, p2]
}

export class GameManager {
    private games: Map<string, GameInstance> = new Map();

    async createGame(roomId: string, type: "SEQUENCE" | "SPLENDOR" | "CARCASSONNE" | "AZUL", host: string, isSinglePlayer?: boolean) {
        if (type === "SEQUENCE") {
            // ... (Sequence Logic - Shortened for brevity in this replace, assuming existing context is fine, but I must match exact target for robustness)
            // To avoid context issues, I will rewrite the SEQUENCE block exactly as it appears in the view_file output to be safe, then add others.
            const initialState = JSON.parse(JSON.stringify(INITIAL_STATE));
            if (initialState.deck) initialState.deck = initialState.deck.sort(() => Math.random() - 0.5);
            initialState.players[host] = "BLUE";
            const hostHand = [];
            for (let i = 0; i < 7; i++) {
                if (initialState.deck.length > 0) hostHand.push(initialState.deck.pop()!);
            }
            initialState.hands[host] = hostHand;

            this.games.set(roomId, { id: roomId, type, state: initialState, players: [host] });

        } else if (type === "SPLENDOR") {
            // ... (Splendor Logic)
            const initialState = INITIAL_SPLENDOR_STATE();
            initialState.players[host] = {
                username: host,
                tokens: { WHITE: 0, BLUE: 0, GREEN: 0, RED: 0, BLACK: 0, GOLD: 0 },
                reserved: [],
                tableau: [],
                nobles: [],
                points: 0
            };
            initialState.turnOrder = [host];
            this.games.set(roomId, { id: roomId, type, state: initialState, players: [host] });

        } else if (type === "CARCASSONNE") {
            // Lazy load to avoid circular deps if any
            const { INITIAL_CARCASSONNE_STATE } = require("./games/Carcassonne");
            const initialState = INITIAL_CARCASSONNE_STATE();
            initialState.players[host] = {
                username: host,
                score: 0,
                meeples: 7,
                color: "RED"
            };
            initialState.turnOrder = [host];
            // Deal first tile
            if (initialState.deck.length > 0) {
                initialState.currentTileId = initialState.deck.pop();
            }
            this.games.set(roomId, { id: roomId, type, state: initialState, players: [host] });
        } else if (type === "AZUL") {
            const { INITIAL_AZUL_STATE, azulReducer } = require("./games/Azul");
            let initialState = INITIAL_AZUL_STATE();
            initialState.players[host] = {
                username: host,
                score: 0,
                patternLines: [[], [], [], [], []],
                wall: Array(5).fill([]).map(() => Array(5).fill(false)),
                floorLine: []
            };
            initialState.turnOrder = [host];
            initialState = azulReducer(initialState, { type: "START_GAME" });
            this.games.set(roomId, { id: roomId, type, state: initialState, players: [host] });
        }

        if (isSinglePlayer) {
            await this.joinGame(roomId, "AI_PLAYER");
        }

        const game = this.games.get(roomId);
        return game ? game.state : null;
    }

    async joinGame(roomId: string, user: string) {
        const game = this.games.get(roomId);
        if (!game) return null;

        // Reconnection Logic: If user is already in players list, return current state
        if (game.players.includes(user)) {
            return game.state;
        }

        // Limit to 2 players
        if (game.players.length >= 2) return null;

        // Add new player
        game.players.push(user);

        if (game.type === "SEQUENCE") {
            game.state.players[user] = "RED"; // Second player is RED

            // Deal hand
            const p2Hand = [];
            for (let i = 0; i < 7; i++) {
                if (game.state.deck.length > 0) {
                    p2Hand.push(game.state.deck.pop()!);
                }
            }
            game.state.hands[user] = p2Hand;
        } else if (game.type === "SPLENDOR") {
            // Splendor Join
            game.state.players[user] = {
                username: user,
                tokens: { WHITE: 0, BLUE: 0, GREEN: 0, RED: 0, BLACK: 0, GOLD: 0 },
                reserved: [],
                tableau: [],
                nobles: [],
                points: 0
            };
            game.state.turnOrder.push(user);
        } else if (game.type === "CARCASSONNE") {
            // Carcassonne Join
            game.state.players[user] = {
                username: user,
                score: 0,
                meeples: 7,
                color: "BLUE"
            };
            game.state.turnOrder.push(user);
        } else if (game.type === "AZUL") {
            game.state.players[user] = {
                username: user,
                score: 0,
                patternLines: [[], [], [], [], []],
                wall: Array(5).fill([]).map(() => Array(5).fill(false)),
                floorLine: []
            };
            game.state.turnOrder.push(user);

            // Auto start if Azul reaches 2 players (or could be manual, let's auto start for now)
            if (game.state.turnOrder.length === 2) {
                const { azulReducer } = require("./games/Azul");
                game.state = azulReducer(game.state, { type: "START_GAME" });
            }
        }

        return game.state;
    }

    async getGame(roomId: string) {
        const game = this.games.get(roomId);
        if (!game) return null;
        return game.state;
    }

    getGameInstance(roomId: string) {
        return this.games.get(roomId) || null;
    }

    async restartGame(roomId: string) {
        const game = this.games.get(roomId);
        if (!game) return null;

        const players = [...game.players];
        const type = game.type;
        const isSinglePlayer = players.includes("AI_PLAYER");

        // Filter out AI_PLAYER from manual joins
        const humanPlayers = players.filter(p => p !== "AI_PLAYER");
        if (humanPlayers.length === 0) return null;

        const host = humanPlayers[0];

        // Re-create game state
        await this.createGame(roomId, type, host, isSinglePlayer);

        // Add other human players back
        for (let i = 1; i < humanPlayers.length; i++) {
            await this.joinGame(roomId, humanPlayers[i]);
        }

        return this.games.get(roomId)?.state || null;
    }

    async makeMove(roomId: string, action: any) {
        const game = this.games.get(roomId);
        if (!game) throw new Error("Game not found");

        if (game.type === "SEQUENCE") {
            game.state = sequenceReducer(game.state, action);
        } else if (game.type === "SPLENDOR") {
            game.state = splendorReducer(game.state, action);
        } else if (game.type === "CARCASSONNE") {
            const { carcassonneReducer } = require("./games/Carcassonne");
            game.state = carcassonneReducer(game.state, action);
        } else if (game.type === "AZUL") {
            const { azulReducer } = require("./games/Azul");
            game.state = azulReducer(game.state, action);
        }

        return game.state;
    }
}
