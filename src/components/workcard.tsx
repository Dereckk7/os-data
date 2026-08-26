/**
 * WorkCard — la carte opérationnelle du DATA OS.
 * Couleur sémantique liée au type d'objet (demande, opération, action
 * critique…), en accent uniquement. Les intervenants sont des agents.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, Clock, MoreHorizontal, Plus } from "lucide-react";
import { cn } from "../lib/services";
import { useGlassLight } from "./glass";
import { AgentGlyph } from "./icons";
import type { WorkTone } from "../lib/types";

export type { WorkTone };

const TONE: Record<WorkTone, { bar: string; text: string; fill: string; ring: string }> = {
  blue: { bar: "bg-[var(--type-blue)]", text: "text-[var(--type-blue)]", fill: "var(--type-blue)", ring: "border-[var(--type-blue)]" },
  violet: { bar: "bg-[var(--type-violet)]", text: "text-[var(--type-violet)]", fill: "var(--type-violet)", ring: "border-[var(--type-violet)]" },
  orange: { bar: "bg-[var(--type-orange)]", text: "text-[var(--type-orange)]", fill: "var(--type-orange)", ring: "border-[var(--type-orange)]" },
  ember: { bar: "bg-ember/85", text: "text-ember", fill: "#c9635a", ring: "border-ember/60" },
  jade: { bar: "bg-jade/85", text: "text-jade", fill: "#8ab291", ring: "border-jade/60" },
  gold: { bar: "bg-champagne-500/85", text: "text-champagne-300", fill: "#c9b27c", ring: "border-champagne-500/60" },
  neutral: { bar: "bg-cream/45", text: "text-cream/55", fill: "rgba(245,245,242,0.45)", ring: "border-cream/30" },
};

function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

function fmtRemaining(ms: number): string | null {
  if (ms <= 0) return null;
  const min = Math.ceil(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return m > 0 ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
  return `${Math.floor(h / 24)} j ${h % 24} h`;
}

export function AgentAvatar({ agentId, tint, name, working, size = 26 }: {
  agentId: string; tint: string; name: string; working?: boolean; size?: number;
}) {
  return (
    <span
      title={`${name}${working ? " · en activité" : ""}`}
      className={cn("agent-tile relative grid shrink-0 place-items-center rounded-full border-[1.5px] border-ink-900", working && "agent-breathe")}
      style={{ width: size, height: size, "--tint": tint } as React.CSSProperties}
    >
      <AgentGlyph agentId={agentId} size={Math.round(size * 0.5)} strokeWidth={1.6} />
      {working && <span className="absolute -right-[1px] -bottom-[1px] h-[7px] w-[7px] rounded-full border border-ink-900 bg-jade pulse-dot" />}
    </span>
  );
}

export interface WorkStep { id: string; label: string; state: "done" | "active" | "todo"; }

function StepRow({ step, tone }: { step: WorkStep; tone: WorkTone }) {
  return (
    <li className="flex items-center gap-2.5 py-[3px]">
      {step.state === "done" ? (
        <Check size={12} strokeWidth={2.25} className="shrink-0 text-jade" />
      ) : step.state === "active" ? (
        <span className={cn("relative grid h-[13px] w-[13px] shrink-0 place-items-center rounded-full border", TONE[tone].ring)}>
          <span className="h-[5px] w-[5px] rounded-full pulse-dot" style={{ color: TONE[tone].fill, backgroundColor: "currentColor" }} />
        </span>
      ) : (
        <span className="h-[13px] w-[13px] shrink-0 rounded-full border border-cream/20" />
      )}
      <span
        className={cn(
          "text-xs leading-relaxed",
          step.state === "done" && "text-cream/60",
          step.state === "active" && "font-medium text-cream/90",
          step.state === "todo" && "text-cream/35"
        )}
      >
        {step.label}
      </span>
    </li>
  );
}

function CardMenu({ items }: { items: { label: string; onClick: () => void }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Options de la carte" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        className={cn("grid h-7 w-7 place-items-center rounded-[8px] transition-all duration-150", open ? "bg-white/[0.07] text-cream" : "text-cream/35 hover:bg-white/[0.05] hover:text-cream")}
      >
        <MoreHorizontal size={15} strokeWidth={1.75} />
      </button>
      {open && (
        <div className="glass-raised animate-menu-in absolute right-0 top-8 z-30 w-48 rounded-[12px] p-1">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => { setOpen(false); it.onClick(); }}
              className="block w-full rounded-[8px] px-2.5 py-2 text-left text-xs font-medium text-cream/70 transition-colors hover:bg-white/[0.06] hover:text-cream"
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export interface WorkAgent { id: string; name: string; tint: string; working?: boolean; }

export function WorkCard({
  tone, eyebrow, title, desc, when, progress, steps, agents = [], dueIn, urgent,
  menu, onQuickAdd, quickAddLabel = "Ajouter une étape", onOpen, openLabel, className, footerSlot,
}: {
  tone: WorkTone; eyebrow: string; title: string; desc?: string; when?: string; progress: number;
  steps?: WorkStep[]; agents?: WorkAgent[]; dueIn?: number; urgent?: boolean;
  menu?: { label: string; onClick: () => void }[]; onQuickAdd?: () => void; quickAddLabel?: string;
  onOpen?: () => void; openLabel?: string; className?: string; footerSlot?: ReactNode;
}) {
  const t = TONE[tone];
  const lightRef = useGlassLight<HTMLElement>();
  const mountedAt = useRef(Date.now());
  const now = useNow(dueIn !== undefined ? 30000 : 3_600_000);

  const remainingMs = dueIn !== undefined ? dueIn * 60000 - (now - mountedAt.current) : undefined;
  const remaining = remainingMs !== undefined ? fmtRemaining(remainingMs) : undefined;
  const overdue = remainingMs !== undefined && remainingMs <= 0;
  const dueSoon = remainingMs !== undefined && remainingMs > 0 && remainingMs < 60 * 60000;

  const working = agents.filter((a) => a.working);
  const shown = agents.slice(0, 3);
  const extra = agents.length - shown.length;

  return (
    <article
      ref={lightRef}
      className={cn(
        "glass glass-sweep group relative flex h-full flex-col overflow-hidden p-5 pl-6 transition-all duration-200",
        "hover:-translate-y-[2px] hover:border-white/[0.14] hover:bg-white/[0.032]",
        urgent && "border-ember/25",
        className
      )}
      aria-label={title}
    >
      <span className={cn("absolute top-4 bottom-4 left-0 w-[2.5px] rounded-r", t.bar)} aria-hidden />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("num truncate text-[9px] font-semibold uppercase tracking-[0.16em]", t.text)}>{eyebrow}</p>
          {when && <p className="num mt-1 text-[10px] text-cream/35">{when}</p>}
        </div>
        {menu && <CardMenu items={menu} />}
      </div>

      <h3 className="mt-2.5 text-[15px] font-semibold leading-snug tracking-tight">{title}</h3>
      {desc && <p className="mt-1 text-xs leading-relaxed text-cream/50">{desc}</p>}

      <div className="mt-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-cream/35">Progression</span>
          <span className="num text-[11px] font-semibold text-cream/80">{progress}%</span>
        </div>
        <div className="mt-1.5 h-[4px] overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="h-full rounded-full"
            style={{ backgroundColor: t.fill }}
          />
        </div>
      </div>

      {steps && steps.length > 0 && (
        <ul className="mt-3">
          {steps.map((s) => <StepRow key={s.id} step={s} tone={tone} />)}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3.5" style={{ marginTop: "auto" }}>
        <div className="flex min-w-0 items-center gap-2.5">
          {agents.length > 0 && (
            <span className="flex items-center -space-x-2">
              {shown.map((a) => <AgentAvatar key={a.id} agentId={a.id} tint={a.tint} name={a.name} working={a.working} />)}
              {extra > 0 && (
                <span className="num z-10 grid h-[26px] min-w-[26px] place-items-center rounded-full border-[1.5px] border-ink-900 bg-ink-750 px-1 text-[9px] font-semibold text-cream/60">
                  +{extra}
                </span>
              )}
            </span>
          )}
          {working.length > 0 && (
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-jade pulse-dot" />
              <span className="num truncate text-[8.5px] uppercase tracking-[0.14em] text-cream/40">
                {working[0].name.replace("Agent ", "")} · processing
              </span>
            </span>
          )}
          {footerSlot}
        </div>

        {dueIn !== undefined &&
          (overdue ? (
            <span className="num flex shrink-0 items-center gap-1.5 rounded-full border border-ember/35 bg-ember/[0.08] px-2.5 py-1 text-[9.5px] font-semibold text-ember">
              <Clock size={11} strokeWidth={1.75} /> Dépassée
            </span>
          ) : (
            <span
              className={cn(
                "num flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] font-semibold",
                dueSoon || urgent
                  ? "border-[color-mix(in_srgb,var(--type-orange)_40%,transparent)] bg-[color-mix(in_srgb,var(--type-orange)_10%,transparent)] text-[var(--type-orange)]"
                  : "border-white/[0.09] bg-white/[0.03] text-cream/55"
              )}
              title="Échéance"
            >
              <Clock size={11} strokeWidth={1.75} />
              <span className="sr-only">Échéance dans </span>
              {remaining}
            </span>
          ))}
      </div>

      {onOpen && openLabel && (
        <button
          onClick={onOpen}
          className="mt-3.5 inline-flex h-10 w-full items-center justify-center rounded-[10px] border border-white/[0.09] text-xs font-semibold text-cream/80 transition-all duration-200 hover:border-white/[0.2] hover:bg-white/[0.05] hover:text-cream active:scale-[0.99]"
        >
          {openLabel}
        </button>
      )}

      {onQuickAdd && (
        <button
          aria-label={quickAddLabel} title={quickAddLabel} onClick={onQuickAdd}
          className="absolute right-4 bottom-4 grid h-7 w-7 place-items-center rounded-full border border-dashed border-white/[0.16] text-cream/40 transition-all duration-200 hover:border-cream/40 hover:bg-white/[0.05] hover:text-cream"
          style={onOpen ? { bottom: "4.25rem" } : undefined}
        >
          <Plus size={13} strokeWidth={1.75} />
        </button>
      )}
    </article>
  );
}
