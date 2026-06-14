import type { CodexEntry } from "./types";

// Guarda de privacidade redundante: mesmo com a destilação produzindo
// conhecimento neutro, rejeitamos qualquer entrada com sinais de dado pessoal
// ou de reconstrução da conversa original.
const EMAIL = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/;
const FIRST_PERSON = /\b(meu|minha|meus|minhas|tenho|sou|estou|comprei|gastei)\b/i;
const PERSONAL_CONTEXT = /\b(or[çc]amento|budget|mastery\s*rank|\bmr\b)\b/i;

export function sanitizeCodexEntry(entry: CodexEntry): CodexEntry | null {
  const blob = `${entry.topic} ${entry.question} ${entry.knowledge}`;

  if (EMAIL.test(blob)) return null;
  if (FIRST_PERSON.test(blob)) return null;
  if (PERSONAL_CONTEXT.test(blob)) return null;
  if (entry.knowledge.trim().length < 12) return null;

  return entry;
}
