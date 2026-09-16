import { useMemo, useState } from "react";
import { cn, useOperations, useRequests, useAgents } from "../lib/services";
import { GlassBadge, GlassPanel, GlassSurface } from "../components/glass";
import { ActivityFeed, AnimatedNumber, Reveal, Skeleton } from "../components/ui";
import { WorkCard } from "../components/workcard";
import { toast } from "../components/toast";
import { useNavigate } from "react-router-dom";

export default function Operations() {
  const operationsQ = useOperations(600);
  const requestsQ = useRequests(600);
  const agentsQ = useAgents(600);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("Tous");

  const all = operationsQ.data;
  const progressByStatus: Record<string, number> = { "En recherche": 35, "À valider": 65, "En attente client": 50, "Confirmée": 92, "En retard": 45, "Traitée": 100 };
  const inProgress = requestsQ.data.filter((r) => r.status !== "Traitée").slice(0, 6);
  const agentNames = useMemo(
    () => ["Tous", ...Array.from(new Set(operationsQ.data.filter((o) => o.agent).map((o) => o.agent as string)))],
    [operationsQ.data]
  );
  const filtered = filter === "Tous" ? all : all.filter((o) => o.agent === filter);

  const incidents = requestsQ.data.filter((r) => r.status === "En retard").length;
  const inProgressTotal = requestsQ.data.filter((r) => r.status !== "Traitée").length;
  const slaPct = inProgressTotal > 0 ? Math.round((100 * (inProgressTotal - incidents)) / inProgressTotal) : 100;
  const summary = [
    { k: "Actions agents", v: String(operationsQ.data.length), pct: Math.min(100, operationsQ.data.length * 5) },
    { k: "Demandes créées", v: String(requestsQ.data.length), pct: Math.min(100, requestsQ.data.length * 10) },
    { k: "Incidents actifs", v: String(incidents), pct: Math.min(100, incidents * 25) },
    { k: "SLA respecté", v: `${slaPct}%`, pct: slaPct },
  ];

  return (
    <div className="space-y-5">
      <Reveal>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Temps réel</p>
            <h1 className="mt-2 t-title">Activité opérationnelle</h1>
            <p className="mt-1.5 text-[13.5px] text-cream/50">Chaque action de chaque agent, tracée et horodatée.</p>
          </div>
          <GlassBadge tone="success" dot pulse className="mb-1">En direct</GlassBadge>
        </header>
      </Reveal>

      <Reveal delay={0.07}>
        <section aria-label="Opérations en cours">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold tracking-tight">Opérations en cours</h2>
            <span className="num text-[9.5px] uppercase tracking-[0.14em] text-cream/52">{inProgress.length} demande(s) en cours</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {inProgress.map((r, i) => {
              const tone = r.status === "En retard" || r.priority === "Critique" ? "ember" : r.status === "À valider" ? "orange" : "blue";
              const cardAgents = agentsQ.data
                .filter((a) => a.name === r.agent)
                .map((a) => ({ id: a.id, name: a.name, tint: a.tint, working: true }));
              return (
                <Reveal key={r.id} delay={0.04 * i}>
                  <WorkCard
                    tone={tone} eyebrow={(r.ref || r.type).toUpperCase()} title={r.title}
                    desc={`${r.client}${r.vip ? " · VIP" : ""}`} when={r.time}
                    progress={progressByStatus[r.status] ?? 40} agents={cardAgents}
                    urgent={r.status === "En retard" || r.priority === "Critique"}
                    menu={[
                      { label: "Voir le détail", onClick: () => navigate(`/requests/${r.id}`) },
                      { label: "Notifier le client", onClick: () => toast.neutral("Notification préparée", { description: "Brouillon ajouté à la file." }) },
                    ]}
                    onQuickAdd={() => toast("Note ajoutée", { description: `${r.title} — transmise aux agents.` })}
                  />
                </Reveal>
              );
            })}
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrer par agent">
          {agentNames.map((a) => (
            <button
              key={a} onClick={() => setFilter(a)}
              className={cn(
                "h-9 rounded-full border px-4 text-xs font-medium transition-all duration-200",
                filter === a ? "border-transparent bg-[color-mix(in_srgb,var(--color-cream)_10%,transparent)] text-cream" : "border-transparent bg-[var(--surface-2)] text-cream/55 shadow-[var(--highlight-top)] hover:text-cream/85"
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-12">
        <Reveal delay={0.1} className="lg:col-span-8">
          <GlassSurface className="p-5 sm:p-6">
            {operationsQ.loading ? (
              <div className="space-y-3">
                {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : (
              <ActivityFeed events={filtered.map((o) => ({ id: o.id, time: o.time, title: o.title, desc: o.desc, agent: o.agent, live: o.live }))} />
            )}
          </GlassSurface>
        </Reveal>

        <div className="space-y-4 lg:col-span-4">
          <Reveal delay={0.14}>
            <GlassPanel eyebrow="Synthèse du jour" title="Indicateurs opérationnels">
              <div className="space-y-3.5">
                {summary.map((s) => (
                  <div key={s.k}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11.5px] text-cream/50">{s.k}</span>
                      <span className="num text-[12.5px] font-semibold">{s.v}</span>
                    </div>
                    <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-[var(--surface-3)]">
                      <div className="h-full rounded-full bg-champagne-500/70 transition-all duration-1000" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </Reveal>

          <Reveal delay={0.18}>
            <GlassPanel eyebrow="Agents en ligne" title="Disponibilité">
              <ul className="space-y-3">
                {agentsQ.data.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5">
                      <span className={cn("h-[7px] w-[7px] rounded-full", !/attente|erreur|error|pause|hors/i.test(a.status) ? "bg-jade pulse-dot" : "bg-saffron/80")} />
                      <span className="text-[12.5px] font-medium">{a.name}</span>
                    </span>
                    <span className="num text-[11px] text-cream/62"><AnimatedNumber value={`${a.actionsToday} actions`} /></span>
                  </li>
                ))}
              </ul>
              <p className="num mt-4 border-t border-[var(--card-divider)] pt-3 text-[9.5px] uppercase tracking-[0.12em] text-cream/52">
                Prochaine synchro complète · 10:00
              </p>
            </GlassPanel>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
