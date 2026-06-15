import { createRequire } from "module";
import path from "path";
import { sql } from "@vercel/postgres";

// Importação única do histórico de preços do SQLite local para o Postgres.
// Rode ANTES de remover o better-sqlite3, com POSTGRES_URL no ambiente:
//   node --env-file=.env.local scripts/import-snapshots.mjs

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const COLUMNS = [
  "collected_at", "item_id", "slug", "name", "thumb",
  "orders", "units", "plat_volume", "avg_plat",
  "min_plat", "max_plat", "sell_orders", "buy_orders",
];
const BATCH = 500;

async function main() {
  const db = new Database(path.join(process.cwd(), "data", "dagath.db"), { readonly: true });

  await sql`
    CREATE TABLE IF NOT EXISTS price_snapshots (
      id BIGSERIAL PRIMARY KEY,
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
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_snapshots_item_time ON price_snapshots (item_id, collected_at);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_snapshots_time ON price_snapshots (collected_at);`;

  const rows = db
    .prepare(`SELECT ${COLUMNS.join(", ")} FROM price_snapshots ORDER BY id ASC`)
    .all();

  console.log(`Lendo ${rows.length} linhas do SQLite...`);

  let imported = 0;
  for (let start = 0; start < rows.length; start += BATCH) {
    const chunk = rows.slice(start, start + BATCH);
    const placeholders = chunk
      .map((_, row) => {
        const base = row * COLUMNS.length;
        const slots = COLUMNS.map((_, col) => `$${base + col + 1}`);
        return `(${slots.join(", ")})`;
      })
      .join(", ");

    const params = [];
    for (const row of chunk) {
      for (const column of COLUMNS) params.push(row[column]);
    }

    await sql.query(
      `INSERT INTO price_snapshots (${COLUMNS.join(", ")}) VALUES ${placeholders}`,
      params
    );
    imported += chunk.length;
    console.log(`Importadas ${imported}/${rows.length}`);
  }

  console.log(`Importação concluída · ${imported} linhas no Postgres`);
}

main().catch((error) => {
  console.error("Falha na importação:", error);
  process.exit(1);
});
