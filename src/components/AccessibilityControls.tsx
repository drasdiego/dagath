"use client";

import { useEffect, useState } from "react";

const ZOOM_MIN = 0.8;
const ZOOM_MAX = 1.4;
const ZOOM_STEP = 0.1;
const ZOOM_KEY = "dagath-zoom";
const THEME_KEY = "dagath-theme";
const GLOW_KEY = "dagath-glow";

type Theme = "dark" | "light";
type Glow = "full" | "low";

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="7" y2="7" />
      <line x1="17" y1="17" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="7" y2="17" />
      <line x1="17" y1="7" x2="19.1" y2="4.9" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function GlowIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 L13.6 10.4 L21 12 L13.6 13.6 L12 21 L10.4 13.6 L3 12 L10.4 10.4 Z" />
    </svg>
  );
}

export default function AccessibilityControls() {
  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<Theme>("dark");
  const [glow, setGlow] = useState<Glow>("full");

  useEffect(() => {
    try {
      const savedZoom = localStorage.getItem(ZOOM_KEY);
      if (savedZoom) {
        const parsed = parseFloat(savedZoom);
        if (!Number.isNaN(parsed)) setZoom(parsed);
      }
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }
      const savedGlow = localStorage.getItem(GLOW_KEY);
      if (savedGlow === "low" || savedGlow === "full") {
        setGlow(savedGlow);
      }
    } catch {
      setZoom(1);
      setTheme("dark");
      setGlow("full");
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.zoom = String(zoom);
    try {
      localStorage.setItem(ZOOM_KEY, String(zoom));
    } catch {}
  }, [zoom]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-glow", glow);
    try {
      localStorage.setItem(GLOW_KEY, glow);
    } catch {}
  }, [glow]);

  function decrease() {
    setZoom((current) => Math.max(ZOOM_MIN, Math.round((current - ZOOM_STEP) * 10) / 10));
  }

  function increase() {
    setZoom((current) => Math.min(ZOOM_MAX, Math.round((current + ZOOM_STEP) * 10) / 10));
  }

  function reset() {
    setZoom(1);
  }

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  function toggleGlow() {
    setGlow((current) => (current === "full" ? "low" : "full"));
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={decrease}
        disabled={zoom <= ZOOM_MIN}
        aria-label="Diminuir tamanho da fonte"
        className="border border-line-2 px-2 py-1 font-mono text-[10px] text-ink-2 hover:border-line-cyan hover:text-cyan transition-colors disabled:opacity-40 disabled:hover:border-line-2 disabled:hover:text-ink-2"
      >
        A-
      </button>
      <button
        onClick={reset}
        aria-label="Restaurar tamanho da fonte"
        className="border border-line-2 px-2 py-1 font-mono text-[10px] text-ink-3 hover:border-line-cyan hover:text-cyan transition-colors min-w-12"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        onClick={increase}
        disabled={zoom >= ZOOM_MAX}
        aria-label="Aumentar tamanho da fonte"
        className="border border-line-2 px-2 py-1 font-mono text-[10px] text-ink-2 hover:border-line-cyan hover:text-cyan transition-colors disabled:opacity-40 disabled:hover:border-line-2 disabled:hover:text-ink-2"
      >
        A+
      </button>
      <button
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
        title={theme === "dark" ? "Tema claro" : "Tema escuro"}
        className="border border-line-2 p-1.5 text-ink-2 hover:border-line-cyan hover:text-cyan transition-colors ml-1"
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
      <button
        onClick={toggleGlow}
        aria-label={glow === "full" ? "Reduzir brilho" : "Restaurar brilho"}
        aria-pressed={glow === "low"}
        title={glow === "full" ? "Reduzir brilho" : "Restaurar brilho"}
        className={`border p-1.5 transition-colors ${
          glow === "low"
            ? "border-line-cyan bg-cyan-faint text-cyan"
            : "border-line-2 text-ink-2 hover:border-line-cyan hover:text-cyan"
        }`}
      >
        <GlowIcon active={glow === "low"} />
      </button>
    </div>
  );
}