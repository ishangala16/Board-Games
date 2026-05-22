"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
    username: string;
    message: string;
    timestamp: string;
}

const EMOJI_LIST = [
    "😀", "😂", "🥰", "😎", "🤔", "😮", "😴",
    "👍", "👎", "👋", "🎉", "🔥", "❤️", "💔",
    "👀", "🎱", "🎲", "🎯", "🏆"
];

export default function Chat({ socket, username, room, onClose }: { socket: any, username: string, room: string, onClose?: () => void }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        socket.on("receive_message", (msg: Message) => {
            setMessages((prev) => [...prev, msg]);
        });

        socket.on("system_message", (text: string) => {
            setMessages((prev) => [...prev, { username: "System", message: text, timestamp: new Date().toISOString() }]);
        });

        return () => {
            socket.off("receive_message");
            socket.off("system_message");
        };
    }, [socket]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && socket) {
            socket.emit("send_message", { room, message: input, username });
            setInput("");
            setShowEmojiPicker(false);
        }
    };

    const addEmoji = (emoji: string) => {
        setInput(prev => prev + emoji);
        // Keep picker open for multi-emoji spam
    };

    return (
        <div className="flex flex-col h-full bg-warm-black border-l border-white/10 w-full md:w-80 font-sans shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                    Live Chat
                </h2>
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

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
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
                        <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                            {/* Avatar (Opponent) */}
                            {!isMe && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-black shrink-0 mr-2 -mt-1">
                                    {msg.username[0].toUpperCase()}
                                </div>
                            )}

                            <div className={`max-w-[85%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                {/* Username (Only show if not me) */}
                                {!isMe && <span className="text-[10px] text-gray-500 mb-1 ml-1">{msg.username}</span>}

                                {/* Bubble */}
                                <div className={`relative px-3 py-2 text-sm shadow-md rounded-2xl ${isMe
                                    ? "bg-gradient-to-br from-[#9b51e0] to-[#ff88a5] text-white rounded-tr-sm"
                                    : "bg-white/10 text-gray-100 border border-white/5 rounded-tl-sm"
                                    }`}>
                                    {msg.message}
                                </div>
                                <span className="text-[9px] text-gray-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                <div ref={endRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-black/20 relative">
                {/* Emoji Popover */}
                {showEmojiPicker && (
                    <div className="absolute bottom-16 right-4 bg-gray-900 border border-white/20 rounded-xl shadow-2xl p-3 w-64 grid grid-cols-6 gap-2 animate-fade-in z-50">
                        {EMOJI_LIST.map(emoji => (
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
                        onChange={(e) => setInput(e.target.value)}
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
