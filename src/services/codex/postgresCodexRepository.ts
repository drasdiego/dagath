import type { CodexRepository } from "./codexRepository";
import type { CodexEntry, CodexLevel } from "./types";

// Subconjunto da API do @vercel/postgres que usamos. O pacote é carregado por
// import dinâmico para não acoplar o build à sua presença: sem ele, o Codex
// simplesmente fica inerte (factory devolve o repositório nulo).
type QueryResult = { rows: Record<string, unknown>[] };
type VercelSql = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<QueryResult>;
  query: (text: string, values?: unknown[]) => Promise<QueryResult>;
};

let sqlPromise: Promise<VercelSql> | null = null;

async function getSql(): Promise<VercelSql> {
  if (!sqlPromise) {
    const specifier = "@vercel/postgres";
    sqlPromise = import(specifier).then(
      (mod) => (mod as { sql: VercelSql }).sql
    );
  }
  return sqlPromise;
}

let schemaReady: Promise<void> | null = null;

async function ensureSchema(sql: VercelSql): Promise<void> {
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS codex_entries (
        id BIGSERIAL PRIMARY KEY,
        topic TEXT NOT NULL UNIQUE,
        question TEXT NOT NULL,
        knowledge TEXT NOT NULL,
        level SMALLINT NOT NULL DEFAULT 2,
        confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
        occurrences INTEGER NOT NULL DEFAULT 1,
        sources TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `.then(() => undefined);
  }
  return schemaReady;
}

function clampLevel(value: unknown): CodexLevel {
  const level = Number(value);
  if (level >= 3) return 3;
  if (level <= 1) return 1;
  return 2;
}

function rowToEntry(row: Record<string, unknown>): CodexEntry {
  return {
    topic: String(row.topic ?? ""),
    question: String(row.question ?? ""),
    knowledge: String(row.knowledge ?? ""),
    level: clampLevel(row.level),
    confidence: Number(row.confidence ?? 0),
    occurrences: Number(row.occurrences ?? 0),
    sources: String(row.sources ?? "")
      .split(",")
      .map((source) => source.trim())
      .filter((source) => source.length > 0),
  };
}

export const postgresCodexRepository: CodexRepository = {
  async save(entry: CodexEntry): Promise<void> {
    const sql = await getSql();
    await ensureSchema(sql);

    const sources = entry.sources.join(",");

    // Upsert por tópico: conhecimento recorrente acumula occurrences e eleva o
    // nível, sem job recorrente externo. Mantém a maior confiança observada.
    await sql`
      INSERT INTO codex_entries (topic, question, knowledge, level, confidence, occurrences, sources)
      VALUES (${entry.topic}, ${entry.question}, ${entry.knowledge}, ${entry.level}, ${entry.confidence}, ${entry.occurrences}, ${sources})
      ON CONFLICT (topic) DO UPDATE SET
        occurrences = codex_entries.occurrences + 1,
        confidence = GREATEST(codex_entries.confidence, EXCLUDED.confidence),
        knowledge = EXCLUDED.knowledge,
        question = EXCLUDED.question,
        level = GREATEST(codex_entries.level, EXCLUDED.level),
        sources = EXCLUDED.sources,
        updated_at = now();
    `;
  },

  async findRelevant(query: string): Promise<CodexEntry[]> {
    const keywords = query
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3)
      .slice(0, 6);

    if (keywords.length === 0) return [];

    const sql = await getSql();
    await ensureSchema(sql);

    const conditions = keywords
      .map(
        (_, index) =>
          `(lower(topic) LIKE $${index + 1} OR lower(question) LIKE $${index + 1} OR lower(knowledge) LIKE $${index + 1})`
      )
      .join(" OR ");
    const params = keywords.map((word) => `%${word}%`);

    const { rows } = await sql.query(
      `SELECT topic, question, knowledge, level, confidence, occurrences, sources
       FROM codex_entries
       WHERE ${conditions}
       ORDER BY occurrences DESC, confidence DESC
       LIMIT 5`,
      params
    );

    return rows.map(rowToEntry);
  },

  async consolidate(entries: CodexEntry[]): Promise<void> {
    for (const entry of entries) {
      await this.save(entry);
    }
  },
};
