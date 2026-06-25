import { GameManager } from "./lib/GameManager";
import { generateAIMove } from "./lib/games/AI";

async function testGame(type: "SEQUENCE" | "SPLENDOR" | "CARCASSONNE" | "AZUL") {
    console.log(`\n--- Testing ${type} ---`);
    const gm = new GameManager();
    const roomId = `TEST_${type}`;
    const host = "player1";
    
    // Create game
    await gm.createGame(roomId, type, host, true, "HARD");
    const gameInstance = gm.getGameInstance(roomId);
    if (!gameInstance) {
        console.error(`Failed to create ${type}`);
        return;
    }
    
    let state = gameInstance.state;
    
    // Check if AI is current turn initially (should not be for any game, but let's check)
    let isAITurn = false;
    if (type === "SEQUENCE") {
        isAITurn = state.currentTurn === state.players["AI_PLAYER"];
    } else {
        isAITurn = state.turnOrder[state.currentTurnIndex] === "AI_PLAYER";
    }

    if (isAITurn) {
        console.log(`[${type}] AI is unexpectedly first to play.`);
    }

    try {
        // Force human to play a move
        console.log(`[${type}] Simulating human move...`);
        let humanAction: any = null;
        if (type === "SEQUENCE") {
            const hand = state.hands[host];
            if (hand && hand.length > 0) {
                // Find a valid spot for the first card
                const card = hand[0];
                const boardLayout = [
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
                let played = false;
                for (let y = 0; y < 10; y++) {
                    for (let x = 0; x < 10; x++) {
                        if (boardLayout[y][x] === card && state.board[y][x] === null) {
                            humanAction = { type: "PLAY_CARD", payload: { playerId: host, card, x, y } };
                            played = true;
                            break;
                        }
                    }
                    if (played) break;
                }
                if (!played) {
                    console.log("[SEQUENCE] Could not find a spot for", card);
                }
            }
        } else if (type === "SPLENDOR") {
            // Take 3 different gems
            humanAction = { type: "TAKE_TOKENS", playerId: host, tokens: ["WHITE", "BLUE", "GREEN"] };
        } else if (type === "CARCASSONNE") {
            // Place tile and skip meeple
            humanAction = { type: "PLACE_TILE", payload: { playerId: host, x: 0, y: 1, rotation: 0 } };
            // Note: In Carcassonne, we might need a valid placement. If invalid, the move will throw.
        } else if (type === "AZUL") {
            // Take from factory 0 to pattern line 0
            humanAction = { type: "DRAFT_TILES", payload: { username: host, source: "FACTORY", factoryIndex: 0, color: state.factories[0][0], patternLineIndex: 0 } };
        }
        
        if (humanAction) {
            state = await gm.makeMove(roomId, humanAction);
            if (type === "CARCASSONNE") {
                // Also skip meeple
                state = await gm.makeMove(roomId, { type: "SKIP_MEEPLE", playerId: host });
            }
            console.log(`[${type}] Human moved successfully.`);
        }
    } catch (e: any) {
        console.log(`[${type}] Human move failed: ${e.message}`);
    }
    
    // Now check AI
    if (type === "SEQUENCE") {
        isAITurn = state.currentTurn === state.players["AI_PLAYER"];
    } else {
        isAITurn = state.turnOrder[state.currentTurnIndex] === "AI_PLAYER";
    }
    
    if (isAITurn) {
        console.log(`[${type}] It is AI's turn. Generating move...`);
        try {
            const aiAction = generateAIMove(type, state, "AI_PLAYER", "HARD");
            if (aiAction) {
                console.log(`[${type}] AI generated action:`, JSON.stringify(aiAction));
                state = await gm.makeMove(roomId, aiAction);
                console.log(`[${type}] AI move applied successfully.`);
            } else {
                console.log(`[${type}] AI generated NO action! (Returned null)`);
            }
        } catch (e: any) {
            console.log(`[${type}] AI move generation/execution failed: ${e.message}`);
        }
    } else {
        console.log(`[${type}] It is NOT AI's turn after human move!`);
    }
}

async function runAll() {
    await testGame("SEQUENCE");
    await testGame("SPLENDOR");
    await testGame("CARCASSONNE");
    await testGame("AZUL");
}

runAll().catch(console.error);
