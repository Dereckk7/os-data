import { useMemo, useState, type ReactNode } from "react";
import { Check, HelpCircle, Pencil, ShieldAlert, TrendingUp, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn, useApprovals } from "../lib/services";
import type { Approval, ApprovalCategory, Tone } from "../lib/types";
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

/* Niveau de risque — classification présentationnelle dérivée de la catégorie
   (aucune donnée nouvelle : simple lecture de a.category). */
const riskOf = (a: Approval): { label: string; tone: Tone } => {
  if (a.category === "Actions financières") return { label: "Élevé", tone: "danger" };
  if (a.category === "Opérations" || a.category === "Modifications clients") return { label: "Modéré", tone: "warning" };
  return { label: "Faible", tone: "success" };
};

function Field({ icon, label, children, mono }: { icon: ReactNode; label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[9px] font-[590] uppercase tracking-[0.14em] text-cream/35">{icon}{label}</dt>
      <dd className={cn("mt-1 leading-relaxed text-cream/65", mono ? "num text-[10.5px] text-cream/45" : "text-xs")}>{children}</dd>
    </div>
  );
}

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
          <h1 className="mt-2 t-title">Validation</h1>
          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-cream/50">
            Le DATA OS peut travailler seul, mais l'entreprise garde le contrôle des actions sensibles.
          </p>
        </header>
      </Reveal>

      <section aria-label="Actions en attente">
        <Reveal delay={0.05}>
          <div className="mb-3 flex flex-wrap items-baseline gap-2.5">
            <h2 className="t-section">En attente</h2>
            <span className="num text-[22px] font-[590] text-champagne-300"><AnimatedNumber value={String(pending.length)} /></span>
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
                  category === c ? "border-transparent bg-[color-mix(in_srgb,var(--color-cream)_10%,transparent)] text-cream" : "border-transparent bg-[var(--surface-2)] text-cream/55 shadow-[var(--highlight-top)] hover:text-cream/85"
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
            {filteredPending.map((a, i) => {
              const risk = riskOf(a);
              return (
                <Reveal key={a.id} delay={0.04 * i}>
                  <motion.article
                    layout
                    className="surface-2 relative flex h-full flex-col overflow-hidden p-5"
                    aria-label={a.title}
                  >
                    {/* Accent champagne — zone de confiance / action critique */}
                    <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-champagne-500/60 to-transparent" aria-hidden />

                    <div className="flex items-start justify-between gap-3">
                      <span className="num text-[9px] uppercase tracking-[0.14em] text-cream/35">{a.agent} · {a.time}</span>
                      <GlassBadge tone={risk.tone} dot>Risque {risk.label.toLowerCase()}</GlassBadge>
                    </div>

                    {/* QUOI */}
                    <p className="mt-3 t-label text-champagne-300/80">Action demandée</p>
                    <h3 className="mt-1 text-[15.5px] font-[590] leading-snug tracking-tight">{a.title}</h3>
                    {a.impact && (
                      <p className="num mt-1.5 text-[13px] font-[590] text-champagne-300">{a.impact}</p>
                    )}

                    {/* POURQUOI / IMPACT / RISQUE / SOURCES */}
                    <dl className="mt-3.5 grid gap-3 sm:grid-cols-2">
                      <Field icon={<HelpCircle size={10} strokeWidth={2} />} label="Pourquoi">{a.why}</Field>
                      <Field icon={<TrendingUp size={10} strokeWidth={2} />} label="Impact">{a.impact || "—"}</Field>
                      <Field icon={<ShieldAlert size={10} strokeWidth={2} />} label="Risque">
                        <span className={cn(
                          risk.tone === "danger" ? "text-ember" : risk.tone === "warning" ? "text-saffron" : "text-jade",
                        )}>{risk.label}</span> · non exécutable sans votre accord
                      </Field>
                      <Field icon={<Check size={10} strokeWidth={2} />} label="Sources" mono>{a.data || "—"}</Field>
                    </dl>

                    {/* ACTION */}
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--card-divider)] pt-4" style={{ marginTop: "auto" }}>
                      <button
                        onClick={() => decide(a, "rejetee", "Action rejetée", "warning")}
                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-sm border border-ember/25 bg-ember/[0.07] text-xs font-[590] text-ember transition-all duration-200 hover:bg-ember/[0.14] active:scale-[0.98]"
                      >
                        <X size={13} strokeWidth={2} /> Rejeter
                      </button>
                      <button
                        onClick={() => decide(a, "modifiee", "Action modifiée", "neutral")}
                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-sm border border-[var(--hairline-strong)] text-xs font-medium text-cream/70 transition-all duration-200 hover:bg-[var(--row-hover)] hover:text-cream active:scale-[0.98]"
                      >
                        <Pencil size={12.5} strokeWidth={1.75} /> Modifier
                      </button>
                      <button
                        onClick={() => decide(a, "validee", "Action approuvée", "success")}
                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-sm bg-champagne-500 text-xs font-[590] text-ink-950 shadow-[0_2px_18px_-6px_color-mix(in_srgb,var(--color-champagne-500)_60%,transparent)] transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
                      >
                        <Check size={13} strokeWidth={2.25} /> Approuver
                      </button>
                    </div>
                  </motion.article>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      <section aria-label="Historique des validations">
        <Reveal delay={0.1}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="t-section">Historique</h2>
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
            <ul className="divide-y divide-[var(--card-divider)]">
              {history.map((a, i) => (
                <motion.li
                  layout key={a.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03, ease: EASE }}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--row-hover)] sm:px-6"
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
