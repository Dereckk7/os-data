import { useMemo, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn, useApprovals } from "../lib/services";
import type { Approval, ApprovalCategory } from "../lib/types";
import { GlassBadge, GlassSurface } from "../components/glass";
import { AnimatedNumber, EASE, EmptyState, Reveal, SegmentedControl } from "../components/ui";
import { toast } from "../components/toast";

const CATEGORIES: ("Toutes" | ApprovalCategory)[] = [
  "Toutes", "Messages", "Communications", "Modifications clients", "Actions financières", "Opérations", "Rapports", "Actions agents",
];
type HistoryTab = "Validées" | "Rejetées" | "Modifiées" | "Automatiques";
const statusOf: Record<HistoryTab, Approval["status"]> = {
  "Validées": "validee", "Rejetées": "rejetee", "Modifiées": "modifiee", "Automatiques": "modifiee",
};

export default function Validation() {
  const { approvals, pending, setStatus } = useApprovals();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Toutes");
  const [historyTab, setHistoryTab] = useState<HistoryTab>("Validées");

  const filteredPending = useMemo(
    () => (category === "Toutes" ? pending : pending.filter((a) => a.category === category)),
    [pending, category]
  );
  const history = useMemo(
    () => approvals.filter((a) => a.status === statusOf[historyTab] && historyTab !== "Automatiques"),
    [approvals, historyTab]
  );

  const decide = (a: Approval, status: Approval["status"], label: string, tone: "success" | "neutral" | "warning") => {
    setStatus(a.id, status);
    const undo = a.status;
    toast[tone](label, { description: a.title, action: { label: "Annuler", onClick: () => setStatus(a.id, undo) } });
  };

  return (
    <div className="space-y-6">
      <Reveal>
        <header>
          <p className="eyebrow">Contrôle humain</p>
          <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Validation</h1>
          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-cream/50">
            Le DATA OS peut travailler seul, mais l'entreprise garde le contrôle des actions sensibles.
          </p>
        </header>
      </Reveal>

      <section aria-label="Actions en attente">
        <Reveal delay={0.05}>
          <div className="mb-3 flex flex-wrap items-baseline gap-2.5">
            <h2 className="text-[15px] font-semibold tracking-tight">En attente</h2>
            <span className="num text-[22px] font-semibold text-champagne-300"><AnimatedNumber value={String(pending.length)} /></span>
            <span className="text-xs text-cream/45">actions nécessitent votre attention</span>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mb-4 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrer par catégorie">
            {CATEGORIES.map((c) => (
              <button
                key={c} onClick={() => setCategory(c)}
                className={cn(
                  "h-9 rounded-full border px-3.5 text-xs font-medium transition-all duration-200",
                  category === c ? "border-cream/30 bg-cream/[0.08] text-cream" : "border-white/[0.08] bg-white/[0.02] text-cream/55 hover:border-white/[0.15] hover:text-cream/85"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </Reveal>

        {pending.length === 0 ? (
          <GlassSurface>
            <EmptyState icon={<Check size={18} strokeWidth={1.5} />} title="Tout est validé." desc="Aucune action sensible en attente. Les agents continuent de travailler en autonomie." />
          </GlassSurface>
        ) : filteredPending.length === 0 ? (
          <GlassSurface>
            <EmptyState title="Aucune action dans cette catégorie." desc="Changez de filtre pour voir les autres actions en attente." />
          </GlassSurface>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredPending.map((a, i) => (
              <Reveal key={a.id} delay={0.04 * i}>
                <motion.article layout className="glass glass-sweep flex h-full flex-col p-5" aria-label={a.title}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="num text-[9px] uppercase tracking-[0.14em] text-cream/35">{a.agent} · {a.time}</span>
                    <GlassBadge tone={a.category === "Actions financières" ? "warning" : "neutral"}>{a.category}</GlassBadge>
                  </div>
                  <h3 className="mt-2.5 text-[15px] font-semibold leading-snug tracking-tight">{a.title}</h3>
                  <dl className="mt-3.5 space-y-2.5 text-xs">
                    <div>
                      <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cream/35">Pourquoi ?</dt>
                      <dd className="mt-0.5 leading-relaxed text-cream/60">{a.why}</dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cream/35">Données utilisées</dt>
                      <dd className="num mt-0.5 text-[10.5px] leading-relaxed text-cream/45">{a.data}</dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cream/35">Impact</dt>
                      <dd className="mt-0.5 leading-relaxed text-cream/60">{a.impact}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4" style={{ marginTop: "auto" }}>
                    <button
                      onClick={() => decide(a, "rejetee", "Action rejetée", "warning")}
                      className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[10px] border border-ember/25 bg-ember/[0.07] text-xs font-semibold text-[#e28d85] transition-all duration-200 hover:bg-ember/[0.14] active:scale-[0.98]"
                    >
                      <X size={13} strokeWidth={2} /> Rejeter
                    </button>
                    <button
                      onClick={() => decide(a, "modifiee", "Action modifiée", "neutral")}
                      className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[10px] border border-white/[0.09] text-xs font-medium text-cream/70 transition-all duration-200 hover:border-white/[0.18] hover:bg-white/[0.04] hover:text-cream active:scale-[0.98]"
                    >
                      <Pencil size={12.5} strokeWidth={1.75} /> Modifier
                    </button>
                    <button
                      onClick={() => decide(a, "validee", "Action validée", "success")}
                      className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[10px] bg-cream text-xs font-semibold text-ink-950 transition-all duration-200 hover:bg-white active:scale-[0.98]"
                    >
                      <Check size={13} strokeWidth={2.25} /> Valider
                    </button>
                  </div>
                </motion.article>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Historique des validations">
        <Reveal delay={0.1}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold tracking-tight">Historique</h2>
            <SegmentedControl
              value={historyTab} onChange={setHistoryTab} size="sm"
              options={(["Validées", "Rejetées", "Modifiées", "Automatiques"] as HistoryTab[]).map((h) => ({ value: h, label: h }))}
            />
          </div>
        </Reveal>
        <GlassSurface className="overflow-hidden p-0">
          {history.length === 0 ? (
            <p className="px-6 py-10 text-center text-[13px] text-cream/40">
              {historyTab === "Automatiques" ? "Les actions automatiques (sans risque) seront journalisées ici." : `Aucune action ${historyTab.toLowerCase()} pour le moment.`}
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {history.map((a, i) => (
                <motion.li
                  layout key={a.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03, ease: EASE }}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02] sm:px-6"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{a.title}</span>
                    <span className="num mt-0.5 block text-[9.5px] uppercase tracking-[0.1em] text-cream/30">{a.agent} · {a.category} · {a.time}</span>
                  </span>
                  <GlassBadge tone={a.status === "validee" ? "success" : a.status === "rejetee" ? "danger" : "neutral"} dot>
                    {a.status === "validee" ? "Validée" : a.status === "rejetee" ? "Rejetée" : "Modifiée"}
                  </GlassBadge>
                </motion.li>
              ))}
            </ul>
          )}
        </GlassSurface>
      </section>
    </div>
  );
}
