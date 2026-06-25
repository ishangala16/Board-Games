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
    const [playerCount, setPlayerCount] = useState(0);
    const [playerLocations, setPlayerLocations] = useState<Record<string, number>>({});
    const [gameState, setGameState] = useState<any>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [totalGamesPlayed, setTotalGamesPlayed] = useState(0);
    const [socketInstance, setSocketInstance] = useState<any>(null);

    useEffect(() => {
        if (!socketInstance) return;
        const handleMessage = (msg: any) => {
            if (msg.username !== username && !isChatOpen) {
                setUnreadMessages(prev => prev + 1);
            }
        };
        socketInstance.on("receive_message", handleMessage);
        return () => {
            socketInstance.off("receive_message", handleMessage);
        };
    }, [socketInstance, username, isChatOpen]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const roomParam = params.get("room");
            if (roomParam) {
                setRoomId(roomParam.toUpperCase());
            }

            const storedUsername = localStorage.getItem("board_game_username");
            if (storedUsername) {
                setUsername(storedUsername);
            }
        }
    }, []);

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            const params = new URLSearchParams(window.location.search);
            const roomParam = params.get("room");
            
            if (roomParam) {
                const upperRoom = roomParam.toUpperCase();
                setRoomId(upperRoom);
                if (connected && socket && username) {
                    socket.emit("join_room", { roomId: upperRoom, username }, (response: any) => {
                        if (response && response.success === false) {
                            alert(response?.error || "Failed to join room");
                            setRoomId("");
                            setGameState(null);
                            const url = new URL(window.location.href);
                            url.searchParams.delete("room");
                            window.history.replaceState({}, "", url.toString());
                        }
                    });
                }
            } else {
                if (roomId) {
                    setRoomId("");
                    setGameState(null);
                    if (connected && socket) {
                        socket.emit("join_lobby", username);
                    }
                }
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [roomId, connected, socket, username]);

    const handleEnter = () => {
        if (username) {
            if (typeof window !== "undefined") {
                localStorage.setItem("board_game_username", username);
            }
            socketInitializer().then(() => {
                setInLobby(true);
                setConnected(true);
                if (roomId) {
                    handleJoinGame(roomId);
                }
            });
        }
    };

    const socketInitializer = async () => {
        // Determine URL based on environment, typically relative for same-origin
        socket = io();
        setSocketInstance(socket);

        socket.on("connect", () => {
            console.log("Connected");
            socket.emit("join_lobby", username);
        });

        socket.on("concurrent_players_update", (stats: any) => {
            if (typeof stats === "number") {
                setPlayerCount(stats);
                setPlayerLocations({});
            } else if (stats && typeof stats === "object") {
                setPlayerCount(stats.total || 0);
                setPlayerLocations(stats.locations || {});
                if (stats.totalGames !== undefined) {
                    setTotalGamesPlayed(stats.totalGames);
                }
            }
        });

        socket.on("game_state_update", (state: any) => {
            console.log("Game State Update (Lounge):", state);
            setGameState(state);
        });
    };

    const updateRoomUrl = (id: string) => {
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            if (url.searchParams.get("room") !== id) {
                url.searchParams.set("room", id);
                window.history.pushState({ room: id }, "", url.toString());
            }
        }
    };

    const handleJoinGame = (id: string) => {
        const upperId = id.toUpperCase();
        socket.emit("join_room", { roomId: upperId, username }, (response: any) => {
            if (response && response.success !== false) {
                setRoomId(upperId);
                updateRoomUrl(upperId);
            } else {
                alert(response?.error || "Failed to join room");
            }
        });
        // Optimistic update for create_room where callback provides roomId directly
        if (upperId && !roomId) {
            setRoomId(upperId);
            updateRoomUrl(upperId);
        }
    };

    const handleLeaveGame = () => {
        setRoomId("");
        setGameState(null);
        socket.emit("join_lobby", username);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            if (url.searchParams.has("room")) {
                url.searchParams.delete("room");
                window.history.replaceState({}, "", url.toString());
            }
        }
    };

    if (roomId && connected && socket) {
        return <GameRoom socket={socket} username={username} roomId={roomId} onLeave={handleLeaveGame} gameState={gameState} setGameState={setGameState} />;
    }

    if (inLobby) {
        return (
            <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#080b11] via-[#121824] to-[#1a1128] animate-gradient relative">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                <InteractiveBackground />

                <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto relative z-10 pt-8 pb-4 px-4 scroll-smooth">
                    {/* Top Left User Greeting */}
                    <div className="absolute top-4 left-4 flex items-center space-x-1.5 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-semibold text-gray-300 shadow-md backdrop-blur-md">
                        <span>Welcome back,</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4b90ff] to-[#9b51e0] font-bold">
                            {username}
                        </span>
                        <span>!</span>
                    </div>

                    {/* Top Right Stats */}
                    <div className="absolute top-4 right-4 flex items-center space-x-3 z-50">
                        {/* Games Played Pill */}
                        {totalGamesPlayed > 0 && (
                            <div className="flex items-center space-x-2 bg-[#9b51e0]/10 border border-[#9b51e0]/20 px-4 py-1.5 rounded-full text-xs font-semibold text-[#c084fc] shadow-[0_0_15px_rgba(155,81,224,0.15)] backdrop-blur-md cursor-default transition-colors hover:bg-[#9b51e0]/20 hover:border-[#9b51e0]/40">
                                <span>🎲</span>
                                <span>{totalGamesPlayed.toLocaleString()} games played</span>
                            </div>
                        )}

                        {/* Online Counter */}
                        <div className="group relative">
                            <div className="flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full text-xs font-semibold text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)] backdrop-blur-md cursor-help transition-colors hover:bg-indigo-500/20 hover:border-indigo-500/40">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span>{playerCount} player{playerCount !== 1 ? "s" : ""} online</span>
                            </div>
                            
                            {/* Hover Tooltip for Locations */}
                            {Object.keys(playerLocations).length > 0 && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300 pointer-events-none overflow-hidden z-[100]">
                                    <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-4 py-2 border-b border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Global Network</span>
                                        <div className="flex space-x-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="p-2 flex flex-col gap-1 max-h-56 overflow-y-auto custom-scrollbar">
                                        {Object.entries(playerLocations).sort((a,b) => b[1] - a[1]).map(([loc, count]) => (
                                            <div key={loc} className="flex justify-between items-center px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                                                <span className="text-xs font-medium text-gray-300 flex items-center gap-2">
                                                    <span className="text-[11px] opacity-80">📍</span> {loc}
                                                </span>
                                                <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] drop-shadow-[0_2px_8px_rgba(155,81,224,0.3)] tracking-tight mb-2">Game Lounge</h1>
                    <p className="text-gray-300/80 mb-6 text-lg font-medium tracking-wide">Select a game to start playing or join a room.</p>
                    <Lobby socket={socket} username={username} onJoinGame={handleJoinGame} />
                </div>

                {/* Floating Chat Button */}
                <button 
                    onClick={() => {
                        setIsChatOpen(!isChatOpen);
                        setUnreadMessages(0);
                    }}
                    className={`fixed bottom-6 right-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 z-[60] group ${isChatOpen ? "opacity-0 translate-y-10 pointer-events-none" : "opacity-100 translate-y-0"}`}
                    title="Live Lounge Chat"
                >
                    <span className="text-2xl group-hover:animate-bounce block">💬</span>
                    {unreadMessages > 0 && (
                        <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#121824] animate-pulse shadow-lg">
                            {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                    )}
                </button>

                {/* Sliding Chat Panel */}
                <div className={`fixed right-0 top-0 h-screen w-80 lg:w-96 border-l border-white/10 bg-black/80 backdrop-blur-3xl z-50 shadow-[rgba(0,0,0,0.5)_-20px_0_40px_0px] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isChatOpen ? "translate-x-0" : "translate-x-full"}`}>
                    <Chat socket={socket} username={username} room="lobby" onClose={() => setIsChatOpen(false)} />
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
