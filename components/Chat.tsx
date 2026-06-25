"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
    id?: string;
    username: string;
    message: string;
    timestamp: string;
    reactions?: Record<string, string[]>; // reaction emoji -> array of usernames
}

interface FloatingEmoji {
    id: string;
    emoji: string;
    left: number;
}

const EMOJI_LIST = [
    "😀", "😂", "🥰", "😎", "🤔", "😮", "😴",
    "👍", "👎", "👋", "🎉", "🔥", "❤️", "💔",
    "👀", "🎱", "🎲", "🎯", "🏆"
];

const BANTER_EMOJIS = ["🎯", "😂", "🔥", "💥", "👑", "🔔"];

// Sound synthesis using Web Audio API
const playSynthSound = (type: "send" | "receive" | "react" | "float" | "buzz", isMuted: boolean) => {
    if (isMuted) return;
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (type === "receive") {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
            
            gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === "send") {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(500, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(250, audioCtx.currentTime + 0.12);
            
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.12);
        } else if (type === "react") {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = "triangle";
            osc.frequency.setValueAtTime(700, audioCtx.currentTime);
            
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.08);
        } else if (type === "float") {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(280, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.22);
            
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.22);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.22);
        } else if (type === "buzz") {
            // Retro chime chord (Buzz!)
            const now = audioCtx.currentTime;
            [523.25, 659.25, 783.99].forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                
                gain.gain.setValueAtTime(0.08, now + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.06 + 0.25);
                
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.25);
            });
        }
    } catch (e) {
        console.error("Audio Context initialization failed or was blocked by browser policy.", e);
    }
};

export default function Chat({ socket, username, room, onClose }: { socket: any, username: string, room: string, onClose?: () => void }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [muted, setMuted] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
    
    const endRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<any>(null);
    const isTypingLocalRef = useRef(false);
    const mutedRef = useRef(muted);

    // Keep mutedRef updated to prevent stale socket closures
    useEffect(() => {
        mutedRef.current = muted;
    }, [muted]);

    useEffect(() => {
        if (!socket) return;

        socket.on("receive_message", (msg: Message) => {
            setMessages((prev) => [...prev, msg]);
            if (msg.username !== username) {
                playSynthSound("receive", mutedRef.current);
            }
        });

        socket.on("system_message", (text: string) => {
            setMessages((prev) => [...prev, { id: Math.random().toString(36).substring(7), username: "System", message: text, timestamp: new Date().toISOString() }]);
        });

        socket.on("typing_update", ({ username: typingUser, isTyping }: { username: string, isTyping: boolean }) => {
            setTypingUsers((prev) => {
                if (isTyping) {
                    if (prev.includes(typingUser)) return prev;
                    return [...prev, typingUser];
                } else {
                    return prev.filter((u) => u !== typingUser);
                }
            });
        });

        socket.on("message_reaction_update", ({ messageId, reaction, username: reactingUser }: { messageId: string, reaction: string, username: string }) => {
            setMessages((prev) =>
                prev.map((msg) => {
                    if (msg.id !== messageId) return msg;
                    const reactionsCopy = { ...(msg.reactions || {}) };
                    const users = reactionsCopy[reaction] || [];
                    if (users.includes(reactingUser)) {
                        reactionsCopy[reaction] = users.filter((u) => u !== reactingUser);
                        if (reactionsCopy[reaction].length === 0) {
                            delete reactionsCopy[reaction];
                        }
                    } else {
                        reactionsCopy[reaction] = [...users, reactingUser];
                    }
                    return { ...msg, reactions: reactionsCopy };
                })
            );
            playSynthSound("react", mutedRef.current);
        });

        socket.on("buzz_reaction_update", ({ emoji, username: sender }: { emoji: string, username: string }) => {
            // Trigger floating emoji animation
            const id = Math.random().toString(36).substring(7);
            const left = 15 + Math.random() * 70; // Float between 15% and 85% width
            setFloatingEmojis((prev) => [...prev, { id, emoji, left }]);
            setTimeout(() => {
                setFloatingEmojis((prev) => prev.filter((f) => f.id !== id));
            }, 2500);

            // Play float or buzz sound depending on emoji
            if (emoji === "🔔") {
                playSynthSound("buzz", mutedRef.current);
            } else {
                playSynthSound("float", mutedRef.current);
            }
        });

        return () => {
            socket.off("receive_message");
            socket.off("system_message");
            socket.off("typing_update");
            socket.off("message_reaction_update");
            socket.off("buzz_reaction_update");
        };
    }, [socket, username]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typingUsers]);

    const sendMessage = (e?: React.FormEvent | React.KeyboardEvent) => {
        e?.preventDefault();
        if (input.trim() && socket) {
            socket.emit("send_message", { room, message: input, username });
            setInput("");
            setShowEmojiPicker(false);
            
            // Stop typing immediately
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            socket.emit("typing", { room, username, isTyping: false });
            isTypingLocalRef.current = false;
            
            playSynthSound("send", mutedRef.current);
        }
    };

    const handleInputChange = (val: string) => {
        setInput(val);
        if (!socket) return;
        
        if (!isTypingLocalRef.current) {
            isTypingLocalRef.current = true;
            socket.emit("typing", { room, username, isTyping: true });
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            isTypingLocalRef.current = false;
            socket.emit("typing", { room, username, isTyping: false });
        }, 1500);
    };

    const addEmoji = (emoji: string) => {
        setInput((prev) => prev + emoji);
    };

    const handleBanterEmoji = (emoji: string) => {
        if (socket) {
            socket.emit("buzz_reaction", { room, emoji, username });
        }
    };

    const handleAddReaction = (messageId: string, emoji: string) => {
        if (socket) {
            socket.emit("message_reaction", { room, messageId, reaction: emoji, username });
        }
    };

    return (
        <div className="flex flex-col h-full bg-warm-black border-l border-white/10 w-full font-sans shadow-2xl relative">
            {/* Scoped CSS animations for floating emojis and chat bounce */}
            <style>{`
                @keyframes float-up {
                    0% {
                        transform: translateY(0) scale(0.6) rotate(0deg);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                        transform: translateY(-20px) scale(1.2) rotate(-5deg);
                    }
                    50% {
                        transform: translateY(-120px) scale(1) rotate(5deg);
                    }
                    100% {
                        transform: translateY(-340px) scale(0.7) rotate(15deg);
                        opacity: 0;
                    }
                }
                .animate-float-up {
                    animation: float-up 2.5s ease-out forwards;
                }
                @keyframes chat-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-chat-bounce {
                    animation: chat-bounce 0.6s infinite ease-in-out;
                }
            `}</style>

            {/* Floating Emojis Layer */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                {floatingEmojis.map((f) => (
                    <div
                        key={f.id}
                        className="absolute bottom-24 text-4xl animate-float-up opacity-0"
                        style={{ left: `${f.left}%` }}
                    >
                        {f.emoji}
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                    Live Chat
                </h2>
                <div className="flex items-center space-x-2 shrink-0">
                    <button
                        onClick={() => setMuted(!muted)}
                        className="p-1 text-gray-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 border border-white/10 rounded-md flex items-center justify-center"
                        title={muted ? "Unmute Chat Sounds" : "Mute Chat Sounds"}
                    >
                        {muted ? (
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6L4.5 9H1.5v6h3l4.5 3.75V5.25z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            </svg>
                        )}
                    </button>
                    {onClose ? (
                        <button 
                            onClick={onClose} 
                            className="p-1 text-gray-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-md flex items-center justify-center shrink-0"
                            title="Close Chat"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    ) : (
                        <span className="text-[10px] text-gray-500">Room: {room}</span>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 relative">
                {messages.length === 0 && (
                    <div className="text-center text-gray-600 text-xs italic mt-10">
                        No messages yet. Say hi! 👋
                    </div>
                )}

                {messages.map((msg, i) => {
                    const isMe = msg.username === username;
                    const isSystem = msg.username === "System";

                    if (isSystem) {
                        return (
                            <div key={i} className="flex justify-center my-2">
                                <span className="bg-white/5 border border-white/5 text-gray-400 text-[10px] px-3 py-1 rounded-full uppercase tracking-wide">
                                    {msg.message}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"} group relative mb-2`}>
                            {/* Hover Reaction Panel */}
                            {msg.id && (
                                <div className={`absolute -top-7 ${isMe ? "right-10" : "left-10"} hidden group-hover:flex items-center space-x-1 bg-gray-900 border border-white/20 px-2 py-0.5 rounded-full shadow-lg z-25`}>
                                    {["👍", "😂", "🔥", "😮"].map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => handleAddReaction(msg.id!, emoji)}
                                            className="text-xs hover:scale-130 transition-transform duration-100 p-0.5"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Avatar (Opponent) */}
                            {!isMe && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-black shrink-0 mr-2 -mt-1 text-white">
                                    {msg.username[0].toUpperCase()}
                                </div>
                            )}

                            <div className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                {/* Username (Only show if not me) */}
                                {!isMe && <span className="text-[10px] text-gray-500 mb-1 ml-1">{msg.username}</span>}

                                {/* Bubble */}
                                <div className={`relative px-3 py-2 text-sm shadow-md rounded-2xl ${isMe
                                    ? "bg-gradient-to-br from-[#9b51e0] to-[#ff88a5] text-white rounded-tr-sm"
                                    : "bg-white/10 text-gray-100 border border-white/5 rounded-tl-sm"
                                    }`}>
                                    {msg.message}
                                </div>

                                {/* Rendered Reactions */}
                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                                        {Object.entries(msg.reactions).map(([emoji, users]) => {
                                            const hasReacted = users.includes(username);
                                            return (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleAddReaction(msg.id!, emoji)}
                                                    className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[9px] border transition-all ${
                                                        hasReacted 
                                                            ? "bg-indigo-500/25 border-indigo-400/40 text-indigo-300 font-bold" 
                                                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                                    }`}
                                                    title={users.join(", ")}
                                                >
                                                    <span>{emoji}</span>
                                                    <span>{users.length}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                <span className="text-[8px] text-gray-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Avatar (Me) */}
                            {isMe && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-900 to-red-600 flex items-center justify-center text-xs font-bold ring-2 ring-black shrink-0 ml-2 -mt-1 text-white border border-red-400/50">
                                    {username[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Bouncing Typing Indicator */}
                {typingUsers.length > 0 && (
                    <div className="flex items-center group relative mb-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold ring-2 ring-black shrink-0 mr-2 -mt-1 text-gray-400">
                            💬
                        </div>
                        <div className="flex flex-col items-start max-w-[70%]">
                            <div className="relative px-3 py-2 text-xs text-gray-400 bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-inner">
                                <span className="font-semibold text-gray-300">{typingUsers.join(", ")}</span> is typing
                                <div className="flex space-x-1 items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-chat-bounce" style={{ animationDelay: "0ms" }}></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-chat-bounce" style={{ animationDelay: "150ms" }}></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-chat-bounce" style={{ animationDelay: "300ms" }}></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-black/20 relative shrink-0">
                {/* Emoji Popover */}
                {showEmojiPicker && (
                    <div className="absolute bottom-32 right-4 bg-gray-900 border border-white/20 rounded-xl shadow-2xl p-3 w-64 grid grid-cols-6 gap-2 animate-fade-in z-50">
                        {EMOJI_LIST.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => addEmoji(emoji)}
                                className="text-xl hover:bg-white/10 rounded p-1 transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}

                {/* Quick Banter / Sound Buzz Row */}
                <div className="flex items-center justify-between px-1 mb-2 bg-black/30 border border-white/5 rounded-lg py-1">
                    <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider ml-1">Send Banter:</span>
                    <div className="flex gap-1.5">
                        {BANTER_EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => handleBanterEmoji(emoji)}
                                className="hover:scale-125 hover:-translate-y-0.5 active:scale-95 text-sm transition-all duration-150 p-0.5 rounded"
                                title={emoji === "🔔" ? "Buzz Opponent!" : `Float ${emoji}`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={sendMessage} className="flex items-center gap-2">
                    {/* Emoji Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-2 rounded-full transition-colors ${showEmojiPicker ? "text-pink-400 bg-white/10" : "text-gray-400 hover:text-white"}`}
                    >
                        😀
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                sendMessage(e);
                            }
                        }}
                        placeholder="Type..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-[#9b51e0]/50 transition-all placeholder:text-gray-600"
                    />

                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="p-2 rounded-full bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all font-bold shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
