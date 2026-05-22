"use client";
import React, { useState } from 'react';
import VictoryModal from '../../../components/VictoryModal';

export default function VictoryTestPage() {
    const [winner, setWinner] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-deep-navy flex flex-col items-center justify-center space-y-8">
            <h1 className="text-white text-3xl font-bold">Victory Modal Test</h1>

            <div className="flex space-x-4">
                <button
                    onClick={() => setWinner("BLUE")}
                    className="px-6 py-3 bg-blue-600 rounded text-white font-bold hover:bg-blue-500"
                >
                    Trigger Blue Win
                </button>
                <button
                    onClick={() => setWinner("RED")}
                    className="px-6 py-3 bg-red-600 rounded text-white font-bold hover:bg-red-500"
                >
                    Trigger Red Win
                </button>
            </div>

            {winner && (
                <VictoryModal
                    winner={winner}
                    onReset={() => setWinner(null)}
                />
            )}
        </div>
    );
}
