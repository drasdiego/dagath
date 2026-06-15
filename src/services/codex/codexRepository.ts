import type { CodexEntry } from "./types";

// Abstração de persistência do Codex Vivo. A implementação concreta (Postgres)
// fica desacoplada para permitir migração futura (KV, Supabase) sem tocar no
// serviço.
export interface CodexRepository {
  save(entry: CodexEntry): Promise<void>;
  findRelevant(query: string): Promise<CodexEntry[]>;
  recent(limit: number): Promise<CodexEntry[]>;
  consolidate(entries: CodexEntry[]): Promise<void>;
}
