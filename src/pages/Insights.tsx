import { useMemo, useState } from "react";
import { cn, useInsights } from "../lib/services";
import type { Insight, InsightType } from "../lib/types";
import { GlassBadge, GlassButton, GlassModal } from "../components/glass";
import { InsightCard, INSIGHT_META } from "../components/insight";
import { insightIcons } from "../components/icons";
import { EmptyState, Reveal, Skeleton } from "../components/ui";
import { toast } from "../components/toast";

const TYPE_FILTERS: { value: InsightType | "Tous"; label: string }[] = [
  { value: "Tous", label: "Tous" },
  { value: "opportunity", label: "Opportunités" },
  { value: "recommendation", label: "Recommandations" },
  { value: "anomaly", label: "Anomalies" },
  { value: "warning", label: "Attention" },
  { value: "decision", label: "Décisions" },
];
const STATUS_FILTERS = ["Tous", "Nouveau", "Vu", "Traité"] as const;
const InsightIcon = insightIcons.opportunity;

export default function Insights() {
  const insightsQ = useInsights(500);
  const [overrides, setOverrides] = useState<Record<string, Partial<Insight>>>({});
  const list = insightsQ.data.map((i) => ({ ...i, ...overrides[i.id] }));
  const [type, setType] = useState<InsightType | "Tous">("Tous");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("Tous");
  const [selected, setSelected] = useState<Insight | null>(null);

  const filtered = useMemo(
    () => list.filter((i) => (type === "Tous" || i.type === type) && (status === "Tous" || i.status === status)),
    [list, type, status]
  );

  const update = (id: string, patch: Partial<Insight>) => {
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    setSelected((s) => (s && s.id === id ? { ...s, ...patch } : s));
  };

  const counts = (t: InsightType | "Tous") => (t === "Tous" ? list.length : list.filter((i) => i.type === t).length);

  return (
    <div className="space-y-5">
      <Reveal>
        <header>
          <p className="eyebrow">Intelligence</p>
          <h1 className="mt-2 t-title">Insights</h1>
          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-cream/50">
            Opportunités, anomalies et décisions — détectées en continu par vos agents sur l'ensemble de vos sources.
          </p>
        </header>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrer par type">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value} onClick={() => setType(f.value)}
                className={cn(
                  "h-9 rounded-full border px-4 text-xs font-medium transition-all duration-200",
                  type === f.value ? "border-transparent bg-[color-mix(in_srgb,var(--color-cream)_10%,transparent)] text-cream" : "border-transparent bg-[var(--surface-2)] text-cream/55 shadow-[var(--highlight-top)] hover:text-cream/85"
                )}
              >
                {f.label}
                <span className="num ml-1.5 text-[9.5px] opacity-60">{counts(f.value)}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrer par statut">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s} onClick={() => setStatus(s)}
                className={cn("h-8 rounded-full border px-3 text-[11px] font-medium transition-all duration-200", status === s ? "border-transparent bg-[color-mix(in_srgb,var(--color-cream)_10%,transparent)] text-cream" : "border-transparent text-cream/62 hover:text-cream/75")}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {insightsQ.loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass">
          <EmptyState
            icon={<InsightIcon size={18} strokeWidth={1.5} />}
            title="Aucun insight dans cette vue."
            desc="Vos agents continuent d'analyser vos sources — les prochains signaux apparaîtront ici."
            action={<GlassButton variant="ghost" size="sm" onClick={() => { setType("Tous"); setStatus("Tous"); }}>Réinitialiser les filtres</GlassButton>}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((i, idx) => (
            <Reveal key={i.id} delay={0.05 * idx}>
              <InsightCard insight={i} onCta={(ins) => setSelected(ins)} onOpen={(ins) => setSelected(ins)} className="h-full" />
            </Reveal>
          ))}
        </div>
      )}

      <GlassModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        eyebrow={selected ? INSIGHT_META[selected.type].label : undefined}
        title={selected?.title}
        wide
        footer={
          selected && (
            <>
              <GlassButton
                variant="ghost"
                onClick={() => {
                  const prev = selected.status;
                  update(selected.id, { status: "Vu" });
                  toast("Insight archivé", {
                    description: "Retrouvez-le dans le filtre « Vu ».",
                    action: { label: "Annuler", onClick: () => update(selected.id, { status: prev }) },
                  });
                  setSelected(null);
                }}
              >
                Ignorer
              </GlassButton>
              {selected.status !== "Traité" && (
                <GlassButton
                  variant="primary"
                  onClick={() => {
                    update(selected.id, { status: "Traité" });
                    toast.success("Insight traité", { description: `${selected.agent} a reçu vos instructions.` });
                    setSelected(null);
                  }}
                >
                  Marquer comme traité
                </GlassButton>
              )}
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-4">
            <p className="text-[13.5px] leading-relaxed text-cream/65">{selected.body}</p>
            {selected.metric && (
              <div className="flex items-baseline gap-3 rounded-[12px] border border-[var(--hairline)] bg-[var(--surface-2)] px-4 py-3">
                <span className="num text-[22px] font-semibold">{selected.metric}</span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-cream/56">{selected.metricLabel}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <GlassBadge tone={selected.impact === "Élevé" ? "danger" : selected.impact === "Moyen" ? "warning" : "neutral"} dot>
                Impact {selected.impact.toLowerCase()}
              </GlassBadge>
              <span className="num text-[10px] uppercase tracking-[0.12em] text-cream/56">{selected.agent} · {selected.time}</span>
            </div>
            {selected.status === "Traité" && (
              <p className="rounded-[10px] border border-jade/25 bg-jade/[0.06] px-3 py-2.5 text-xs text-jade">
                Traité — les agents appliquent votre décision.
              </p>
            )}
          </div>
        )}
      </GlassModal>
    </div>
  );
}
