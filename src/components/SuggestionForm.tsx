"use client";

import { useEffect, useRef, useState } from "react";

type ItemHit = {
  slug: string;
  name: string;
  thumb: string | null;
};

type SlotDef = {
  id: string;
  label: string;
  role: string;
};

type SlotMod = {
  modName: string;
  modSlug: string | null;
  thumb: string | null;
  note: string;
};

const SIDE_SLOTS: SlotDef[] = [
  { id: "aura", label: "Aura", role: "Aura" },
  { id: "exilus", label: "Exilus", role: "Exilus" },
];

const MAIN_SLOTS: SlotDef[] = [
  { id: "m1", label: "Mod 1", role: "Geral" },
  { id: "m2", label: "Mod 2", role: "Geral" },
  { id: "m3", label: "Mod 3", role: "Geral" },
  { id: "m4", label: "Mod 4", role: "Geral" },
  { id: "m5", label: "Mod 5", role: "Geral" },
  { id: "m6", label: "Mod 6", role: "Geral" },
  { id: "m7", label: "Mod 7", role: "Geral" },
  { id: "m8", label: "Mod 8", role: "Geral" },
];

const ARCANE_SLOTS: SlotDef[] = [
  { id: "arcane1", label: "Arcana 1", role: "Arcana" },
  { id: "arcane2", label: "Arcana 2", role: "Arcana" },
];

const ALL_SLOTS: SlotDef[] = [...SIDE_SLOTS, ...MAIN_SLOTS, ...ARCANE_SLOTS];

function useItemSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemHit[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/items?q=${encodeURIComponent(query.trim())}`);
        const data = await response.json();
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  return { query, setQuery, results, setResults, loading };
}

function SearchOverlay({
  title,
  onPick,
  onClose,
}: {
  title: string;
  onPick: (hit: ItemHit) => void;
  onClose: () => void;
}) {
  const search = useItemSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-bg-0/80 backdrop-blur-sm pt-24 px-6"
      onClick={onClose}
    >
      <div
        className="hud-panel hud-panel--accent w-full max-w-lg flex flex-col gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">{title}</p>
          <button
            onClick={onClose}
            className="font-mono text-[10px] uppercase text-ink-3 hover:text-ink-0 transition-colors"
          >
            Fechar
          </button>
        </div>
        <input
          ref={inputRef}
          value={search.query}
          onChange={(event) => search.setQuery(event.target.value)}
          placeholder="Digite o nome do mod..."
          spellCheck={false}
          className="w-full bg-bg-2 border border-line-2 px-3 py-2 font-body text-sm text-ink-0 placeholder:text-ink-3 outline-none focus:border-line-cyan transition-colors"
        />
        <div className="max-h-72 overflow-y-auto flex flex-col">
          {search.loading && (
            <p className="font-mono text-xs text-ink-3 py-3 px-1 animate-pulse">buscando...</p>
          )}
          {!search.loading && search.query.trim().length >= 2 && search.results.length === 0 && (
            <p className="font-body text-sm text-ink-3 py-3 px-1">Nada encontrado.</p>
          )}
          {search.results.map((hit) => (
            <button
              key={hit.slug}
              onClick={() => onPick(hit)}
              className="flex items-center gap-3 w-full px-2 py-2 hover:bg-bg-2 transition-colors text-left"
            >
              {hit.thumb ? (
                <img src={hit.thumb} alt={hit.name} width={32} height={32} />
              ) : (
                <span className="w-8 h-8 border border-line-1" />
              )}
              <span className="font-body text-sm text-ink-0">{hit.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Slot({
  slot,
  mod,
  onPick,
  onClear,
}: {
  slot: SlotDef;
  mod: SlotMod | undefined;
  onPick: () => void;
  onClear: () => void;
}) {
  if (mod) {
    return (
      <div className="relative flex flex-col items-center gap-1.5 border border-line-cyan bg-bg-2 p-2 h-full min-h-[108px]">
        <button
          onClick={onClear}
          className="absolute top-1 right-1 font-mono text-[9px] uppercase text-down hover:text-ink-0 transition-colors z-10"
        >
          ✕
        </button>
        <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-cyan">{slot.label}</span>
        {mod.thumb ? (
          <img src={mod.thumb} alt={mod.modName} width={48} height={48} />
        ) : (
          <span className="w-12 h-12 border border-line-1" />
        )}
        <span className="font-body text-[11px] text-ink-0 text-center leading-tight">{mod.modName}</span>
      </div>
    );
  }

  return (
    <button
      onClick={onPick}
      className="flex flex-col items-center justify-center gap-1 border border-dashed border-line-2 bg-bg-1 p-2 h-full min-h-[108px] hover:border-line-cyan hover:bg-bg-2 transition-colors w-full"
    >
      <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-ink-3">{slot.label}</span>
      <span className="font-display text-2xl text-ink-3">+</span>
    </button>
  );
}

export default function SuggestionForm() {
  const itemSearch = useItemSearch();
  const [selectedItem, setSelectedItem] = useState<ItemHit | null>(null);

  const [slots, setSlots] = useState<Record<string, SlotMod>>({});
  const [activeSlot, setActiveSlot] = useState<SlotDef | null>(null);
  const [author, setAuthor] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickItem(hit: ItemHit) {
    setSelectedItem(hit);
    itemSearch.setQuery(hit.name);
    itemSearch.setResults([]);
  }

  function assignSlot(hit: ItemHit) {
    if (!activeSlot) return;
    setSlots((current) => ({
      ...current,
      [activeSlot.id]: { modName: hit.name, modSlug: hit.slug, thumb: hit.thumb, note: "" },
    }));
    setActiveSlot(null);
  }

  function clearSlot(slotId: string) {
    setSlots((current) => {
      const next = { ...current };
      delete next[slotId];
      return next;
    });
  }

  function setNote(slotId: string, note: string) {
    setSlots((current) => ({ ...current, [slotId]: { ...current[slotId], note } }));
  }

  const filledCount = Object.keys(slots).length;

  async function submit() {
    if (!selectedItem || filledCount === 0 || submitting) return;
    setSubmitting(true);
    setError(null);

    const mods = ALL_SLOTS.filter((slot) => slots[slot.id]).map((slot) => {
      const mod = slots[slot.id];
      return {
        modName: mod.modName,
        modSlug: mod.modSlug,
        role: slot.role,
        note: mod.note.trim() || null,
      };
    });

    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemSlug: selectedItem.slug,
          itemName: selectedItem.name,
          author: author.trim() || null,
          mods,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Falha ao enviar.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Falha de conexão ao enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="hud-panel hud-panel--accent flex flex-col gap-3 items-start">
        <p className="font-display text-xl font-semibold text-up uppercase tracking-wide">
          Sugestão enviada
        </p>
        <p className="font-body text-sm text-ink-1">
          Obrigado. Sua build entrou na fila e vai aparecer no item assim que for revisada.
        </p>
        <button
          onClick={() => {
            setDone(false);
            setSelectedItem(null);
            itemSearch.setQuery("");
            setSlots({});
            setAuthor("");
          }}
          className="border border-line-cyan px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-cyan hover:bg-cyan hover:text-bg-0 transition-colors"
        >
          Sugerir outra
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="hud-panel flex flex-col gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Item da build</p>
        <div className="relative">
          <input
            value={itemSearch.query}
            onChange={(event) => {
              itemSearch.setQuery(event.target.value);
              setSelectedItem(null);
            }}
            placeholder="Busque o warframe, arma ou item..."
            spellCheck={false}
            className="w-full bg-bg-2 border border-line-2 px-3 py-2 font-body text-sm text-ink-0 placeholder:text-ink-3 outline-none focus:border-line-cyan transition-colors"
          />
          {itemSearch.results.length > 0 && !selectedItem && (
            <div className="absolute z-20 left-0 right-0 mt-1 border border-line-cyan bg-bg-1 max-h-64 overflow-y-auto">
              {itemSearch.results.slice(0, 8).map((hit) => (
                <button
                  key={hit.slug}
                  onClick={() => pickItem(hit)}
                  className="flex items-center gap-3 w-full px-3 py-2 hover:bg-bg-2 transition-colors text-left"
                >
                  {hit.thumb ? (
                    <img src={hit.thumb} alt={hit.name} width={28} height={28} />
                  ) : (
                    <span className="w-7 h-7 border border-line-1" />
                  )}
                  <span className="font-body text-sm text-ink-0">{hit.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedItem && (
          <div className="flex items-center gap-3">
            {selectedItem.thumb && (
              <img src={selectedItem.thumb} alt={selectedItem.name} width={40} height={40} />
            )}
            <span className="font-body text-sm text-cyan">{selectedItem.name}</span>
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="hud-panel flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">
              Configuração de mods
            </p>
            <span className="font-mono text-[10px] uppercase text-ink-3">{filledCount} preenchidos</span>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex flex-row gap-3 lg:flex-col lg:w-32 lg:shrink-0">
              {SIDE_SLOTS.map((slot) => (
                <div key={slot.id} className="flex-1 lg:flex-none">
                  <Slot
                    slot={slot}
                    mod={slots[slot.id]}
                    onPick={() => setActiveSlot(slot)}
                    onClear={() => clearSlot(slot.id)}
                  />
                </div>
              ))}
            </div>

            <div className="hidden lg:block w-px self-stretch bg-line-1" />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 flex-1">
              {MAIN_SLOTS.map((slot) => (
                <Slot
                  key={slot.id}
                  slot={slot}
                  mod={slots[slot.id]}
                  onPick={() => setActiveSlot(slot)}
                  onClear={() => clearSlot(slot.id)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 border-t border-line-1 pt-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">Arcanas</p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              {ARCANE_SLOTS.map((slot) => (
                <Slot
                  key={slot.id}
                  slot={slot}
                  mod={slots[slot.id]}
                  onPick={() => setActiveSlot(slot)}
                  onClear={() => clearSlot(slot.id)}
                />
              ))}
            </div>
          </div>

          {filledCount > 0 && (
            <div className="flex flex-col gap-2 border-t border-line-1 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Notas (opcional)</p>
              {ALL_SLOTS.filter((slot) => slots[slot.id]).map((slot) => (
                <div key={slot.id} className="flex items-center gap-3">
                  <span className="font-body text-xs text-ink-1 w-40 shrink-0 truncate">
                    {slots[slot.id].modName}
                  </span>
                  <input
                    value={slots[slot.id].note}
                    onChange={(event) => setNote(slot.id, event.target.value)}
                    placeholder="Por que esse mod nessa build?"
                    className="flex-1 bg-bg-2 border border-line-2 px-2 py-1 font-body text-xs text-ink-1 placeholder:text-ink-3 outline-none focus:border-line-cyan"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedItem && filledCount > 0 && (
        <div className="hud-panel flex flex-col gap-3">
          <input
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="Seu nick (opcional, aparece como crédito)"
            maxLength={40}
            className="w-full bg-bg-2 border border-line-2 px-3 py-2 font-body text-sm text-ink-0 placeholder:text-ink-3 outline-none focus:border-line-cyan transition-colors"
          />
          {error && <p className="font-body text-sm text-down">{error}</p>}
          <button
            onClick={submit}
            disabled={submitting}
            className="border border-line-cyan bg-cyan-faint px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-cyan hover:bg-cyan hover:text-bg-0 transition-colors disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Enviar sugestão para revisão"}
          </button>
        </div>
      )}

      {activeSlot && (
        <SearchOverlay
          title={`Escolher mod · ${activeSlot.label}`}
          onPick={assignSlot}
          onClose={() => setActiveSlot(null)}
        />
      )}
    </div>
  );
}