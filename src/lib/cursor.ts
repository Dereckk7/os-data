/**
 * Tracker de curseur global — source unique de position souris.
 * Une seule boucle rAF interpole (lerp) la position et met à jour les
 * variables CSS --gx/--gy/--ga des surfaces enregistrées. Rects mis en
 * cache (jamais de getBoundingClientRect par frame).
 * Expose le niveau de performance détecté (HIGH/MEDIUM/LOW) sur
 * <html data-perf>.
 */
import { prefersReducedMotion } from "./theme";

export type PerfTier = "high" | "medium" | "low";

function detectTier(): PerfTier {
  try {
    const nav = navigator as unknown as { deviceMemory?: number };
    const mem = nav.deviceMemory ?? 8;
    const cores = navigator.hardwareConcurrency ?? 8;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse || mem <= 2 || cores <= 2) return "low";
    if (mem <= 4 || cores <= 4) return "medium";
    return "high";
  } catch { return "medium"; }
}

const tier: PerfTier = detectTier();
try { document.documentElement.dataset.perf = tier; } catch { /* noop */ }
export const getPerfTier = (): PerfTier => tier;

interface Entry { el: HTMLElement; rect: { left: number; top: number; width: number; height: number }; gx: number; gy: number; ga: number; }

const entries = new Set<Entry>();
let raf = 0;
let targetX = 0; let targetY = 0;
let smoothX = 0; let smoothY = 0;
let scrollTimer = 0;
let started = false;

function refreshRects() {
  entries.forEach((e) => {
    const r = e.el.getBoundingClientRect();
    e.rect = { left: r.left, top: r.top, width: r.width, height: r.height };
  });
}

function loop() {
  smoothX += (targetX - smoothX) * 0.18;
  smoothY += (targetY - smoothY) * 0.18;
  entries.forEach((e) => {
    const inside =
      smoothX >= e.rect.left - 40 && smoothX <= e.rect.left + e.rect.width + 40 &&
      smoothY >= e.rect.top - 40 && smoothY <= e.rect.top + e.rect.height + 40;
    const wantAlpha = inside ? 1 : 0;
    e.ga += (wantAlpha - e.ga) * 0.12;
    if (e.ga > 0.01) {
      const gx = smoothX - e.rect.left;
      const gy = smoothY - e.rect.top;
      if (Math.abs(gx - e.gx) > 0.5) { e.gx = gx; e.el.style.setProperty("--gx", `${gx.toFixed(1)}px`); }
      if (Math.abs(gy - e.gy) > 0.5) { e.gy = gy; e.el.style.setProperty("--gy", `${gy.toFixed(1)}px`); }
    }
    const cur = parseFloat(e.el.style.getPropertyValue("--ga") || "0");
    if (Math.abs(e.ga - cur) > 0.02) e.el.style.setProperty("--ga", e.ga.toFixed(3));
  });
  raf = requestAnimationFrame(loop);
}

function ensureRunning() {
  if (raf === 0 && entries.size > 0) { smoothX = targetX; smoothY = targetY; raf = requestAnimationFrame(loop); }
  else if (raf !== 0 && entries.size === 0) { cancelAnimationFrame(raf); raf = 0; }
}

function start() {
  if (started) return;
  started = true;
  window.addEventListener("pointermove", (e: PointerEvent) => { targetX = e.clientX; targetY = e.clientY; }, { passive: true });
  const schedule = () => { window.clearTimeout(scrollTimer); scrollTimer = window.setTimeout(refreshRects, 120); };
  window.addEventListener("scroll", schedule, { passive: true, capture: true });
  window.addEventListener("resize", schedule, { passive: true });
}

/** Enregistre une surface pour l'éclairage réactif. Retourne unregister. */
export function registerGlass(el: HTMLElement): () => void {
  try {
    if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion() || tier === "low") return () => {};
  } catch { return () => {}; }
  start();
  const r = el.getBoundingClientRect();
  const entry: Entry = { el, rect: { left: r.left, top: r.top, width: r.width, height: r.height }, gx: r.width / 2, gy: 0, ga: 0 };
  entries.add(entry);
  ensureRunning();
  return () => { entries.delete(entry); el.style.removeProperty("--ga"); ensureRunning(); };
}
