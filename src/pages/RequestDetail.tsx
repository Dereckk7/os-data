import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Check, MessageCircle } from "lucide-react";
import { mockRequests } from "../lib/mock";
import { cn, useRequests } from "../lib/services";
import { GlassBadge, GlassButton, GlassPanel, GlassSurface } from "../components/glass";
import { TypeIcon } from "../components/icons";
import { ActivityFeed, Avatar, ErrorState, PriorityBadge, Reveal, Skeleton, StatusBadge } from "../components/ui";
import { toast } from "../components/toast";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const requestsQ = useRequests(450);
  const navigate = useNavigate();
  const request = useMemo(() => mockRequests.find((r) => r.id === id), [id]);
  const [selected, setSelected] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);

  if (requestsQ.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40" />
        <div className="grid gap-4 lg:grid-cols-12">
          <Skeleton className="h-72 lg:col-span-7" />
          <Skeleton className="h-72 lg:col-span-5" />
        </div>
      </div>
    );
  }
  if (!request) {
    return (
      <GlassSurface>
        <ErrorState title="Demande introuvable" desc="Cette demande n'existe pas ou a été archivée." onRetry={() => navigate("/requests")} />
      </GlassSurface>
    );
  }

  const status = approved ? "Confirmée" : request.status;
  const selectedOption = request.options.find((o) => o.id === selected);

  return (
    <div className="space-y-4">
      <Reveal>
        <Link to="/requests" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-cream/50 transition-colors hover:text-cream">
          <ArrowLeft size={14} strokeWidth={1.75} /> Demandes
        </Link>
      </Reveal>

      <Reveal delay={0.05}>
        <GlassSurface className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="num text-[11px] tracking-[0.08em] text-cream/40">{request.ref}</span>
                <StatusBadge status={status} pulse={!approved} />
                <PriorityBadge priority={request.priority} />
                {request.vip && <GlassBadge tone="gold" dot>VIP</GlassBadge>}
              </div>
              <h1 className="mt-3 text-[20px] font-semibold tracking-tight sm:text-[22px]">{request.title}</h1>
              <p className="mt-1.5 text-[13px] text-cream/55">{request.summary}</p>
              <Link
                to={`/clients/${request.clientId}`}
                className="group mt-4 inline-flex items-center gap-2.5 rounded-[11px] border border-white/[0.07] bg-white/[0.02] py-1.5 pl-1.5 pr-3 transition-all duration-200 hover:border-white/[0.16]"
              >
                <Avatar initials={request.client.split(" ").map((p) => p[0]).join("")} name={request.client} size={26} />
                <span className="text-[12.5px] font-medium">{request.client}</span>
                <span className="flex items-center gap-1 text-[10.5px] text-cream/40 transition-colors group-hover:text-cream">
                  Voir la fiche <ArrowUpRight size={11} strokeWidth={1.75} />
                </span>
              </Link>
            </div>
            <div className="shrink-0 text-right">
              <p className="card-eyebrow">Budget estimé</p>
              <p className="num mt-1.5 text-[22px] font-semibold tracking-tight">{request.amountLabel}</p>
              <p className="num mt-1 text-[9.5px] uppercase tracking-[0.12em] text-cream/30">{request.agent}</p>
            </div>
          </div>
        </GlassSurface>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-12">
        <Reveal delay={0.1} className="lg:col-span-7">
          <GlassPanel eyebrow="Options trouvées" title="Sélection préparée par l'Agent Réservation" className="h-full">
            {request.options.length === 0 ? (
              <div className="py-6 text-center">
                <TypeIcon type={request.type} size={18} strokeWidth={1.5} className="mx-auto text-cream/25" />
                <p className="mt-3 text-[13px] font-medium">L'agent analyse les options</p>
                <p className="mt-1 text-xs text-cream/45">La recherche partenaires est en cours. Vous serez notifié.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {request.options.map((opt) => {
                  const isSelected = selected === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={cn(
                        "rounded-[14px] border p-4 transition-all duration-300",
                        isSelected ? "border-champagne-500/45 bg-champagne-500/[0.05] shadow-[0_0_30px_rgba(201,178,124,0.06)]" : "border-white/[0.07] bg-white/[0.015] hover:border-white/[0.14]"
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="num rounded-[6px] border border-white/[0.09] bg-white/[0.04] px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.12em] text-cream/55">{opt.label}</span>
                            {opt.recommended && <GlassBadge tone="gold" dot>Recommandée</GlassBadge>}
                          </div>
                          <p className="mt-2 text-[14.5px] font-semibold tracking-tight">{opt.vehicle}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {opt.features.map((f) => (
                              <span key={f} className="rounded-full border border-white/[0.07] px-2 py-0.5 text-[10.5px] text-cream/50">{f}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="num text-[19px] font-semibold tracking-tight">{opt.price}</p>
                          <p className="num mt-0.5 text-[9px] uppercase tracking-[0.1em] text-cream/30">par prestation</p>
                        </div>
                      </div>
                      <div className="mt-3.5 flex flex-wrap items-center gap-4 border-t border-white/[0.06] pt-3.5">
                        <div className="min-w-[160px] flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-[0.12em] text-cream/35">Fiabilité</span>
                            <span className="num text-[11px] font-semibold text-champagne-300">{opt.reliability}%</span>
                          </div>
                          <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
                            <div className="h-full rounded-full bg-champagne-500/80 transition-all duration-700" style={{ width: `${opt.reliability}%` }} />
                          </div>
                        </div>
                        {isSelected ? (
                          <GlassBadge tone="gold" dot className="px-3 py-1.5"><Check size={12} strokeWidth={2} /> Sélectionnée</GlassBadge>
                        ) : (
                          <GlassButton size="sm" variant="ghost" onClick={() => setSelected(opt.id)} disabled={approved}>Sélectionner</GlassButton>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassPanel>
        </Reveal>

        <div className="space-y-4 lg:col-span-5">
          <Reveal delay={0.14}>
            <GlassPanel eyebrow="Décision" title="Validation de la direction">
              {approved ? (
                <div className="flex items-start gap-2.5 rounded-[12px] border border-jade/25 bg-jade/[0.06] p-3.5">
                  <Check size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-jade" />
                  <div>
                    <p className="text-[13px] font-medium text-jade">Option confirmée</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-cream/50">
                      {selectedOption?.vehicle} — {selectedOption?.price}. Le client a été notifié.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs leading-relaxed text-cream/50">
                    Validez la sélection pour lancer la confirmation partenaire et notifier le client.
                  </p>
                  <div className="mt-3.5 space-y-2">
                    <GlassButton
                      variant="primary" full disabled={!selectedOption}
                      onClick={() => {
                        setApproved(true);
                        toast.success("Option validée", {
                          description: `${selectedOption?.vehicle} — ${selectedOption?.price} · confirmation envoyée au client.`,
                          action: { label: "Annuler", onClick: () => { setApproved(false); toast.neutral("Validation annulée"); } },
                        });
                      }}
                    >
                      Valider la sélection
                    </GlassButton>
                    {!selectedOption && <p className="text-center text-[10.5px] text-cream/35">Sélectionnez d'abord une option ci-contre.</p>}
                    <GlassButton
                      variant="ghost" full iconLeft={<MessageCircle size={14} strokeWidth={1.6} />}
                      onClick={() => toast.neutral("Message préparé", { description: "Brouillon WhatsApp ajouté à la file." })}
                    >
                      Contacter le client
                    </GlassButton>
                  </div>
                </>
              )}
            </GlassPanel>
          </Reveal>

          <Reveal delay={0.18}>
            <GlassPanel eyebrow="Détails" title="Contexte de la demande">
              <dl className="space-y-2.5">
                {[
                  { k: "Référence", v: request.ref, mono: true },
                  { k: "Type", v: request.type },
                  { k: "Agent responsable", v: request.agent, mono: true },
                  { k: "Créée", v: request.time },
                  { k: "Mise à jour", v: "il y a 6 min" },
                ].map((row) => (
                  <div key={row.k} className="flex items-center justify-between gap-3">
                    <dt className="text-xs text-cream/40">{row.k}</dt>
                    <dd className={cn("text-xs font-medium text-cream/80", row.mono && "num text-[10.5px]")}>{row.v}</dd>
                  </div>
                ))}
              </dl>
            </GlassPanel>
          </Reveal>

          <Reveal delay={0.22}>
            <GlassPanel eyebrow="Activité" title="Chronologie">
              <ActivityFeed events={request.activity} />
            </GlassPanel>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
