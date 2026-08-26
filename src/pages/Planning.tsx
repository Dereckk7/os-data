import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn, useRequests } from "../lib/services";
import { GlassBadge, GlassSurface } from "../components/glass";
import { FadeSwitch, Reveal, SegmentedControl, Skeleton, StatusBadge } from "../components/ui";


type View = "Jour" | "Semaine" | "Mois";

interface CalEvent {
  id: string; day: number; time: string; title: string; kind: "demande" | "rdv"; ref?: string; status?: string;
}

const APPOINTMENTS: CalEvent[] = [
  { id: "ap-1", day: 13, time: "10:00", title: "Briefing équipe opérations", kind: "rdv" },
  { id: "ap-2", day: 14, time: "09:30", title: "Point trimestriel — Alex Williams", kind: "rdv" },
  { id: "ap-3", day: 15, time: "15:00", title: "Visite rooftop — événement Dupuis", kind: "rdv" },
  { id: "ap-4", day: 16, time: "06:15", title: "Départ vol privé — Nkoulou", kind: "rdv" },
  { id: "ap-5", day: 18, time: "12:00", title: "Arrivée Groupe Meka — 12 collab.", kind: "rdv" },
  { id: "ap-6", day: 20, time: "11:00", title: "Revue partenaires transport", kind: "rdv" },
  { id: "ap-7", day: 24, time: "18:00", title: "Lancement produit — H. Dupuis", kind: "rdv" },
];

export default function Planning() {
  const requestsQ = useRequests(450);
  const [isMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  const [view, setView] = useState<View>(isMobile ? "Jour" : "Semaine");
  const navigate = useNavigate();

  const events = useMemo<CalEvent[]>(() => {
    const fromRequests: CalEvent[] = requestsQ.data
      .filter((r) => r.status !== "Traitée")
      .map((r) => ({ id: r.id, day: r.day, time: r.time, title: r.title, kind: "demande", ref: r.ref, status: r.status }));
    return [...APPOINTMENTS, ...fromRequests].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  }, [requestsQ.data]);

  const now = new Date();
  const today = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstOffset = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(now);

  const weekDays = useMemo(() => {
    const start = today - ((now.getDay() + 6) % 7);
    return Array.from({ length: 7 }, (_, i) => start + i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  const dayEvents = events.filter((e) => e.day === today);

  return (
    <div className="space-y-5">
      <Reveal>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Travail</p>
            <h1 className="mt-2 t-title">Planning</h1>
            <p className="mt-1.5 text-[13.5px] text-cream/50">Rendez-vous, demandes, réservations et échéances — au même endroit.</p>
          </div>
          <SegmentedControl value={view} onChange={setView} options={(["Jour", "Semaine", "Mois"] as View[]).map((v) => ({ value: v, label: v }))} />
        </header>
      </Reveal>

      <FadeSwitch k={view}>
      {requestsQ.loading ? (
        <Skeleton className="h-96" />
      ) : view === "Jour" ? (
          <GlassSurface className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold tracking-tight">Aujourd'hui</h2>
              <GlassBadge tone="neutral">{dayEvents.length} événements</GlassBadge>
            </div>
            {dayEvents.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-cream/40">Aucun événement aujourd'hui — les nouvelles demandes apparaîtront ici.</p>
            ) : (
              <ul className="space-y-2">
                {dayEvents.map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={() => e.kind === "demande" && navigate(`/requests/${e.id}`)}
                      className="grid w-full grid-cols-[56px_1fr] items-center gap-3 rounded-[12px] border border-[var(--card-divider)] bg-[var(--surface-2)] px-3.5 py-3 text-left transition-all duration-200 hover:-translate-y-px hover:border-[var(--hairline-strong)]"
                    >
                      <span className="num text-[12px] font-semibold text-champagne-300">{e.time}</span>
                      <span className="flex min-w-0 items-center justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium">{e.title}</span>
                          <span className="num mt-0.5 block text-[9px] uppercase tracking-[0.1em] text-cream/30">
                            {e.kind === "rdv" ? "Rendez-vous" : e.ref}
                          </span>
                        </span>
                        {e.kind === "demande" && e.status && <StatusBadge status={e.status as never} />}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </GlassSurface>
      ) : view === "Semaine" ? (
          <GlassSurface className="overflow-x-auto p-5 sm:p-6">
            <div className="grid min-w-[720px] grid-cols-7 gap-2">
              {weekDays.map((d, i) => {
                const isToday = d === today;
                const label = new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(new Date(now.getFullYear(), now.getMonth(), d));
                const dayEvts = events.filter((e) => e.day === d);
                return (
                  <div
                    key={i}
                    className={cn("flex min-h-[280px] flex-col rounded-[12px] border p-2.5", isToday ? "border-champagne-500/40 bg-champagne-500/[0.05]" : "border-[var(--card-divider)] bg-[var(--surface-2)]")}
                  >
                    <p className={cn("num mb-2 text-center text-[10.5px] font-semibold uppercase tracking-[0.1em]", isToday ? "text-champagne-300" : "text-cream/45")}>
                      {label} {d}
                    </p>
                    <div className="space-y-1.5">
                      {dayEvts.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => e.kind === "demande" && navigate(`/requests/${e.id}`)}
                          className={cn("w-full rounded-[8px] border px-2 py-1.5 text-left transition-all duration-150 hover:border-[var(--hairline-strong)]", e.kind === "rdv" ? "border-[var(--hairline)] bg-[var(--surface-2)]" : "border-champagne-500/20 bg-champagne-500/[0.06]")}
                        >
                          <span className="num block text-[8.5px] text-cream/40">{e.time}</span>
                          <span className="mt-0.5 block truncate text-[10.5px] font-medium leading-tight">{e.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassSurface>
      ) : (
          <GlassSurface className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold capitalize tracking-tight">{monthLabel}</h2>
              <span className="num text-[10.5px] text-cream/40">{events.length} événements</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <span key={`${d}${i}`} className="pb-1 text-center text-[9.5px] font-semibold uppercase tracking-[0.14em] text-cream/30">{d}</span>
              ))}
              {Array.from({ length: firstOffset }).map((_, i) => <span key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const dayEvts = events.filter((e) => e.day === d);
                const isToday = d === today;
                return (
                  <div
                    key={d}
                    className={cn("flex aspect-square flex-col items-center rounded-[10px] border pt-1.5 transition-colors sm:aspect-auto sm:min-h-[74px]", isToday ? "border-champagne-500/40 bg-champagne-500/[0.06]" : "border-[var(--card-divider)] bg-[var(--surface-2)] hover:border-[var(--hairline-strong)]")}
                  >
                    <span className={cn("num text-[10.5px]", isToday ? "font-semibold text-champagne-300" : "text-cream/50")}>{d}</span>
                    <span className="mt-1 flex w-full flex-col gap-[3px] px-1">
                      {dayEvts.slice(0, 2).map((e) => (
                        <button
                          key={e.id}
                          onClick={() => e.kind === "demande" && navigate(`/requests/${e.id}`)}
                          className={cn("hidden w-full truncate rounded-[5px] border px-1 py-0.5 text-left text-[8px] leading-tight sm:block", e.kind === "rdv" ? "border-[var(--hairline)] bg-[var(--surface-2)] text-cream/60" : "border-champagne-500/20 bg-champagne-500/[0.07] text-champagne-300")}
                        >
                          {e.title}
                        </button>
                      ))}
                      {dayEvts.length > 0 && (
                        <span className="flex justify-center gap-[3px] sm:hidden">
                          {dayEvts.slice(0, 3).map((e) => (
                            <span key={e.id} className={cn("h-[5px] w-[5px] rounded-full", e.kind === "rdv" ? "bg-cream/35" : "bg-champagne-400")} />
                          ))}
                        </span>
                      )}
                      {dayEvts.length > 2 && <span className="num hidden text-[7.5px] text-cream/40 sm:block">+{dayEvts.length - 2}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassSurface>
      )}
      </FadeSwitch>
    </div>
  );
}
