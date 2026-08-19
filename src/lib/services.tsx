/**
 * DATA OS — Couche services & état.
 * Toute la logique métier transite par ce module. L'implémentation est
 * mockée ; chaque fonction est conçue pour être remplacée par Supabase
 * sans toucher aux composants (props / hooks stables).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  mockActivity, mockAgents, mockApprovals, mockClients, mockDocuments, mockInsights,
  mockIntegrations, mockNotifications, mockOperations, mockRequests, mockReports,
  mockSources, mockTasks, mockUser,
} from "./mock";
import type {
  ActivityEntry, Agent, AppNotification, Approval, ApprovalStatus, Client, DataRequest,
  DataSource, DocumentItem, Insight, Integration, Operation, Report, SourceKey, TaskItem, User,
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

/* ————————————————— Authentification —————————————————
   Abstraction prête pour Supabase Auth. */
const SESSION_KEY = "dataos.session.v1";

export const authService = {
  async signIn(email: string, _password: string): Promise<User> {
    await delay(850);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Adresse email invalide.");
    const user: User = { ...mockUser, email };
    safeSet(SESSION_KEY, JSON.stringify(user));
    return user;
  },
  signOut(): void { safeDel(SESSION_KEY); },
  getSession(): User | null {
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
    const t = window.setTimeout(() => { setUser(authService.getSession()); setBooting(false); }, 350);
    return () => window.clearTimeout(t);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const u = await authService.signIn(email, password);
    setUser(u);
    return u;
  }, []);
  const signOut = useCallback(() => { authService.signOut(); setUser(null); }, []);

  const value = useMemo(() => ({ user, booting, signIn, signOut }), [user, booting, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);

/* ————————————————— Onboarding ————————————————— */
const ONBOARDED_KEY = "dataos.onboarded.v1";
export function getOnboarded(): boolean { return safeGet(ONBOARDED_KEY) === "1"; }
export function setOnboarded(v: boolean): void { if (v) safeSet(ONBOARDED_KEY, "1"); else safeDel(ONBOARDED_KEY); }

/* ————————————————— Connecteurs de sources (simulés) ————————————————— */
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

/* ————————————————— Validations (approbations) ————————————————— */
interface ApprovalsContextValue {
  approvals: Approval[]; pending: Approval[];
  setStatus: (id: string, status: ApprovalStatus) => void;
}
const ApprovalsContext = createContext<ApprovalsContextValue>({ approvals: mockApprovals, pending: [], setStatus: () => {} });

export function ApprovalsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Approval[]>(mockApprovals);
  const setStatus = useCallback((id: string, status: ApprovalStatus) => {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }, []);
  const pending = useMemo(() => items.filter((a) => a.status === "pending"), [items]);
  const value = useMemo(() => ({ approvals: items, pending, setStatus }), [items, pending, setStatus]);
  return <ApprovalsContext.Provider value={value}>{children}</ApprovalsContext.Provider>;
}
export const useApprovals = () => useContext(ApprovalsContext);

/* ————————————————— Hooks de données —————————————————
   Mock aujourd'hui ; remplacer le corps par un useQuery Supabase. */
export function useMockData<T>(initial: T, ms = 550) {
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    const t = window.setTimeout(() => { if (mounted.current) setLoading(false); }, ms);
    return () => { mounted.current = false; window.clearTimeout(t); };
  }, [ms]);
  const query = { ["data"]: initial, loading };
  return query;
}

export const useRequests = (ms?: number) => useMockData<DataRequest[]>(mockRequests, ms);
export const useClients = (ms?: number) => useMockData<Client[]>(mockClients, ms);
export const useAgents = (ms?: number) => useMockData<Agent[]>(mockAgents, ms);
export const useInsights = (ms?: number) => useMockData<Insight[]>(mockInsights, ms);
export const useOperations = (ms?: number) => useMockData<Operation[]>(mockOperations, ms);
export const useReports = (ms?: number) => useMockData<Report[]>(mockReports, ms);
export const useNotifications = (ms?: number) => useMockData<AppNotification[]>(mockNotifications, ms);
export const useTasks = (ms?: number) => useMockData<TaskItem[]>(mockTasks, ms);
export const useDocuments = (ms?: number) => useMockData<DocumentItem[]>(mockDocuments, ms);
export const useIntegrations = (ms?: number) => useMockData<Integration[]>(mockIntegrations, ms);
export const useActivity = (ms?: number) => useMockData<ActivityEntry[]>(mockActivity, ms);
