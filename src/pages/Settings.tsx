import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, Bell, Building2, Check, Copy, CreditCard, Database, Eye, EyeOff, KeyRound,
  LayoutTemplate, Plug, Plus, ScrollText, Shield, ShieldCheck, User as UserIcon, Users, Workflow,
} from "lucide-react";
import { cn, copyText, fmtInt, useAgents, useAuth, useSourcesState } from "../lib/services";
import { mockOrganization } from "../lib/mock";
import { usePrefs, useTheme, type ContrastPref, type DensityPref, type FontPref, type MotionPref, type ThemeMode } from "../lib/theme";
import { GlassBadge, GlassButton, GlassInput, GlassModal, GlassSelect, GlassSurface } from "../components/glass";
import { AgentGlyph } from "../components/icons";
import { Avatar, FadeSwitch, Reveal, Toggle } from "../components/ui";
import { toast } from "../components/toast";
import { AnimatePresence } from "framer-motion";
import type { Tone } from "../lib/types";

const SECTIONS = [
  { id: "compte", label: "Compte", icon: UserIcon },
  { id: "organisation", label: "Organisation", icon: Building2 },
  { id: "apparence", label: "Apparence", icon: LayoutTemplate },
  { id: "utilisateurs", label: "Utilisateurs", icon: Users },
  { id: "roles", label: "Rôles & permissions", icon: ShieldCheck },
  { id: "notifications", label: "Notifications & sons", icon: Bell },
  { id: "agents", label: "Agents", icon: Workflow },
  { id: "sources", label: "Sources de données", icon: Database },
  { id: "integrations", label: "Intégrations", icon: Plug },
  { id: "facturation", label: "Facturation", icon: CreditCard },
  { id: "securite", label: "Sécurité", icon: Shield },
  { id: "api", label: "API", icon: KeyRound },
  { id: "journal", label: "Journal d'activité", icon: ScrollText },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

function Row({ label, desc, children }: { label: string; desc?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[13px] font-medium">{label}</p>
        {desc && <p className="mt-0.5 text-[11.5px] leading-relaxed text-cream/45">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function OptionGroup<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex items-center gap-0.5 rounded-[11px] border border-white/[0.07] bg-white/[0.03] p-0.5">
      {options.map((o) => (
        <button
          key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cn("h-8 rounded-[8px] px-3 text-xs font-medium transition-all duration-200", value === o.value ? "bg-cream text-ink-950" : "text-cream/45 hover:text-cream/80")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const toneOf = (s: string): Tone =>
  s === "connected" ? "success" : s === "syncing" ? "gold" : s === "error" ? "danger" : "neutral";

export default function Settings() {
  const [section, setSection] = useState<SectionId>("compte");
  const { user } = useAuth();
  const agentsQ = useAgents(300);
  const { sources } = useSourcesState();
  const { mode, setMode } = useTheme();
  const prefs = usePrefs();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [notifs, setNotifs] = useState({ email: true, push: true, critical: true, digest: true, whatsapp: false });
  const [sounds, setSounds] = useState({ system: false, done: true, validation: true, error: true, sync: false, volume: 40 });
  const [twoFA, setTwoFA] = useState(true);
  const [agentCfg, setAgentCfg] = useState<Record<string, { on: boolean; autonomy: string }>>({});
  const [showKey, setShowKey] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const isAgentOn = (id: string, fallback: boolean) => agentCfg[id]?.on ?? fallback;
  const active = SECTIONS.find((s) => s.id === section);

  return (
    <div className="space-y-5">
      <Reveal>
        <header>
          <p className="eyebrow">Configuration</p>
          <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Paramètres</h1>
        </header>
      </Reveal>

      <div className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden" role="tablist" aria-label="Sections des paramètres">
        {SECTIONS.map((s) => (
          <button
            key={s.id} role="tab" aria-selected={section === s.id} onClick={() => setSection(s.id)}
            className={cn("flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-all", section === s.id ? "border-cream/30 bg-cream/[0.08] text-cream" : "border-white/[0.08] text-cream/55")}
          >
            <s.icon size={12.5} strokeWidth={1.6} />
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[228px_1fr]">
        <nav className="hidden lg:block" aria-label="Sections des paramètres">
          <div className="sticky top-24 space-y-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id} onClick={() => setSection(s.id)}
                className={cn("relative flex h-10 w-full items-center gap-2.5 rounded-[10px] px-3 text-[13px] font-medium transition-all duration-200", section === s.id ? "bg-white/[0.055] text-cream" : "text-cream/50 hover:bg-white/[0.03] hover:text-cream/85")}
              >
                {section === s.id && <span className="absolute left-0 top-2.5 bottom-2.5 w-[2px] rounded-r bg-cream" />}
                <s.icon size={15} strokeWidth={1.6} className={cn(section === s.id && "text-cream")} />
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        <AnimatePresence mode="wait" initial={false}>
        <FadeSwitch k={section} className="min-w-0">
          <GlassSurface className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2.5 border-b border-white/[0.06] pb-4">
              {active && <active.icon size={16} strokeWidth={1.6} className="text-cream/70" />}
              <h2 className="text-[15px] font-semibold tracking-tight">{active?.label}</h2>
            </div>

            {section === "compte" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <Avatar initials={user?.initials ?? "?"} name={user?.name ?? ""} size={48} />
                  <div>
                    <p className="text-[14px] font-semibold">{user?.name}</p>
                    <p className="num text-[11px] text-cream/40">{user?.email}</p>
                  </div>
                </div>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <GlassInput label="Nom complet" value={name} onChange={(e) => setName(e.target.value)} />
                  <GlassInput label="Email professionnel" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="flex justify-end">
                  <GlassButton variant="primary" onClick={() => toast.success("Profil mis à jour", { description: "Vos informations ont été enregistrées." })}>
                    Enregistrer
                  </GlassButton>
                </div>
              </div>
            )}

            {section === "organisation" && (
              <div className="space-y-4">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <GlassInput label="Nom de l'organisation" defaultValue={mockOrganization.name} />
                  <GlassInput label="Localisation" defaultValue={mockOrganization.city} />
                </div>
                <div className="flex items-center justify-between rounded-[12px] border border-champagne-500/15 bg-champagne-500/[0.04] px-4 py-3.5">
                  <div>
                    <p className="text-[13px] font-medium">Plan Enterprise</p>
                    <p className="num mt-0.5 text-[10.5px] text-cream/40">{mockOrganization.members.length} membres · agents illimités · support dédié</p>
                  </div>
                  <GlassBadge tone="gold" dot>Actif</GlassBadge>
                </div>
                <div className="flex justify-end">
                  <GlassButton variant="primary" onClick={() => toast.success("Organisation mise à jour")}>Enregistrer</GlassButton>
                </div>
              </div>
            )}

            {section === "apparence" && (
              <div className="divide-y divide-white/[0.05]">
                <Row label="Thème" desc="Sombre, clair, confort ou aligné sur votre système.">
                  <OptionGroup<ThemeMode>
                    label="Thème" value={mode} onChange={setMode}
                    options={[
                      { value: "dark", label: "Sombre" },
                      { value: "light", label: "Clair" },
                      { value: "comfort", label: "Confort" },
                      { value: "system", label: "Système" },
                    ]}
                  />
                </Row>
                <Row label="Animations" desc="Réduire supprime les effets décoratifs, garde le feedback essentiel.">
                  <OptionGroup<MotionPref> label="Animations" value={prefs.motion} onChange={(v) => prefs.set("motion", v)}
                    options={[{ value: "full", label: "Complètes" }, { value: "reduced", label: "Réduites" }]} />
                </Row>
                <Row label="Contraste" desc="Renforcé augmente la visibilité des bordures et du texte.">
                  <OptionGroup<ContrastPref> label="Contraste" value={prefs.contrast} onChange={(v) => prefs.set("contrast", v)}
                    options={[{ value: "standard", label: "Standard" }, { value: "high", label: "Renforcé" }]} />
                </Row>
                <Row label="Densité d'interface" desc="Ajuste l'espace alloué au contenu.">
                  <OptionGroup<DensityPref> label="Densité" value={prefs.density} onChange={(v) => prefs.set("density", v)}
                    options={[{ value: "compact", label: "Compact" }, { value: "confort", label: "Confort" }, { value: "spacieux", label: "Spacieux" }]} />
                </Row>
                <Row label="Taille du texte" desc="Agrandit l'ensemble de l'interface.">
                  <OptionGroup<FontPref> label="Taille du texte" value={prefs.fontSize} onChange={(v) => prefs.set("fontSize", v)}
                    options={[{ value: "default", label: "Défaut" }, { value: "large", label: "Grande" }]} />
                </Row>
                <p className="pt-4 text-[11.5px] leading-relaxed text-cream/40">
                  Vos préférences s'appliquent immédiatement et seront synchronisées via Supabase prochainement.
                </p>
              </div>
            )}

            {section === "utilisateurs" && (
              <div>
                <div className="divide-y divide-white/[0.05]">
                  {mockOrganization.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 py-3">
                      <Avatar initials={m.name.split(" ").map((p) => p[0]).join("")} name={m.name} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{m.name}</p>
                        <p className="num truncate text-[10.5px] text-cream/40">{m.email}</p>
                      </div>
                      <GlassBadge tone={m.role === "Direction" ? "gold" : "neutral"}>{m.role}</GlassBadge>
                      <GlassBadge tone={m.status === "Actif" ? "success" : "warning"} dot>{m.status}</GlassBadge>
                    </div>
                  ))}
                </div>
                <GlassButton variant="gold" size="sm" className="mt-4" iconLeft={<Plus size={13} strokeWidth={1.75} />} onClick={() => setInviteOpen(true)}>
                  Inviter un membre
                </GlassButton>
              </div>
            )}

            {section === "roles" && (
              <div className="divide-y divide-white/[0.05]">
                {[
                  { role: "Administrateurs", desc: "Accès complet, validation des décisions, facturation.", perms: [true, true, true] },
                  { role: "Managers", desc: "Pilotage des demandes, clients et agents.", perms: [true, true, false] },
                  { role: "Opérateurs", desc: "Exécution terrain, supervision des partenaires.", perms: [true, true, false] },
                  { role: "Lecteurs", desc: "Consultation des rapports et du tableau de bord.", perms: [true, false, false] },
                ].map((r) => (
                  <div key={r.role} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div>
                      <p className="text-[13px] font-medium">{r.role}</p>
                      <p className="mt-0.5 text-[11.5px] text-cream/45">{r.desc}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {["Lecture", "Écriture", "Admin"].map((p, i) => (
                        <span key={p} className={cn("rounded-full border px-2 py-0.5 text-[9.5px] font-medium", r.perms[i] ? "border-jade/30 bg-jade/[0.08] text-jade" : "border-white/[0.08] text-cream/30")}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section === "notifications" && (
              <div className="divide-y divide-white/[0.05]">
                <Row label="Notifications email" desc="Demandes, validations et rapports quotidiens.">
                  <Toggle checked={notifs.email} onChange={(v) => setNotifs((n) => ({ ...n, email: v }))} label="Notifications email" />
                </Row>
                <Row label="Notifications push" desc="Alertes en temps réel sur vos appareils.">
                  <Toggle checked={notifs.push} onChange={(v) => setNotifs((n) => ({ ...n, push: v }))} label="Notifications push" />
                </Row>
                <Row label="Alertes critiques" desc="Retards, incidents et paiements — toujours notifiés.">
                  <Toggle checked={notifs.critical} onChange={(v) => setNotifs((n) => ({ ...n, critical: v }))} label="Alertes critiques" />
                </Row>
                <Row label="Résumé quotidien" desc="Briefing complet chaque matin à 08:00.">
                  <Toggle checked={notifs.digest} onChange={(v) => setNotifs((n) => ({ ...n, digest: v }))} label="Résumé quotidien" />
                </Row>
                <div className="pt-5">
                  <p className="card-eyebrow mb-3">Sons système — désactivés par défaut</p>
                  <Row label="Sons système" desc="Signaux sonores extrêmement discrets.">
                    <Toggle checked={sounds.system} onChange={(v) => setSounds((s) => ({ ...s, system: v }))} label="Sons système" />
                  </Row>
                  <div className={cn("space-y-3 transition-opacity duration-300", !sounds.system && "pointer-events-none opacity-40")}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-cream/55">Volume</span>
                        <span className="num text-[10.5px] text-cream/40">{sounds.volume}%</span>
                      </div>
                      <input
                        type="range" min={0} max={100} value={sounds.volume}
                        onChange={(e) => setSounds((s) => ({ ...s, volume: Number(e.target.value) }))}
                        aria-label="Volume des sons système"
                        className="mt-2 w-full accent-[#c9b27c]"
                      />
                    </div>
                    {[
                      { k: "done", l: "Action terminée" },
                      { k: "validation", l: "Validation requise" },
                      { k: "error", l: "Erreur" },
                      { k: "sync", l: "Synchronisation terminée" },
                    ].map((ev) => (
                      <Row key={ev.k} label={ev.l}>
                        <Toggle
                          checked={sounds[ev.k as "done" | "validation" | "error" | "sync"]}
                          onChange={(v) => setSounds((s) => ({ ...s, [ev.k]: v }))}
                          label={ev.l}
                        />
                      </Row>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {section === "agents" && (
              <div className="divide-y divide-white/[0.05]">
                {agentsQ.data.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="agent-tile grid h-8 w-8 place-items-center rounded-[9px] border" style={{ "--tint": a.tint } as React.CSSProperties}>
                        <AgentGlyph agentId={a.id} size={14} strokeWidth={1.6} />
                      </span>
                      <div>
                        <p className="text-[13px] font-medium">{a.name}</p>
                        <p className="text-[11px] text-cream/45">{a.current}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-36">
                        <GlassSelect
                          value={agentCfg[a.id]?.autonomy ?? "Standard"}
                          onChange={(v) => setAgentCfg((c) => ({ ...c, [a.id]: { on: isAgentOn(a.id, a.status === "Opérationnel"), autonomy: v } }))}
                          options={["Standard", "Renforcée", "Supervisée"].map((o) => ({ value: o, label: `Autonomie ${o.toLowerCase()}` }))}
                        />
                      </div>
                      <Toggle
                        checked={isAgentOn(a.id, a.status === "Opérationnel")}
                        onChange={(v) => {
                          setAgentCfg((c) => ({ ...c, [a.id]: { on: v, autonomy: c[a.id]?.autonomy ?? "Standard" } }));
                          toast(v ? `${a.name} activé` : `${a.name} mis en veille`, { tone: v ? "success" : "neutral" });
                        }}
                        label={`Activer ${a.name}`}
                      />
                    </div>
                  </div>
                ))}
                <p className="pt-4 text-[11.5px] leading-relaxed text-cream/45">
                  Les actions sensibles des agents passent toujours par le{" "}
                  <Link to="/validation" className="font-medium text-cream/70 underline-offset-2 hover:underline">centre de validation</Link>.
                </p>
              </div>
            )}

            {section === "sources" && (
              <div>
                <div className="divide-y divide-white/[0.05]">
                  {sources.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="text-[13px] font-medium">{s.name}</p>
                        <p className="num mt-0.5 text-[10.5px] text-cream/40">
                          Dernière sync : {s.lastSync} · {s.records > 0 ? fmtInt(s.records) : "0"} données
                        </p>
                      </div>
                      <GlassBadge tone={toneOf(s.status)} dot>
                        {s.status === "connected" ? "Connecté" : s.status === "syncing" ? "Sync" : s.status === "error" ? "Erreur" : "Inactif"}
                      </GlassBadge>
                    </div>
                  ))}
                </div>
                <Link to="/sources">
                  <GlassButton variant="gold" size="sm" className="mt-4" iconLeft={<ArrowUpRight size={13} strokeWidth={1.75} />}>
                    Gérer les sources
                  </GlassButton>
                </Link>
              </div>
            )}

            {section === "integrations" && (
              <div className="space-y-4">
                <p className="text-[13px] leading-relaxed text-cream/55">
                  CRM, ERP, suites Google et Microsoft, PMS, API publique… retrouvez l'ensemble de votre écosystème.
                </p>
                <Link to="/integrations">
                  <GlassButton variant="primary" iconLeft={<ArrowUpRight size={14} strokeWidth={1.75} />}>
                    Ouvrir les intégrations
                  </GlassButton>
                </Link>
              </div>
            )}

            {section === "facturation" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-[12px] border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
                  <div>
                    <p className="text-[13.5px] font-semibold">Enterprise — 249 000 XAF / mois</p>
                    <p className="num mt-0.5 text-[10.5px] text-cream/40">Prochaine échéance : 1er sept. · Carte •• 4821</p>
                  </div>
                  <GlassBadge tone="success" dot>À jour</GlassBadge>
                </div>
                <div className="divide-y divide-white/[0.05]">
                  {[
                    { ref: "INV-2025-081", date: "01 août 2025", amount: "249 000 XAF" },
                    { ref: "INV-2025-064", date: "01 juil. 2025", amount: "249 000 XAF" },
                    { ref: "INV-2025-048", date: "01 juin 2025", amount: "236 000 XAF" },
                  ].map((inv) => (
                    <div key={inv.ref} className="flex items-center justify-between gap-3 py-3">
                      <span className="num text-[11.5px] text-cream/60">{inv.ref}</span>
                      <span className="hidden text-xs text-cream/45 sm:block">{inv.date}</span>
                      <span className="num text-xs font-semibold">{inv.amount}</span>
                      <GlassBadge tone="success">Payée</GlassBadge>
                      <button
                        aria-label={`Télécharger ${inv.ref}`}
                        onClick={() => toast.success("Facture téléchargée", { description: `${inv.ref} · PDF` })}
                        className="grid h-8 w-8 place-items-center rounded-[8px] text-cream/40 transition-colors hover:bg-white/[0.06] hover:text-cream"
                      >
                        <ArrowUpRight size={13} strokeWidth={1.75} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === "securite" && (
              <div className="divide-y divide-white/[0.05]">
                <Row label="Authentification à deux facteurs" desc="Code de vérification requis à chaque connexion.">
                  <Toggle
                    checked={twoFA}
                    onChange={(v) => {
                      setTwoFA(v);
                      toast(v ? "2FA activée" : "2FA désactivée", { tone: v ? "success" : "warning", description: v ? "Votre compte est mieux protégé." : "Nous recommandons fortement la 2FA." });
                    }}
                    label="Authentification à deux facteurs"
                  />
                </Row>
                <div className="py-3.5">
                  <p className="text-[13px] font-medium">Sessions actives</p>
                  <div className="mt-3 space-y-2">
                    {[
                      { d: "MacBook Pro — Chrome · Paris", s: "Session actuelle", current: true },
                      { d: "iPhone 15 — Safari · Douala", s: "Active il y a 2 h", current: false },
                    ].map((ses) => (
                      <div key={ses.d} className="flex items-center justify-between rounded-[11px] border border-white/[0.06] bg-white/[0.015] px-3.5 py-2.5">
                        <span className="flex items-center gap-2.5">
                          <span className={cn("h-[7px] w-[7px] rounded-full", ses.current ? "bg-jade pulse-dot" : "bg-cream/30")} />
                          <span className="text-xs font-medium">{ses.d}</span>
                        </span>
                        <span className="num text-[9.5px] uppercase tracking-[0.1em] text-cream/35">{ses.s}</span>
                      </div>
                    ))}
                  </div>
                  <GlassButton size="sm" variant="danger" className="mt-3" onClick={() => toast.success("Sessions révoquées", { description: "Seul cet appareil reste connecté." })}>
                    Révoquer les autres sessions
                  </GlassButton>
                </div>
                <Row label="Mot de passe" desc="Modifié il y a 34 jours.">
                  <GlassButton size="sm" onClick={() => toast.neutral("Lien envoyé", { description: "Consultez votre boîte mail pour définir un nouveau mot de passe." })}>
                    Modifier
                  </GlassButton>
                </Row>
              </div>
            )}

            {section === "api" && (
              <div className="space-y-4">
                <div>
                  <p className="text-[13px] font-medium">Clé de production</p>
                  <div className="glass-sunken mt-2 flex items-center gap-2 px-3 py-2.5">
                    <span className="num min-w-0 flex-1 truncate text-[11.5px] text-cream/70">
                      {showKey ? "sk_live_ekw_7f3K2mQ9xRt41WpLz86vB4821" : "sk_live_••••••••••••••••••••4821"}
                    </span>
                    <button aria-label={showKey ? "Masquer la clé" : "Révéler la clé"} onClick={() => setShowKey((v) => !v)} className="grid h-8 w-8 place-items-center rounded-[8px] text-cream/40 transition-colors hover:bg-white/[0.06] hover:text-cream">
                      {showKey ? <EyeOff size={13.5} strokeWidth={1.6} /> : <Eye size={13.5} strokeWidth={1.6} />}
                    </button>
                    <button
                      aria-label="Copier la clé"
                      onClick={async () => {
                        await copyText("sk_live_ekw_7f3K2mQ9xRt41WpLz86vB4821");
                        toast.success("Clé copiée", { description: "Ne la partagez jamais publiquement." });
                      }}
                      className="grid h-8 w-8 place-items-center rounded-[8px] text-cream/40 transition-colors hover:bg-white/[0.06] hover:text-cream"
                    >
                      <Copy size={13.5} strokeWidth={1.6} />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[13px] font-medium">Webhooks</p>
                  <div className="mt-2 flex items-center justify-between rounded-[11px] border border-white/[0.08] bg-white/[0.015] px-3.5 py-2.5">
                    <span className="num truncate text-[11px] text-cream/60">https://api.maison-ekwata.com/hooks/dataos</span>
                    <GlassBadge tone="success" dot>Actif</GlassBadge>
                  </div>
                </div>
                <GlassButton variant="gold" size="sm" iconLeft={<Plus size={13} strokeWidth={1.75} />} onClick={() => toast.gold("Nouvelle clé générée", { description: "sk_live_ekw_9…B7302 — copiez-la maintenant." })}>
                  Créer une clé
                </GlassButton>
                <p className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[11px] leading-relaxed text-cream/40">
                  L'API DATA OS expose demandes, clients, insights et rapports. Documentation sur{" "}
                  <span className="num text-champagne-300">docs.dataos.app</span>.
                </p>
              </div>
            )}

            {section === "journal" && (
              <div className="glass-sunken p-4">
                <pre className="num overflow-x-auto text-[10.5px] leading-[1.9] text-cream/55">
{`09:42:18  auth        connexion réussie             marie@maison-ekwata.com
09:42:05  ag-resa     options trouvées REQ-2481     4 options · 2 présélectionnées
09:31:44  ag-ops      chauffeur confirmé            Riviera Prestige · 4,9/5
09:18:02  ag-rep      rapport quotidien généré      6 pages · 08:00
08:57:31  ag-ci       demande qualifiée             REQ-2481 · priorité haute
08:44:10  ag-ops      escalade REQ-2477             chauffeur non assigné
08:20:55  ag-ci       préférences appliquées        REQ-2479 · étage élevé
08:02:47  sync        crm synchronisé               12 480 données vérifiées
07:31:04  sync        whatsapp FAILED               token expiré · alerte envoyée`}
                </pre>
                <Link to="/activity" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-cream/60 transition-colors hover:text-cream">
                  Ouvrir le centre d'activité <ArrowUpRight size={12} strokeWidth={1.75} />
                </Link>
              </div>
            )}
          </GlassSurface>
        </FadeSwitch>
        </AnimatePresence>
      </div>

      <GlassModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        eyebrow="Équipe"
        title="Inviter un membre"
        footer={
          <>
            <GlassButton variant="ghost" onClick={() => setInviteOpen(false)}>Annuler</GlassButton>
            <GlassButton
              variant="primary"
              disabled={!inviteEmail.includes("@")}
              onClick={() => {
                setInviteOpen(false);
                setInviteEmail("");
                toast.success("Invitation envoyée", { description: "Le membre recevra un email de bienvenue." });
              }}
            >
              Envoyer l'invitation
            </GlassButton>
          </>
        }
      >
        <div className="space-y-3.5">
          <GlassInput label="Email professionnel" type="email" placeholder="collegue@maison-ekwata.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          <div className="flex items-start gap-2 rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <Check size={13} strokeWidth={2} className="mt-0.5 shrink-0 text-jade" />
            <p className="text-[11.5px] leading-relaxed text-cream/50">
              Le nouveau membre rejoint avec le rôle « Lecteurs ». Vous pourrez ajuster ses permissions ensuite.
            </p>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
