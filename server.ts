import express from "express";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { GameManager } from "./lib/GameManager";
import { generateAIMove } from "./lib/games/AI";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();
    const httpServer = createServer(server);
    const io = new Server(httpServer);

    const gameManager = new GameManager();

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });

        // Lobby & Chat Events
        socket.on("join_lobby", (username) => {
            console.log(`${username} joined lobby`);
            socket.join("lobby");
            io.to("lobby").emit("system_message", `${username} has entered the lounge.`);
        });

        socket.on("send_message", ({ room, message, username }) => {
            io.to(room).emit("receive_message", { username, message, timestamp: new Date() });
        });

        socket.on("create_room", async ({ username, type, isSinglePlayer }: { username: string, type: "SEQUENCE" | "SPLENDOR" | "CARCASSONNE" | "AZUL", isSinglePlayer?: boolean }, callback) => {
            const roomId = Math.random().toString(36).substring(7).toUpperCase(); // Still generated client-side essentially, or here.
            // In GameManager, we are now using this ID to query DB.
            // Ideally we create in DB and get ID back, but for now we pass IT in.

            socket.join(roomId);
            console.log(`Room ${roomId} created for ${type} (Singleplayer: ${isSinglePlayer})`);

            // Initialize Game
            if (["SEQUENCE", "SPLENDOR", "CARCASSONNE", "AZUL"].includes(type)) {
                try {
                    await gameManager.createGame(roomId, type, username, isSinglePlayer);
                    if (callback) callback({ roomId });
                } catch (e) {
                    console.error("Create Game Error:", e);
                    if (callback) callback({ error: "Failed to create game" });
                }
            }
        });

        socket.on("join_room", async ({ roomId, username }, callback) => {
            try {
                // Check if game exists first? joinGame checks internally.
                const state = await gameManager.joinGame(roomId, username);

                if (state) {
                    socket.join(roomId);
                    // Broadcast update
                    io.to(roomId).emit("game_state_update", state);
                    io.to(roomId).emit("system_message", `${username} joined the game.`);

                    console.log(`${username} joined room ${roomId}`);
                    if (callback) callback({ success: true });
                } else {
                    if (callback) callback({ success: false, error: "Room not found or full" });
                }
            } catch (e) {
                console.error("Join Error:", e);
                if (callback) callback({ success: false, error: "Join failed" });
            }
        });

        const handleAITurns = async (roomId: string) => {
            const gameInstance = gameManager.getGameInstance(roomId);
            if (!gameInstance || !gameInstance.players.includes("AI_PLAYER")) return;

            let state = gameInstance.state;
            if (state.winner) return;

            // Determine if it is AI's turn
            let isAITurn = false;
            if (gameInstance.type === "SEQUENCE") {
                const aiTeam = state.players["AI_PLAYER"];
                const isCurrentTurn = state.currentTurn === aiTeam;
                const isPendingAction = state.pendingAction?.playerId === "AI_PLAYER";
                isAITurn = (isCurrentTurn || isPendingAction) && !state.winner;
            } else {
                const currentTurnPlayer = state.turnOrder[state.currentTurnIndex];
                isAITurn = currentTurnPlayer === "AI_PLAYER" && !state.winner;
            }

            if (isAITurn) {
                setTimeout(async () => {
                    try {
                        // Re-fetch in case state changed during timeout
                        const freshInstance = gameManager.getGameInstance(roomId);
                        if (!freshInstance) return;

                        const aiAction = generateAIMove(freshInstance.type, freshInstance.state, "AI_PLAYER");
                        if (aiAction) {
                            console.log(`AI Move in ${roomId}:`, aiAction);

                            // For Carcassonne, handle rotation moves first
                            if (freshInstance.type === "CARCASSONNE" && aiAction.type === "PLACE_TILE" && aiAction.payload?.rotation !== undefined) {
                                const targetRot = aiAction.payload.rotation;
                                let currentRot = freshInstance.state.currentTileRotation;
                                while (currentRot !== targetRot) {
                                    await gameManager.makeMove(roomId, { type: "ROTATE_TILE", playerId: "AI_PLAYER" });
                                    const nextInstance = gameManager.getGameInstance(roomId);
                                    currentRot = nextInstance ? nextInstance.state.currentTileRotation : targetRot;
                                }
                            }

                            const newState = await gameManager.makeMove(roomId, aiAction);
                            io.to(roomId).emit("game_state_update", newState);

                            // Trigger again in case AI has consecutive actions
                            handleAITurns(roomId);
                        }
                    } catch (e: any) {
                        console.error("AI turn error:", e.message);
                    }
                }, 800);
            }
        };

        socket.on("make_move", async ({ roomId, action }) => {
            try {
                console.log("Move in", roomId, action);
                const newState = await gameManager.makeMove(roomId, action);
                io.to(roomId).emit("game_state_update", newState);

                // Check and run AI turns
                handleAITurns(roomId);
            } catch (e: any) {
                console.error("Move error:", e.message);
                socket.emit("error", e.message);
            }
        });
    });

    server.all("*", (req, res) => {
        const parsedUrl = parse(req.url!, true);
        return handle(req, res, parsedUrl);
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
