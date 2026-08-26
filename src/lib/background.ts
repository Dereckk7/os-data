/**
 * Le background est un langage visuel du DATA OS : chaque page a sa
 * personnalité, le fond réagit aux changements de page (micro-vague)
 * et au travail des agents (micro-pulsations locales).
 */
export type BgMode = "calm" | "structured" | "dynamic" | "quiet" | "still" | "lively";

const ROUTE_MODES: Record<string, BgMode> = {
  "/dashboard": "calm",     // Overview — très calme, texture quasi invisible
  "/operations": "structured",
  "/agents": "dynamic",
  "/insights": "structured", // Insights — un peu plus « analytique »
  "/reports": "still",       // Rapports — calme maximal, lisibilité prioritaire
  "/settings": "still",
  "/cowork": "lively",
};

export function modeForPath(pathname: string): BgMode {
  const root = "/" + pathname.split("/")[1];
  return ROUTE_MODES[root] ?? "calm";
}

export interface BgEvent { type: "wave" | "pulse"; x?: number; y?: number; strength?: number; }
type Listener = (e: BgEvent) => void;
const listeners = new Set<Listener>();

export const bgBus = {
  on(fn: Listener): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; },
  emit(e: BgEvent): void { listeners.forEach((fn) => fn(e)); },
};

export const emitWave = (x?: number, y?: number) => bgBus.emit({ type: "wave", x, y });
export const emitPulse = (strength = 0.5, x?: number, y?: number) => bgBus.emit({ type: "pulse", x, y, strength });
