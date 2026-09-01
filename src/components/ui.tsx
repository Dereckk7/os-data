/**
 * Composants transverses : reveal, skeletons, états vides/erreur,
 * toggles, avatars, timeline, nombres animés, statuts d'agents…
 */
import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "../lib/services";
import { prefersReducedMotion } from "../lib/theme";
import type { ActivityEvent, AgentStatus, Priority, RequestStatus, Tone } from "../lib/types";
import { GlassBadge, GlassButton } from "./glass";

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ————— Fondu d'onglets / de vues —————
   Quand la clé `k` change, le motion.div est re-monté et fond en entrée.
   Volontairement SANS AnimatePresence : un simple keyed-remount ne peut
   jamais bloquer le rendu (aucune attente de sortie). Transform + opacity
   uniquement ; coupé si prefers-reduced-motion. */
export function FadeSwitch({ k, children, className }: { k: string; children: ReactNode; className?: string }) {
  const reduce = prefersReducedMotion();
  return (
    <motion.div
      key={k}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.2, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ————— Révélation au scroll ————— */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  // Rendu direct : la visibilité du contenu ne dépend d'AUCUNE animation.
  // Un fondu d'entrée purement CSS (classe .reveal-in) qui, s'il ne s'exécute
  // pas, laisse le contenu à opacity:1 — jamais masqué.
  return (
    <div className={["reveal-in", className].filter(Boolean).join(" ")} style={delay ? { animationDelay: `${delay}s` } : undefined}>
      {children}
    </div>
  );
}

/* ————— Nombre animé (compté bref, 420 ms) ————— */
export function AnimatedNumber({ value, className }: { value: string; className?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) { setDisplay(value); return; }
    prev.current = value;
    if (prefersReducedMotion()) { setDisplay(value); return; }
    const m = value.match(/^([\d\s.,]+)(.*)$/);
    if (!m) { setDisplay(value); return; }
    const target = parseFloat(m[1].replace(/[\s.,]/g, ""));
    const suffix = m[2];
    if (Number.isNaN(target)) { setDisplay(value); return; }
    const start = performance.now();
    const dur = 420;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(`${Math.round(target * eased)}${suffix}`);
      if (t < 1) raf = requestAnimationFrame(step);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={className}>{display}</span>;
}

/* ————— Icône à tracé animé ————— */
export function AnimatedIcon({ children, trigger = "hover", delay = 0, className }: {
  children: ReactNode; trigger?: "hover" | "mount"; delay?: number; className?: string;
}) {
  const [key, setKey] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (trigger !== "mount" || prefersReducedMotion()) return;
    const t = window.setTimeout(() => setKey((k) => k + 1), delay * 1000);
    return () => window.clearTimeout(t);
  }, [trigger, delay]);

  const onEnter = () => {
    if (trigger !== "hover" || prefersReducedMotion()) return;
    setKey((k) => k + 1);
  };

  useEffect(() => {
    if (key === 0 || prefersReducedMotion()) return;
    const root = ref.current;
    if (!root) return;
    const paths = Array.from(root.querySelectorAll("path, circle, line, polyline, rect"));
    paths.forEach((p, i) => {
      const el = p as SVGGeometryElement;
      try {
        const len = el.getTotalLength?.() ?? 0;
        if (!len) return;
        el.style.strokeDasharray = String(len);
        el.style.strokeDashoffset = String(len);
        el.style.transition = "none";
        requestAnimationFrame(() => {
          el.style.transition = `stroke-dashoffset 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s`;
          el.style.strokeDashoffset = "0";
        });
      } catch { /* noop */ }
    });
    const total = 600 + paths.length * 40 + delay * 1000;
    const t = window.setTimeout(() => {
      paths.forEach((p) => {
        const el = p as SVGGeometryElement;
        el.style.strokeDasharray = "";
        el.style.strokeDashoffset = "";
        el.style.transition = "";
      });
    }, total);
    return () => window.clearTimeout(t);
  }, [key, delay]);

  return (
    <span ref={ref} className={cn("inline-flex", className)} onMouseEnter={onEnter} aria-hidden="true">
      {children}
    </span>
  );
}

/* ————— Skeletons ————— */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

/* ————— États vides / erreur ————— */
export function EmptyState({ icon, title, desc, action, className }: {
  icon?: ReactNode; title: string; desc?: string; action?: ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <span className="grid h-11 w-11 place-items-center rounded-[12px] border border-[var(--hairline)] bg-[var(--surface-2)] text-cream/60">
        {icon ?? <Inbox size={18} strokeWidth={1.5} />}
      </span>
      <p className="mt-4 text-[15px] font-semibold">{title}</p>
      {desc && <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-cream/50">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, desc, onRetry, className }: {
  title: string; desc?: string; onRetry?: () => void; className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <span className="grid h-11 w-11 place-items-center rounded-[12px] border border-ember/25 bg-ember/10 text-ember">
        <AlertTriangle size={18} strokeWidth={1.5} />
      </span>
      <p className="mt-4 text-[15px] font-semibold">{title}</p>
      {desc && <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-cream/50">{desc}</p>}
      {onRetry && <GlassButton variant="soft" size="sm" className="mt-5" onClick={onRetry}>Réessayer</GlassButton>}
    </div>
  );
}

/* ————— Toggle ————— */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-[22px] w-10 shrink-0 rounded-full border transition-colors duration-300", checked ? "border-jade/40 bg-jade/35" : "border-[var(--hairline-strong)] bg-[var(--surface-3)]")}
    >
      <span className={cn("absolute top-1/2 h-[16px] w-[16px] -translate-y-1/2 rounded-full transition-all duration-300", checked ? "left-[21px] bg-jade" : "left-[3px] bg-cream/45")} />
    </button>
  );
}

/* ————— Avatar ————— */
const avatarPalette = [
  "bg-champagne-500/15 text-champagne-300 border-champagne-500/25",
  "bg-jade/12 text-jade border-jade/25",
  "bg-saffron/12 text-saffron border-saffron/25",
  "bg-ink-600/40 text-cream/70 border-[var(--hairline)]",
  "bg-ember/12 text-ember border-ember/25",
];
export const Avatar = memo(function Avatar({ initials, name = "", size = 32, className }: { initials: string; name?: string; size?: number; className?: string }) {
  const idx = Math.abs([...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)) % avatarPalette.length;
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full border font-semibold", avatarPalette[idx], className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
});

/* ————— Badges métier ————— */
const statusTone: Record<RequestStatus, Tone> = {
  "En recherche": "gold", "À valider": "warning", "En attente client": "neutral",
  "Confirmée": "success", "En retard": "danger", "Traitée": "neutral",
};
export const StatusBadge = memo(function StatusBadge({ status, pulse }: { status: RequestStatus; pulse?: boolean }) {
  // Repli sûr : un statut hors de l'ensemble attendu retombe sur "neutral"
  // (jamais de crash / de tone undefined).
  const tone = statusTone[status] ?? "neutral";
  return (
    <GlassBadge tone={tone} dot pulse={pulse && (status === "En recherche" || status === "En retard")}>
      {status}
    </GlassBadge>
  );
});

const priorityTone: Record<Priority, Tone> = { Critique: "danger", Haute: "warning", Normale: "neutral", Basse: "neutral" };
export const PriorityBadge = memo(function PriorityBadge({ priority }: { priority: Priority }) {
  return <GlassBadge tone={priorityTone[priority]}>{priority}</GlassBadge>;
});

/* ————— Statuts d'agents ————— */
const agentStatusMeta: Record<AgentStatus, { tone: Tone; symbol: string; label: string }> = {
  "Opérationnel": { tone: "success", symbol: "●", label: "Actif" },
  "En veille": { tone: "neutral", symbol: "Ⅱ", label: "En pause" },
  "Maintenance": { tone: "neutral", symbol: "Ⅱ", label: "En pause" },
  "En attente": { tone: "warning", symbol: "○", label: "En attente" },
  "Erreur": { tone: "danger", symbol: "!", label: "Attention" },
};
export const AgentStatusBadge = memo(function AgentStatusBadge({ status, withSymbol = true }: { status: AgentStatus; withSymbol?: boolean }) {
  const m = agentStatusMeta[status];
  return (
    <GlassBadge tone={m.tone} dot={status === "Opérationnel"} pulse={status === "Opérationnel"}>
      {withSymbol && <span className="text-[9px] leading-none">{m.symbol}</span>}
      {m.label}
    </GlassBadge>
  );
});

/* ————— Segmented control ————— */
export function SegmentedControl<T extends string>({ options, value, onChange, className, size = "md" }: {
  options: { value: T; label: string; icon?: ReactNode }[]; value: T; onChange: (v: T) => void;
  className?: string; size?: "sm" | "md";
}) {
  return (
    <div role="tablist" className={cn("inline-flex items-center gap-0.5 rounded-[12px] border border-[var(--hairline)] bg-[var(--surface-2)] p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value} role="tab" aria-selected={active} onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[9px] font-medium transition-all duration-200",
              size === "sm" ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-xs",
              active ? "bg-cream text-ink-950 shadow-[0_2px_10px_rgba(0,0,0,0.15)]" : "text-cream/62 hover:text-cream/80"
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ————— Timeline d'activité ————— */
export function ActivityFeed({ events, className }: { events: ActivityEvent[]; className?: string }) {
  return (
    <ol className={cn("space-y-0", className)}>
      {events.map((e, i) => (
        <li key={e.id} className="grid grid-cols-[52px_14px_1fr] gap-x-1">
          <span className={cn("num pt-[3px] text-right text-[10.5px] leading-5", e.live ? "text-jade" : "text-cream/60")}>{e.time}</span>
          <span className="relative flex justify-center">
            <span
              className={cn(
                "z-10 mt-[7px] h-[7px] w-[7px] rounded-full border",
                e.live ? "border-jade/60 bg-jade pulse-dot" : e.agent ? "border-champagne-500/50 bg-champagne-500/25" : "border-white/20 bg-[var(--surface-3)]"
              )}
            />
            {i < events.length - 1 && <span className="absolute top-0 bottom-0 w-px bg-[var(--surface-3)]" aria-hidden />}
          </span>
          <span className={cn("block", i < events.length - 1 ? "pb-4" : "pb-0.5")}>
            <span className={cn("block text-[13px] font-medium leading-5", e.live && "text-cream")}>
              {e.title}
              {e.live && <span className="num ml-2 align-middle text-[9px] uppercase tracking-[0.14em] text-jade/80">direct</span>}
            </span>
            {e.desc && <span className="mt-0.5 block text-xs leading-relaxed text-cream/62">{e.desc}</span>}
            {e.agent && <span className="num mt-1 block text-[9.5px] uppercase tracking-[0.12em] text-cream/52">{e.agent}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
