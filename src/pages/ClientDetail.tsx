import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Mail, MessageCircle, Phone, Sparkles, Users } from "lucide-react";
import { mockClients, mockRequests } from "../lib/mock";
import { cn, fmtMoney, useClients } from "../lib/services";
import type { Segment, Tone } from "../lib/types";
import { GlassBadge, GlassButton, GlassPanel, GlassSurface } from "../components/glass";
import { ActivityFeed, Avatar, ErrorState, Reveal, Skeleton, StatusBadge } from "../components/ui";
import { riskTone } from "./Clients";
import { toast } from "../components/toast";

const segmentTone: Record<Segment, Tone> = { VIP: "gold", "Fidèle": "neutral", Nouveau: "success", "À risque": "danger" };
const channelIcon = { WhatsApp: MessageCircle, Email: Mail, Appel: Phone, "Réunion": Users } as const;

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const clientsQ = useClients(400);
  const navigate = useNavigate();
  const [acted, setActed] = useState<Record<string, boolean>>({});
  const client = useMemo(() => mockClients.find((c) => c.id === id), [id]);
  const clientRequests = useMemo(() => mockRequests.filter((r) => r.clientId === id), [id]);

  if (clientsQ.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40" />
        <div className="grid gap-4 lg:grid-cols-12">
          <Skeleton className="h-80 lg:col-span-7" />
          <Skeleton className="h-80 lg:col-span-5" />
        </div>
      </div>
    );
  }
  if (!client) {
    return <GlassSurface><ErrorState title="Client introuvable" desc="Cette fiche n'existe pas ou a été fusionnée." onRetry={() => navigate("/clients")} /></GlassSurface>;
  }

  const planAction = (label: string, agent: string, actionId: string) => {
    setActed((prev) => ({ ...prev, [actionId]: true }));
    toast.gold("Action planifiée", {
      description: `${label} — transmise à ${agent}.`,
      action: { label: "Voir les tâches", onClick: () => navigate("/tasks") },
    });
  };

  return (
    <div className="space-y-4">
      <Reveal>
        <Link to="/clients" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-cream/50 transition-colors hover:text-cream">
          <ArrowLeft size={14} strokeWidth={1.75} /> Clients
        </Link>
      </Reveal>

      <Reveal delay={0.05}>
        <GlassSurface className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <Avatar initials={client.initials} name={client.name} size={52} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[21px] font-semibold tracking-tight">{client.name}</h1>
                  <GlassBadge tone={segmentTone[client.segment]} dot={client.segment === "VIP"}>{client.segment}</GlassBadge>
                  <GlassBadge tone={client.state === "Actif" ? "success" : client.state === "Inactif" ? "neutral" : "danger"}>{client.state}</GlassBadge>
                </div>
                <p className="num mt-1.5 text-[11px] text-cream/45">{client.email} · {client.phone}</p>
                <p className="mt-1 text-[12px] text-cream/45">
                  {client.city} · client depuis {client.since} · suivi par <span className="text-cream/70">{client.owner}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="card-eyebrow">Valeur client</p>
              <p className="num mt-1.5 text-[24px] font-semibold tracking-tight text-champagne-300">{fmtMoney(client.value)}</p>
              <p className="num mt-1 text-[9.5px] uppercase tracking-[0.12em] text-cream/30">cumulée depuis {client.since}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[13px] border border-white/[0.06] bg-white/[0.05] sm:grid-cols-4">
            {[
              { k: "Demandes", v: String(client.requestsCount), cls: "" },
              { k: "Réservations", v: String(client.bookingsCount), cls: "" },
              { k: "Satisfaction", v: `${client.satisfaction}%`, cls: "text-jade" },
              { k: "Risque", v: client.risk, cls: client.risk === "Élevé" ? "text-[#e28d85]" : client.risk === "Modéré" ? "text-saffron" : "text-jade" },
            ].map((s) => (
              <div key={s.k} className="bg-ink-900/70 px-4 py-3">
                <p className="text-[9.5px] uppercase tracking-[0.12em] text-cream/35">{s.k}</p>
                <p className={cn("num mt-1 text-[15px] font-semibold", s.cls)}>{s.v}</p>
              </div>
            ))}
          </div>
        </GlassSurface>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <Reveal delay={0.1}>
            <GlassPanel eyebrow="Historique" title="Événements récents"><ActivityFeed events={client.history} /></GlassPanel>
          </Reveal>
          <Reveal delay={0.14}>
            <GlassPanel eyebrow="Demandes" title={`${clientRequests.length} demandes liées`}>
              {clientRequests.length === 0 ? (
                <p className="py-4 text-center text-xs text-cream/40">Aucune demande associée à ce client.</p>
              ) : (
                <ul className="divide-y divide-white/[0.05]">
                  {clientRequests.map((r) => (
                    <li key={r.id}>
                      <Link to={`/requests/${r.id}`} className="group flex items-center justify-between gap-3 py-3 transition-colors hover:bg-white/[0.02] first:pt-0 last:pb-0">
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium">{r.title}</span>
                          <span className="num mt-0.5 block text-[9.5px] text-cream/35">{r.ref} · {r.time}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="num hidden text-[12px] font-semibold sm:block">{r.amountLabel}</span>
                          <StatusBadge status={r.status} />
                          <ArrowUpRight size={13} strokeWidth={1.75} className="text-cream/25 transition-colors group-hover:text-cream" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </GlassPanel>
          </Reveal>
          <Reveal delay={0.18}>
            <GlassPanel eyebrow="Communications" title="Derniers échanges">
              <ul className="space-y-3">
                {client.comms.map((cm) => {
                  const Icon = channelIcon[cm.channel];
                  return (
                    <li key={cm.id} className="flex items-start gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] border border-white/[0.08] bg-ink-950/55 text-cream/60">
                        <Icon size={13} strokeWidth={1.6} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="text-[12.5px] font-medium">{cm.channel}</span>
                          <span className="num shrink-0 text-[9.5px] text-cream/35">{cm.date}</span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-cream/50">{cm.summary}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </GlassPanel>
          </Reveal>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <Reveal delay={0.12}>
            <GlassPanel eyebrow="Intelligence DATA OS" title="Insights sur ce client">
              <ul className="space-y-3">
                {client.aiInsights.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Sparkles size={13} strokeWidth={1.6} className="mt-0.5 shrink-0 text-champagne-300" />
                    <span className="text-[12.5px] leading-relaxed text-cream/65">{ins}</span>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          </Reveal>
          <Reveal delay={0.16}>
            <GlassPanel eyebrow="Actions recommandées" title="Prochaines étapes">
              <div className="space-y-2">
                {client.recommendedActions.map((a) => {
                  const done = acted[a.id];
                  return (
                    <div key={a.id} className={cn("flex items-center justify-between gap-3 rounded-[12px] border p-3 transition-all duration-300", done ? "border-jade/25 bg-jade/[0.05]" : "border-white/[0.07] bg-white/[0.015] hover:border-white/[0.15]")}>
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-medium leading-snug">{a.label}</span>
                        <span className="num mt-1 block text-[9px] uppercase tracking-[0.12em] text-cream/30">{a.agent}</span>
                      </span>
                      {done ? <GlassBadge tone="success" dot>Planifiée</GlassBadge> : (
                        <GlassButton size="sm" variant="gold" onClick={() => planAction(a.label, a.agent, a.id)}>Planifier</GlassButton>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 border-t border-white/[0.06] pt-3.5">
                <GlassButton
                  variant="soft" size="sm" full iconLeft={<MessageCircle size={13} strokeWidth={1.6} />}
                  onClick={() => toast.neutral("Conversation ouverte", { description: `Fil ${client.name} chargé depuis WhatsApp Business.` })}
                >
                  Ouvrir la conversation
                </GlassButton>
              </div>
            </GlassPanel>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
