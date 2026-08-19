import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pause, Play } from "lucide-react";
import { mockAgents } from "../lib/mock";
import { cn, useAgents } from "../lib/services";
import type { AgentStatus } from "../lib/types";
import { GlassBadge, GlassButton, GlassPanel, GlassSelect, GlassSurface } from "../components/glass";
import { Sparkline } from "../components/charts";
import { ActivityFeed, AgentStatusBadge, AnimatedNumber, ErrorState, Reveal, SegmentedControl, Skeleton, Toggle } from "../components/ui";
import { toast } from "../components/toast";
import { AgentTile } from "./Agents";

type Tab = "Vue d'ensemble" | "Activité" | "Tâches" | "Sources" | "Performance" | "Configuration";
const TABS: Tab[] = ["Vue d'ensemble", "Activité", "Tâches", "Sources", "Performance", "Configuration"];
const taskTone = (s: string) => (s === "Terminé" ? "success" : s === "En cours" ? "gold" : "neutral") as "success" | "gold" | "neutral";

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const agentsQ = useAgents(400);
  const navigate = useNavigate();
  const agent = useMemo(() => mockAgents.find((a) => a.id === id), [id]);
  const [tab, setTab] = useState<Tab>("Vue d'ensemble");
  const [statusOverride, setStatusOverride] = useState<AgentStatus | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [autonomy, setAutonomy] = useState("Standard");
  const [humanValidation, setHumanValidation] = useState(true);

  if (agentsQ.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-36" />
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (!agent) {
    return <GlassSurface><ErrorState title="Agent introuvable" desc="Cet agent n'existe pas ou a été retiré de l'organisation." onRetry={() => navigate("/agents")} /></GlassSurface>;
  }

  const status: AgentStatus = statusOverride ?? agent.status;
  const isRunning = status === "Opérationnel";

  const toggleRun = () => {
    if (isRunning) {
      setStatusOverride("En veille");
      toast.neutral(`${agent.name} mis en pause`, {
        description: "Les tâches en cours seront terminées avant la mise en veille.",
        action: { label: "Reprendre", onClick: () => setStatusOverride("Opérationnel") },
      });
    } else {
      setStatusOverride("Opérationnel");
      toast.success(`${agent.name} réactivé`, { description: "L'agent reprend ses opérations immédiatement." });
    }
  };

  return (
    <div className="space-y-4">
      <Reveal>
        <Link to="/agents" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-cream/50 transition-colors hover:text-cream">
          <ArrowLeft size={14} strokeWidth={1.75} /> Agents
        </Link>
      </Reveal>

      <Reveal delay={0.05}>
        <GlassSurface className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <AgentTile agentId={agent.id} tint={agent.tint} active={isRunning} error={status === "Erreur"} size="lg" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[21px] font-semibold tracking-tight">{agent.name}</h1>
                  <AgentStatusBadge status={status} />
                </div>
                <p className="mt-1 text-[13px] text-cream/55">{agent.role}</p>
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-cream/45">{agent.description}</p>
              </div>
            </div>
            <GlassButton variant={isRunning ? "ghost" : "primary"} iconLeft={isRunning ? <Pause size={14} strokeWidth={1.75} /> : <Play size={14} strokeWidth={1.75} />} onClick={toggleRun}>
              {isRunning ? "Suspendre" : "Reprendre"}
            </GlassButton>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-[13px] border border-white/[0.06] bg-white/[0.05]">
            {[
              { k: "Tâches aujourd'hui", v: <AnimatedNumber value={String(agent.actionsToday)} /> },
              { k: "Taux de réussite", v: <span className="num">{agent.accuracy}%</span> },
              { k: "Temps moyen", v: <span className="num">{agent.avgTime}</span> },
            ].map((s) => (
              <div key={s.k} className="bg-ink-900/70 px-4 py-3 text-center sm:text-left">
                <p className="text-[9.5px] uppercase tracking-[0.12em] text-cream/35">{s.k}</p>
                <p className="mt-1 text-[19px] font-semibold leading-none">{s.v}</p>
              </div>
            ))}
          </div>
        </GlassSurface>
      </Reveal>

      <Reveal delay={0.1}>
        <SegmentedControl value={tab} onChange={setTab} options={TABS.map((t) => ({ value: t, label: t }))} size="sm" />
      </Reveal>

      <Reveal delay={0.14} key={tab}>
        {tab === "Vue d'ensemble" && (
          <div className="grid gap-4 lg:grid-cols-12">
            <GlassPanel eyebrow="Capacités" title="Ce que fait cet agent" className="lg:col-span-7">
              <ul className="space-y-2.5">
                {agent.capabilities.map((c) => (
                  <li key={c} className="flex items-center gap-2.5 rounded-[11px] border border-white/[0.06] bg-white/[0.015] px-3.5 py-2.5">
                    <span className="h-[5px] w-[5px] rounded-full bg-champagne-400" />
                    <span className="text-[13px] font-medium">{c}</span>
                  </li>
                ))}
              </ul>
              <p className="num mt-4 text-[9.5px] uppercase tracking-[0.12em] text-cream/30">Dernière activité · {agent.lastActivity}</p>
            </GlassPanel>
            <GlassPanel eyebrow="Rythme" title="7 derniers jours" className="lg:col-span-5">
              <Sparkline data={agent.week} width={300} height={72} className="w-full" />
              <div className="mt-3 flex items-center justify-between">
                <span className="num text-[10px] text-cream/35">moyenne {Math.round(agent.week.reduce((a, b) => a + b, 0) / 7)} actions/jour</span>
                <GlassBadge tone={isRunning ? "success" : "neutral"} dot pulse={isRunning}>{agent.current}</GlassBadge>
              </div>
            </GlassPanel>
          </div>
        )}

        {tab === "Activité" && (
          <GlassPanel eyebrow="Journal" title="Activité récente"><ActivityFeed events={agent.events} /></GlassPanel>
        )}

        {tab === "Tâches" && (
          <GlassPanel eyebrow="File de travail" title={`${agent.tasks.length} tâches`}>
            <ul className="divide-y divide-white/[0.05]">
              {agent.tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">{t.label}</span>
                    <span className="num mt-0.5 block text-[9.5px] uppercase tracking-[0.12em] text-cream/30">Échéance · {t.due}</span>
                  </span>
                  <GlassBadge tone={taskTone(t.status)} dot={t.status === "En cours"} pulse={t.status === "En cours"}>{t.status}</GlassBadge>
                </li>
              ))}
            </ul>
          </GlassPanel>
        )}

        {tab === "Sources" && (
          <GlassPanel eyebrow="Données" title="Sources utilisées par l'agent">
            <ul className="space-y-2.5">
              {agent.sources.map((s) => (
                <li key={s} className="flex items-center justify-between gap-3 rounded-[11px] border border-white/[0.06] bg-white/[0.015] px-3.5 py-3">
                  <span className="text-[13px] font-medium">{s}</span>
                  <Link to="/sources" className="text-[11px] font-medium text-cream/55 transition-colors hover:text-cream">Gérer →</Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[11.5px] leading-relaxed text-cream/45">
              Les accès sont révoqués automatiquement si une source passe en erreur.
            </p>
          </GlassPanel>
        )}

        {tab === "Performance" && (
          <div className="grid gap-4 lg:grid-cols-12">
            <GlassPanel eyebrow="Volume" title="Actions par jour" className="lg:col-span-7">
              <Sparkline data={agent.week} width={420} height={90} className="w-full" />
            </GlassPanel>
            <GlassPanel eyebrow="Qualité" title="Indicateurs" className="lg:col-span-5">
              <dl className="space-y-3">
                {[
                  { k: "Taux de réussite", v: `${agent.accuracy}%`, pct: agent.accuracy },
                  { k: "Temps moyen par tâche", v: agent.avgTime, pct: 70 },
                  { k: "Respect des seuils", v: "97%", pct: 97 },
                ].map((m) => (
                  <div key={m.k}>
                    <div className="flex items-center justify-between">
                      <dt className="text-[11.5px] text-cream/50">{m.k}</dt>
                      <dd className="num text-[12.5px] font-semibold">{m.v}</dd>
                    </div>
                    <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-champagne-500/70 transition-all duration-1000" style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                ))}
              </dl>
            </GlassPanel>
          </div>
        )}

        {tab === "Configuration" && (
          <GlassPanel eyebrow="Réglages" title={`Configuration — ${agent.name}`}>
            <div className="divide-y divide-white/[0.05]">
              <div className="flex items-center justify-between gap-4 py-3.5">
                <div>
                  <p className="text-[13px] font-medium">Agent activé</p>
                  <p className="mt-0.5 text-[11.5px] text-cream/45">Un agent désactivé ne traite plus aucune tâche.</p>
                </div>
                <Toggle
                  checked={enabled}
                  onChange={(v) => {
                    setEnabled(v);
                    setStatusOverride(v ? "Opérationnel" : "En veille");
                    toast(v ? `${agent.name} activé` : `${agent.name} désactivé`, { tone: v ? "success" : "neutral" });
                  }}
                  label={`Activer ${agent.name}`}
                />
              </div>
              <div className="flex items-center justify-between gap-4 py-3.5">
                <div>
                  <p className="text-[13px] font-medium">Niveau d'autonomie</p>
                  <p className="mt-0.5 text-[11.5px] text-cream/45">Standard exécute, Supervisée demande avant d'agir.</p>
                </div>
                <div className="w-44">
                  <GlassSelect value={autonomy} onChange={setAutonomy} options={["Standard", "Renforcée", "Supervisée"].map((o) => ({ value: o, label: o }))} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 py-3.5">
                <div>
                  <p className="text-[13px] font-medium">Validation humaine requise</p>
                  <p className="mt-0.5 text-[11.5px] text-cream/45">Les actions sensibles passent par le centre de validation.</p>
                </div>
                <Toggle checked={humanValidation} onChange={setHumanValidation} label="Validation humaine requise" />
              </div>
            </div>
            <p className={cn("num mt-4 text-[9.5px] uppercase tracking-[0.12em]", enabled ? "text-cream/30" : "text-saffron")}>
              {enabled ? "Configuration appliquée à la prochaine tâche" : "Agent en pause — les tâches en cours seront terminées"}
            </p>
          </GlassPanel>
        )}
      </Reveal>
    </div>
  );
}
