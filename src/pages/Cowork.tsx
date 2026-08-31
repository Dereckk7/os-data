import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUp, Check, Database, MessageSquare, PanelRightClose, PanelRightOpen, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { mockClients, mockRequests } from "../lib/mock";
import { cn, fmtInt, fmtMoney, coworkAsk } from "../lib/services";
import type { CoworkKind, CoworkMessage } from "../lib/types";
import { GlassBadge } from "../components/glass";
import { Sparkline } from "../components/charts";
import { AnimatedNumber, EASE, Reveal } from "../components/ui";
import { toast } from "../components/toast";
import { emitPulse } from "../lib/background";
import { LogoMark } from "../components/icons";

const now = () => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date());

const SUGGESTIONS: { kind: CoworkKind; label: string; prompt: string }[] = [
  { kind: "analysis", label: "Analyse", prompt: "Analyse mes demandes des 30 derniers jours" },
  { kind: "report", label: "Rapport", prompt: "Prépare un rapport mensuel" },
  { kind: "late", label: "Opérations", prompt: "Quelles demandes sont en retard ?" },
  { kind: "clients", label: "Clients", prompt: "Quels sont mes meilleurs clients ?" },
];

const HISTORY = [
  { group: "Aujourd'hui", items: ["Analyse des demandes", "Rapport mensuel", "Clients VIP"] },
  { group: "Hier", items: ["Performance opérations", "Analyse satisfaction"] },
];

function replyFor(prompt: string): { kind: CoworkKind; text: string } {
  const p = prompt.toLowerCase();
  if (p.includes("retard")) return { kind: "late", text: "J'ai identifié les demandes qui dépassent le délai habituel :" };
  if (p.includes("client") || p.includes("vip")) return { kind: "clients", text: "Voici vos clients à plus forte valeur :" };
  if (p.includes("rapport")) return { kind: "report", text: "Le rapport mensuel est prêt. Voici la synthèse :" };
  if (p.includes("analyse") || p.includes("demande")) return { kind: "analysis", text: "Analyse des 30 derniers jours terminée. Ce qu'il faut retenir :" };
  return { kind: "text", text: "Je peux analyser vos opérations, préparer un rapport, retrouver une information, comparer des périodes ou demander à un agent d'exécuter une tâche. Essayez une suggestion ci-dessous." };
}

function AnalysisBlock() {
  const kpis = [
    { k: "Demandes", v: "126", d: "+12%" },
    { k: "Réservations", v: "84", d: "+8%" },
    { k: "Satisfaction", v: "94%", d: "+2 pts" },
  ];
  return (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {kpis.map((s) => (
          <div key={s.k} className="rounded-sm border border-[var(--hairline)] bg-[var(--surface-2)] p-3">
            <p className="text-[8.5px] uppercase tracking-[0.1em] text-cream/52">{s.k}</p>
            <p className="num mt-1 text-[15px] font-[590]"><AnimatedNumber value={s.v} /></p>
            <p className="num text-[9px] text-jade">{s.d}</p>
          </div>
        ))}
      </div>
      <Sparkline data={[62, 71, 68, 84, 92, 88, 104, 112, 108, 126]} width={320} height={48} className="w-full" />
      <p className="text-xs leading-relaxed text-cream/50">
        La croissance est portée par les transferts VIP (+18%). L'Agent Veille recommande de rétablir la file prioritaire.
      </p>
    </div>
  );
}

function LateBlock({ onOpen }: { onOpen: (id: string) => void }) {
  const late = mockRequests.filter((r) => r.status === "En retard");
  return (
    <div className="mt-3 space-y-1.5">
      {late.map((r) => (
        <button
          key={r.id} onClick={() => onOpen(r.id)}
          className="flex w-full items-center justify-between gap-3 rounded-sm border border-[var(--hairline)] bg-[var(--surface-2)] px-3 py-2.5 text-left transition-colors hover:border-[var(--hairline-strong)] hover:bg-[var(--row-hover)]"
        >
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium">{r.title}</span>
            <span className="num mt-0.5 block text-[9px] uppercase tracking-[0.1em] text-cream/56">{r.ref} · {r.client}</span>
          </span>
          <GlassBadge tone="danger" dot>En retard</GlassBadge>
        </button>
      ))}
      <p className="pt-1 text-xs leading-relaxed text-cream/50">
        Cause principale : indisponibilité de 2 chauffeurs partenaires. L'Agent Opérations a lancé une réassignation.
      </p>
    </div>
  );
}

function ClientsBlock({ onOpen }: { onOpen: (id: string) => void }) {
  const top = [...mockClients].sort((a, b) => b.value - a.value).slice(0, 3);
  return (
    <div className="mt-3 space-y-1.5">
      {top.map((c, i) => (
        <button
          key={c.id} onClick={() => onOpen(c.id)}
          className="flex w-full items-center justify-between gap-3 rounded-sm border border-[var(--hairline)] bg-[var(--surface-2)] px-3 py-2.5 text-left transition-colors hover:border-[var(--hairline-strong)] hover:bg-[var(--row-hover)]"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-xs font-medium">
              <span className="num text-cream/56">{i + 1}.</span> {c.name}
              {c.segment === "VIP" && <GlassBadge tone="gold" className="px-1.5 py-0 text-[8px]">VIP</GlassBadge>}
            </span>
            <span className="num mt-0.5 block text-[9px] uppercase tracking-[0.1em] text-cream/56">
              {c.requestsCount} demandes · satisfaction {c.satisfaction}%
            </span>
          </span>
          <span className="num shrink-0 text-xs font-[590]">{fmtMoney(c.value)}</span>
        </button>
      ))}
    </div>
  );
}

function ReportBlock({ onValidate, onCancel, onModify }: { onValidate: () => void; onCancel: () => void; onModify: () => void }) {
  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-sm border border-[var(--hairline)] bg-[var(--surface-2)] p-3.5">
        <p className="text-xs font-[590]">Rapport mensuel — août · 18 pages</p>
        <p className="mt-1 text-[11px] leading-relaxed text-cream/50">
          CA 74,2 M XAF (+11%) · 186 réservations · 23 nouveaux clients · 2 comptes à risque suivis.
        </p>
        <p className="num mt-2 text-[9px] uppercase tracking-[0.1em] text-cream/52">Sources : CRM · Paiement · Calendar — vérifiées à 09:12</p>
      </div>
      <div className="rounded-md border border-saffron/25 bg-saffron/[0.05] p-3.5">
        <p className="flex items-center gap-2 text-[11px] font-[590] text-saffron">
          <ShieldCheck size={13} strokeWidth={1.75} /> Action nécessitant votre validation
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-cream/55">
          Le DATA OS souhaite envoyer le rapport mensuel à 24 clients. Cette action critique ne sera jamais exécutée sans votre accord.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={onCancel} className="inline-flex h-9 items-center gap-1.5 rounded-xs border border-[var(--hairline-strong)] px-3.5 text-xs font-medium text-cream/70 transition-all hover:bg-[var(--row-hover)] hover:text-cream">
            <X size={12} strokeWidth={2} /> Annuler
          </button>
          <button onClick={onModify} className="inline-flex h-9 items-center gap-1.5 rounded-xs border border-[var(--hairline-strong)] px-3.5 text-xs font-medium text-cream/70 transition-all hover:bg-[var(--row-hover)] hover:text-cream">
            Modifier
          </button>
          <Link to="/validation" className="inline-flex h-9 items-center gap-1.5 rounded-xs border border-[var(--hairline-strong)] px-3.5 text-xs font-medium text-cream/70 transition-all hover:bg-[var(--row-hover)] hover:text-cream">
            <ShieldCheck size={12} strokeWidth={1.75} /> Examiner
          </Link>
          <button onClick={onValidate} className="inline-flex h-9 items-center gap-1.5 rounded-xs bg-cream px-3.5 text-xs font-[590] text-ink-950 transition-all hover:brightness-105 active:scale-[0.98]">
            <Check size={12} strokeWidth={2.25} /> Valider
          </button>
        </div>
      </div>
    </div>
  );
}

const PROPOSED = ["Créer le rapport", "Envoyer pour validation", "Ajouter aux tâches"];
function ActionChips({ onChip }: { onChip: (label: string) => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--card-divider)] pt-3">
      <p className="num w-full text-[8.5px] uppercase tracking-[0.14em] text-cream/52">Actions proposées</p>
      {PROPOSED.map((a) => (
        <button
          key={a} onClick={() => onChip(a)}
          className="h-8 rounded-full border border-[var(--hairline-strong)] px-3 text-[11px] font-medium text-cream/65 transition-all duration-200 hover:border-champagne-500/40 hover:bg-[color-mix(in_srgb,var(--color-champagne-500)_9%,transparent)] hover:text-cream"
        >
          {a}
        </button>
      ))}
    </div>
  );
}

/* — Mapping présentationnel prompt → outil / agent (habillage, la logique
     d'appel à coworkAsk reste inchangée). — */
function mapPromptToTool(prompt: string): { tool: string; params: Record<string, unknown> } | null {
  const p = prompt.toLowerCase();
  const today = new Date().toISOString().slice(0, 10);
  const d30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  if (p.includes("retard")) return { tool: "sla_depasses", params: {} };
  if (p.includes("client") || p.includes("vip")) return { tool: "top_clients_par_depense", params: { periode_debut: d30, periode_fin: today } };
  if (p.includes("rapport")) return { tool: "generer_rapport", params: { debut: d30, fin: today } };
  if (p.includes("analyse") || p.includes("demande") || p.includes("complétion") || p.includes("completion")) return { tool: "taux_completion_demandes", params: { periode_debut: d30, periode_fin: today } };
  return null;
}
const agentForTool = (tool: string): string =>
  tool === "sla_depasses" ? "Agent Opérations"
    : tool === "top_clients_par_depense" ? "Concierge Intelligence"
      : tool === "generer_rapport" ? "Agent Reporting"
        : tool === "taux_completion_demandes" ? "Agent Analyse"
          : "Data OS";

const fmtCell = (v: unknown): string =>
  typeof v === "number" ? new Intl.NumberFormat("fr-FR").format(v) : v == null ? "" : String(v);

function DataBlock({ data, source }: { data: unknown; source?: string }) {
  const chip = source ? (
    <p className="num mt-2 text-[8.5px] uppercase tracking-[0.12em] text-champagne-300/70">source : {source.replace(/^core\./, "")}</p>
  ) : null;

  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
    const cols = Object.keys(data[0] as object).slice(0, 5);
    return (
      <div className="mt-3">
        <div className="overflow-hidden rounded-sm border border-[var(--hairline)]">
          <table className="w-full text-left">
            <thead>
              <tr>{cols.map((c) => (
                <th key={c} className="bg-[var(--surface-2)] px-3 py-2 text-[8.5px] font-medium uppercase tracking-[0.08em] text-cream/56">{c}</th>
              ))}</tr>
            </thead>
            <tbody>
              {(data as Record<string, unknown>[]).slice(0, 8).map((row, i) => (
                <tr key={i} className="border-t border-[var(--card-divider)]">
                  {cols.map((c) => (<td key={c} className="num px-3 py-2 text-[11px] text-cream/75">{fmtCell(row[c])}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {chip}
      </div>
    );
  }

  if (Array.isArray(data) && data.length === 0) {
    return (<div className="mt-3"><p className="text-xs text-cream/50">Aucun résultat sur cette période.</p>{chip}</div>);
  }

  if (data && typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>).filter(([, v]) => typeof v === "string" || typeof v === "number");
    return (
      <div className="mt-3">
        <div className="grid grid-cols-2 gap-2">
          {entries.slice(0, 6).map(([k, v]) => (
            <div key={k} className="rounded-sm border border-[var(--hairline)] bg-[var(--surface-2)] p-3">
              <p className="text-[8.5px] uppercase tracking-[0.1em] text-cream/52">{k.replace(/_/g, " ")}</p>
              <p className="num mt-1 text-[15px] font-[590]">{fmtCell(v)}</p>
            </div>
          ))}
        </div>
        {chip}
      </div>
    );
  }
  return <div className="mt-3">{chip}</div>;
}

/* ————— Traçabilité : le système montre son travail ————— */
interface Trace { id: string; label: string; status: "run" | "done"; agent?: string; source?: string; }

function ContextPanel({ traces, reports, onChip, onClose }: {
  traces: Trace[]; reports: number; onChip: (label: string) => void; onClose: () => void;
}) {
  const sources = Array.from(new Set(traces.map((t) => t.source).filter(Boolean))) as string[];
  const agents = Array.from(new Set(traces.map((t) => t.agent).filter(Boolean))) as string[];

  return (
    <aside className="lcard hidden min-h-0 flex-col overflow-hidden lg:flex">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--card-divider)] px-4 py-3">
        <p className="t-label">Contexte du travail</p>
        <button onClick={onClose} aria-label="Replier le panneau contextuel" className="grid h-6 w-6 place-items-center rounded-xs text-cream/62 transition-colors hover:bg-[var(--row-hover)] hover:text-cream">
          <PanelRightClose size={15} strokeWidth={1.75} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {/* Travail en cours / trace */}
        <section>
          <p className="num mb-2 text-[8.5px] uppercase tracking-[0.14em] text-cream/52">Traçabilité</p>
          {traces.length === 0 ? (
            <p className="text-[11.5px] leading-relaxed text-cream/60">Le détail du travail du Data OS — sources consultées, agents impliqués — apparaîtra ici.</p>
          ) : (
            <ol className="space-y-2">
              {traces.slice(0, 8).map((t) => (
                <li key={t.id} className="flex items-start gap-2">
                  <span className={cn("mt-[3px] grid h-[13px] w-[13px] shrink-0 place-items-center rounded-full", t.status === "done" ? "bg-[color-mix(in_srgb,var(--color-jade)_22%,transparent)] text-jade" : "text-champagne-300")}>
                    {t.status === "done" ? <Check size={9} strokeWidth={3} /> : <span className="pulse-dot h-[5px] w-[5px] rounded-full bg-champagne-400" />}
                  </span>
                  <span className="text-[11.5px] leading-snug text-cream/65">{t.label}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Sources consultées */}
        <section>
          <p className="num mb-2 flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.14em] text-cream/52"><Database size={10} strokeWidth={2} /> Sources consultées</p>
          {sources.length === 0 ? (
            <p className="text-[11.5px] text-cream/56">—</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {sources.map((s) => <span key={s} className="num rounded-full bg-[color-mix(in_srgb,var(--color-champagne-500)_11%,transparent)] px-2 py-0.5 text-[9.5px] text-champagne-300">{s.replace(/^core\./, "")}</span>)}
            </div>
          )}
        </section>

        {/* Agents impliqués */}
        <section>
          <p className="num mb-2 flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.14em] text-cream/52"><Users size={10} strokeWidth={2} /> Agents impliqués</p>
          {agents.length === 0 ? (
            <p className="text-[11.5px] text-cream/56">—</p>
          ) : (
            <ul className="space-y-1.5">
              {agents.map((a) => (
                <li key={a} className="flex items-center gap-2 text-[11.5px] text-cream/65">
                  <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-champagne-500/70" aria-hidden />{a}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Rapports générés */}
        <section>
          <p className="num mb-2 flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.14em] text-cream/52"><Sparkles size={10} strokeWidth={2} /> Rapports générés</p>
          <p className="num text-[13px] text-cream/70">{reports > 0 ? `${reports} sur cette session` : "—"}</p>
        </section>

        {/* Actions proposées */}
        <section>
          <p className="num mb-2 text-[8.5px] uppercase tracking-[0.14em] text-cream/52">Actions proposées</p>
          <div className="flex flex-col gap-1.5">
            {PROPOSED.map((a) => (
              <button key={a} onClick={() => onChip(a)} className="rounded-xs border border-[var(--hairline)] px-2.5 py-2 text-left text-[11.5px] text-cream/70 transition-colors hover:border-champagne-500/40 hover:bg-[color-mix(in_srgb,var(--color-champagne-500)_8%,transparent)] hover:text-cream">
                {a}
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

export default function Cowork() {
  const [messages, setMessages] = useState<CoworkMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [panelOpen, setPanelOpen] = useState(true);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = messages.length > 0 || thinking;
  const reportsCount = useMemo(() => messages.filter((m) => m.role === "os" && m.kind === "report").length, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const addTrace = (t: Omit<Trace, "id">) =>
    setTraces((prev) => [{ id: `tr-${Date.now()}-${prev.length}`, ...t }, ...prev].slice(0, 12));

  const send = async (text: string, fromHistory = false) => {
    const clean = text.trim();
    if (!clean || thinking) return;
    if (fromHistory) setActiveItem(text);
    setInput("");
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", kind: "text", text: clean, at: now() }]);
    setThinking(true);

    // Traçabilité (habillage) — le système montre son travail, sans en changer la logique.
    const mapped = mapPromptToTool(clean);
    addTrace({ label: "Interprétation de la demande", status: "done" });
    if (mapped) addTrace({ label: `${agentForTool(mapped.tool)} consulté`, status: "done", agent: agentForTool(mapped.tool) });

    // Appel réel au Data OS (Edge Function cowork-ask, outils bornés + traçabilité).
    const res = mapped ? await coworkAsk({ tool: mapped.tool, params: mapped.params }) : await coworkAsk({ question: clean });
    if (res && res.resolved && res.data !== undefined) {
      const count = Array.isArray(res.data) ? res.data.length : 0;
      addTrace({ label: count > 0 ? `✓ ${fmtInt(count)} enregistrements analysés` : "✓ Résultat calculé", status: "done", source: res.source });
      if (res.answer) addTrace({ label: "Génération de la recommandation", status: "done" });
      setMessages((m) => [...m, { id: `os-${Date.now()}`, role: "os", kind: "data", text: res.answer || "Voici ce que le Data OS a trouvé :", data: res.data, source: res.source, at: now() }]);
      setThinking(false);
      emitPulse(0.5);
      return;
    }

    // Repli : démonstration locale si le back n'est pas joignable / question non couverte.
    const reply = replyFor(clean);
    addTrace({ label: "Synthèse locale préparée", status: "done" });
    window.setTimeout(() => {
      setMessages((m) => [...m, { id: `os-${Date.now()}`, role: "os", kind: reply.kind, text: reply.text, at: now() }]);
      setThinking(false);
      emitPulse(0.5);
    }, 700);
  };

  const onChip = (label: string) => {
    if (label === "Ajouter aux tâches") {
      toast.gold("Tâche créée", { description: "« Relire le rapport mensuel » ajoutée à votre file.", action: { label: "Ouvrir", onClick: () => navigate("/tasks") } });
    } else if (label === "Envoyer pour validation") {
      toast("Envoyé pour validation", { description: "L'action apparaît dans le centre de validation.", action: { label: "Examiner", onClick: () => navigate("/validation") } });
    } else {
      toast.success("Rapport créé", { description: "Rapport mensuel — août, 18 pages, prêt à l'export." });
    }
  };

  const validateReport = () => {
    toast.success("Envoi validé", {
      description: "Le rapport mensuel partira à 24 clients à 10:00.",
      action: { label: "Voir la validation", onClick: () => navigate("/validation") },
    });
  };

  const newWork = () => { setMessages([]); setActiveItem(null); setTraces([]); };

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col lg:h-[calc(100vh-8.5rem)]">
      <Reveal>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Travail</p>
            <h1 className="mt-1.5 t-title">Cowork</h1>
            <p className="mt-1 text-[13px] text-cream/50">Un espace de travail focalisé — le Data OS analyse, cite ses sources et vous montre son travail.</p>
          </div>
          <div className="flex items-center gap-2">
            {!panelOpen && (
              <button
                onClick={() => setPanelOpen(true)}
                className="hidden h-9 items-center gap-1.5 rounded-sm border border-[var(--hairline)] px-3.5 text-xs font-medium text-cream/65 transition-all hover:border-[var(--hairline-strong)] hover:text-cream lg:inline-flex"
              >
                <PanelRightOpen size={13} strokeWidth={1.6} /> Contexte
              </button>
            )}
            {started && (
              <button
                onClick={newWork}
                className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-[var(--hairline)] px-3.5 text-xs font-medium text-cream/65 transition-all hover:border-[var(--hairline-strong)] hover:text-cream"
              >
                <MessageSquare size={13} strokeWidth={1.6} /> Nouveau travail
              </button>
            )}
          </div>
        </div>
      </Reveal>

      <div className={cn("grid min-h-0 flex-1 gap-4", panelOpen ? "lg:grid-cols-[180px_1fr_272px]" : "lg:grid-cols-[180px_1fr]")}>
        <aside className="hidden lg:block">
          <div className="lcard sticky top-0 h-full overflow-y-auto p-3">
            <p className="card-eyebrow px-2 py-1">Historique</p>
            {HISTORY.map((h) => (
              <div key={h.group} className="mb-3">
                <p className="px-3 pb-1 text-[10px] font-[590] uppercase tracking-[0.12em] text-cream/52">{h.group}</p>
                {h.items.map((it) => (
                  <button
                    key={it}
                    data-active={activeItem === it}
                    onClick={() => send(it, true)}
                    className="hist-item block w-full truncate text-left text-xs text-cream/60"
                  >
                    {it}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-h-0 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto pb-3 pr-0.5">
            {!started ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] text-cream shadow-[var(--highlight-top)]">
                  <LogoMark size={24} />
                </span>
                <h2 className="mt-4 t-section text-[19px]">Que souhaitez-vous faire ?</h2>
                <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-cream/50">
                  Analysez vos opérations, retrouvez une information, préparez un rapport, demandez une action, explorez vos données.
                </p>
                <div className="mt-6 grid w-full max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={s.prompt}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.1 + i * 0.06, ease: EASE }}
                      onClick={() => send(s.prompt)}
                      className="lcard row-hover p-4 text-left transition-transform duration-200 hover:-translate-y-px"
                    >
                      <span className="num text-[8.5px] uppercase tracking-[0.16em] text-champagne-300">{s.label}</span>
                      <span className="mt-1 block text-[13px] font-medium leading-snug">{s.prompt}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-2xl space-y-5">
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className={cn("flex gap-3", m.role === "user" && "justify-end")}
                  >
                    {m.role === "os" && (
                      <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-sm border border-[var(--hairline)] bg-[var(--surface-2)] text-cream shadow-[var(--highlight-top)]">
                        <LogoMark size={15} />
                      </span>
                    )}
                    <div className={cn("max-w-[86%] rounded-md px-4 py-3", m.role === "user" ? "bg-cream text-ink-950" : "lcard")}>
                      <p className={cn("text-[13px] leading-relaxed", m.role === "os" && "text-cream/80")}>{m.text}</p>
                      {m.kind === "data" && <DataBlock data={m.data} source={m.source} />}
                      {m.kind === "analysis" && <AnalysisBlock />}
                      {m.kind === "late" && <LateBlock onOpen={(id) => navigate(`/requests/${id}`)} />}
                      {m.kind === "clients" && <ClientsBlock onOpen={(id) => navigate(`/clients/${id}`)} />}
                      {m.kind === "report" && (
                        <ReportBlock
                          onValidate={validateReport}
                          onCancel={() => toast.neutral("Action annulée", { description: "Aucun envoi ne sera effectué." })}
                          onModify={() => setInput("Apporte ces modifications au rapport mensuel : ")}
                        />
                      )}
                      {m.role === "os" && m.kind !== "report" && <ActionChips onChip={onChip} />}
                      <p className={cn("num mt-2 text-[8.5px] uppercase tracking-[0.12em]", m.role === "user" ? "text-ink-950/45" : "text-cream/50")}>
                        {m.role === "user" ? "Vous" : "DATA OS"} · {m.at}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {thinking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm border border-[var(--hairline)] bg-[var(--surface-2)] text-cream shadow-[var(--highlight-top)]">
                      <LogoMark size={15} />
                    </span>
                    <span className="lcard flex items-center gap-1.5 rounded-md px-4 py-3.5">
                      <span className="pulse-dot h-[5px] w-[5px] rounded-full bg-cream/50" />
                      <span className="pulse-dot h-[5px] w-[5px] rounded-full bg-cream/50" style={{ animationDelay: "0.2s" }} />
                      <span className="pulse-dot h-[5px] w-[5px] rounded-full bg-cream/50" style={{ animationDelay: "0.4s" }} />
                    </span>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          <div className="safe-bottom pt-3">
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="lcard flex items-center gap-2 rounded-md p-2 pl-4">
              <input
                value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Demandez quelque chose…" aria-label="Votre message"
                className="h-10 min-w-0 flex-1 bg-transparent text-[13.5px] text-cream outline-none placeholder:text-cream/52"
              />
              <button
                type="submit" disabled={!input.trim() || thinking} aria-label="Envoyer"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-cream text-ink-950 transition-all duration-200 hover:brightness-105 active:scale-95 disabled:opacity-35"
              >
                <ArrowUp size={16} strokeWidth={2} />
              </button>
            </form>
            <p className="num mt-2 text-center text-[9px] uppercase tracking-[0.12em] text-cream/50">
              Le DATA OS cite ses sources · les actions critiques passent toujours par validation
            </p>
          </div>
        </div>

        {panelOpen && <ContextPanel traces={traces} reports={reportsCount} onChip={onChip} onClose={() => setPanelOpen(false)} />}
      </div>
    </div>
  );
}
