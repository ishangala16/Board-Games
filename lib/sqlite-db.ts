import fs from "fs";
import path from "path";

// Require node:sqlite dynamically to avoid TS compilation errors if @types/node is outdated
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(process.cwd(), "data");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, "stats.db");
const db = new DatabaseSync(dbPath);

// Initialize table
db.exec(`
    CREATE TABLE IF NOT EXISTS global_stats (
        key TEXT PRIMARY KEY,
        value INTEGER NOT NULL
    );
`);

// Seed total_games if it doesn't exist
const checkStmt = db.prepare('SELECT value FROM global_stats WHERE key = ?');
const insertStmt = db.prepare('INSERT INTO global_stats (key, value) VALUES (?, ?)');

const row = checkStmt.get('total_games');
if (!row) {
    insertStmt.run('total_games', 0);
}

export function getTotalGamesPlayed(): number {
    const stmt = db.prepare('SELECT value FROM global_stats WHERE key = ?');
    const result = stmt.get('total_games') as { value: number };
    return result ? result.value : 0;
}

export function incrementTotalGamesPlayed(): number {
    const stmt = db.prepare('UPDATE global_stats SET value = value + 1 WHERE key = ?');
    stmt.run('total_games');
    return getTotalGamesPlayed();
}
