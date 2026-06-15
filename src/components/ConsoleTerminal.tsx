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

export default function ConsoleTerminal({ embedded = false }: { embedded?: boolean }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
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

  return (
    <div className={`hud-panel hud-panel--accent flex flex-col ${embedded ? "h-full" : "h-[70vh]"}`}>
      <header className="hud-panel__title">
        <span className="hud-panel__tick" />
        Cephalon · Assistente Dagath
      </header>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2">
        {history.length === 0 && !loading && (
          <p className="font-mono text-sm text-ink-2">
            Cephalon em escuta. Pergunte sobre builds, mercado, farm ou mecânicas de Warframe. Digite <span className="text-cyan">ajuda</span> para os comandos diretos.
          </p>
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

      <div className="flex items-center gap-2 border-t border-line-1 pt-3 mt-3">
        <span className="font-mono text-sm text-cyan shrink-0">cephalon&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          placeholder="Pergunte à Cephalon ou digite um comando..."
          className="flex-1 bg-transparent font-mono text-sm text-ink-0 placeholder:text-ink-3 outline-none"
        />
      </div>
    </div>
  );
}