import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Search } from "lucide-react";
import { cn, useAgents } from "../lib/services";
import type { AgentStatus } from "../lib/types";
import { GlassSurface } from "../components/glass";
import { AgentGlyph } from "../components/icons";
import { AgentStatusBadge, AnimatedNumber, EmptyState, Reveal, Skeleton } from "../components/ui";

type StatusFilter = "Tous" | "Actifs" | "En pause" | "En attente" | "Attention";
const STATUS_FILTERS: StatusFilter[] = ["Tous", "Actifs", "En pause", "En attente", "Attention"];

const matchesFilter = (status: AgentStatus, f: StatusFilter): boolean => {
  if (f === "Tous") return true;
  if (f === "Actifs") return status === "Opérationnel";
  if (f === "En pause") return status === "En veille" || status === "Maintenance";
  if (f === "En attente") return status === "En attente";
  return status === "Erreur";
};

export function AgentTile({ agentId, tint, active, error, size = "md" }: {
  agentId: string; tint: string; active: boolean; error: boolean; size?: "md" | "lg";
}) {
  return (
    <span
      className={cn("agent-tile relative grid shrink-0 place-items-center rounded-[12px] border transition-all duration-300", size === "lg" ? "h-12 w-12 rounded-[14px]" : "h-10 w-10")}
      style={{ "--tint": tint } as React.CSSProperties}
    >
      <span className={cn(active && "agent-breathe", error && "agent-err")}>
        <AgentGlyph agentId={agentId} size={size === "lg" ? 20 : 17} strokeWidth={1.5} />
      </span>
      {active && <span className="agent-ring" aria-hidden />}
    </span>
  );
}

export default function Agents() {
  const agentsQ = useAgents(550);
  const [filter, setFilter] = useState<StatusFilter>("Tous");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    let out = agentsQ.data.filter((a) => matchesFilter(a.status, filter));
    const q = query.trim().toLowerCase();
    if (q) out = out.filter((a) => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q));
    return out;
  }, [agentsQ.data, filter, query]);

  const counts = useMemo(() => ({
    Tous: agentsQ.data.length,
    Actifs: agentsQ.data.filter((a) => a.status === "Opérationnel").length,
    "En pause": agentsQ.data.filter((a) => a.status === "En veille" || a.status === "Maintenance").length,
    "En attente": agentsQ.data.filter((a) => a.status === "En attente").length,
    Attention: agentsQ.data.filter((a) => a.status === "Erreur").length,
  }), [agentsQ.data]);

  return (
    <div className="space-y-5">
      <Reveal>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Collaborateurs numériques</p>
            <h1 className="mt-2 t-title">Agents</h1>
            <p className="mt-1.5 text-[13.5px] text-cream/50">
              {counts.Actifs} actifs · travaillent en continu sur vos sources connectées.
            </p>
          </div>
        </header>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrer par statut">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f} onClick={() => setFilter(f)}
                className={cn(
                  "h-9 rounded-full border px-4 text-xs font-medium transition-all duration-200",
                  filter === f ? "border-transparent bg-[color-mix(in_srgb,var(--color-cream)_10%,transparent)] text-cream" : "border-transparent bg-[var(--surface-2)] text-cream/55 shadow-[var(--highlight-top)] hover:text-cream/85"
                )}
              >
                {f}
                <span className="num ml-1.5 text-[9.5px] opacity-60">{counts[f]}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-64">
            <Search size={14} strokeWidth={1.6} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream/35" />
            <label htmlFor="agent-search" className="sr-only">Rechercher un agent</label>
            <input
              id="agent-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un agent…"
              className="h-10 w-full rounded-[11px] border border-[var(--hairline)] bg-[var(--surface-2)] pl-9 pr-3 text-[13px] text-cream outline-none transition-all placeholder:text-cream/30 hover:border-[var(--hairline-strong)] focus:border-cream/35"
            />
          </div>
        </div>
      </Reveal>

      {agentsQ.loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[230px]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <GlassSurface>
          <EmptyState title="Aucun agent dans cet état." desc="Modifiez le filtre ou la recherche — vos agents restent opérationnels en arrière-plan." />
        </GlassSurface>
      ) : (
        <>
          <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((a, i) => (
              <Reveal key={a.id} delay={0.04 * i}>
                <button
                  onClick={() => navigate(`/agents/${a.id}`)}
                  className={cn(
                    "glass glass-sweep group flex h-full w-full flex-col p-5 text-left transition-all duration-200",
                    "hover:-translate-y-[2px] hover:border-[var(--hairline-strong)] hover:bg-[var(--row-hover)]",
                    (a.status === "En veille" || a.status === "Maintenance") && "opacity-80"
                  )}
                  aria-label={`Détails de ${a.name}`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <AgentTile agentId={a.id} tint={a.tint} active={a.status === "Opérationnel"} error={a.status === "Erreur"} />
                    <AgentStatusBadge status={a.status} />
                  </span>
                  <span className="mt-4 block">
                    <span className="block text-[15px] font-semibold tracking-tight">{a.name}</span>
                    <span className="mt-0.5 block text-xs text-cream/50">{a.role}</span>
                  </span>
                  {a.current && (
                    <span className="mt-3 flex items-start gap-2 rounded-sm bg-[var(--surface-2)] px-2.5 py-2 shadow-[var(--highlight-top)]">
                      <span className={cn("mt-[5px] h-[5px] w-[5px] shrink-0 rounded-full", a.status === "Opérationnel" ? "bg-champagne-500/80 pulse-dot" : "bg-cream/30")} aria-hidden />
                      <span className="min-w-0">
                        <span className="num block text-[8px] uppercase tracking-[0.12em] text-cream/35">Tâche courante</span>
                        <span className="mt-0.5 block truncate text-[11.5px] leading-snug text-cream/65">{a.current}</span>
                      </span>
                    </span>
                  )}
                  <span className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--card-divider)] pt-3.5">
                    <span>
                      <span className="block text-[17px] font-semibold leading-none"><AnimatedNumber value={String(a.actionsToday)} /></span>
                      <span className="mt-1 block text-[9.5px] uppercase tracking-[0.1em] text-cream/35">tâches aujourd'hui</span>
                    </span>
                    <span>
                      <span className="num block text-[17px] font-semibold leading-none">{a.accuracy}%</span>
                      <span className="mt-1 block text-[9.5px] uppercase tracking-[0.1em] text-cream/35">réussite</span>
                    </span>
                  </span>
                  <span className="mt-3.5 flex items-center justify-between border-t border-[var(--card-divider)] pt-3">
                    <span className="num text-[9.5px] uppercase tracking-[0.12em] text-cream/30">Dernière activité · {a.lastActivity}</span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-cream/55 transition-colors duration-200 group-hover:text-cream">
                      Voir l'activité
                      <ArrowUpRight size={12} strokeWidth={1.75} className="transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px" />
                    </span>
                  </span>
                </button>
              </Reveal>
            ))}
          </div>

          <div className="space-y-2.5 md:hidden">
            {filtered.map((a, i) => (
              <Reveal key={a.id} delay={0.03 * i}>
                <button
                  onClick={() => navigate(`/agents/${a.id}`)}
                  className={cn("glass glass-sweep flex w-full items-center gap-4 p-4 text-left transition-all duration-200 active:scale-[0.995]", (a.status === "En veille" || a.status === "Maintenance") && "opacity-80")}
                  aria-label={`Détails de ${a.name}`}
                >
                  <AgentTile agentId={a.id} tint={a.tint} active={a.status === "Opérationnel"} error={a.status === "Erreur"} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold tracking-tight">{a.name}</span>
                    <span className="block truncate text-[11.5px] text-cream/50">{a.role}</span>
                    <span className="num mt-1.5 block text-[10.5px] text-cream/40">{a.actionsToday} tâches · {a.accuracy}% · {a.lastActivity}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-2">
                    <AgentStatusBadge status={a.status} withSymbol={false} />
                    <ArrowUpRight size={14} strokeWidth={1.6} className="text-cream/30" />
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
