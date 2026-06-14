import type { CodexRepository } from "./codexRepository";
import { nullCodexRepository } from "./nullCodexRepository";

// O Codex só opera com a flag ligada E uma conexão Postgres presente. Qualquer
// outra situação mantém o repositório inerte, sem impacto no produto.
export function isCodexEnabled(): boolean {
  return (
    process.env.CODEX_ENABLED === "true" &&
    Boolean(process.env.POSTGRES_URL ?? process.env.DATABASE_URL)
  );
}

let cached: CodexRepository | null = null;

export async function getCodexRepository(): Promise<CodexRepository> {
  if (!isCodexEnabled()) return nullCodexRepository;
  if (cached) return cached;

  // Import dinâmico: o adapter Postgres (e o pacote @vercel/postgres) só é
  // carregado quando o Codex está realmente ativo.
  const { postgresCodexRepository } = await import("./postgresCodexRepository");
  cached = postgresCodexRepository;
  return cached;
}
