import { useState } from "react";
import { Settings2 } from "lucide-react";
import { cn, delay, fmtInt, useIntegrations } from "../lib/services";
import type { Integration, IntegrationStatus } from "../lib/types";
import { GlassBadge, GlassButton, GlassModal, GlassSurface } from "../components/glass";
import { EmptyState, Reveal, Skeleton } from "../components/ui";
import { toast } from "../components/toast";

const STATUS_FILTERS: ("Tous" | IntegrationStatus)[] = ["Tous", "Connecté", "Déconnecté", "Synchronisation", "Erreur", "Configuration requise"];
const statusTone = (s: IntegrationStatus) =>
  s === "Connecté" ? "success" : s === "Synchronisation" ? "gold" : s === "Erreur" ? "danger" : s === "Configuration requise" ? "warning" : "neutral";

export default function Integrations() {
  const integrationsQ = useIntegrations(500);
  const [overrides, setOverrides] = useState<Record<string, Partial<Integration>>>({});
  const list = integrationsQ.data.map((i) => ({ ...i, ...overrides[i.id] }));
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("Tous");
  const [configTarget, setConfigTarget] = useState<Integration | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = filter === "Tous" ? list : list.filter((i) => i.status === filter);
  const patch = (id: string, p: Partial<Integration>) => setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...p } }));

  const configure = async (it: Integration) => {
    setBusy(true);
    patch(it.id, { status: "Synchronisation", lastSync: "en cours" });
    await delay(1800);
    const records = it.records > 0 ? it.records + Math.round(20 + Math.random() * 60) : Math.round(200 + Math.random() * 800);
    patch(it.id, { status: "Connecté", lastSync: "à l'instant", records });
    setBusy(false);
    setConfigTarget(null);
    toast.success(`${it.name} connecté`, { description: `${fmtInt(records)} données synchronisées.` });
  };

  return (
    <div className="space-y-5">
      <Reveal>
        <header>
          <p className="eyebrow">Écosystème</p>
          <h1 className="mt-2 t-title">Intégrations</h1>
          <p className="mt-1.5 text-[13.5px] text-cream/50">Reliez vos outils métier — les données circulent dans les deux sens.</p>
        </header>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-0.5" role="group" aria-label="Filtrer par statut">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f} onClick={() => setFilter(f)}
              className={cn(
                "h-9 shrink-0 rounded-full border px-4 text-xs font-medium transition-all duration-200",
                filter === f ? "border-cream/30 bg-cream/[0.08] text-cream" : "border-[var(--hairline)] bg-[var(--surface-2)] text-cream/55 hover:border-[var(--hairline-strong)] hover:text-cream/85"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </Reveal>

      {integrationsQ.loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[170px]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <GlassSurface>
          <EmptyState title="Aucune intégration dans cet état." desc="Changez de filtre pour voir l'ensemble de votre écosystème connecté." />
        </GlassSurface>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((it, i) => (
            <Reveal key={it.id} delay={0.04 * i}>
              <GlassSurface sweep className="group flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-[11px] border border-[var(--hairline)] bg-ink-950/60">
                    <span className="num text-[11px] font-semibold tracking-tight text-cream/75">{it.monogram}</span>
                  </span>
                  <GlassBadge tone={statusTone(it.status)} dot pulse={it.status === "Synchronisation"}>{it.status}</GlassBadge>
                </div>
                <p className="mt-3.5 text-[14px] font-semibold tracking-tight">{it.name}</p>
                <p className="num mt-0.5 text-[9px] uppercase tracking-[0.12em] text-cream/56">{it.category}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-cream/50">{it.description}</p>
                <div className="mt-3.5 flex items-center justify-between border-t border-[var(--card-divider)] pt-3">
                  <span className="num text-[10px] text-cream/60">
                    {it.records > 0 ? `${fmtInt(it.records)} données` : "Aucune donnée"} · {it.lastSync}
                  </span>
                </div>
                <div className="mt-3">
                  <GlassButton size="sm" variant={it.status === "Connecté" ? "ghost" : "gold"} full iconLeft={<Settings2 size={13} strokeWidth={1.6} />} onClick={() => setConfigTarget(it)}>
                    {it.status === "Connecté" ? "Configurer" : it.status === "Erreur" ? "Réparer" : "Connecter"}
                  </GlassButton>
                </div>
              </GlassSurface>
            </Reveal>
          ))}
        </div>
      )}

      <GlassModal
        open={configTarget !== null}
        onClose={() => { if (!busy) setConfigTarget(null); }}
        eyebrow={configTarget?.status === "Connecté" ? "Configuration" : "Connexion simulée"}
        title={configTarget ? configTarget.name : ""}
        footer={
          configTarget && (configTarget.status === "Connecté" ? (
            <>
              <GlassButton variant="ghost" onClick={() => setConfigTarget(null)}>Fermer</GlassButton>
              <GlassButton
                variant="primary"
                onClick={() => {
                  toast.success("Paramètres enregistrés", { description: `${configTarget.name} — synchronisation toutes les 15 min.` });
                  setConfigTarget(null);
                }}
              >
                Enregistrer
              </GlassButton>
            </>
          ) : (
            <GlassButton variant="primary" loading={busy} onClick={() => configure(configTarget)}>
              {busy ? "Synchronisation…" : "Lancer la connexion"}
            </GlassButton>
          ))
        }
      >
        {configTarget && (configTarget.status === "Connecté" ? (
          <div className="space-y-3">
            {[
              { k: "Fréquence de synchronisation", v: "Toutes les 15 minutes" },
              { k: "Dernière synchronisation", v: configTarget.lastSync },
              { k: "Données indexées", v: configTarget.records > 0 ? fmtInt(configTarget.records) : "—" },
              { k: "Mode", v: "Bidirectionnel" },
            ].map((row) => (
              <div key={row.k} className="flex items-center justify-between gap-3">
                <span className="text-xs text-cream/62">{row.k}</span>
                <span className="num text-xs font-medium text-cream/80">{row.v}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed text-cream/55">
            {configTarget.status === "Erreur"
              ? "Le jeton d'accès a expiré. Relancez l'autorisation sécurisée pour rétablir la synchronisation."
              : "Autorisez DATA OS à accéder à vos données. Aucune information n'est partagée en dehors de votre organisation."}
            <span className="mt-2 block text-[10.5px] text-cream/56">Environnement de démonstration — connexion simulée.</span>
          </p>
        ))}
      </GlassModal>
    </div>
  );
}
