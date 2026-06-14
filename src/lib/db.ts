import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(path.join(dataDir, "dagath.db"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS price_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collected_at TEXT NOT NULL,
    item_id TEXT NOT NULL,
    slug TEXT,
    name TEXT,
    thumb TEXT,
    orders INTEGER NOT NULL,
    units INTEGER NOT NULL,
    plat_volume INTEGER NOT NULL,
    avg_plat INTEGER NOT NULL,
    min_plat INTEGER NOT NULL,
    max_plat INTEGER NOT NULL,
    sell_orders INTEGER NOT NULL,
    buy_orders INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_snapshots_item_time
    ON price_snapshots (item_id, collected_at);

  CREATE INDEX IF NOT EXISTS idx_snapshots_time
    ON price_snapshots (collected_at);

  CREATE TABLE IF NOT EXISTS recommended_mods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_slug TEXT NOT NULL,
    mod_name TEXT NOT NULL,
    mod_slug TEXT,
    role TEXT NOT NULL,
    note TEXT,
    position INTEGER NOT NULL,
    source TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_recommended_mods_item
    ON recommended_mods (item_slug);

  CREATE TABLE IF NOT EXISTS mod_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    item_slug TEXT NOT NULL,
    item_name TEXT NOT NULL,
    author TEXT,
    mods_json TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_suggestions_status
    ON mod_suggestions (status, created_at);
`);