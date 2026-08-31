/**
 * InsightCard — la voix du DATA OS. Sobre, distinctive, hiérarchisée.
 */
import type { Insight, InsightType, Tone } from "../lib/types";
import { cn } from "../lib/services";
import { GlassBadge, GlassButton, GlassSurface } from "./glass";
import { AnimatedIcon } from "./ui";
import { insightIcons } from "./icons";

export const INSIGHT_META: Record<InsightType, { label: string; tone: Tone; bar: string }> = {
  opportunity: { label: "Le DATA OS a détecté une opportunité", tone: "gold", bar: "bg-champagne-500/70" },
  recommendation: { label: "Le DATA OS recommande une action", tone: "neutral", bar: "bg-cream/40" },
  warning: { label: "Attention requise", tone: "warning", bar: "bg-saffron/70" },
  anomaly: { label: "Anomalie détectée", tone: "danger", bar: "bg-ember/70" },
  decision: { label: "Décision à prendre", tone: "success", bar: "bg-jade/70" },
};

const toneText: Record<Tone, string> = {
  gold: "text-champagne-300", neutral: "text-cream/60", warning: "text-saffron",
  danger: "text-ember", success: "text-jade",
};

export function InsightCard({ insight, onCta, onOpen, compact, className }: {
  insight: Insight; onCta: (insight: Insight) => void; onOpen?: (insight: Insight) => void;
  compact?: boolean; className?: string;
}) {
  const meta = INSIGHT_META[insight.type];
  const Icon = insightIcons[insight.type];

  return (
    <GlassSurface sweep className={cn("flex h-full flex-col gap-3 p-5", className)} role="article" aria-label={insight.title}>
      <span className={cn("absolute top-4 bottom-4 left-0 w-[2px] rounded-r", meta.bar)} aria-hidden />
      <div className="flex items-start justify-between gap-3 pl-2">
        <span className={cn("flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.14em]", toneText[meta.tone])}>
          <AnimatedIcon trigger="mount" delay={0.15}><Icon size={13} strokeWidth={1.75} /></AnimatedIcon>
          {meta.label}
        </span>
        <GlassBadge
          tone={insight.status === "Nouveau" ? "gold" : insight.status === "Traité" ? "success" : "neutral"}
          dot={insight.status === "Nouveau"} pulse={insight.status === "Nouveau"}
        >
          {insight.status}
        </GlassBadge>
      </div>

      <button
        onClick={onOpen ? () => onOpen(insight) : undefined}
        className={cn("text-left", onOpen && "cursor-pointer transition-opacity hover:opacity-85")}
        tabIndex={onOpen ? 0 : -1}
      >
        <h3 className="pl-2 text-[15px] font-semibold leading-snug tracking-tight">{insight.title}</h3>
        <p className={cn("mt-1.5 pl-2 text-[13px] leading-relaxed text-cream/52", compact && "line-clamp-2")}>{insight.body}</p>
      </button>

      {insight.metric && (
        <div className="flex items-baseline gap-2.5 pl-2">
          <span className="num text-[21px] font-semibold text-cream">{insight.metric}</span>
          {insight.metricLabel && <span className="text-[10px] uppercase tracking-[0.12em] text-cream/56">{insight.metricLabel}</span>}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--card-divider)] pt-3 pl-2">
        <span className="num truncate text-[9.5px] uppercase tracking-[0.12em] text-cream/52">{insight.agent} · {insight.time}</span>
        <GlassButton size="sm" variant={insight.type === "opportunity" ? "gold" : "ghost"} onClick={() => onCta(insight)}>
          {insight.cta}
        </GlassButton>
      </div>
    </GlassSurface>
  );
}
