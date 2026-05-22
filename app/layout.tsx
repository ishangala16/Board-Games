import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Game Night",
    description: "Play real-time multiplayer board games like Sequence, Splendor, and more in a premium, cosmic-themed lounge.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-warm-black text-white min-h-screen`}>{children}</body>
        </html>
    );
}
