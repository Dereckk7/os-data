import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronRight, Columns, Layers, List, Plus, Search } from "lucide-react";
import { mockAgents, mockClients } from "../lib/mock";
import { cn, useRequests } from "../lib/services";
import type { DataRequest, RequestStatus, RequestType } from "../lib/types";
import { GlassButton, GlassInput, GlassModal, GlassSelect, GlassSurface } from "../components/glass";
import { TypeIcon } from "../components/icons";
import { Avatar, EmptyState, FadeSwitch, PriorityBadge, Reveal, SegmentedControl, Skeleton, StatusBadge } from "../components/ui";
import { WorkCard, type WorkTone } from "../components/workcard";
import { toast } from "../components/toast";
import { AnimatePresence } from "framer-motion";

type View = "liste" | "board" | "calendrier" | "cartes";
type Filter = "Tous" | "VIP" | "En retard" | "Transferts" | "À confirmer";
const FILTERS: Filter[] = ["Tous", "VIP", "En retard", "Transferts", "À confirmer"];
const BOARD_COLUMNS: RequestStatus[] = ["En recherche", "À valider", "En attente client", "Confirmée", "En retard"];

export default function Requests() {
  const requestsQ = useRequests(600);
  const [added, setAdded] = useState<DataRequest[]>([]);
  const [view, setView] = useState<View>("liste");
  const [filter, setFilter] = useState<Filter>("Tous");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [seq, setSeq] = useState(0);
  const navigate = useNavigate();

  const [form, setForm] = useState({ client: mockClients[0].name, type: "Transfert" as RequestType, desc: "", priority: "Normale" });

  const list = useMemo(() => [...added, ...requestsQ.data], [added, requestsQ.data]);

  const filtered = useMemo(() => {
    let out = list.filter((r) => r.status !== "Traitée");
    if (filter === "VIP") out = out.filter((r) => r.vip);
    if (filter === "En retard") out = out.filter((r) => r.status === "En retard");
    if (filter === "Transferts") out = out.filter((r) => r.type === "Transfert");
    if (filter === "À confirmer") out = out.filter((r) => r.status === "À valider");
    const q = query.trim().toLowerCase();
    if (q) out = out.filter((r) => r.client.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.ref.toLowerCase().includes(q));
    return out;
  }, [list, filter, query]);

  const openCount = list.filter((r) => r.status !== "Traitée").length;
  const lateCount = list.filter((r) => r.status === "En retard").length;
  const validateCount = list.filter((r) => r.status === "À valider").length;

  const createRequest = () => {
    const client = mockClients.find((c) => c.name === form.client);
    const now = new Date();
    const req: DataRequest = {
      id: `req-${Date.now()}`,
      ref: `REQ-${2482 + seq}`,
      clientId: client?.id ?? "cl-01",
      client: form.client,
      title: form.desc.trim() || `${form.type} — ${form.client}`,
      type: form.type,
      status: "En recherche",
      priority: form.priority as DataRequest["priority"],
      agent: "Agent Réservation",
      amountLabel: "À qualifier",
      vip: client?.segment === "VIP",
      day: now.getDate(),
      time: "à l'instant",
      summary: `${form.type} · créé aujourd'hui · ${form.client}`,
      options: [],
      activity: [{ id: "a1", time: "à l'instant", title: "Demande créée et qualifiée", agent: "Agent Réservation", desc: "Recherche d'options lancée automatiquement." }],
    };
    setAdded((prev) => [req, ...prev]);
    setSeq((s) => s + 1);
    setModalOpen(false);
    setForm({ client: mockClients[0].name, type: "Transfert", desc: "", priority: "Normale" });
    toast.gold(`Demande ${req.ref} créée`, {
      description: "Attribuée à l'Agent Réservation — recherche d'options en cours.",
      action: { label: "Ouvrir", onClick: () => navigate(`/requests/${req.id}`) },
    });
  };

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstOffset = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(now);

  return (
    <div className="space-y-5">
      <Reveal>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Pilotage des demandes</p>
            <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Demandes</h1>
            <p className="num mt-1.5 text-[11.5px] text-cream/45">
              {openCount} ouvertes · {lateCount} en retard · {validateCount} à valider
            </p>
          </div>
          <GlassButton variant="primary" iconLeft={<Plus size={15} strokeWidth={1.75} />} onClick={() => setModalOpen(true)}>
            Nouvelle demande
          </GlassButton>
        </header>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrer les demandes">
            {FILTERS.map((f) => (
              <button
                key={f} onClick={() => setFilter(f)}
                className={cn(
                  "h-9 rounded-full border px-4 text-xs font-medium transition-all duration-200",
                  filter === f ? "border-cream/30 bg-cream/[0.08] text-cream" : "border-white/[0.08] bg-white/[0.02] text-cream/55 hover:border-white/[0.15] hover:text-cream/85"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            <GlassInput
              placeholder="Rechercher…" aria-label="Rechercher une demande"
              icon={<Search size={14} strokeWidth={1.6} />}
              value={query} onChange={(e) => setQuery(e.target.value)}
              className="w-full lg:w-56"
            />
            <SegmentedControl<View>
              value={view} onChange={setView} size="sm"
              options={[
                { value: "liste", label: "Liste", icon: <List size={12.5} strokeWidth={1.75} /> },
                { value: "board", label: "Board", icon: <Columns size={12.5} strokeWidth={1.75} /> },
                { value: "calendrier", label: "Mois", icon: <CalendarDays size={12.5} strokeWidth={1.75} /> },
                { value: "cartes", label: "Cartes", icon: <Layers size={12.5} strokeWidth={1.75} /> },
              ]}
            />
          </div>
        </div>
      </Reveal>

      <AnimatePresence mode="wait" initial={false}>
      <FadeSwitch key={view} k={view}>
      {requestsQ.loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[62px]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <GlassSurface>
          <EmptyState
            title="Aucune demande pour le moment."
            desc="Ajustez vos filtres, ou créez une demande — les agents prennent le relais immédiatement."
            action={
              <div className="flex gap-2">
                <GlassButton variant="ghost" size="sm" onClick={() => { setFilter("Tous"); setQuery(""); }}>Réinitialiser</GlassButton>
                <GlassButton variant="primary" size="sm" onClick={() => setModalOpen(true)}>Créer une demande</GlassButton>
              </div>
            }
          />
        </GlassSurface>
      ) : view === "liste" ? (
        <>
          <Reveal delay={0.08}>
            <GlassSurface className="hidden overflow-hidden p-0 md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.07]">
                    {["Client", "Demande", "Statut", "Priorité", "Responsable", "Heure"].map((h) => (
                      <th key={h} className="card-eyebrow px-4 py-3 first:pl-5 last:pr-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/requests/${r.id}`)}
                      className="group cursor-pointer border-b border-white/[0.04] transition-colors duration-150 last:border-0 hover:bg-white/[0.022]"
                    >
                      <td className="py-3 pl-5 pr-4">
                        <span className="flex items-center gap-2.5">
                          <Avatar initials={r.client.split(" ").map((p) => p[0]).join("")} name={r.client} size={28} />
                          <span className="text-[13px] font-medium">
                            {r.client}
                            {r.vip && <span className="num ml-1.5 rounded-[5px] border border-champagne-500/25 bg-champagne-500/[0.08] px-1.5 py-px text-[8.5px] font-semibold tracking-[0.1em] text-champagne-300">VIP</span>}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <TypeIcon type={r.type} size={14} strokeWidth={1.5} className="shrink-0 text-cream/35" />
                          <span>
                            <span className="block max-w-[240px] truncate text-[13px] font-medium">{r.title}</span>
                            <span className="num block text-[9.5px] text-cream/30">{r.ref}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} pulse /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                      <td className="num px-4 py-3 text-[10.5px] text-cream/45">{r.agent}</td>
                      <td className="num py-3 pl-4 pr-5 text-[11px] text-cream/45">
                        <span className="flex items-center justify-between gap-2">
                          {r.time}
                          <ChevronRight size={14} strokeWidth={1.6} className="text-cream/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-cream" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassSurface>
          </Reveal>

          <div className="space-y-2.5 md:hidden">
            {filtered.map((r, i) => (
              <Reveal key={r.id} delay={0.03 * i}>
                <button onClick={() => navigate(`/requests/${r.id}`)} className="glass glass-sweep w-full p-4 text-left">
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[13px] font-medium">
                      <Avatar initials={r.client.split(" ").map((p) => p[0]).join("")} name={r.client} size={24} />
                      {r.client}
                    </span>
                    <StatusBadge status={r.status} pulse />
                  </span>
                  <span className="mt-2.5 flex items-start gap-2">
                    <TypeIcon type={r.type} size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-cream/35" />
                    <span className="text-[13.5px] font-medium leading-snug">{r.title}</span>
                  </span>
                  <span className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
                    <PriorityBadge priority={r.priority} />
                    <span className="num text-[10px] text-cream/35">{r.ref} · {r.time}</span>
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </>
      ) : view === "board" ? (
        <Reveal delay={0.08}>
          <div className="overflow-x-auto pb-3">
            <div className="flex min-w-max gap-3">
              {BOARD_COLUMNS.map((col) => {
                const items = filtered.filter((r) => r.status === col);
                return (
                  <div key={col} className="w-[262px] shrink-0">
                    <div className="mb-2.5 flex items-center justify-between px-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/45">{col}</span>
                      <span className="num rounded-[6px] border border-white/[0.08] bg-white/[0.03] px-1.5 py-px text-[9.5px] text-cream/50">{items.length}</span>
                    </div>
                    <div className="space-y-2">
                      {items.map((r) => (
                        <button key={r.id} onClick={() => navigate(`/requests/${r.id}`)} className="glass glass-sweep w-full p-3.5 text-left transition-transform duration-200 hover:-translate-y-0.5">
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-xs font-medium leading-snug">{r.title}</span>
                            {r.vip && <span className="num shrink-0 rounded-[5px] border border-champagne-500/25 bg-champagne-500/[0.08] px-1.5 py-px text-[8px] font-semibold tracking-[0.1em] text-champagne-300">VIP</span>}
                          </span>
                          <span className="mt-1 block text-[11px] text-cream/45">{r.client}</span>
                          <span className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2">
                            <PriorityBadge priority={r.priority} />
                            <span className="num text-[9.5px] text-cream/35">{r.time}</span>
                          </span>
                        </button>
                      ))}
                      {items.length === 0 && (
                        <div className="rounded-[12px] border border-dashed border-white/[0.08] p-4 text-center text-[11px] text-cream/25">Aucune demande</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      ) : view === "cartes" ? (
        <Reveal delay={0.08}>
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((r, idx) => {
              const tone: WorkTone = r.status === "En retard" || r.priority === "Critique" ? "ember" : r.status === "À valider" ? "orange" : "blue";
              const progress = ({ "En recherche": 35, "À valider": 65, "En attente client": 50, "Confirmée": 92, "En retard": 45, "Traitée": 100 } as Record<string, number>)[r.status] ?? 40;
              const agent = mockAgents.find((a) => a.name === r.agent);
              return (
                <Reveal key={r.id} delay={0.04 * idx}>
                  <WorkCard
                    tone={tone}
                    eyebrow={`Demande ${r.ref}`}
                    title={r.title}
                    desc={`${r.client} · ${r.type} · ${r.amountLabel}`}
                    when={`Aujourd'hui · ${r.time}`}
                    progress={progress}
                    steps={[
                      { id: "q", label: "Demande qualifiée", state: "done" },
                      { id: "o", label: r.options.length > 0 ? `${r.options.length} options trouvées` : "Recherche d'options", state: r.options.length > 0 ? "done" : "active" },
                      { id: "v", label: "Validation direction", state: r.status === "À valider" ? "active" : r.status === "Confirmée" ? "done" : "todo" },
                      { id: "c", label: "Confirmation client", state: r.status === "Confirmée" ? "done" : "todo" },
                    ]}
                    agents={agent ? [{ id: agent.id, name: agent.name, tint: agent.tint, working: r.status === "En recherche" || r.status === "En retard" }] : []}
                    dueIn={r.status === "En retard" ? -25 : 18 + idx * 21}
                    urgent={r.status === "En retard"}
                    menu={[
                      { label: "Voir la demande", onClick: () => navigate(`/requests/${r.id}`) },
                      { label: "Voir le client", onClick: () => navigate(`/clients/${r.clientId}`) },
                      { label: "Ajouter une note", onClick: () => toast("Note ajoutée", { description: `${r.ref} — note visible par les agents.` }) },
                    ]}
                    onQuickAdd={() => toast("Agent impliqué", { description: `${r.agent} a repris la main sur ${r.ref}.` })}
                    quickAddLabel="Impliquer un agent"
                    onOpen={() => navigate(`/requests/${r.id}`)}
                    openLabel="Voir la demande"
                  />
                </Reveal>
              );
            })}
          </div>
        </Reveal>
      ) : (
        <Reveal delay={0.08}>
          <GlassSurface className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold capitalize tracking-tight">{monthLabel}</h2>
              <span className="num text-[10.5px] text-cream/40">{filtered.length} demandes planifiées</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <span key={`${d}${i}`} className="pb-1 text-center text-[9.5px] font-semibold uppercase tracking-[0.14em] text-cream/30">{d}</span>
              ))}
              {Array.from({ length: firstOffset }).map((_, i) => <span key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const dayReqs = filtered.filter((r) => r.day === d);
                const isToday = d === now.getDate();
                return (
                  <div
                    key={d}
                    className={cn(
                      "flex aspect-square flex-col items-center rounded-[10px] border pt-1.5 transition-colors sm:aspect-auto sm:min-h-[74px]",
                      isToday ? "border-champagne-500/40 bg-champagne-500/[0.06]" : "border-white/[0.05] bg-white/[0.012] hover:border-white/[0.12]"
                    )}
                  >
                    <span className={cn("num text-[10.5px]", isToday ? "font-semibold text-champagne-300" : "text-cream/50")}>{d}</span>
                    <span className="mt-1 flex w-full flex-col gap-[3px] px-1">
                      {dayReqs.slice(0, 2).map((r) => (
                        <button
                          key={r.id}
                          onClick={() => navigate(`/requests/${r.id}`)}
                          className={cn(
                            "hidden w-full truncate rounded-[5px] border px-1 py-0.5 text-left text-[8px] leading-tight sm:block",
                            r.status === "En retard" ? "border-ember/30 bg-ember/[0.08] text-[#e28d85]" : r.vip ? "border-champagne-500/20 bg-champagne-500/[0.07] text-champagne-300" : "border-white/[0.08] bg-white/[0.04] text-cream/60"
                          )}
                        >
                          {r.title}
                        </button>
                      ))}
                      {dayReqs.length > 0 && (
                        <span className="flex justify-center gap-[3px] sm:hidden">
                          {dayReqs.slice(0, 3).map((r) => (
                            <span key={r.id} className={cn("h-[5px] w-[5px] rounded-full", r.status === "En retard" ? "bg-ember" : r.vip ? "bg-champagne-400" : "bg-cream/35")} />
                          ))}
                        </span>
                      )}
                      {dayReqs.length > 2 && <span className="num hidden text-[7.5px] text-cream/40 sm:block">+{dayReqs.length - 2}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassSurface>
        </Reveal>
      )}
      </FadeSwitch>
      </AnimatePresence>

      <GlassModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow="Création"
        title="Nouvelle demande"
        footer={
          <>
            <GlassButton variant="ghost" onClick={() => setModalOpen(false)}>Annuler</GlassButton>
            <GlassButton variant="primary" onClick={createRequest}>Créer la demande</GlassButton>
          </>
        }
      >
        <div className="space-y-3.5">
          <GlassSelect
            label="Client" value={form.client} onChange={(v) => setForm((f) => ({ ...f, client: v }))}
            options={mockClients.map((c) => ({ value: c.name, label: `${c.name} — ${c.segment}` }))}
          />
          <GlassSelect
            label="Type de demande" value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v as RequestType }))}
            options={(["Transfert", "Réservation", "Vol", "Conciergerie", "Séjour", "Visa", "Événement"] as RequestType[]).map((t) => ({ value: t, label: t }))}
          />
          <GlassInput
            label="Description" placeholder="Ex. Transfert privé Paris → Cannes, 4 personnes"
            value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
          />
          <GlassSelect
            label="Priorité" value={form.priority} onChange={(v) => setForm((f) => ({ ...f, priority: v }))}
            options={["Critique", "Haute", "Normale", "Basse"].map((p) => ({ value: p, label: p }))}
          />
          <p className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[11.5px] leading-relaxed text-cream/45">
            L'Agent Réservation qualifiera la demande et lancera la recherche d'options automatiquement.
          </p>
        </div>
      </GlassModal>
    </div>
  );
}
