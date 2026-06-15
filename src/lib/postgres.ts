// Camada única de acesso ao Postgres. Todo o SQL do projeto passa por aqui, o
// que mantém o driver desacoplado e permite trocar de provedor mexendo só neste
// arquivo. O import é estático para a Vercel rastrear e incluir o pacote no
// runtime da função. Em desenvolvimento e produção exige POSTGRES_URL.
import { sql as vercelSql, db as vercelDb } from "@vercel/postgres";

export type Sql = typeof vercelSql;

export async function getSql(): Promise<Sql> {
  return vercelSql;
}

// Executa uma função dentro de uma transação com cliente dedicado.
export async function withTransaction<T>(
  fn: (sql: Sql) => Promise<T>
): Promise<T> {
  const client = await vercelDb.connect();
  try {
    await client.sql`BEGIN`;
    const result = await fn(client.sql as unknown as Sql);
    await client.sql`COMMIT`;
    return result;
  } catch (error) {
    await client.sql`ROLLBACK`;
    throw error;
  } finally {
    client.release();
  }
}

let schemaPromise: Promise<void> | null = null;

// Criação idempotente do schema, executada uma vez por processo na primeira
// consulta. Equivale ao db.exec que existia no SQLite, sem rodar no import.
export function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await vercelSql`
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
      await vercelSql`CREATE INDEX IF NOT EXISTS idx_snapshots_item_time ON price_snapshots (item_id, collected_at);`;
      await vercelSql`CREATE INDEX IF NOT EXISTS idx_snapshots_time ON price_snapshots (collected_at);`;

      await vercelSql`
        CREATE TABLE IF NOT EXISTS recommended_mods (
          id BIGSERIAL PRIMARY KEY,
          item_slug TEXT NOT NULL,
          mod_name TEXT NOT NULL,
          mod_slug TEXT,
          role TEXT NOT NULL,
          note TEXT,
          position INTEGER NOT NULL,
          source TEXT
        );
      `;
      await vercelSql`CREATE INDEX IF NOT EXISTS idx_recommended_mods_item ON recommended_mods (item_slug);`;

      await vercelSql`
        CREATE TABLE IF NOT EXISTS mod_suggestions (
          id BIGSERIAL PRIMARY KEY,
          created_at TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          item_slug TEXT NOT NULL,
          item_name TEXT NOT NULL,
          author TEXT,
          mods_json TEXT NOT NULL
        );
      `;
      await vercelSql`CREATE INDEX IF NOT EXISTS idx_suggestions_status ON mod_suggestions (status, created_at);`;
    })();
  }
  return schemaPromise;
}
