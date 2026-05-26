"use client";

import { useState } from "react";

export default function Lobby({ socket, username, onJoinGame }: { socket: any, username: string, onJoinGame: (roomId: string) => void }) {
    const [roomId, setRoomId] = useState("");
    const [playVsAi, setPlayVsAi] = useState(false);

    const createGame = (type: string, isSinglePlayer?: boolean) => {
        socket.emit("create_room", { type, username, isSinglePlayer }, ({ roomId }: { roomId: string }) => {
            onJoinGame(roomId);
        });
    };

    const joinGame = () => {
        if (roomId) {
            onJoinGame(roomId);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-5xl p-2 sm:p-4 md:p-8 animate-fade-in">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full">
                {/* Create Game */}
                <div className="lg:col-span-2 bg-black/40 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 hover:border-indigo-500/30 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                        <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">Start New Game</h3>
                        
                        {/* Mode Selector Pill Toggle */}
                        <div className="flex bg-black/45 p-1 rounded-xl border border-white/10 self-start sm:self-auto shadow-inner">
                            <button
                                onClick={() => setPlayVsAi(false)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                                    !playVsAi
                                        ? "bg-white/10 text-white shadow-md"
                                        : "text-gray-400 hover:text-white"
                                }`}
                            >
                                👥 Friends
                            </button>
                            <button
                                onClick={() => setPlayVsAi(true)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                                    playVsAi
                                        ? "bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] text-white shadow-md font-bold"
                                        : "text-gray-400 hover:text-white"
                                }`}
                            >
                                🤖 vs AI
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* Sequence */}
                        <div className="bg-gradient-to-br from-blue-950/40 to-blue-900/40 p-4 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-white text-base sm:text-lg">Sequence</span>
                                    <span className="text-xl">🃏</span>
                                </div>
                                <p className="text-blue-200/60 text-xs sm:text-sm">Connect 5 chips in a row using strategy and card plays.</p>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={() => createGame("SEQUENCE", playVsAi)}
                                    className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center gap-2 ${
                                        playVsAi
                                            ? "bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] hover:opacity-90 text-white"
                                            : "bg-blue-600/80 hover:bg-blue-500 border border-blue-400/20 text-white"
                                    }`}
                                >
                                    {playVsAi ? "🤖 Play vs AI" : "👥 Play with Friends"}
                                </button>
                            </div>
                        </div>

                        {/* Splendor */}
                        <div className="bg-gradient-to-br from-emerald-950/40 to-emerald-900/40 p-4 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-white text-base sm:text-lg">Splendor</span>
                                    <span className="text-xl">💎</span>
                                </div>
                                <p className="text-emerald-200/60 text-xs sm:text-sm">Collect gems, buy developments, and attract nobles.</p>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={() => createGame("SPLENDOR", playVsAi)}
                                    className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center gap-2 ${
                                        playVsAi
                                            ? "bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] hover:opacity-90 text-white"
                                            : "bg-emerald-600/80 hover:bg-emerald-500 border border-emerald-400/20 text-white"
                                    }`}
                                >
                                    {playVsAi ? "🤖 Play vs AI" : "👥 Play with Friends"}
                                </button>
                            </div>
                        </div>

                        {/* Carcassonne */}
                        <div className="bg-gradient-to-br from-stone-900/60 to-stone-850/60 p-4 rounded-xl border border-stone-700/30 hover:border-stone-600/50 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-white text-base sm:text-lg">Carcassonne</span>
                                    <span className="text-xl">🏰</span>
                                </div>
                                <p className="text-stone-300/60 text-xs sm:text-sm">Build landscapes with tiles and place meeples on features.</p>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={() => createGame("CARCASSONNE", playVsAi)}
                                    className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center gap-2 ${
                                        playVsAi
                                            ? "bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] hover:opacity-90 text-white"
                                            : "bg-stone-600/80 hover:bg-stone-500 border border-stone-500/20 text-white"
                                    }`}
                                >
                                    {playVsAi ? "🤖 Play vs AI" : "👥 Play with Friends"}
                                </button>
                            </div>
                        </div>

                        {/* Azul */}
                        <div className="bg-gradient-to-br from-cyan-950/40 to-cyan-900/40 p-4 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-white text-base sm:text-lg">Azul</span>
                                    <span className="text-xl">🟦</span>
                                </div>
                                <p className="text-cyan-200/60 text-xs sm:text-sm">Draft tiles to decorate your palace walls for points.</p>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={() => createGame("AZUL", playVsAi)}
                                    className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center gap-2 ${
                                        playVsAi
                                            ? "bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] hover:opacity-90 text-white"
                                            : "bg-cyan-600/80 hover:bg-cyan-500 border border-cyan-400/20 text-white"
                                    }`}
                                >
                                    {playVsAi ? "🤖 Play vs AI" : "👥 Play with Friends"}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Join Game */}
                <div className="bg-black/40 backdrop-blur-xl p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 hover:border-indigo-500/30 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col justify-between gap-6">
                    <div>
                        <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-6 text-white tracking-wide">Join Existing Game</h3>
                        <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-8">Have a room code from a friend? Enter it below to join their table instantly.</p>
                    </div>

                    <div className="flex flex-col space-y-3 sm:space-y-4">
                        <input
                            type="text"
                            placeholder="Enter Room Code"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && joinGame()}
                            className="bg-black/50 border-2 border-white/10 rounded-xl p-3 sm:p-4 text-white focus:outline-none focus:border-indigo-500/50 text-center tracking-widest text-base sm:text-lg uppercase transition-colors shadow-inner"
                        />
                        <button
                            onClick={joinGame}
                            disabled={!roomId}
                            className="w-full bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] text-white font-bold py-3 sm:py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg shadow-lg"
                        >
                            Join Room
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
