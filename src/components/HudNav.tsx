"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import AccessibilityControls from "@/components/AccessibilityControls";

const items = [
  {
    href: "/",
    label: "Dashboard",
    desc: "Market pulse · feed",
  },
];

const CHAMFER = "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))";

function HomeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="miter"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d="M3 11 L10.5 4.5 L13.5 4.5 L21 11" />
      <path d="M5.5 10 V19.5 H18.5 V10" />
      <path d="M10.3 19.5 V14 H13.7 V19.5" />
    </svg>
  );
}

export default function HudNav() {
  const pathname = usePathname();
  const homeActive = pathname === "/";

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-line-2 bg-glass backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1680px] items-center gap-4 px-6">
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            aria-label="Início"
            title="Início"
            aria-current={homeActive ? "page" : undefined}
            className={`flex h-9 w-9 items-center justify-center border transition-colors ${
              homeActive
                ? "border-line-cyan bg-cyan-faint text-cyan"
                : "border-line-2 text-ink-2 hover:border-line-cyan hover:text-cyan"
            }`}
            style={{ clipPath: CHAMFER }}
          >
            <HomeIcon />
          </Link>

          <Link href="/" className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3">
              NAV
            </span>
            <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-cyan">
              Dagath
            </span>
          </Link>
        </div>

        <div className="flex-1 flex justify-center">
          <SearchBar />
        </div>

        <div className="hidden md:block shrink-0">
          <AccessibilityControls />
        </div>

        <div className="flex items-stretch gap-1 shrink-0">
          {items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href) ?? false;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col justify-center border-b-2 px-4 py-2 transition-colors ${
                  active
                    ? "border-cyan bg-cyan-faint"
                    : "border-transparent hover:bg-bg-2"
                }`}
              >
                <span
                  className={`font-display text-xs font-semibold uppercase tracking-wider ${
                    active ? "text-cyan" : "text-ink-1"
                  }`}
                >
                  {item.label}
                </span>
                <span className="hidden font-body text-[10px] text-ink-3 lg:block">
                  {item.desc}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
