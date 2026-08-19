import { useEffect, useState } from "react";
import { Check, CheckCircle2, Loader2, RefreshCw, Webhook } from "lucide-react";
import { cn, connectors, fmtInt, useSourcesState } from "../lib/services";
import type { DataSource, SourceKey } from "../lib/types";
import { GlassBadge, GlassButton, GlassModal, GlassPanel, GlassSurface } from "../components/glass";
import { SourceIcon } from "../components/icons";
import { AnimatedIcon, ErrorState, Reveal, Skeleton } from "../components/ui";
import { toast } from "../components/toast";

const OAUTH_STEPS = [
  "Redirection vers le fournisseur…",
  "Autorisation sécurisée accordée…",
  "Import et indexation des données…",
];

function SourceStatusBadge({ s }: { s: DataSource }) {
  if (s.status === "connected") return <GlassBadge tone="success" dot>Connecté</GlassBadge>;
  if (s.status === "syncing") return <GlassBadge tone="gold" dot pulse>Synchronisation</GlassBadge>;
  if (s.status === "error") return <GlassBadge tone="danger" dot>Erreur</GlassBadge>;
  return <GlassBadge tone="neutral">Non connecté</GlassBadge>;
}

export default function Sources() {
  const { sources, patchSource } = useSourcesState();
  const [loadingPage, setLoadingPage] = useState(true);
  const [syncingKey, setSyncingKey] = useState<SourceKey | null>(null);
  const [progress, setProgress] = useState(0);
  const [connectTarget, setConnectTarget] = useState<DataSource | null>(null);
  const [errorTarget, setErrorTarget] = useState<DataSource | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setLoadingPage(false), 500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!syncingKey) return;
    setProgress(0);
    const t = window.setInterval(() => setProgress((p) => Math.min(p + 7 + Math.random() * 9, 96)), 120);
    return () => window.clearInterval(t);
  }, [syncingKey]);

  useEffect(() => {
    if (!connectTarget) return;
    setStep(0);
    const timers = [window.setTimeout(() => setStep(1), 800), window.setTimeout(() => setStep(2), 1700)];
    const finish = window.setTimeout(async () => {
      const key = connectTarget.key;
      const res = await {
        crm: connectors.connectCRM, email: connectors.connectEmail, calendar: connectors.connectCalendar,
        whatsapp: connectors.connectWhatsApp, payments: connectors.connectPayments, documents: connectors.importDocuments,
      }[key]();
      patchSource(key, {
        status: "connected", lastSync: "à l'instant", records: res.records,
        lastActivity: "Première synchronisation réussie", error: undefined,
      });
      setConnectTarget(null);
      toast.success(`${connectTarget.name} connecté`, { description: `${fmtInt(res.records)} données seront organisées automatiquement.` });
    }, 2700);
    return () => { timers.forEach((t) => window.clearTimeout(t)); window.clearTimeout(finish); };
  }, [connectTarget, patchSource]);

  const sync = async (s: DataSource) => {
    setSyncingKey(s.key);
    patchSource(s.key, { status: "syncing", lastActivity: "Synchronisation en cours…" });
    await connectors.syncSource(s.key);
    const gained = Math.round(10 + Math.random() * 40);
    patchSource(s.key, {
      status: "connected", lastSync: "à l'instant", records: s.records + gained,
      lastActivity: `${gained} nouvelles données indexées`, error: undefined,
    });
    setSyncingKey(null);
    setProgress(100);
    toast.success(`${s.name} synchronisé`, { description: `${fmtInt(s.records + gained)} données vérifiées à l'instant.` });
  };

  return (
    <div className="space-y-5">
      <Reveal>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Infrastructure de données</p>
            <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Sources</h1>
            <p className="mt-1.5 text-[13.5px] text-cream/50">Vos données, connectées et organisées en continu.</p>
          </div>
          <GlassButton
            variant="ghost" iconLeft={<RefreshCw size={14} strokeWidth={1.6} />} disabled={syncingKey !== null}
            onClick={async () => { for (const s of sources) if (s.status === "connected") await sync(s); }}
          >
            Tout synchroniser
          </GlassButton>
        </header>
      </Reveal>

      {loadingPage ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[210px]" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sources.map((s, i) => (
            <Reveal key={s.id} delay={0.04 * i}>
              <GlassSurface
                sweep
                className={cn("group flex h-full flex-col p-5 transition-colors duration-300", s.status === "connected" && "border-jade/20", s.status === "error" && "border-ember/30")}
              >
                <div className="flex items-start justify-between gap-3">
                  <AnimatedIcon trigger="hover" className={cn("grid h-9 w-9 place-items-center rounded-[10px] border border-white/[0.08] bg-ink-950/55", s.status === "error" ? "text-[#e28d85]" : "text-cream/70")}>
                    <SourceIcon sourceKey={s.key} size={16} strokeWidth={1.6} />
                  </AnimatedIcon>
                  <SourceStatusBadge s={s} />
                </div>
                <p className="mt-3.5 flex items-center gap-2 text-[14px] font-semibold tracking-tight">
                  {s.name}
                  <span className="num rounded-[5px] border border-white/[0.08] bg-white/[0.03] px-1.5 py-px text-[8.5px] uppercase tracking-[0.12em] text-cream/40">{s.method}</span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-cream/50">{s.description}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3.5">
                  {[
                    { k: "Dernière sync", v: s.lastSync },
                    { k: "Données", v: s.records > 0 ? fmtInt(s.records) : "—" },
                    { k: "Activité", v: s.lastActivity },
                  ].map((st) => (
                    <div key={st.k} className="min-w-0">
                      <p className="text-[8.5px] uppercase tracking-[0.12em] text-cream/30">{st.k}</p>
                      <p className={cn("mt-0.5 truncate text-[10.5px] font-medium", st.k === "Données" ? "num text-cream/80" : "text-cream/55")} title={st.v}>{st.v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-4">
                  {s.status === "error" ? (
                    <div>
                      <div className="rounded-[11px] border border-ember/25 bg-ember/[0.07] p-3">
                        <p className="text-[11.5px] font-medium text-[#e28d85]">Cette source n'a pas pu être synchronisée.</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-cream/50">{s.error}</p>
                      </div>
                      <div className="mt-2.5 flex gap-2">
                        <GlassButton size="sm" variant="soft" full iconLeft={<RefreshCw size={13} strokeWidth={1.75} />} onClick={() => sync(s)} loading={syncingKey === s.key}>
                          Réessayer
                        </GlassButton>
                        <GlassButton size="sm" onClick={() => setErrorTarget(s)}>Détails</GlassButton>
                      </div>
                    </div>
                  ) : s.status === "off" ? (
                    <GlassButton size="sm" variant="gold" full onClick={() => setConnectTarget(s)}>
                      {s.key === "documents" ? "Importer des documents" : "Connecter"}
                    </GlassButton>
                  ) : (
                    <div>
                      <GlassButton
                        size="sm" variant="ghost" full
                        iconLeft={<RefreshCw size={13} strokeWidth={1.75} className={syncingKey === s.key ? "animate-spin" : ""} />}
                        onClick={() => sync(s)} disabled={syncingKey !== null}
                      >
                        {syncingKey === s.key ? "Synchronisation…" : "Synchroniser"}
                      </GlassButton>
                      {syncingKey === s.key && (
                        <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-champagne-500/80 transition-all duration-200" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </GlassSurface>
            </Reveal>
          ))}
        </div>
      )}

      <Reveal delay={0.2}>
        <GlassPanel eyebrow="Architecture" title="Prête pour vos intégrations" bodyClassName="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CheckCircle2, label: "Supabase", desc: "Client typé prêt dans /lib/supabase" },
            { icon: Webhook, label: "Webhooks", desc: "Événements temps réel entrants" },
            { icon: RefreshCw, label: "REST APIs", desc: "Connecteurs normalisés" },
            { icon: Check, label: "OAuth", desc: "Flux d'autorisation sécurisés" },
          ].map((a) => (
            <div key={a.label} className="rounded-[12px] border border-white/[0.06] bg-white/[0.018] p-3.5">
              <a.icon size={15} strokeWidth={1.6} className="text-cream/60" />
              <p className="mt-2 text-xs font-semibold">{a.label}</p>
              <p className="num mt-0.5 text-[9.5px] leading-relaxed text-cream/40">{a.desc}</p>
            </div>
          ))}
        </GlassPanel>
      </Reveal>

      <GlassModal open={connectTarget !== null} onClose={() => setConnectTarget(null)} eyebrow="Connexion simulée" title={connectTarget ? `Connecter ${connectTarget.name}` : ""}>
        <div className="space-y-2.5">
          {OAUTH_STEPS.map((label, i) => {
            const done = step > i;
            const current = step === i;
            return (
              <div
                key={label}
                className={cn("flex items-center gap-3 rounded-[11px] border px-3.5 py-3 transition-all duration-300", done ? "border-jade/25 bg-jade/[0.05]" : current ? "border-champagne-500/30 bg-champagne-500/[0.05]" : "border-white/[0.06] bg-white/[0.015] opacity-50")}
              >
                {done ? <Check size={14} strokeWidth={2} className="shrink-0 text-jade" />
                  : current ? <Loader2 size={14} strokeWidth={1.75} className="shrink-0 animate-spin text-champagne-300" />
                  : <span className="h-[14px] w-[14px] shrink-0 rounded-full border border-white/15" />}
                <span className={cn("text-xs font-medium", done ? "text-cream/80" : "text-cream/55")}>{label}</span>
              </div>
            );
          })}
          <p className="pt-1 text-[10.5px] leading-relaxed text-cream/35">
            Environnement de démonstration — aucun accès réel au fournisseur. Le flux OAuth production est câblé via /lib/services.
          </p>
        </div>
      </GlassModal>

      <GlassModal
        open={errorTarget !== null}
        onClose={() => setErrorTarget(null)}
        eyebrow="Diagnostic"
        title={errorTarget ? `${errorTarget.name} — échec de synchronisation` : ""}
        footer={
          errorTarget && (
            <>
              <GlassButton variant="ghost" onClick={() => setErrorTarget(null)}>Fermer</GlassButton>
              <GlassButton variant="primary" onClick={() => { const s = errorTarget; setErrorTarget(null); sync(s); }}>
                Réessayer maintenant
              </GlassButton>
            </>
          )
        }
      >
        {errorTarget && (
          <div className="space-y-3">
            <ErrorState className="!py-4" title="Cette source n'a pas pu être synchronisée." desc={errorTarget.error} />
            <div className="glass-sunken p-3.5">
              <p className="card-eyebrow mb-2">Journal technique</p>
              <pre className="num overflow-x-auto text-[10px] leading-relaxed text-cream/50">
{`07:31:04  sync.whatsapp     token_refresh  FAILED
07:31:04  sync.whatsapp     error=OAUTH_TOKEN_EXPIRED
07:31:05  sync.whatsapp     retry_scheduled +6h
07:31:05  agent.veille      alerte_notifiée direction`}
              </pre>
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  );
}
