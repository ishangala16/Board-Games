"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports.GameManager = void 0;
var Sequence_1 = require("./games/Sequence");
var Splendor_1 = require("./games/Splendor");
var GameManager = /** @class */ (function () {
    function GameManager() {
        this.games = new Map();
    }
    GameManager.prototype.createGame = function (roomId_1, type_1, host_1, isSinglePlayer_1) {
        return __awaiter(this, arguments, void 0, function (roomId, type, host, isSinglePlayer, aiDifficulty) {
            var initialState, hostHand, i, initialState, INITIAL_CARCASSONNE_STATE, initialState, _a, INITIAL_AZUL_STATE, azulReducer, initialState, game;
            if (aiDifficulty === void 0) { aiDifficulty = "HARD"; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (type === "SEQUENCE") {
                            initialState = JSON.parse(JSON.stringify(Sequence_1.INITIAL_STATE));
                            initialState.aiDifficulty = aiDifficulty;
                            if (initialState.deck)
                                initialState.deck = initialState.deck.sort(function () { return Math.random() - 0.5; });
                            initialState.players[host] = "BLUE";
                            hostHand = [];
                            for (i = 0; i < 7; i++) {
                                if (initialState.deck.length > 0)
                                    hostHand.push(initialState.deck.pop());
                            }
                            initialState.hands[host] = hostHand;
                            this.games.set(roomId, { id: roomId, type: type, state: initialState, players: [host] });
                        }
                        else if (type === "SPLENDOR") {
                            initialState = (0, Splendor_1.INITIAL_SPLENDOR_STATE)();
                            initialState.aiDifficulty = aiDifficulty;
                            initialState.players[host] = {
                                username: host,
                                tokens: { WHITE: 0, BLUE: 0, GREEN: 0, RED: 0, BLACK: 0, GOLD: 0 },
                                reserved: [],
                                tableau: [],
                                nobles: [],
                                points: 0
                            };
                            initialState.turnOrder = [host];
                            this.games.set(roomId, { id: roomId, type: type, state: initialState, players: [host] });
                        }
                        else if (type === "CARCASSONNE") {
                            INITIAL_CARCASSONNE_STATE = require("./games/Carcassonne").INITIAL_CARCASSONNE_STATE;
                            initialState = INITIAL_CARCASSONNE_STATE();
                            initialState.aiDifficulty = aiDifficulty;
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
                            this.games.set(roomId, { id: roomId, type: type, state: initialState, players: [host] });
                        }
                        else if (type === "AZUL") {
                            _a = require("./games/Azul"), INITIAL_AZUL_STATE = _a.INITIAL_AZUL_STATE, azulReducer = _a.azulReducer;
                            initialState = INITIAL_AZUL_STATE();
                            initialState.aiDifficulty = aiDifficulty;
                            initialState.players[host] = {
                                username: host,
                                score: 0,
                                patternLines: [[], [], [], [], []],
                                wall: Array(5).fill([]).map(function () { return Array(5).fill(false); }),
                                floorLine: []
                            };
                            initialState.turnOrder = [host];
                            initialState = azulReducer(initialState, { type: "START_GAME" });
                            this.games.set(roomId, { id: roomId, type: type, state: initialState, players: [host] });
                        }
                        if (!isSinglePlayer) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.joinGame(roomId, "AI_PLAYER", true)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        game = this.games.get(roomId);
                        return [2 /*return*/, game ? game.state : null];
                }
            });
        });
    };
    GameManager.prototype.joinGame = function (roomId_1, user_1) {
        return __awaiter(this, arguments, void 0, function (roomId, user, isInternal) {
            var game, p2Hand, i, azulReducer;
            if (isInternal === void 0) { isInternal = false; }
            return __generator(this, function (_a) {
                if (user === "AI_PLAYER" && !isInternal)
                    return [2 /*return*/, null];
                game = this.games.get(roomId);
                if (!game)
                    return [2 /*return*/, null];
                // Reconnection Logic: If user is already in players list, return current state
                if (game.players.includes(user)) {
                    return [2 /*return*/, game.state];
                }
                // Limit to 2 players
                if (game.players.length >= 2)
                    return [2 /*return*/, null];
                // Add new player
                game.players.push(user);
                if (game.type === "SEQUENCE") {
                    p2Hand = [];
                    for (i = 0; i < 7; i++) {
                        if (game.state.deck.length > 0) {
                            p2Hand.push(game.state.deck.pop());
                        }
                    }
                    game.state.hands[user] = p2Hand;
                    game.state.players[user] = "RED";
                }
                else if (game.type === "SPLENDOR") {
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
                }
                else if (game.type === "CARCASSONNE") {
                    // Carcassonne Join
                    game.state.players[user] = {
                        username: user,
                        score: 0,
                        meeples: 7,
                        color: "BLUE"
                    };
                    game.state.turnOrder.push(user);
                }
                else if (game.type === "AZUL") {
                    game.state.players[user] = {
                        username: user,
                        score: 0,
                        patternLines: [[], [], [], [], []],
                        wall: Array(5).fill([]).map(function () { return Array(5).fill(false); }),
                        floorLine: []
                    };
                    game.state.turnOrder.push(user);
                    // Auto start if Azul reaches 2 players (or could be manual, let's auto start for now)
                    if (game.state.turnOrder.length === 2) {
                        azulReducer = require("./games/Azul").azulReducer;
                        game.state = azulReducer(game.state, { type: "START_GAME" });
                    }
                }
                return [2 /*return*/, game.state];
            });
        });
    };
    GameManager.prototype.getGame = function (roomId) {
        return __awaiter(this, void 0, void 0, function () {
            var game;
            return __generator(this, function (_a) {
                game = this.games.get(roomId);
                if (!game)
                    return [2 /*return*/, null];
                return [2 /*return*/, game.state];
            });
        });
    };
    GameManager.prototype.getGameInstance = function (roomId) {
        return this.games.get(roomId) || null;
    };
    GameManager.prototype.restartGame = function (roomId) {
        return __awaiter(this, void 0, void 0, function () {
            var game, players, type, isSinglePlayer, humanPlayers, host, aiDifficulty, i;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        game = this.games.get(roomId);
                        if (!game)
                            return [2 /*return*/, null];
                        players = __spreadArray([], game.players, true);
                        type = game.type;
                        isSinglePlayer = players.includes("AI_PLAYER");
                        humanPlayers = players.filter(function (p) { return p !== "AI_PLAYER"; });
                        if (humanPlayers.length === 0)
                            return [2 /*return*/, null];
                        host = humanPlayers[0];
                        aiDifficulty = game.state.aiDifficulty || "HARD";
                        return [4 /*yield*/, this.createGame(roomId, type, host, isSinglePlayer, aiDifficulty)];
                    case 1:
                        _b.sent();
                        i = 1;
                        _b.label = 2;
                    case 2:
                        if (!(i < humanPlayers.length)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.joinGame(roomId, humanPlayers[i])];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, ((_a = this.games.get(roomId)) === null || _a === void 0 ? void 0 : _a.state) || null];
                }
            });
        });
    };
    GameManager.prototype.makeMove = function (roomId, action) {
        return __awaiter(this, void 0, void 0, function () {
            var game, carcassonneReducer, azulReducer;
            return __generator(this, function (_a) {
                game = this.games.get(roomId);
                if (!game)
                    throw new Error("Game not found");
                if (game.type === "SEQUENCE") {
                    game.state = (0, Sequence_1.sequenceReducer)(game.state, action);
                }
                else if (game.type === "SPLENDOR") {
                    game.state = (0, Splendor_1.splendorReducer)(game.state, action);
                }
                else if (game.type === "CARCASSONNE") {
                    carcassonneReducer = require("./games/Carcassonne").carcassonneReducer;
                    game.state = carcassonneReducer(game.state, action);
                }
                else if (game.type === "AZUL") {
                    azulReducer = require("./games/Azul").azulReducer;
                    game.state = azulReducer(game.state, action);
                }
                return [2 /*return*/, game.state];
            });
        });
    };
    return GameManager;
}());
exports.GameManager = GameManager;
