/**
 * AmbientDataBackground — « intelligent data environment ».
 * Fond · flux organiques lents · DotField (personnalité par page) ·
 * grain · halo curseur. Couleurs déterminées par le thème.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import DotField, { type DotFieldProps } from "./DotField";
import { modeForPath } from "../lib/background";
import { prefersReducedMotion, useTheme } from "../lib/theme";

type Preset = Partial<DotFieldProps>;

const PRESETS: Record<string, Preset> = {
  calm:       { dotSpacing: 26, bulgeStrength: 44, cursorRadius: 340, sparkle: false, waveAmplitude: 0,   opacity: 0.7 },
  structured: { dotSpacing: 22, bulgeStrength: 52, cursorRadius: 320, sparkle: false, waveAmplitude: 0,   opacity: 1 },
  dynamic:    { dotSpacing: 24, bulgeStrength: 58, cursorRadius: 360, sparkle: true,  waveAmplitude: 0,   opacity: 1 },
  quiet:      { dotSpacing: 30, bulgeStrength: 30, cursorRadius: 300, sparkle: false, waveAmplitude: 0,   opacity: 0.8 },
  still:      { dotSpacing: 32, bulgeStrength: 18, cursorRadius: 260, sparkle: false, waveAmplitude: 0,   opacity: 0.55 },
  lively:     { dotSpacing: 22, bulgeStrength: 50, cursorRadius: 360, sparkle: true,  waveAmplitude: 0.6, opacity: 1 },
};

function useMotionPref(): boolean {
  const [reduced, setReduced] = useState(() => prefersReducedMotion());
  useEffect(() => {
    const update = () => setReduced(prefersReducedMotion());
    let mq: MediaQueryList | null = null;
    try {
      mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", update);
    } catch { /* noop */ }
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    return () => {
      try { mq?.removeEventListener("change", update); } catch { /* noop */ }
      obs.disconnect();
    };
  }, []);
  return reduced;
}

export default function AmbientDataBackground() {
  const glowRef = useRef<HTMLDivElement>(null);
  const reduced = useMotionPref();
  const { resolved } = useTheme();
  const location = useLocation();

  const mode = useMemo(() => modeForPath(location.pathname), [location.pathname]);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow || reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 3;
    let x = tx; let y = ty;
    let visible = false;
    const loop = () => {
      x += (tx - x) * 0.07;
      y += (ty - y) * 0.07;
      glow.style.transform = `translate3d(${x - 280}px, ${y - 280}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      if (!visible) { visible = true; glow.style.opacity = "1"; }
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  const isLight = resolved === "light";
  const preset = PRESETS[mode] ?? PRESETS.calm;
  const colors = isLight
    ? { gradientFrom: "rgba(28,26,22,0.07)", gradientTo: "rgba(168,138,99,0.05)", glowColor: "rgba(168,138,99,0.06)" }
    : { gradientFrom: "rgba(244,242,236,0.12)", gradientTo: "rgba(196,168,130,0.04)", glowColor: "rgba(196,168,130,0.07)" };

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-ink-950 transition-colors duration-500" />
      <div className="amb-flow amb-flow-1" />
      <div className="amb-flow amb-flow-2" />
      <DotField {...colors} {...preset} staticMode={reduced} />
      <div className="amb-noise absolute inset-0" />
      <div ref={glowRef} className="amb-glow hidden opacity-0 transition-opacity duration-700 md:block" />
    </div>
  );
}
