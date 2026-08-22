/**
 * DATA OS — Couche services & état.
 * Branchée sur Supabase quand VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY sont
 * renseignées ; sinon (ou en cas d'erreur réseau) repli automatique sur le mock.
 * Les signatures des hooks sont inchangées : les composants ne bougent pas.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "./supabase/client";
import {
  mockActivity, mockAgents, mockApprovals, mockClients, mockDocuments, mockInsights,
  mockIntegrations, mockNotifications, mockOperations, mockRequests, mockReports,
  mockSources, mockTasks, mockUser,
} from "./mock";
import type {
  ActivityEntry, Agent, AgentStatus, AppNotification, Approval, ApprovalStatus, ApprovalCategory,
  Client, ClientState, DataRequest, DataSource, DocumentItem, Insight, InsightType, Integration, Operation, Segment,
  Priority, Report, RequestOption, RequestStatus, RequestType, SourceKey, TaskItem, User,
} from "./types";

/* ————————————————— Utilitaires ————————————————— */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
export const fmtInt = (n: number): string => new Intl.NumberFormat("fr-FR").format(n);
export const fmtMoney = (n: number, currency: "XAF" | "EUR" = "XAF"): string =>
  `${new Intl.NumberFormat("fr-FR").format(n)} ${currency}`;

export function todayLabel(): string {
  const s = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

const safeGet = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* noop */ } };
const safeDel = (k: string) => { try { localStorage.removeItem(k); } catch { /* noop */ } };

/* ————————————————— Contexte tenant (résolu une fois) ————————————————— */
interface Ctx { tenantId: string; }
let _ctx: Promise<Ctx | null> | null = null;
async function getContext(): Promise<Ctx | null> {
  if (!supabase) return null;
  if (_ctx) return _ctx;
  _ctx = (async () => {
    const { data: u } = await supabase!.auth.getUser();
    if (!u?.user) return null;
    const { data, error } = await supabase!.schema("core").from("memberships")
      .select("tenant_id").eq("status", "active").limit(1).maybeSingle();
    if (error || !data?.tenant_id) return null;
    return { tenantId: data.tenant_id as string };
  })();
  return _ctx;
}
function resetContext() { _ctx = null; }

/* ————————————————— Convertisseurs (jamais d'invention) ————————————————— */
const prioFromInt = (n: number | null | undefined): Priority =>
  n === 1 ? "Critique" : n === 2 ? "Haute" : n === 3 ? "Normale" : "Basse";

function reqStatus(db: string, dueAt: string | null, resolvedAt: string | null): RequestStatus {
  if (dueAt && !resolvedAt && new Date(dueAt) < new Date() && db !== "terminee" && db !== "annulee") return "En retard";
  switch (db) {
    case "en_attente_client": return "En attente client";
    case "terminee": return "Traitée";
    case "annulee": return "Traitée";
    default: return "En recherche";
  }
}
const typeFromCategory = (c: string | null): RequestType => {
  switch ((c ?? "").toLowerCase()) {
    case "transport": return "Transfert";
    case "hotel": return "Réservation";
    case "vol": return "Vol";
    case "sejour": return "Séjour";
    case "evenement": return "Événement";
    case "visa": return "Visa";
    default: return "Conciergerie";
  }
};
const agentStatusOf = (a: { statut?: string; taches_aujourdhui?: number }): AgentStatus =>
  a.statut !== "enabled" ? "En veille" : (a.taches_aujourdhui ?? 0) > 0 ? "Opérationnel" : "En veille";

const insightTypeOf = (code: string): InsightType =>
  code === "clients_inactifs" ? "opportunity"
    : code === "sla_depasses" ? "warning"
    : code === "validations_en_attente" ? "decision"
    : "recommendation";
const impactOf = (g: string): "Élevé" | "Moyen" | "Faible" =>
  g === "critique" ? "Élevé" : g === "attention" ? "Moyen" : "Faible";

const segmentOf = (t: string | null): Segment =>
  t === "entreprise" ? "VIP" : t === "membre" ? "Fidèle" : "Nouveau";
const clientStateOf = (s: string | null): ClientState =>
  s === "inactive" ? "Inactif" : "Actif";
const humanSize = (b: number): string =>
  b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} Mo` : b >= 1000 ? `${Math.round(b / 1000)} Ko` : `${b} o`;
const integStatusOf = (s: string): "Connecté" | "Déconnecté" | "Configuration requise" =>
  s === "actif" ? "Connecté" : s === "inactif" ? "Déconnecté" : "Configuration requise";
const docCategoryOf = (t: string | null): DocumentItem["category"] => {
  switch ((t ?? "").toLowerCase()) {
    case "contrat": return "Contrats";
    case "facture": return "Factures";
    case "reservation": return "Réservations";
    case "fiche_client": return "Documents clients";
    case "rapport": return "Rapports";
    case "procedure": return "Procédures";
    default: return "Autres";
  }
};
const opKindOf = (level: string): Operation["kind"] =>
  level === "error" || level === "warn" ? "warning" : "agent";

const taskStatusOf = (s: string): TaskItem["status"] =>
  s === "en_cours" ? "En cours" : s === "fait" ? "Terminé" : s === "annulee" ? "En attente" : "À faire";

const approvalStatusOf = (s: string): ApprovalStatus =>
  s === "approved" ? "validee" : s === "rejected" ? "rejetee" : s === "pending" ? "pending" : "modifiee";
const approvalCategoryOf = (action: string | null): ApprovalCategory => {
  switch ((action ?? "").toLowerCase()) {
    case "message": case "relance": return "Communications";
    case "remise": case "avoir": case "paiement": return "Actions financières";
    case "reservation": return "Opérations";
    default: return "Actions agents";
  }
};

function rel(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts).getTime(); const now = Date.now();
  const m = Math.round((now - d) / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24); return `il y a ${j} j`;
}
const hhmm = (ts: string | null): string =>
  ts ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(ts)) : "";

/* ————————————————— Authentification (Supabase Auth ou mock) ————————————————— */
const SESSION_KEY = "dataos.session.v1";
const userFromEmail = (email: string): User => {
  const base = email.split("@")[0] ?? "Utilisateur";
  const name = base.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return { id: email, name, email, role: "Direction", initials };
};

export const authService = {
  async signIn(email: string, password: string): Promise<User> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw new Error(error?.message ?? "Connexion impossible.");
      resetContext();
      return userFromEmail(data.user.email ?? email);
    }
    await delay(650);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Adresse email invalide.");
    const user: User = { ...mockUser, email };
    safeSet(SESSION_KEY, JSON.stringify(user));
    return user;
  },
  async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) { await supabase.auth.signOut(); resetContext(); return; }
    safeDel(SESSION_KEY);
  },
  async getSession(): Promise<User | null> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      return u ? userFromEmail(u.email ?? "") : null;
    }
    const raw = safeGet(SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as User; } catch { return null; }
  },
};

interface AuthContextValue {
  user: User | null; booting: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => void;
}
const AuthContext = createContext<AuthContextValue>({ user: null, booting: true, signIn: async () => mockUser, signOut: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let alive = true;
    authService.getSession().then((u) => { if (alive) { setUser(u); setBooting(false); } });
    if (isSupabaseConfigured && supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        setUser(session?.user ? userFromEmail(session.user.email ?? "") : null);
      });
      return () => { alive = false; sub.subscription.unsubscribe(); };
    }
    return () => { alive = false; };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const u = await authService.signIn(email, password); setUser(u); return u;
  }, []);
  const signOut = useCallback(() => { void authService.signOut(); setUser(null); }, []);

  const value = useMemo(() => ({ user, booting, signIn, signOut }), [user, booting, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);

/* ————————————————— Onboarding ————————————————— */
const ONBOARDED_KEY = "dataos.onboarded.v1";
export function getOnboarded(): boolean { return safeGet(ONBOARDED_KEY) === "1"; }
export function setOnboarded(v: boolean): void { if (v) safeSet(ONBOARDED_KEY, "1"); else safeDel(ONBOARDED_KEY); }

/* ————————————————— Connecteurs de sources (simulés — façade honnête) ————————————————— */
const sourceResult = async (records: number, ms: number) => { await delay(ms); return { records, syncedAt: "à l'instant" }; };
export const connectors = {
  connectCRM: () => sourceResult(12480, 1400),
  connectEmail: () => sourceResult(48210, 1200),
  connectCalendar: () => sourceResult(3120, 1300),
  connectWhatsApp: () => sourceResult(86540, 1500),
  connectPayments: () => sourceResult(9875, 1100),
  importDocuments: () => sourceResult(342, 1600),
  syncSource: (key: SourceKey) =>
    sourceResult(mockSources.find((s) => s.key === key)?.records ?? 0, 1400 + Math.random() * 400),
};

/* ————————————————— État des sources ————————————————— */
const SOURCES_KEY = "dataos.sources.v1";
type SourcePatch = Partial<Pick<DataSource, "status" | "lastSync" | "records" | "lastActivity" | "error">>;
interface SourcesContextValue { sources: DataSource[]; patchSource: (key: SourceKey, patch: SourcePatch) => void; }
const SourcesContext = createContext<SourcesContextValue>({ sources: mockSources, patchSource: () => {} });

function loadStoredSources(): Record<string, SourcePatch> {
  const raw = safeGet(SOURCES_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
export function SourcesProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Record<string, SourcePatch>>(loadStoredSources);
  const patchSource = useCallback((key: SourceKey, patch: SourcePatch) => {
    setStored((prev) => {
      const next = { ...prev, [key]: { ...prev[key], ...patch } };
      safeSet(SOURCES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  const sources = useMemo(() => mockSources.map((s) => ({ ...s, ...stored[s.key] })), [stored]);
  const value = useMemo(() => ({ sources, patchSource }), [sources, patchSource]);
  return <SourcesContext.Provider value={value}>{children}</SourcesContext.Provider>;
}
export const useSourcesState = () => useContext(SourcesContext);

/* ————————————————— Validations (branché sur core.validation_requests) ————————————————— */
interface ApprovalsContextValue {
  approvals: Approval[]; pending: Approval[];
  setStatus: (id: string, status: ApprovalStatus) => void;
}
const ApprovalsContext = createContext<ApprovalsContextValue>({ approvals: mockApprovals, pending: [], setStatus: () => {} });

function mapApproval(r: Record<string, any>): Approval {
  return {
    id: r.id, agent: r.agent_key ?? "Agent", title: r.title ?? "Décision requise",
    why: r.summary ?? "", data: r.payload ? JSON.stringify(r.payload) : "",
    impact: r.amount != null ? fmtMoney(Number(r.amount), (r.currency === "EUR" ? "EUR" : "XAF")) : "",
    category: approvalCategoryOf(r.action_type), status: approvalStatusOf(r.status), time: rel(r.created_at),
  };
}

export function ApprovalsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Approval[]>(mockApprovals);

  useEffect(() => {
    let alive = true;
    (async () => {
      const ctx = await getContext();
      if (!ctx || !supabase) return;
      const { data, error } = await supabase.schema("core").from("validation_requests")
        .select("id, agent_key, title, summary, payload, amount, currency, action_type, status, created_at")
        .eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false });
      if (!alive || error || !data) return;
      setItems(data.map(mapApproval));
    })();
    return () => { alive = false; };
  }, []);

  const setStatus = useCallback((id: string, status: ApprovalStatus) => {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    if (isSupabaseConfigured && supabase && (status === "validee" || status === "rejetee")) {
      const decision = status === "validee" ? "approved" : "rejected";
      void supabase.schema("core").rpc("decide_validation",
        { p_request: id, p_decision: decision, p_note: null, p_via: "app" });
    }
  }, []);

  const pending = useMemo(() => items.filter((a) => a.status === "pending"), [items]);
  const value = useMemo(() => ({ approvals: items, pending, setStatus }), [items, pending, setStatus]);
  return <ApprovalsContext.Provider value={value}>{children}</ApprovalsContext.Provider>;
}
export const useApprovals = () => useContext(ApprovalsContext);

/* ————————————————— Hooks de données ————————————————— */
// Mock pur (inchangé) — écrans pas encore branchés.
export function useMockData<T>(initial: T, ms = 550) {
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true; setLoading(true);
    const t = window.setTimeout(() => { if (mounted.current) setLoading(false); }, ms);
    return () => { mounted.current = false; window.clearTimeout(t); };
  }, [ms]);
  return { data: initial, loading };
}

// Réel avec repli mock : si non configuré ou erreur, renvoie le fallback.
function useSupabaseData<T>(fetcher: (ctx: Ctx) => Promise<T>, fallback: T, ms = 400) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isSupabaseConfigured) { await delay(ms); if (alive) setLoading(false); return; }
      try {
        const ctx = await getContext();
        if (!ctx) { if (alive) { setData(fallback); setLoading(false); } return; }
        const res = await fetcher(ctx);
        if (alive) { setData(res); setLoading(false); }
      } catch { if (alive) { setData(fallback); setLoading(false); } }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { data, loading };
}

/* — Demandes — */
export const useRequests = (_ms?: number) => useSupabaseData<DataRequest[]>(async (ctx) => {
  const [{ data: reqs }, { data: accs }, { data: opts }] = await Promise.all([
    supabase!.from("cg_requests")
      .select("id, title, category, status, priority, due_at, resolved_at, created_at, account_id, assigned_provider_id")
      .eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }),
    supabase!.from("cg_accounts").select("id, display_name, account_type").eq("tenant_id", ctx.tenantId),
    supabase!.from("cg_request_options").select("request_id, id, label, amount, currency, reliability, features, recommended").eq("tenant_id", ctx.tenantId),
  ]);
  const optsByReq = new Map<string, RequestOption[]>();
  for (const o of (opts ?? []) as any[]) {
    const arr = optsByReq.get(o.request_id) ?? [];
    arr.push({ id: o.id, label: o.label, vehicle: o.label, price: o.amount != null ? fmtMoney(Number(o.amount), o.currency === "EUR" ? "EUR" : "XAF") : "", reliability: o.reliability ?? 0, features: Array.isArray(o.features) ? o.features : [], recommended: !!o.recommended });
    optsByReq.set(o.request_id, arr);
  }
  const nameOf = new Map((accs ?? []).map((a: any) => [a.id, a.display_name as string]));
  const typeOf = new Map((accs ?? []).map((a: any) => [a.id, a.account_type as string]));
  return (reqs ?? []).map((r: any): DataRequest => ({
    id: r.id, ref: "REQ-" + String(r.id).slice(0, 4).toUpperCase(),
    clientId: r.account_id ?? "", client: nameOf.get(r.account_id) ?? "Client",
    title: r.title, type: typeFromCategory(r.category),
    status: reqStatus(r.status, r.due_at, r.resolved_at), priority: prioFromInt(r.priority),
    agent: r.assigned_provider_id ? "Agent Opérations" : "Agent Réservation",
    amountLabel: "", vip: typeOf.get(r.account_id) === "entreprise",
    day: 0, time: hhmm(r.created_at), summary: "", options: optsByReq.get(r.id) ?? [], activity: [],
  }));
}, mockRequests);

/* — Agents — */
export const useAgents = (_ms?: number) => useSupabaseData<Agent[]>(async (ctx) => {
  const { data } = await supabase!.schema("core").rpc("cowork_agents_activite", { p_tenant: ctx.tenantId });
  return ((data as any[]) ?? []).map((a): Agent => ({
    id: a.key, name: a.nom, role: String(a.categorie ?? ""), description: "",
    actionsToday: a.taches_aujourdhui ?? 0, status: agentStatusOf(a), current: "",
    week: Array(7).fill(0), capabilities: [], accuracy: a.reussite_pct ?? 0,
    lastActivity: rel(a.derniere_activite), avgTime: "", tint: "gold",
    tasks: [], sources: [], events: [],
  }));
}, mockAgents);

/* — Insights — */
export const useInsights = (_ms?: number) => useSupabaseData<Insight[]>(async (ctx) => {
  const { data } = await supabase!.schema("core").rpc("cowork_insights", { p_tenant: ctx.tenantId });
  return ((data as any[]) ?? []).map((i): Insight => ({
    id: i.code, type: insightTypeOf(i.code), title: i.titre, body: i.detail,
    metric: typeof i.valeur === "number" ? String(i.valeur) : undefined, metricLabel: undefined,
    cta: "Examiner", agent: "COPILOT", time: "à l'instant", impact: impactOf(i.gravite), status: "Nouveau",
  }));
}, mockInsights);

/* — Tâches — */
export const useTasks = (_ms?: number) => useSupabaseData<TaskItem[]>(async (ctx) => {
  const { data } = await supabase!.schema("core").rpc("cowork_taches", { p_tenant: ctx.tenantId, p_status: null });
  return ((data as any[]) ?? []).map((t): TaskItem => ({
    id: t.id, title: t.titre, priority: prioFromInt(t.priorite), agent: t.agent ?? "—",
    due: rel(t.due_at), status: taskStatusOf(t.statut), ref: t.related_request_id ?? undefined,
  }));
}, mockTasks);

/* — Écrans encore sur mock (branchement ultérieur) — */
export const useClients = (_ms?: number) => useSupabaseData<Client[]>(async (ctx) => {
  const { data } = await supabase!.schema("core").rpc("cowork_clients", { p_tenant: ctx.tenantId });
  return ((data as any[]) ?? []) as Client[];
}, mockClients);
export const useOperations = (_ms?: number) => useSupabaseData<Operation[]>(async (ctx) => {
  const [{ data: evs }, { data: runs }] = await Promise.all([
    supabase!.schema("core").from("agent_events")
      .select("id, message, event_type, level, created_at, run_id")
      .eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }).limit(15),
    supabase!.schema("core").from("agent_runs").select("id, agent_key").eq("tenant_id", ctx.tenantId),
  ]);
  const agentOf = new Map((runs ?? []).map((r: any) => [r.id, r.agent_key as string]));
  return ((evs ?? []) as any[]).map((e): Operation => ({
    id: e.id, time: rel(e.created_at), agent: (agentOf.get(e.run_id) ?? "").toString().toUpperCase() || undefined,
    title: e.message ?? e.event_type, desc: undefined, kind: opKindOf(e.level),
    live: Date.now() - new Date(e.created_at).getTime() < 300000,
  }));
}, mockOperations);
export const useReports = (_ms?: number) => useSupabaseData<Report[]>(async (ctx) => {
  const { data } = await supabase!.schema("core").rpc("cowork_reports", { p_tenant: ctx.tenantId });
  return ((data as any[]) ?? []).map((r): Report => ({
    id: r.id, title: r.title, period: r.period, category: r.category, status: r.status,
    date: r.date, summary: r.summary ?? "", pages: r.pages ?? 1,
    trend: Array.isArray(r.trend) ? r.trend.map(Number) : [],
    highlights: Array.isArray(r.highlights) ? r.highlights : [],
  }));
}, mockReports);
export const useNotifications = (ms?: number) => useMockData<AppNotification[]>(mockNotifications, ms);
export const useDocuments = (_ms?: number) => useSupabaseData<DocumentItem[]>(async (ctx) => {
  const { data } = await supabase!.schema("core").rpc("cowork_documents", { p_tenant: ctx.tenantId });
  return ((data as any[]) ?? []).map((d): DocumentItem => ({
    id: d.id, name: d.file_name, category: docCategoryOf(d.document_type),
    size: humanSize(Number(d.file_size_bytes ?? 0)), updated: rel(d.updated_at) || "—",
    source: d.source ?? "manuel", tags: Array.isArray(d.data_categories) ? d.data_categories : [],
  }));
}, mockDocuments);
export const useIntegrations = (_ms?: number) => useSupabaseData<Integration[]>(async (ctx) => {
  const { data } = await supabase!.schema("core").rpc("cowork_data_health", { p_tenant: ctx.tenantId });
  const sources = (data as any)?.sources ?? [];
  return (sources as any[]).map((sc): Integration => ({
    id: sc.code, name: sc.nom, monogram: String(sc.nom ?? "?").slice(0, 2).toUpperCase(),
    category: sc.type ?? "", status: integStatusOf(sc.statut),
    lastSync: rel(sc.derniere_sync) || "—", records: Number(sc.enregistrements ?? 0),
    description: sc.statut === "actif" ? "Source connectée et synchronisée." : "Emplacement disponible — à connecter.",
  }));
}, mockIntegrations);
export const useActivity = (_ms?: number) => useSupabaseData<ActivityEntry[]>(async (ctx) => {
  const [{ data: evs }, { data: runs }] = await Promise.all([
    supabase!.schema("core").from("agent_events")
      .select("id, message, event_type, level, created_at, run_id")
      .eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }).limit(20),
    supabase!.schema("core").from("agent_runs").select("id, agent_key").eq("tenant_id", ctx.tenantId),
  ]);
  const agentOf = new Map((runs ?? []).map((r: any) => [r.id, r.agent_key as string]));
  return ((evs ?? []) as any[]).map((e): ActivityEntry => ({
    id: e.id, time: rel(e.created_at),
    actor: (agentOf.get(e.run_id) ?? "data os").toString().toUpperCase(),
    kind: e.level === "error" ? "erreur" : "agent",
    title: e.message ?? e.event_type, desc: undefined,
  }));
}, mockActivity);


/* ————————————————— Cowork : appel de l'Edge Function cowork-ask ————————————————— */
export interface CoworkResult {
  resolved: boolean; tool?: string; source?: string; data?: unknown; answer?: string | null;
  available?: string[]; note?: string;
}
export async function coworkAsk(payload: { tool?: string; params?: Record<string, unknown>; question?: string }): Promise<CoworkResult | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.functions.invoke("cowork-ask", { body: payload });
    if (error) return null;
    return data as CoworkResult;
  } catch { return null; }
}


export async function coworkSelectOption(requestId: string, optionId: string): Promise<boolean> {
  const ctx = await getContext();
  if (!ctx || !supabase) return false;
  const { error } = await supabase.schema("core").rpc("cowork_select_option", { p_tenant: ctx.tenantId, p_request: requestId, p_option: optionId });
  return !error;
}
