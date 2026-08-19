import { useMemo, useState } from "react";
import { cn, useActivity } from "../lib/services";
import type { ActivityKind } from "../lib/types";
import { GlassSurface } from "../components/glass";
import { Reveal, Skeleton } from "../components/ui";

const KIND_FILTERS: ("Tout" | ActivityKind)[] = ["Tout", "agent", "utilisateur", "systeme", "action", "erreur"];
const KIND_LABEL: Record<ActivityKind, string> = {
  agent: "Agents", utilisateur: "Utilisateurs", systeme: "Système", action: "Actions", erreur: "Erreurs",
};
const KIND_DOT: Record<ActivityKind, string> = {
  agent: "bg-champagne-400", utilisateur: "bg-jade", systeme: "bg-cream/40", action: "bg-[var(--type-blue)]", erreur: "bg-ember",
};

export default function Activity() {
  const activityQ = useActivity(550);
  const [filter, setFilter] = useState<(typeof KIND_FILTERS)[number]>("Tout");

  const filtered = useMemo(
    () => (filter === "Tout" ? activityQ.data : activityQ.data.filter((a) => a.kind === filter)),
    [activityQ.data, filter]
  );

  return (
    <div className="space-y-5">
      <Reveal>
        <header>
          <p className="eyebrow">Ressources</p>
          <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Activité</h1>
          <p className="mt-1.5 text-[13.5px] text-cream/50">Le journal global du DATA OS — agents, utilisateurs, système.</p>
        </header>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrer le journal">
          {KIND_FILTERS.map((f) => (
            <button
              key={f} onClick={() => setFilter(f)}
              className={cn(
                "h-9 rounded-full border px-4 text-xs font-medium transition-all duration-200",
                filter === f ? "border-cream/30 bg-cream/[0.08] text-cream" : "border-white/[0.08] bg-white/[0.02] text-cream/55 hover:border-white/[0.15] hover:text-cream/85"
              )}
            >
              {f === "Tout" ? "Tout" : KIND_LABEL[f]}
            </button>
          ))}
        </div>
      </Reveal>

      {activityQ.loading ? (
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : (
        <GlassSurface className="p-5 sm:p-6">
          <ol className="space-y-0">
            {filtered.map((a, i) => (
              <li key={a.id} className="grid grid-cols-[52px_14px_1fr] gap-x-1">
                <span className="num pt-[3px] text-right text-[10.5px] leading-5 text-cream/40">{a.time}</span>
                <span className="relative flex justify-center">
                  <span className={cn("z-10 mt-[7px] h-[7px] w-[7px] rounded-full", KIND_DOT[a.kind])} />
                  {i < filtered.length - 1 && <span className="absolute top-0 bottom-0 w-px bg-white/[0.07]" aria-hidden />}
                </span>
                <span className={cn("block", i < filtered.length - 1 ? "pb-4" : "pb-0.5")}>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-medium leading-5">{a.title}</span>
                    <span className="num rounded-[5px] border border-white/[0.08] bg-white/[0.03] px-1.5 py-px text-[8.5px] uppercase tracking-[0.12em] text-cream/40">
                      {KIND_LABEL[a.kind]}
                    </span>
                  </span>
                  {a.desc && <span className="mt-0.5 block text-xs leading-relaxed text-cream/45">{a.desc}</span>}
                  <span className="num mt-1 block text-[9.5px] uppercase tracking-[0.12em] text-cream/30">{a.actor}</span>
                </span>
              </li>
            ))}
          </ol>
          {filtered.length === 0 && <p className="py-10 text-center text-[13px] text-cream/40">Aucune activité pour ce filtre.</p>}
        </GlassSurface>
      )}
    </div>
  );
}
