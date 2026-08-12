"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";
export const THEME_STORAGE_KEY = "gls-theme";

/** Lets every mounted toggle re-read the store when one of them changes it. */
const THEME_EVENT = "gls-theme-change";

/**
 * Runs before first paint (see RootLayout) so the saved theme is applied while
 * the browser is still parsing HTML — no flash of the wrong theme, and no
 * hydration mismatch because React never renders the attribute itself.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

function subscribe(onChange: () => void): () => void {
  window.addEventListener(THEME_EVENT, onChange);
  // Keep other tabs in sync too.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "dark" || saved === "light" ? saved : "system";
  } catch {
    // Private browsing can block storage; fall back to following the OS.
    return "system";
  }
}

/** The server has no localStorage, so it always renders the "system" state. */
function serverTheme(): Theme {
  return "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable — the choice still applies for this page view.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀" },
  { value: "dark", label: "Dark", icon: "☾" },
  { value: "system", label: "System", icon: "◐" },
];

export function ThemeToggle() {
  // useSyncExternalStore reads the stored theme without a hydration mismatch:
  // React uses the server snapshot while hydrating, then switches to the real
  // one — no setState in an effect, no flash.
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5"
    >
      {OPTIONS.map((opt) => {
        const selected = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            title={`${opt.label} theme`}
            onClick={() => applyTheme(opt.value)}
            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-sm leading-none transition-colors ${
              selected
                ? "bg-brand text-brand-foreground"
                : "text-foreground/55 hover:bg-surface-sunk hover:text-foreground"
            }`}
          >
            <span aria-hidden="true">{opt.icon}</span>
            <span className="sr-only">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
