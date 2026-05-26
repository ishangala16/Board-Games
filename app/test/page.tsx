export default function TestPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#080b11] via-[#121824] to-[#1a1128] animate-gradient text-white p-8 font-sans">
            <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-[#4b90ff] via-[#9b51e0] to-[#ff88a5] border-b border-indigo-500/20 pb-4">Dev Test Suite & Guide</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Test Modules */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-blue-300">Feature Verification</h2>
                    <div className="grid grid-cols-1 gap-4">
                        <a href="/test/victory" className="block p-6 bg-warm-black border border-white/10 rounded-xl hover:border-indigo-500 transition-all group">
                            <h3 className="text-xl font-bold mb-1 flex items-center">
                                🏆 Victory Modal
                                <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">→</span>
                            </h3>
                            <p className="text-gray-400">Preview the winning celebration screen and animations.</p>
                        </a>

                        <a href="/test/removal" className="block p-6 bg-warm-black border border-white/10 rounded-xl hover:border-indigo-500 transition-all group">
                            <h3 className="text-xl font-bold mb-1 flex items-center">
                                ⚔️ Chip Removal
                                <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">→</span>
                            </h3>
                            <p className="text-gray-400">Simulate One-Eyed Jack interaction (Removing loose opponent chips).</p>
                        </a>

                        <a href="/test/cards" className="block p-6 bg-warm-black border border-white/10 rounded-xl hover:border-indigo-500 transition-all group">
                            <h3 className="text-xl font-bold mb-1 flex items-center">
                                🃏 Card Visuals (Jacks & Suits)
                                <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">→</span>
                            </h3>
                            <p className="text-gray-400">Verify the high-fidelity suit shapes and Jack eye icons in hand and board layouts.</p>
                        </a>

                        <a href="/test/locked" className="block p-6 bg-warm-black border border-white/10 rounded-xl hover:border-indigo-500 transition-all group">
                            <h3 className="text-xl font-bold mb-1 flex items-center">
                                🔒 Locked Sequences
                                <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">→</span>
                            </h3>
                            <p className="text-gray-400">Verify that completed 5-in-a-row sequences CANNOT be broken.</p>
                        </a>

                        <a href="/test/splendor" className="block p-6 bg-warm-black border border-white/10 rounded-xl hover:border-indigo-500 transition-all group">
                            <h3 className="text-xl font-bold mb-1 flex items-center">
                                💎 Splendor Mechanics
                                <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">→</span>
                            </h3>
                            <p className="text-gray-400">Test the Splendor game engine: Token taking, card buying, and state updates.</p>
                        </a>
                    </div>
                </div>

                {/* Game Information */}
                <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                    <h2 className="text-2xl font-bold text-indigo-400 mb-4">About Testing</h2>
                    <p className="text-gray-300 mb-4">
                        This suite allows you to verify individual game mechanics in isolation without needing a second player or a full server connection.
                    </p>
                    <p className="text-gray-300">
                        Use the <strong>Feature Verification</strong> links on the left to test specific logic gates like "Locked Sequences" or "Splendor Market" mechanics.
                    </p>

                    <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                        <strong className="text-blue-300 block mb-1">Tip:</strong>
                        <p className="text-sm text-gray-400">If you are looking for Game Rules, please join a game room and click the <strong>"i"</strong> button in the header.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
