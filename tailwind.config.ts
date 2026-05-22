import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                // Cozy Date Night Palette
                'warm-black': '#1a1a1a',
                'soft-gold': '#d4af37',
                'deep-navy': '#0f172a',
                'amber-glow': '#f59e0b',
            },
        },
    },
    plugins: [],
};
export default config;
