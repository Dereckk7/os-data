/**
 * Thème & confort visuel DATA OS.
 * Light (défaut) / Dark / Comfort / System + motion, contraste, densité,
 * taille du texte. Persisté en localStorage — remplaçable par les
 * préférences utilisateur Supabase.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type ThemeMode = "dark" | "light" | "system" | "comfort";
export type ResolvedTheme = "dark" | "light";
export type MotionPref = "full" | "reduced";
export type ContrastPref = "standard" | "high";
export type DensityPref = "compact" | "confort" | "spacieux";
export type FontPref = "default" | "large";

const THEME_KEY = "dataos.theme.v1";
const PREFS_KEY = "dataos.prefs.v1";

const safeGet = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };

function readStoredTheme(): ThemeMode {
  const v = safeGet(THEME_KEY);
  return v === "light" || v === "system" || v === "comfort" || v === "dark" ? v : "light";
}

function systemResolved(): ResolvedTheme {
  try { return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; } catch { return "light"; }
}

/* Le mode Comfort résout sur la base sombre + attribut dédié (voir index.css). */
function resolveMode(mode: ThemeMode): { resolved: ResolvedTheme; comfort: boolean } {
  if (mode === "system") return { resolved: systemResolved(), comfort: false };
  if (mode === "comfort") return { resolved: "dark", comfort: true };
  return { resolved: mode, comfort: false };
}

let themeAnimTimer: number | null = null;

function applyTheme(resolved: ResolvedTheme, comfort: boolean, animate = true) {
  const root = document.documentElement;

  /* Crossfade des couleurs uniquement sur changement réel de thème —
     jamais au montage initial (sinon les transitions d'entrée de l'app
     sont court-circuitées). La classe est retirée sitôt le fondu fini. */
  if (animate && !prefersReducedMotionRaw()) {
    root.classList.add("theme-anim");
    if (themeAnimTimer !== null) window.clearTimeout(themeAnimTimer);
    themeAnimTimer = window.setTimeout(() => {
      root.classList.remove("theme-anim");
      themeAnimTimer = null;
    }, 400);
  }

  root.dataset.theme = resolved;
  if (comfort) root.dataset.comfort = "true";
  else delete root.dataset.comfort;
  root.style.backgroundColor = resolved === "light" ? "#f4f3ef" : "#08090a";
}

function prefersReducedMotionRaw(): boolean {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  catch { return false; }
}

interface ThemeContextValue { mode: ThemeMode; resolved: ResolvedTheme; setMode: (m: ThemeMode) => void; }
const ThemeContext = createContext<ThemeContextValue>({ mode: "light", resolved: "light", setMode: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredTheme);
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveMode(mode).resolved);
  const firstRun = useRef(true);

  useEffect(() => {
    const animate = !firstRun.current;
    firstRun.current = false;
    const { resolved: r, comfort } = resolveMode(mode);
    applyTheme(r, comfort, animate);
    setResolved(r);
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const { resolved: rr, comfort: cc } = resolveMode("system");
      applyTheme(rr, cc, true);
      setResolved(rr);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try { localStorage.setItem(THEME_KEY, m); } catch { /* noop */ }
  }, []);

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);

/* ————— Préférences de confort ————— */
interface Prefs { motion: MotionPref; contrast: ContrastPref; density: DensityPref; fontSize: FontPref; sounds: boolean; }
const defaultPrefs: Prefs = { motion: "full", contrast: "standard", density: "confort", fontSize: "default", sounds: false };

function readPrefs(): Prefs {
  const raw = safeGet(PREFS_KEY);
  if (!raw) return defaultPrefs;
  try { return { ...defaultPrefs, ...JSON.parse(raw) }; } catch { return defaultPrefs; }
}

interface PrefsContextValue extends Prefs { set: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void; scale: number; }
const PrefsContext = createContext<PrefsContextValue>({ ...defaultPrefs, set: () => {}, scale: 1 });

const densityScale: Record<DensityPref, number> = { compact: 0.93, confort: 1, spacieux: 1.06 };
const fontScale: Record<FontPref, number> = { default: 1, large: 1.08 };

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = prefs.motion;
    root.dataset.contrast = prefs.contrast;
    root.style.fontSize = `${16 * densityScale[prefs.density] * fontScale[prefs.fontSize]}px`;
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* noop */ }
  }, [prefs]);

  const set = useCallback(<K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  }, []);

  const scale = densityScale[prefs.density] * fontScale[prefs.fontSize];
  const value = useMemo(() => ({ ...prefs, set, scale }), [prefs, set]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}
export const usePrefs = () => useContext(PrefsContext);

/** Vrai si l'utilisateur ou le système demande moins de mouvement. */
export function prefersReducedMotion(): boolean {
  try {
    return (
      document.documentElement.dataset.motion === "reduced" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  } catch { return false; }
}
