import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { cn, useReports } from "../lib/services";
import type { Report } from "../lib/types";
import { GlassBadge, GlassButton, GlassModal, GlassSurface } from "../components/glass";
import { MiniBars, Sparkline } from "../components/charts";
import { EmptyState, Reveal, SegmentedControl, Skeleton } from "../components/ui";
import { toast } from "../components/toast";

const PERIODS = ["Tous", "Quotidien", "Hebdomadaire", "Mensuel"] as const;

export default function Reports() {
  const reportsQ = useReports(550);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("Tous");
  const [preview, setPreview] = useState<Report | null>(null);

  const filtered = useMemo(
    () => (period === "Tous" ? reportsQ.data : reportsQ.data.filter((r) => r.period === period)),
    [reportsQ.data, period]
  );

  const statusBadge = (r: Report) =>
    r.status === "Prêt" ? <GlassBadge tone="success" dot>Prêt</GlassBadge>
      : r.status === "Génération" ? <GlassBadge tone="gold" dot pulse>Génération…</GlassBadge>
      : <GlassBadge tone="neutral">Planifié</GlassBadge>;

  const exportReport = (r: Report) =>
    toast.success("Export PDF préparé", {
      description: `${r.title} · ${r.pages} pages — téléchargement simulé.`,
      action: { label: "Partager", onClick: () => toast.neutral("Lien de partage copié", { description: "Valable 7 jours." }) },
    });

  return (
    <div className="space-y-5">
      <Reveal>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Analyse</p>
            <h1 className="mt-2 t-title">Rapports</h1>
            <p className="mt-1.5 text-[13.5px] text-cream/50">Générés automatiquement par l'Agent Reporting, chaque matin à 08:00.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl value={period} onChange={setPeriod} size="sm" options={PERIODS.map((p) => ({ value: p, label: p }))} />
            <GlassButton variant="primary" onClick={() => toast.gold("Rapport planifié", { description: "Rapport hebdomadaire — chaque lundi à 08:00." })}>
              Planifier
            </GlassButton>
          </div>
        </header>
      </Reveal>

      {reportsQ.loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[280px]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <GlassSurface>
          <EmptyState
            icon={<FileText size={18} strokeWidth={1.5} />}
            title="Aucun rapport pour cette période."
            desc="L'Agent Reporting génère un rapport chaque matin — changez de période ou revenez plus tard."
            action={period !== "Tous" ? <GlassButton variant="ghost" size="sm" onClick={() => setPeriod("Tous")}>Toutes les périodes</GlassButton> : undefined}
          />
        </GlassSurface>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r, i) => (
            <Reveal key={r.id} delay={0.04 * i}>
              <GlassSurface className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-[9px] border border-[var(--hairline)] bg-ink-950/55 text-cream/60">
                      <FileText size={14.5} strokeWidth={1.6} />
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold leading-tight tracking-tight">{r.title}</p>
                      <p className="num mt-0.5 text-[9px] uppercase tracking-[0.12em] text-cream/56">{r.period} · {r.category}</p>
                    </div>
                  </div>
                  {statusBadge(r)}
                </div>
                <p className="num mt-3 text-[10px] text-cream/56">{r.date}</p>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-cream/55">{r.summary}</p>
                <div className="mt-4">
                  {r.status === "Génération" ? (
                    <div className="h-[44px] rounded-[8px] border border-dashed border-[var(--hairline-strong)] p-2">
                      <div className="skeleton h-full w-full" />
                    </div>
                  ) : (
                    <MiniBars data={r.trend} height={44} />
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--card-divider)] pt-3.5">
                  {r.highlights.map((h) => (
                    <div key={h.label} className="min-w-0">
                      <p className="truncate text-[8.5px] uppercase tracking-[0.1em] text-cream/52">{h.label}</p>
                      <p className="num mt-0.5 truncate text-[11px] font-semibold text-cream/85">{h.value}</p>
                      {h.delta && <p className={cn("num text-[9px]", h.delta.startsWith("+") ? "text-jade" : h.delta.startsWith("-") ? "text-ember" : "text-cream/56")}>{h.delta}</p>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2 border-t border-[var(--card-divider)] pt-3.5">
                  <GlassButton size="sm" variant="soft" full onClick={() => setPreview(r)}>Ouvrir</GlassButton>
                  <GlassButton size="sm" variant="ghost" full iconLeft={<Download size={13} strokeWidth={1.75} />} disabled={r.status !== "Prêt"} onClick={() => exportReport(r)}>
                    Exporter
                  </GlassButton>
                </div>
              </GlassSurface>
            </Reveal>
          ))}
        </div>
      )}

      <GlassModal
        open={preview !== null}
        onClose={() => setPreview(null)}
        eyebrow={preview ? `${preview.period} · ${preview.category}` : undefined}
        title={preview?.title}
        wide
        footer={
          preview && (
            <>
              <GlassButton variant="ghost" onClick={() => setPreview(null)}>Fermer</GlassButton>
              <GlassButton variant="primary" iconLeft={<Download size={14} strokeWidth={1.75} />} onClick={() => exportReport(preview)}>
                Exporter PDF
              </GlassButton>
            </>
          )
        }
      >
        {preview && (
          <div className="space-y-4">
            <p className="num text-[10.5px] text-cream/60">{preview.date} · {preview.pages} pages · Agent Reporting</p>
            <p className="text-[13px] leading-relaxed text-cream/65">{preview.summary}</p>
            <div className="grid grid-cols-3 gap-2">
              {preview.highlights.map((h) => (
                <div key={h.label} className="rounded-[11px] border border-[var(--hairline)] bg-[var(--surface-2)] p-3">
                  <p className="text-[8.5px] uppercase tracking-[0.1em] text-cream/52">{h.label}</p>
                  <p className="num mt-1 text-[13px] font-semibold">{h.value}</p>
                  {h.delta && <p className="num mt-0.5 text-[9.5px] text-cream/60">{h.delta}</p>}
                </div>
              ))}
            </div>
            <div className="rounded-[12px] border border-[var(--hairline)] bg-ink-950/50 p-4">
              <p className="card-eyebrow mb-3">Tendance — 7 dernières périodes</p>
              <Sparkline data={preview.trend} width={440} height={70} className="w-full" />
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  );
}
