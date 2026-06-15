"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import CopyMessageButton from "@/components/CopyMessageButton";
import type { ConsoleResult } from "@/services/consoleService";
import type { SessionMemory } from "@/services/cephalonMemory";

const MEMORY_STORAGE_KEY = "cephalon_operational_context";

type HistoryEntry = {
  input: string;
  result: ConsoleResult;
};

type SavedSession = {
  id: string;
  startedAt: number;
  title: string;
  messages: HistoryEntry[];
};

const CURRENT_CHAT_KEY = "cephalon_chat_current";
const CHAT_HISTORY_KEY = "cephalon_chat_history";
const MAX_SESSIONS = 20;

function ResultView({ result }: { result: ConsoleResult }) {
  if (result.kind === "error") {
    return <p className="font-mono text-sm text-down">{result.message}</p>;
  }

  if (result.kind === "notice") {
    return <p className="font-mono text-sm text-cyan">{result.message}</p>;
  }

  if (result.kind === "help") {
    return (
      <div className="flex flex-col gap-1.5">
        {result.commands.map((cmd) => (
          <div key={cmd.command} className="flex gap-4">
            <span className="font-mono text-sm text-cyan w-36 shrink-0">{cmd.command}</span>
            <span className="font-body text-sm text-ink-1">{cmd.description}</span>
          </div>
        ))}
      </div>
    );
  }

  if (result.kind === "ai") {
    return (
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 bg-gold-faint text-gold w-fit">
          IA · com base nos dados da Dagath
        </span>
        <p className="font-body text-sm text-ink-0 whitespace-pre-wrap leading-relaxed">
          {result.answer}
        </p>
        {result.references?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {result.references.map((ref) => (
              <Link
                key={`${ref.kind}-${ref.slug}`}
                href={`/${ref.kind === "frame" ? "frame" : "item"}/${ref.slug}`}
                className="font-mono text-[10px] uppercase tracking-[0.1em] border border-line-2 px-2 py-1 text-cyan hover:border-line-cyan hover:bg-cyan-faint transition-colors"
              >
                {ref.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (result.kind === "pulse") {
    return (
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">Anúncios · {result.windowHours}h</p>
          <p className="font-display text-xl font-semibold text-ink-0">
            {result.totalOrders.toLocaleString("pt-BR")}
            <span className="font-mono text-[10px] text-ink-3 ml-2">{result.sellOrders} venda · {result.buyOrders} compra</span>
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">Platina em movimento</p>
          <p className="font-display text-xl font-semibold text-gold">{result.platVolume.toLocaleString("pt-BR")}p</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">Jogadores negociando</p>
          <p className="font-display text-xl font-semibold text-cyan">{result.uniqueTraders}</p>
        </div>
      </div>
    );
  }

  if (result.kind === "trends") {
    if (result.movers.length === 0) {
      return (
        <p className="font-body text-sm text-ink-2">
          Nenhuma variação relevante de {result.direction} entre as verificações.
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-[10px] uppercase text-ink-3">
          variação nas últimas {result.minutesBetween >= 90 ? `${Math.round(result.minutesBetween / 60)}h` : `${result.minutesBetween} min`}
        </p>
        {result.movers.map((mover) => (
          <div key={mover.slug ?? mover.name} className="flex items-center gap-3">
            {mover.slug ? (
              <Link href={`/item/${mover.slug}`} className="font-body text-sm text-ink-0 hover:text-cyan transition-colors flex-1 truncate">
                {mover.name}
              </Link>
            ) : (
              <span className="font-body text-sm text-ink-0 flex-1 truncate">{mover.name}</span>
            )}
            <span className="font-mono text-xs text-ink-3">{mover.prevAvgPlat}p →</span>
            <span className="font-mono text-sm text-gold">{mover.avgPlat}p</span>
            <span className={`font-mono text-xs px-1.5 py-0.5 ${
              mover.deltaPct >= 0 ? "bg-up-faint text-up" : "bg-down-faint text-down"
            }`}>
              {mover.deltaPct >= 0 ? "+" : ""}{mover.deltaPct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (result.kind === "price") {
    return (
      <div className="flex flex-col gap-2">
        <Link href={`/item/${result.slug}`} className="font-display text-lg font-semibold text-ink-0 hover:text-cyan transition-colors w-fit">
          {result.name}
        </Link>
        <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm">
          <span className="text-gold">Mínimo {result.low}p</span>
          <span className="text-ink-1">Média {result.avg}p</span>
          <span className="text-ink-1">Máximo {result.high}p</span>
          <span className="text-ink-3">{result.sellersOnline} vendedores ativos</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-body text-sm text-ink-1">
            Melhor oferta: {result.bestSeller} por <span className="text-gold font-mono">{result.bestPlat}p</span>
          </span>
          <CopyMessageButton compact message={result.message} />
        </div>
      </div>
    );
  }

  if (result.kind === "items") {
    return (
      <div className="flex flex-col gap-1.5">
        {result.matches.map((match) => (
          <Link key={match.slug} href={`/item/${match.slug}`} className="flex items-center gap-3 w-fit group">
            {match.thumb ? (
              <img src={match.thumb} alt={match.name} width={22} height={22} />
            ) : (
              <span className="w-[22px] h-[22px] border border-line-1" />
            )}
            <span className="font-body text-sm text-ink-0 group-hover:text-cyan transition-colors">
              {match.name}
            </span>
          </Link>
        ))}
      </div>
    );
  }

  return null;
}

export default function ConsoleTerminal({
  embedded = false,
  onMinimize,
}: {
  embedded?: boolean;
  onMinimize?: () => void;
}) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [sessionMemory, setSessionMemory] = useState<SessionMemory | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [commandIndex, setCommandIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  // Carrega o contexto operacional persistido (sobrevive a reload e reinício).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MEMORY_STORAGE_KEY);
      if (stored) setSessionMemory(JSON.parse(stored) as SessionMemory);
    } catch {
      // localStorage indisponível ou corrompido: segue sem contexto.
    }
  }, []);

  // Persiste o contexto a cada mudança.
  useEffect(() => {
    try {
      if (sessionMemory) {
        window.localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(sessionMemory));
      } else {
        window.localStorage.removeItem(MEMORY_STORAGE_KEY);
      }
    } catch {
      // Sem persistência disponível: a sessão continua em memória.
    }
  }, [sessionMemory]);

  // Ao carregar a página: arquiva a conversa anterior (se houver) no histórico
  // do navegador e começa uma conversa nova. Roda antes do efeito de persistir.
  useEffect(() => {
    try {
      const rawHistory = window.localStorage.getItem(CHAT_HISTORY_KEY);
      let sessions: SavedSession[] = rawHistory ? (JSON.parse(rawHistory) as SavedSession[]) : [];

      const rawCurrent = window.localStorage.getItem(CURRENT_CHAT_KEY);
      if (rawCurrent) {
        const messages = JSON.parse(rawCurrent) as HistoryEntry[];
        if (Array.isArray(messages) && messages.length > 0) {
          const firstInput = messages.find((entry) => entry.input)?.input ?? "Conversa";
          sessions = [
            { id: String(Date.now()), startedAt: Date.now(), title: firstInput.slice(0, 60), messages },
            ...sessions,
          ].slice(0, MAX_SESSIONS);
          window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(sessions));
        }
        window.localStorage.removeItem(CURRENT_CHAT_KEY);
      }

      setSavedSessions(sessions);
    } catch {
      // Sem persistência: segue sem histórico.
    }
  }, []);

  // Persiste a conversa atual no navegador (recuperada como sessão ao recarregar).
  useEffect(() => {
    try {
      if (history.length > 0) {
        window.localStorage.setItem(CURRENT_CHAT_KEY, JSON.stringify(history));
      } else {
        window.localStorage.removeItem(CURRENT_CHAT_KEY);
      }
    } catch {
      // Sem persistência disponível.
    }
  }, [history]);

  function newConversation() {
    if (history.length > 0) {
      const firstInput = history.find((entry) => entry.input)?.input ?? "Conversa";
      const session: SavedSession = {
        id: String(Date.now()),
        startedAt: Date.now(),
        title: firstInput.slice(0, 60),
        messages: history,
      };
      setSavedSessions((prev) => {
        const next = [session, ...prev].slice(0, MAX_SESSIONS);
        try {
          window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    }
    setHistory([]);
    setView("chat");
    setOpenSessionId(null);
    try {
      window.localStorage.removeItem(CURRENT_CHAT_KEY);
    } catch {}
    inputRef.current?.focus();
  }

  function forgetContext(trimmed: string) {
    setSessionMemory(null);
    setHistory((current) => [
      ...current,
      {
        input: trimmed,
        result: { kind: "notice", message: "Contexto operacional da sessão apagado." },
      },
    ]);
  }

  async function run(command: string) {
    const trimmed = command.trim();
    if (!trimmed || loading) return;

    setInput("");
    setCommandIndex(-1);

    if (trimmed.toLowerCase() === "esquecer" || trimmed.toLowerCase() === "esquecer contexto") {
      forgetContext(trimmed);
      inputRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cmd: trimmed, memory: sessionMemory }),
      });
      const result = (await response.json()) as ConsoleResult;
      setHistory((current) => [...current, { input: trimmed, result }]);
      if (result.kind === "ai") {
        setSessionMemory(result.memory);
      }
    } catch {
      setHistory((current) => [
        ...current,
        { input: trimmed, result: { kind: "error", message: "Falha ao executar o comando." } },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      run(input);
      return;
    }

    const commands = history.map((entry) => entry.input);
    if (event.key === "ArrowUp" && commands.length > 0) {
      event.preventDefault();
      const next = commandIndex < 0 ? commands.length - 1 : Math.max(0, commandIndex - 1);
      setCommandIndex(next);
      setInput(commands[next]);
    }
    if (event.key === "ArrowDown" && commandIndex >= 0) {
      event.preventDefault();
      const next = commandIndex + 1;
      if (next >= commands.length) {
        setCommandIndex(-1);
        setInput("");
      } else {
        setCommandIndex(next);
        setInput(commands[next]);
      }
    }
  }

  const openSession = openSessionId
    ? savedSessions.find((session) => session.id === openSessionId) ?? null
    : null;

  return (
    <div className={`hud-panel hud-panel--accent flex flex-col ${embedded ? "h-full" : "h-[70vh]"}`}>
      <header className="hud-panel__title flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="hud-panel__tick" />
          Cephalon · Assistente Dagath
        </span>
        <span className="flex items-center gap-2">
          <button
            onClick={() => {
              setView((current) => (current === "history" ? "chat" : "history"));
              setOpenSessionId(null);
            }}
            aria-label="Histórico de conversas"
            title="Histórico"
            className={`shrink-0 font-mono text-[9px] uppercase tracking-[0.15em] border px-1.5 py-0.5 transition-colors ${
              view === "history"
                ? "border-line-cyan text-cyan"
                : "border-line-2 text-ink-3 hover:text-cyan hover:border-line-cyan"
            }`}
          >
            Histórico
          </button>
          {onMinimize && (
            <button
              onClick={onMinimize}
              aria-label="Minimizar chat"
              title="Minimizar"
              className="shrink-0 px-1 text-ink-3 hover:text-cyan transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="5" y1="18" x2="19" y2="18" />
              </svg>
            </button>
          )}
        </span>
      </header>

      {view === "history" ? (
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2">
          <button
            onClick={() => {
              setView("chat");
              setOpenSessionId(null);
            }}
            className="self-start border border-line-cyan px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-cyan hover:bg-cyan-faint transition-colors"
          >
            ‹ voltar ao chat
          </button>

          {openSession ? (
            <>
              <button
                onClick={() => setOpenSessionId(null)}
                className="self-start font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3 hover:text-cyan transition-colors"
              >
                ‹ voltar ao histórico
              </button>
              {openSession.messages.map((entry, index) => (
                <div key={index} className="flex flex-col gap-1.5">
                  <p className="font-mono text-sm text-ink-3">
                    <span className="text-cyan">cephalon&gt;</span> {entry.input}
                  </p>
                  <div className="pl-4 border-l border-line-1">
                    <ResultView result={entry.result} />
                  </div>
                </div>
              ))}
            </>
          ) : savedSessions.length === 0 ? (
            <p className="font-mono text-sm text-ink-2">
              Nenhuma conversa salva ainda. Suas conversas são guardadas aqui no navegador quando você recarrega a página ou inicia uma nova.
            </p>
          ) : (
            savedSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setOpenSessionId(session.id)}
                className="flex flex-col gap-0.5 text-left border border-line-1 px-3 py-2 hover:border-line-cyan transition-colors"
              >
                <span className="font-body text-sm text-ink-0 truncate">{session.title}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-3">
                  {new Date(session.startedAt).toLocaleString("pt-BR")} · {session.messages.length} mensagens
                </span>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2">
          {history.length === 0 && !loading && (
            <p className="font-mono text-sm text-ink-2">
              Cephalon em escuta. Pergunte sobre builds, mercado, farm ou mecânicas de Warframe. Digite <span className="text-cyan">ajuda</span> para os comandos diretos.
            </p>
          )}

          {history.length > 0 && (
            <button
              onClick={newConversation}
              className="self-end font-mono text-[9px] uppercase tracking-[0.15em] text-ink-3 hover:text-cyan transition-colors"
            >
              + nova conversa
            </button>
          )}

          {history.map((entry, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <p className="font-mono text-sm text-ink-3">
                <span className="text-cyan">cephalon&gt;</span> {entry.input}
              </p>
              <div className="pl-4 border-l border-line-1">
                <ResultView result={entry.result} />
              </div>
            </div>
          ))}

          {loading && (
            <p className="font-mono text-sm text-ink-3 animate-pulse">processando...</p>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {view === "chat" && (
        <div className="flex items-center gap-2 border-t border-line-1 pt-3 mt-3">
          <span className="font-mono text-sm text-cyan shrink-0">cephalon&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder="Pergunte à Cephalon ou digite um comando..."
            className="flex-1 bg-transparent font-mono text-sm text-ink-0 placeholder:text-ink-3 outline-none"
          />
        </div>
      )}
    </div>
  );
}