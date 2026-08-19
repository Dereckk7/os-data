import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, GripVertical, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn, useTasks } from "../lib/services";
import type { Priority, TaskItem } from "../lib/types";
import { GlassBadge, GlassSurface } from "../components/glass";
import { EASE, PriorityBadge, Reveal, Skeleton } from "../components/ui";
import { toast } from "../components/toast";

const COLUMNS: { status: TaskItem["status"]; label: string }[] = [
  { status: "À faire", label: "À faire" },
  { status: "En cours", label: "En cours" },
  { status: "En attente", label: "En attente" },
  { status: "Terminé", label: "Terminé" },
];
const priorityOrder: Record<Priority, number> = { Critique: 0, Haute: 1, Normale: 2, Basse: 3 };

export default function Tasks() {
  const tasksQ = useTasks(550);
  const [overrides, setOverrides] = useState<Record<string, Partial<TaskItem>>>({});
  const navigate = useNavigate();

  const tasks = useMemo(
    () => tasksQ.data.map((t) => ({ ...t, ...overrides[t.id] })).sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]),
    [tasksQ.data, overrides]
  );

  const move = (t: TaskItem, dir: 1 | -1) => {
    const idx = COLUMNS.findIndex((c) => c.status === t.status);
    const next = COLUMNS[idx + dir];
    if (!next) return;
    const prevStatus = t.status;
    setOverrides((prev) => ({ ...prev, [t.id]: { ...prev[t.id], status: next.status } }));
    if (next.status === "Terminé") {
      toast.success("Tâche terminée", {
        description: t.title,
        action: { label: "Annuler", onClick: () => setOverrides((prev) => ({ ...prev, [t.id]: { ...prev[t.id], status: prevStatus } })) },
      });
    }
  };

  const counts = (s: TaskItem["status"]) => tasks.filter((t) => t.status === s).length;

  return (
    <div className="space-y-5">
      <Reveal>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Travail</p>
            <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Tâches</h1>
            <p className="mt-1.5 text-[13.5px] text-cream/50">Le DATA OS transforme ses analyses en travail concret — priorisé et suivi.</p>
          </div>
          <button
            onClick={() => toast.gold("Tâche créée", { description: "« Nouvelle tâche » ajoutée à la colonne À faire." })}
            className="inline-flex h-10 items-center gap-2 rounded-[11px] bg-cream px-4 text-[13px] font-semibold text-ink-950 transition-all duration-200 hover:bg-white active:scale-[0.98]"
          >
            <Plus size={15} strokeWidth={1.75} /> Nouvelle tâche
          </button>
        </header>
      </Reveal>

      {tasksQ.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <section key={col.status} aria-label={`Colonne ${col.label}`} className="flex min-h-[180px] flex-col">
              <div className="mb-2.5 flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/45">{col.label}</span>
                <span className="num rounded-[6px] border border-white/[0.08] bg-white/[0.03] px-1.5 py-px text-[9.5px] text-cream/50">{counts(col.status)}</span>
              </div>
              <div className="flex-1 space-y-2.5 rounded-[14px] border border-white/[0.05] bg-white/[0.012] p-2">
                {tasks.filter((t) => t.status === col.status).map((t) => (
                  <motion.article
                    layout key={t.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className={cn("glass p-3.5 transition-all duration-200 hover:-translate-y-px", col.status === "Terminé" && "opacity-70")}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-cream/25"><GripVertical size={13} strokeWidth={1.75} /></span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-[12.5px] font-medium leading-snug", col.status === "Terminé" && "line-through decoration-cream/30")}>{t.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <PriorityBadge priority={t.priority} />
                          {t.count && <span className="num rounded-full border border-white/[0.08] px-2 py-px text-[9px] text-cream/45">{t.count}</span>}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-2">
                          <span className="num truncate text-[8.5px] uppercase tracking-[0.12em] text-cream/30">{t.agent} · {t.due}</span>
                          {t.ref && (
                            <button
                              onClick={() => navigate(`/requests/${t.ref?.toLowerCase()}`)}
                              className="flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-cream/50 transition-colors hover:text-cream"
                              aria-label={`Ouvrir ${t.ref}`}
                            >
                              Ouvrir <ArrowUpRight size={10} strokeWidth={1.75} />
                            </button>
                          )}
                        </div>
                        <div className="mt-2 flex gap-1.5">
                          {col.status !== "À faire" && (
                            <button onClick={() => move(t, -1)} className="h-7 flex-1 rounded-[7px] border border-white/[0.08] text-[10px] font-medium text-cream/55 transition-colors hover:bg-white/[0.05] hover:text-cream">
                              ← Reculer
                            </button>
                          )}
                          {col.status !== "Terminé" && (
                            <button onClick={() => move(t, 1)} className="h-7 flex-1 rounded-[7px] border border-white/[0.08] text-[10px] font-medium text-cream/55 transition-colors hover:bg-white/[0.05] hover:text-cream">
                              Avancer →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
                {counts(col.status) === 0 && (
                  <p className="rounded-[10px] border border-dashed border-white/[0.08] p-4 text-center text-[11px] text-cream/25">Aucune tâche</p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      <Reveal delay={0.1}>
        <GlassSurface className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-[12.5px] text-cream/55">
            <span className="num font-semibold text-cream">{counts("À faire") + counts("En cours")}</span> tâches actives ·{" "}
            <span className="num font-semibold text-cream">{counts("En attente")}</span> en attente de décision
          </p>
          <GlassBadge tone="gold" dot>Les agents mettent à jour cette file automatiquement</GlassBadge>
        </GlassSurface>
      </Reveal>
    </div>
  );
}
