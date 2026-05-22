"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import Lobby from "@/components/Lobby";
import GameRoom from "@/components/GameRoom";
import Chat from "@/components/Chat";
import InteractiveBackground from "@/components/InteractiveBackground";

let socket: any;

export default function Home() {
    const [username, setUsername] = useState("");
    const [connected, setConnected] = useState(false);
    const [inLobby, setInLobby] = useState(false);
    const [roomId, setRoomId] = useState("");

    const handleEnter = () => {
        if (username) {
            socketInitializer().then(() => {
                setInLobby(true);
                setConnected(true);
            });
        }
    };

    const socketInitializer = async () => {
        // Determine URL based on environment, typically relative for same-origin
        socket = io();

        socket.on("connect", () => {
            console.log("Connected");
            socket.emit("join_lobby", username);
        });
    };

    const handleJoinGame = (id: string) => {
        socket.emit("join_room", { roomId: id, username }, (response: any) => {
            if (response && response.success !== false) {
                setRoomId(id);
            } else {
                alert(response?.error || "Failed to join room");
            }
        });
        // Optimistic update for create_room where callback provides roomId directly
        if (id && !roomId) setRoomId(id);
    };

    const handleLeaveGame = () => {
        setRoomId("");
        socket.emit("join_lobby", username);
    };

    if (roomId) {
        return <GameRoom socket={socket} username={username} roomId={roomId} onLeave={handleLeaveGame} />;
    }

    if (inLobby) {
        return (
            <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#080b11] via-[#121824] to-[#1a1128] animate-gradient relative">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                <InteractiveBackground />

                <div className="flex-1 flex flex-col items-center overflow-y-auto relative z-10 pt-16 md:pt-24 pb-12 px-4 scroll-smooth">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] drop-shadow-[0_2px_8px_rgba(155,81,224,0.3)] tracking-tight mb-2">Game Lounge</h1>
                    <p className="text-gray-300/80 mb-10 text-lg font-medium tracking-wide">Select a game to start playing or join a room.</p>
                    <Lobby socket={socket} username={username} onJoinGame={handleJoinGame} />
                </div>

                {/* Chat Panel */}
                <div className="hidden lg:block w-80 border-l border-white/10 bg-black/40 backdrop-blur-xl relative z-10 shadow-2xl">
                    <Chat socket={socket} username={username} room="lobby" />
                </div>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24 bg-gradient-to-br from-[#080b11] via-[#121824] to-[#1a1128] animate-gradient relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
            <InteractiveBackground />
            
            <div className="relative z-10 flex flex-col items-center w-full">
                <h1 className="text-6xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] drop-shadow-[0_2px_8px_rgba(155,81,224,0.3)] animate-pulse text-center">Game Night</h1>
                <p className="text-gray-400 mb-12 text-lg text-center">Private, cozy, and high-fidelity board games.</p>

                <div className="bg-warm-black/60 p-8 rounded-xl shadow-2xl border border-white/10 w-full max-w-md backdrop-blur-md">
                    <label className="block text-sm font-medium mb-3 text-gray-300 uppercase tracking-widest">Enter Your Name</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleEnter()}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-white mb-6 focus:outline-none focus:border-indigo-500/50 transition-colors text-lg"
                        placeholder="e.g. Player One"
                    />
                    <button
                        onClick={handleEnter}
                        disabled={!username}
                        className="w-full bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] text-white font-bold py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        Enter Lobby
                    </button>
                </div>
            </div>
        </main>
    );
}
