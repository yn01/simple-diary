import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/diary.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath, { verbose: console.log });

// Initialize database schema
export function initializeDatabase() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `;

  const createIndexSQL = `
    CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date DESC)
  `;

  db.exec(createTableSQL);
  db.exec(createIndexSQL);
}

// Close database connection
export function closeDatabase() {
  db.close();
}
