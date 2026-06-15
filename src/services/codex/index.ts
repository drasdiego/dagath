import type { CodexRepository } from "./codexRepository";
import { nullCodexRepository } from "./nullCodexRepository";

function hasConnection(): boolean {
  return Boolean(process.env.POSTGRES_URL ?? process.env.DATABASE_URL);
}

// Escrita do Codex (destilação e persistência). Sprint 2.
export function isCodexEnabled(): boolean {
  return process.env.CODEX_ENABLED === "true" && hasConnection();
}

// Leitura assistiva do Codex nas respostas. Fica para a Sprint 3.
export function isCodexReadEnabled(): boolean {
  return process.env.CODEX_READ_ENABLED === "true" && hasConnection();
}

let cached: CodexRepository | null = null;

export async function getCodexRepository(): Promise<CodexRepository> {
  if (!isCodexEnabled() && !isCodexReadEnabled()) return nullCodexRepository;
  if (cached) return cached;

  const { postgresCodexRepository } = await import("./postgresCodexRepository");
  cached = postgresCodexRepository;
  return cached;
}
