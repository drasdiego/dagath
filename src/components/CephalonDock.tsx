"use client";

import { useState, type CSSProperties } from "react";
import ConsoleTerminal from "@/components/ConsoleTerminal";

// Torna o painel opaco no modo flutuante: sobrescreve o glass translúcido por
// um fundo sólido só aqui, para o conteúdo atrás não atrapalhar a leitura.
const OPAQUE_SURFACE = { "--surface-glass": "var(--bg-1)" } as CSSProperties;

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8z" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="18" x2="19" y2="18" />
    </svg>
  );
}

export default function CephalonDock() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* O painel fica sempre montado para preservar a conversa; minimizar só o
          esconde, em vez de destruir o estado. */}
      <div
        role="dialog"
        aria-label="Cephalon, assistente Dagath"
        aria-hidden={!open}
        style={OPAQUE_SURFACE}
        className={`fixed bottom-24 right-4 z-50 w-[min(420px,calc(100vw-2rem))] h-[min(70vh,640px)] shadow-2xl ${
          open ? "" : "hidden"
        }`}
      >
        <ConsoleTerminal embedded onMinimize={() => setOpen(false)} />
      </div>

      <button
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Minimizar Cephalon" : "Abrir Cephalon"}
        aria-expanded={open}
        title="Cephalon · Assistente"
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border px-5 py-3 font-display text-xs font-semibold uppercase tracking-[0.2em] shadow-lg backdrop-blur-md transition-colors ${
          open
            ? "border-line-cyan bg-cyan-faint text-cyan"
            : "border-line-cyan bg-glass text-cyan hover:bg-cyan-faint"
        }`}
      >
        {open ? <MinimizeIcon /> : <ChatIcon />}
        {open ? "Minimizar" : "Cephalon"}
      </button>
    </>
  );
}
