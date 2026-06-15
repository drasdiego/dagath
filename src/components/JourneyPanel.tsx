"use client";

import { useEffect, useState } from "react";

type Objective = {
  id: string;
  text: string;
  done: boolean;
};

const STORAGE_KEY = "dagath_objectives";
const MAX_OBJECTIVES = 12;

function CheckBox({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${
        done ? "border-line-cyan bg-cyan-faint text-cyan" : "border-line-2 text-transparent"
      }`}
      style={{ clipPath: "polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))" }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12 l5 5 L20 6" />
      </svg>
    </span>
  );
}

export default function JourneyPanel() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setObjectives(JSON.parse(raw) as Objective[]);
    } catch {
      // sem persistência
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(objectives));
    } catch {
      // sem persistência
    }
  }, [objectives, ready]);

  function addObjective() {
    const text = draft.trim();
    if (!text) return;
    setObjectives((current) =>
      [{ id: String(Date.now()), text: text.slice(0, 120), done: false }, ...current].slice(0, MAX_OBJECTIVES)
    );
    setDraft("");
  }

  function toggle(id: string) {
    setObjectives((current) =>
      current.map((objective) => (objective.id === id ? { ...objective, done: !objective.done } : objective))
    );
  }

  function remove(id: string) {
    setObjectives((current) => current.filter((objective) => objective.id !== id));
  }

  const remaining = objectives.filter((objective) => !objective.done).length;

  return (
    <section className="hud-panel hud-panel--accent flex flex-col gap-3">
      <header className="hud-panel__title flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="hud-panel__tick" />
          Sua jornada · próximos objetivos
        </span>
        {objectives.length > 0 && (
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-3">
            {remaining} em aberto
          </span>
        )}
      </header>

      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-cyan shrink-0">›</span>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addObjective();
          }}
          spellCheck={false}
          maxLength={120}
          placeholder="Novo objetivo: farmar Khora Prime, montar build de Saryn pra Steel Path..."
          className="flex-1 bg-transparent font-body text-sm text-ink-0 placeholder:text-ink-3 outline-none"
        />
        <button
          onClick={addObjective}
          disabled={draft.trim().length === 0}
          className="shrink-0 border border-line-2 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-ink-2 hover:border-line-cyan hover:text-cyan transition-colors disabled:opacity-40 disabled:hover:border-line-2 disabled:hover:text-ink-2"
        >
          Marcar rota
        </button>
      </div>

      {objectives.length === 0 ? (
        <p className="font-body text-sm text-ink-2 leading-relaxed">
          Defina seu próximo objetivo, Tenno. A Orbiter acompanha a sua jornada: farmar um frame, montar uma build, juntar platina para o próximo Prime.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line-1">
          {objectives.map((objective) => (
            <li key={objective.id} className="flex items-start gap-3 py-2.5 first:pt-0 group">
              <button
                onClick={() => toggle(objective.id)}
                aria-pressed={objective.done}
                aria-label={objective.done ? "Marcar como pendente" : "Concluir objetivo"}
                className="shrink-0"
              >
                <CheckBox done={objective.done} />
              </button>
              <span
                className={`flex-1 font-body text-sm leading-snug ${
                  objective.done ? "text-ink-3 line-through" : "text-ink-0"
                }`}
              >
                {objective.text}
              </span>
              <button
                onClick={() => remove(objective.id)}
                aria-label="Remover objetivo"
                className="shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3 opacity-0 group-hover:opacity-100 hover:text-down transition-opacity"
              >
                remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
