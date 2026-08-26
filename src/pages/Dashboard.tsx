import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ChevronRight, Sparkles } from "lucide-react";
import { attentionItems, executiveKpis, mockAgents } from "../lib/mock";
import { cn, todayLabel, useAuth, useInsights, useOperations } from "../lib/services";
import type { Kpi } from "../lib/types";
import { GlassButton } from "../components/glass";
import { AgentGlyph } from "../components/icons";
import { ActivityFeed, AnimatedNumber, AgentStatusBadge, EASE, PriorityBadge, Reveal, Skeleton } from "../components/ui";
import { toast } from "../components/toast";
import { motion } from "framer-motion";

function DeltaBadge({ k }: { k: Kpi }) {
  const t = k.deltaText;
  const cls = t.startsWith("+") ? "delta-up" : t.startsWith("-") ? "delta-down" : "delta-neutral";
  return <span className={cn("delta-badge", cls)}>{t}</span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const insightsQ = useInsights(650);
  const operationsQ = useOperations(850);
  const navigate = useNavigate();

  const firstName = user?.name.split(" ")[0] ?? "";
  const opportunity = insightsQ.data.find((i) => i.type === "opportunity");
  const recommendation = insightsQ.data.find((i) => i.type === "recommendation");
  const activeAgents = mockAgents.slice(0, 4);

  return (
    <div className="space-y-5">
      <Reveal>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Maison Ekwata · {todayLabel()}</p>
            <h1 className="mt-2.5 t-display">Bonjour, {firstName}</h1>
            <p className="font-serif mt-1 text-[19px] italic text-cream/75 sm:text-[21px]">
              Votre entreprise est <em className="text-champagne-300">sous contrôle</em>.
            </p>
            <p className="num mt-2.5 text-[11.5px] text-cream/45">
              25 demandes traitées · 8 réservations confirmées · 3 décisions importantes
            </p>
          </div>
          <span className="delta-badge delta-up mb-1">● Système opérationnel</span>
        </header>
      </Reveal>

      {/* ————— Executive overview — KPI cards Linear ————— */}
      <Reveal delay={0.06}>
        <section className="lcard overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--card-divider)] px-5 py-4">
            <h2 className="card-eyebrow">Executive overview</h2>
            <Link to="/reports" className="flex items-center gap-1 text-[12px] font-medium text-[var(--card-title)] transition-colors hover:text-[var(--color-cream)]">
              Rapport complet <ArrowRight size={13} strokeWidth={1.75} />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {executiveKpis.map((k, i) => (
              <div
                key={k.label}
                className={cn(
                  "row-hover relative px-5 py-4",
                  i > 0 && "border-l border-[var(--card-divider)]",
                  i >= 2 && "border-t border-[var(--card-divider)] lg:border-t-0"
                )}
              >
                <p className="card-eyebrow">{k.label}</p>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="kpi-num"><AnimatedNumber value={k.value} /></span>
                  <DeltaBadge k={k} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <Reveal delay={0.1}>
            <div className="flex items-center justify-between">
              <h2 className="card-eyebrow">Intelligence</h2>
              <Link to="/insights" className="flex items-center gap-1 text-[12px] font-medium text-[var(--card-title)] transition-colors hover:text-[var(--color-cream)]">
                Tous les insights <ArrowUpRight size={12} strokeWidth={1.75} />
              </Link>
            </div>
          </Reveal>

          {insightsQ.loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-56" />
              <Skeleton className="h-56" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Opportunité IA — moment card champagne (les 5%), theme-aware */}
              {opportunity && (
                <Reveal delay={0.12}>
                  <article className="relative flex h-full flex-col overflow-hidden rounded-md bg-[color-mix(in_srgb,var(--color-champagne-500)_10%,transparent)] p-6 shadow-[var(--shadow-2),var(--highlight-top)] ring-1 ring-[color-mix(in_srgb,var(--color-champagne-500)_22%,transparent)]">
                    <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-champagne-500)_20%,transparent),transparent_68%)]" aria-hidden />
                    <span className="absolute inset-y-5 left-0 w-[2px] rounded-r bg-champagne-500/75" aria-hidden />
                    <div className="relative flex items-center justify-between gap-2 pl-2.5">
                      <span className="text-[9.5px] font-[590] uppercase tracking-[0.14em] text-champagne-300">
                        Intelligence DATA OS
                      </span>
                      <span className="ai-tag"><Sparkles size={11} strokeWidth={2} /> IA</span>
                    </div>
                    <div className="num relative mt-2 pl-2.5 text-[34px] font-[590] tracking-[-0.022em]">
                      {opportunity.metric?.replace(" XAF", "")}{" "}
                      <span className="text-xl text-champagne-300">XAF</span>
                    </div>
                    <p className="relative mt-2 pl-2.5 text-[13px] font-[510]">{opportunity.title}</p>
                    <p className="relative mt-1 pl-2.5 text-[12.5px] leading-relaxed text-cream/55">{opportunity.body}</p>
                    <div className="relative mt-auto flex items-center justify-between pl-2.5 pt-4">
                      <span className="num text-[9px] uppercase tracking-[0.12em] text-cream/35">
                        {opportunity.agent} · {opportunity.time}
                      </span>
                      <button
                        onClick={() => {
                          toast.gold("Opportunité ouverte", {
                            description: "3 profils VIP à réactiver — potentiel 1 850 000 XAF.",
                            action: { label: "Voir", onClick: () => navigate("/insights") },
                          });
                        }}
                        className="inline-flex h-9 items-center rounded-sm bg-champagne-500 px-4 text-[13px] font-[590] text-ink-950 transition-[filter,transform] duration-200 hover:brightness-105 active:scale-[0.98]"
                      >
                        Examiner
                      </button>
                    </div>
                  </article>
                </Reveal>
              )}

              {/* Recommandation — carte neutre */}
              {recommendation && (
                <Reveal delay={0.18}>
                  <article className="lcard flex h-full flex-col p-5">
                    <span className="card-eyebrow">Recommandation</span>
                    <h3 className="mt-3 text-[15px] font-semibold leading-snug tracking-tight">{recommendation.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--card-title)]">{recommendation.body}</p>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <span className="num text-[9px] uppercase tracking-[0.12em] text-[var(--card-title)]">
                        {recommendation.agent} · {recommendation.time}
                      </span>
                      <button
                        onClick={() => {
                          toast.neutral("Analyse lancée", { description: "L'Agent Client Intelligence détaille la tendance." });
                          navigate("/insights");
                        }}
                        className="inline-flex h-9 items-center rounded-[10px] border border-[var(--card-border)] px-4 text-[13px] font-medium text-[var(--color-cream)] transition-all duration-200 hover:border-[var(--color-cream)] active:scale-[0.98]"
                      >
                        Analyser
                      </button>
                    </div>
                  </article>
                </Reveal>
              )}
            </div>
          )}

          {/* ————— À votre attention ————— */}
          <Reveal delay={0.16}>
            <section className="lcard p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="card-eyebrow">À votre attention</h2>
                <Link to="/requests" className="flex items-center gap-1 text-[12px] font-medium text-[var(--card-title)] transition-colors hover:text-[var(--color-cream)]">
                  Tout voir <ArrowRight size={13} strokeWidth={1.75} />
                </Link>
              </div>
              <ul className="mt-2">
                {attentionItems.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.08 * i, ease: EASE }}
                  >
                    <button
                      onClick={() => navigate(`/requests/${item.requestId}`)}
                      className="agent-row row-hover group flex w-full items-center gap-3 px-2 py-3.5 text-left sm:gap-4 sm:px-3"
                    >
                      <PriorityBadge priority={item.priority} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium tracking-tight">{item.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-[var(--card-title)]">{item.desc}</span>
                      </span>
                      <span className="hidden shrink-0 text-right md:block">
                        <span className="num block text-[13.5px] font-semibold">{item.value}</span>
                        <span className="num mt-0.5 block text-[9px] uppercase tracking-[0.12em] text-[var(--card-title)]">{item.agent}</span>
                      </span>
                      <span className="hidden shrink-0 items-center gap-1 rounded-[9px] border border-[var(--card-border)] px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200 group-hover:border-[var(--color-cream)] sm:flex">
                        Examiner
                      </span>
                      <ChevronRight size={15} strokeWidth={1.6} className="shrink-0 text-[var(--card-title)] transition-transform duration-200 group-hover:translate-x-0.5 sm:hidden" />
                    </button>
                  </motion.li>
                ))}
              </ul>
            </section>
          </Reveal>
        </div>

        <div className="space-y-5 lg:col-span-5">
          {/* ————— Vos agents — liste structurée ————— */}
          <Reveal delay={0.14}>
            <section className="lcard p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="card-eyebrow">Vos agents</h2>
                <Link to="/agents" className="flex items-center gap-1 text-[12px] font-medium text-[var(--card-title)] transition-colors hover:text-[var(--color-cream)]">
                  Tous les agents <ArrowRight size={13} strokeWidth={1.75} />
                </Link>
              </div>
              <ul className="mt-2">
                {activeAgents.map((a) => (
                  <li key={a.id} className="agent-row">
                    <Link
                      to={`/agents/${a.id}`}
                      className="row-hover flex items-center gap-3 rounded-[8px] px-2 py-3"
                    >
                      <span className="agent-tile grid h-6 w-6 shrink-0 place-items-center rounded-[7px] border" style={{ "--tint": a.tint } as React.CSSProperties}>
                        <AgentGlyph agentId={a.id} size={12.5} strokeWidth={1.6} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium" style={{ fontWeight: 500 }}>
                        {a.name}
                      </span>
                      <span className="num shrink-0 text-[12px] font-normal text-[var(--card-title)]">
                        <AnimatedNumber value={`${a.actionsToday} actions`} />
                      </span>
                      <AgentStatusBadge status={a.status} withSymbol={false} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          {/* ————— Flux opérationnel ————— */}
          <Reveal delay={0.2}>
            <section className="lcard p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="card-eyebrow">Flux opérationnel</h2>
                <Link to="/operations" className="flex items-center gap-1 text-[12px] font-medium text-[var(--card-title)] transition-colors hover:text-[var(--color-cream)]">
                  Toute l'activité <ArrowRight size={13} strokeWidth={1.75} />
                </Link>
              </div>
              <div className="mt-3">
                {operationsQ.loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9" />)}
                  </div>
                ) : (
                  <ActivityFeed
                    events={operationsQ.data.slice(0, 5).map((o) => ({
                      id: o.id, time: o.time, title: o.title, desc: o.desc, agent: o.agent, live: o.live,
                    }))}
                  />
                )}
              </div>
              <div className="mt-4 border-t border-[var(--card-divider)] pt-3.5">
                <GlassButton size="sm" variant="soft" full onClick={() => navigate("/operations")}>
                  Voir le journal complet
                </GlassButton>
              </div>
            </section>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
