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
Object.defineProperty(exports, "__esModule", { value: true });
var GameManager_1 = require("./lib/GameManager");
var AI_1 = require("./lib/games/AI");
function testGame(type) {
    return __awaiter(this, void 0, void 0, function () {
        var gm, roomId, host, gameInstance, state, isAITurn, humanAction, hand, card, boardLayout, played, y, x, e_1, aiAction, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n--- Testing ".concat(type, " ---"));
                    gm = new GameManager_1.GameManager();
                    roomId = "TEST_".concat(type);
                    host = "player1";
                    // Create game
                    return [4 /*yield*/, gm.createGame(roomId, type, host, true, "HARD")];
                case 1:
                    // Create game
                    _a.sent();
                    gameInstance = gm.getGameInstance(roomId);
                    if (!gameInstance) {
                        console.error("Failed to create ".concat(type));
                        return [2 /*return*/];
                    }
                    state = gameInstance.state;
                    isAITurn = false;
                    if (type === "SEQUENCE") {
                        isAITurn = state.currentTurn === state.players["AI_PLAYER"];
                    }
                    else {
                        isAITurn = state.turnOrder[state.currentTurnIndex] === "AI_PLAYER";
                    }
                    if (isAITurn) {
                        console.log("[".concat(type, "] AI is unexpectedly first to play."));
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 7, , 8]);
                    // Force human to play a move
                    console.log("[".concat(type, "] Simulating human move..."));
                    humanAction = null;
                    if (type === "SEQUENCE") {
                        hand = state.hands[host];
                        if (hand && hand.length > 0) {
                            card = hand[0];
                            boardLayout = [
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
                            played = false;
                            for (y = 0; y < 10; y++) {
                                for (x = 0; x < 10; x++) {
                                    if (boardLayout[y][x] === card && state.board[y][x] === null) {
                                        humanAction = { type: "PLAY_CARD", payload: { playerId: host, card: card, x: x, y: y } };
                                        played = true;
                                        break;
                                    }
                                }
                                if (played)
                                    break;
                            }
                            if (!played) {
                                console.log("[SEQUENCE] Could not find a spot for", card);
                            }
                        }
                    }
                    else if (type === "SPLENDOR") {
                        // Take 3 different gems
                        humanAction = { type: "TAKE_TOKENS", playerId: host, tokens: ["WHITE", "BLUE", "GREEN"] };
                    }
                    else if (type === "CARCASSONNE") {
                        // Place tile and skip meeple
                        humanAction = { type: "PLACE_TILE", payload: { playerId: host, x: 0, y: 1, rotation: 0 } };
                        // Note: In Carcassonne, we might need a valid placement. If invalid, the move will throw.
                    }
                    else if (type === "AZUL") {
                        // Take from factory 0 to pattern line 0
                        humanAction = { type: "DRAFT_TILES", payload: { username: host, source: "FACTORY", factoryIndex: 0, color: state.factories[0][0], patternLineIndex: 0 } };
                    }
                    if (!humanAction) return [3 /*break*/, 6];
                    return [4 /*yield*/, gm.makeMove(roomId, humanAction)];
                case 3:
                    state = _a.sent();
                    if (!(type === "CARCASSONNE")) return [3 /*break*/, 5];
                    return [4 /*yield*/, gm.makeMove(roomId, { type: "SKIP_MEEPLE", playerId: host })];
                case 4:
                    // Also skip meeple
                    state = _a.sent();
                    _a.label = 5;
                case 5:
                    console.log("[".concat(type, "] Human moved successfully."));
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    e_1 = _a.sent();
                    console.log("[".concat(type, "] Human move failed: ").concat(e_1.message));
                    return [3 /*break*/, 8];
                case 8:
                    // Now check AI
                    if (type === "SEQUENCE") {
                        isAITurn = state.currentTurn === state.players["AI_PLAYER"];
                    }
                    else {
                        isAITurn = state.turnOrder[state.currentTurnIndex] === "AI_PLAYER";
                    }
                    if (!isAITurn) return [3 /*break*/, 15];
                    console.log("[".concat(type, "] It is AI's turn. Generating move..."));
                    _a.label = 9;
                case 9:
                    _a.trys.push([9, 13, , 14]);
                    aiAction = (0, AI_1.generateAIMove)(type, state, "AI_PLAYER", "HARD");
                    if (!aiAction) return [3 /*break*/, 11];
                    console.log("[".concat(type, "] AI generated action:"), JSON.stringify(aiAction));
                    return [4 /*yield*/, gm.makeMove(roomId, aiAction)];
                case 10:
                    state = _a.sent();
                    console.log("[".concat(type, "] AI move applied successfully."));
                    return [3 /*break*/, 12];
                case 11:
                    console.log("[".concat(type, "] AI generated NO action! (Returned null)"));
                    _a.label = 12;
                case 12: return [3 /*break*/, 14];
                case 13:
                    e_2 = _a.sent();
                    console.log("[".concat(type, "] AI move generation/execution failed: ").concat(e_2.message));
                    return [3 /*break*/, 14];
                case 14: return [3 /*break*/, 16];
                case 15:
                    console.log("[".concat(type, "] It is NOT AI's turn after human move!"));
                    _a.label = 16;
                case 16: return [2 /*return*/];
            }
        });
    });
}
function runAll() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, testGame("SEQUENCE")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, testGame("SPLENDOR")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, testGame("CARCASSONNE")];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, testGame("AZUL")];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
runAll().catch(console.error);
