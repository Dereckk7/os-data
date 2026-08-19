import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUp, Check, MessageSquare, ShieldCheck, X } from "lucide-react";
import { mockClients, mockRequests } from "../lib/mock";
import { cn, fmtMoney } from "../lib/services";
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
          <div key={s.k} className="rounded-[11px] border border-white/[0.07] bg-white/[0.02] p-3">
            <p className="text-[8.5px] uppercase tracking-[0.1em] text-cream/30">{s.k}</p>
            <p className="mt-1 text-[15px] font-semibold"><AnimatedNumber value={s.v} /></p>
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
          className="flex w-full items-center justify-between gap-3 rounded-[11px] border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:border-white/[0.15] hover:bg-white/[0.04]"
        >
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium">{r.title}</span>
            <span className="num mt-0.5 block text-[9px] uppercase tracking-[0.1em] text-cream/35">{r.ref} · {r.client}</span>
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
          className="flex w-full items-center justify-between gap-3 rounded-[11px] border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:border-white/[0.15] hover:bg-white/[0.04]"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-xs font-medium">
              <span className="num text-cream/35">{i + 1}.</span> {c.name}
              {c.segment === "VIP" && <GlassBadge tone="gold" className="px-1.5 py-0 text-[8px]">VIP</GlassBadge>}
            </span>
            <span className="num mt-0.5 block text-[9px] uppercase tracking-[0.1em] text-cream/35">
              {c.requestsCount} demandes · satisfaction {c.satisfaction}%
            </span>
          </span>
          <span className="num shrink-0 text-xs font-semibold">{fmtMoney(c.value)}</span>
        </button>
      ))}
    </div>
  );
}

function ReportBlock({ onValidate, onCancel, onModify }: { onValidate: () => void; onCancel: () => void; onModify: () => void }) {
  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-[11px] border border-white/[0.07] bg-white/[0.02] p-3.5">
        <p className="text-xs font-semibold">Rapport mensuel — août · 18 pages</p>
        <p className="mt-1 text-[11px] leading-relaxed text-cream/50">
          CA 74,2 M XAF (+11%) · 186 réservations · 23 nouveaux clients · 2 comptes à risque suivis.
        </p>
        <p className="num mt-2 text-[9px] uppercase tracking-[0.1em] text-cream/30">Sources : CRM · Paiement · Calendar — vérifiées à 09:12</p>
      </div>
      <div className="rounded-[12px] border border-saffron/25 bg-saffron/[0.05] p-3.5">
        <p className="flex items-center gap-2 text-[11px] font-semibold text-saffron">
          <ShieldCheck size={13} strokeWidth={1.75} /> Action nécessitant votre validation
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-cream/55">
          Le DATA OS souhaite envoyer le rapport mensuel à 24 clients. Cette action critique ne sera jamais exécutée sans votre accord.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={onCancel} className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-white/[0.09] px-3.5 text-xs font-medium text-cream/70 transition-all hover:bg-white/[0.05] hover:text-cream">
            <X size={12} strokeWidth={2} /> Annuler
          </button>
          <button onClick={onModify} className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-white/[0.09] px-3.5 text-xs font-medium text-cream/70 transition-all hover:bg-white/[0.05] hover:text-cream">
            Modifier
          </button>
          <Link to="/validation" className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-white/[0.09] px-3.5 text-xs font-medium text-cream/70 transition-all hover:bg-white/[0.05] hover:text-cream">
            <ShieldCheck size={12} strokeWidth={1.75} /> Examiner
          </Link>
          <button onClick={onValidate} className="inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-cream px-3.5 text-xs font-semibold text-ink-950 transition-all hover:bg-white active:scale-[0.98]">
            <Check size={12} strokeWidth={2.25} /> Valider
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionChips({ onChip }: { onChip: (label: string) => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-3">
      <p className="num w-full text-[8.5px] uppercase tracking-[0.14em] text-cream/30">Actions proposées</p>
      {["Créer le rapport", "Envoyer pour validation", "Ajouter aux tâches"].map((a) => (
        <button
          key={a} onClick={() => onChip(a)}
          className="h-8 rounded-full border border-white/[0.09] px-3 text-[11px] font-medium text-cream/65 transition-all duration-200 hover:border-cream/30 hover:bg-cream/[0.07] hover:text-cream"
        >
          {a}
        </button>
      ))}
    </div>
  );
}

export default function Cowork() {
  const [messages, setMessages] = useState<CoworkMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = messages.length > 0 || thinking;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = (text: string, fromHistory = false) => {
    const clean = text.trim();
    if (!clean || thinking) return;
    if (fromHistory) setActiveItem(text);
    setInput("");
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", kind: "text", text: clean, at: now() }]);
    setThinking(true);
    const reply = replyFor(clean);
    window.setTimeout(() => {
      setMessages((m) => [...m, { id: `os-${Date.now()}`, role: "os", kind: reply.kind, text: reply.text, at: now() }]);
      setThinking(false);
      emitPulse(0.5);
    }, 1100);
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

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col lg:h-[calc(100vh-8.5rem)]">
      <Reveal>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Travail</p>
            <h1 className="mt-1.5 text-[24px] font-semibold tracking-tight">Cowork</h1>
            <p className="mt-1 text-[13px] text-cream/50">Travaillez avec votre Data OS comme avec un membre de votre équipe.</p>
          </div>
          {started && (
            <button
              onClick={() => { setMessages([]); setActiveItem(null); }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-white/[0.08] px-3.5 text-xs font-medium text-cream/65 transition-all hover:border-white/[0.16] hover:text-cream"
            >
              <MessageSquare size={13} strokeWidth={1.6} /> Nouveau travail
            </button>
          )}
        </div>
      </Reveal>

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="lcard sticky top-0 h-full overflow-y-auto p-3">
            <p className="card-eyebrow px-2 py-1">Historique</p>
            {HISTORY.map((h) => (
              <div key={h.group} className="mb-3">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cream/30">{h.group}</p>
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
                <span className="grid h-12 w-12 place-items-center rounded-[14px] border border-white/[0.09] bg-white/[0.03] text-cream">
                  <LogoMark size={24} />
                </span>
                <h2 className="mt-4 text-[19px] font-semibold tracking-tight">Que souhaitez-vous faire ?</h2>
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
                      className="lcard row-hover p-4 text-left transition-all duration-200 hover:-translate-y-px"
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
                      <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-[9px] border border-white/[0.09] bg-white/[0.03] text-cream">
                        <LogoMark size={15} />
                      </span>
                    )}
                    <div className={cn("max-w-[86%] rounded-[14px] px-4 py-3", m.role === "user" ? "bg-cream text-ink-950" : "lcard")}>
                      <p className={cn("text-[13px] leading-relaxed", m.role === "os" && "text-cream/80")}>{m.text}</p>
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
                      <p className={cn("num mt-2 text-[8.5px] uppercase tracking-[0.12em]", m.role === "user" ? "text-ink-950/45" : "text-cream/25")}>
                        {m.role === "user" ? "Vous" : "DATA OS"} · {m.at}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {thinking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] border border-white/[0.09] bg-white/[0.03] text-cream">
                      <LogoMark size={15} />
                    </span>
                    <span className="lcard flex items-center gap-1.5 rounded-[14px] px-4 py-3.5">
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
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="lcard flex items-center gap-2 rounded-[14px] p-2 pl-4">
              <input
                value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Demandez quelque chose…" aria-label="Votre message"
                className="h-10 min-w-0 flex-1 bg-transparent text-[13.5px] text-cream outline-none placeholder:text-cream/30"
              />
              <button
                type="submit" disabled={!input.trim() || thinking} aria-label="Envoyer"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-cream text-ink-950 transition-all duration-200 hover:bg-white active:scale-95 disabled:opacity-35"
              >
                <ArrowUp size={16} strokeWidth={2} />
              </button>
            </form>
            <p className="num mt-2 text-center text-[9px] uppercase tracking-[0.12em] text-cream/25">
              Le DATA OS cite ses sources · les actions critiques passent toujours par validation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
