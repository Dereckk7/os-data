/* ————————————————————————————————————————————————
   DATA OS — Types frontend
   Miroir conceptuel des futures tables Supabase :
   organizations, organization_members, profiles, roles, requests,
   clients, agents, agent_actions, insights, operations, reports,
   data_sources, notifications, settings, approvals, documents…
   ———————————————————————————————————————————————— */

export type Tone = "gold" | "success" | "warning" | "danger" | "neutral";
export type Priority = "Critique" | "Haute" | "Normale" | "Basse";

export type RequestStatus = "En recherche" | "À valider" | "En attente client" | "Confirmée" | "En retard" | "Traitée";
export type RequestType = "Transfert" | "Réservation" | "Vol" | "Conciergerie" | "Séjour" | "Visa" | "Événement";

export interface RequestOption {
  id: string; label: string; vehicle: string; price: string;
  reliability: number; features: string[]; recommended?: boolean;
}

export interface ActivityEvent {
  id: string; time: string; title: string; desc?: string; agent?: string; live?: boolean;
}

export interface DataRequest {
  id: string; ref: string; clientId: string; client: string; title: string;
  type: RequestType; status: RequestStatus; priority: Priority; agent: string;
  amountLabel: string; vip: boolean; day: number; time: string; summary: string;
  options: RequestOption[]; activity: ActivityEvent[];
}

export type Segment = "VIP" | "Fidèle" | "Nouveau" | "À risque";
export type ClientState = "Actif" | "Inactif" | "À risque";
export type Risk = "Faible" | "Modéré" | "Élevé";

export interface Communication { id: string; channel: "WhatsApp" | "Email" | "Appel" | "Réunion"; date: string; summary: string; }
export interface RecommendedAction { id: string; label: string; agent: string; }

export interface Client {
  id: string; name: string; initials: string; segment: Segment; state: ClientState;
  lastContact: string; value: number; currency: "XAF" | "EUR";
  requestsCount: number; bookingsCount: number; satisfaction: number; activity: number;
  risk: Risk; owner: string; email: string; phone: string; city: string; since: number;
  history: ActivityEvent[]; comms: Communication[];
  aiInsights: string[]; recommendedActions: RecommendedAction[];
}

export type AgentStatus = "Opérationnel" | "En veille" | "En attente" | "Maintenance" | "Erreur";

export interface AgentTask { id: string; label: string; status: "À faire" | "En cours" | "Planifié" | "Terminé"; due: string; }

export interface Agent {
  id: string; name: string; role: string; description: string;
  actionsToday: number; status: AgentStatus; current: string;
  week: number[]; capabilities: string[]; accuracy: number;
  lastActivity: string; avgTime: string; tint: string;
  tasks: AgentTask[]; sources: string[]; events: ActivityEvent[];
}

export type InsightType = "opportunity" | "recommendation" | "warning" | "anomaly" | "decision";

export interface Insight {
  id: string; type: InsightType; title: string; body: string;
  metric?: string; metricLabel?: string; cta: string; agent: string;
  time: string; impact: "Élevé" | "Moyen" | "Faible"; status: "Nouveau" | "Vu" | "Traité";
}

export interface Operation {
  id: string; time: string; agent?: string; title: string; desc?: string;
  kind: "info" | "success" | "warning" | "agent"; live?: boolean;
}

export type ReportStatus = "Prêt" | "Génération" | "Planifié";
export type ReportPeriod = "Quotidien" | "Hebdomadaire" | "Mensuel";
export interface ReportHighlight { label: string; value: string; delta?: string; }

export interface Report {
  id: string; title: string; period: ReportPeriod; category: string;
  status: ReportStatus; date: string; summary: string; pages: number;
  trend: number[]; highlights: ReportHighlight[];
}

export type SourceStatus = "connected" | "syncing" | "error" | "off";
export type SourceKey = "crm" | "email" | "calendar" | "whatsapp" | "payments" | "documents";

export interface DataSource {
  id: string; key: SourceKey; name: string; description: string;
  status: SourceStatus; lastSync: string; records: number; lastActivity: string;
  error?: string; method: "OAuth" | "IMAP" | "API" | "Import";
}

export type IntegrationStatus = "Connecté" | "Déconnecté" | "Synchronisation" | "Erreur" | "Configuration requise";
export interface Integration {
  id: string; name: string; monogram: string; category: string;
  status: IntegrationStatus; lastSync: string; records: number; description: string;
}

export type DocumentCategory = "Contrats" | "Factures" | "Réservations" | "Documents clients" | "Rapports" | "Procédures" | "Autres";
export interface DocumentItem {
  id: string; name: string; category: DocumentCategory; size: string;
  updated: string; source: string; tags: string[];
}

export type ActivityKind = "agent" | "utilisateur" | "systeme" | "action" | "erreur";
export interface ActivityEntry { id: string; time: string; actor: string; kind: ActivityKind; title: string; desc?: string; }

export interface TaskItem {
  id: string; title: string; priority: Priority; agent: string; due: string;
  status: "À faire" | "En cours" | "En attente" | "Terminé"; count?: number; ref?: string;
}

export type ApprovalStatus = "pending" | "validee" | "rejetee" | "modifiee";
export type ApprovalCategory = "Messages" | "Communications" | "Modifications clients" | "Actions financières" | "Opérations" | "Rapports" | "Actions agents";
export interface Approval {
  id: string; agent: string; title: string; why: string; data: string;
  impact: string; category: ApprovalCategory; status: ApprovalStatus; time: string;
}

export interface AppNotification { id: string; title: string; desc: string; time: string; read: boolean; tone: Tone; }

export interface User { id: string; name: string; email: string; role: string; initials: string; }
export interface Member { id: string; name: string; email: string; role: string; status: "Actif" | "Invité"; }
export interface Organization { id: string; name: string; plan: string; city: string; members: Member[]; }

export interface AttentionItem {
  id: string; title: string; desc: string; value: string; agent: string;
  priority: Priority; requestId: string;
}

export interface Kpi { label: string; value: string; deltaText: string; deltaTone: Tone; spark: number[]; }

export type WorkTone = "blue" | "violet" | "orange" | "ember" | "jade" | "gold" | "neutral";
export interface OpsStep { id: string; label: string; state: "done" | "active" | "todo"; }
export interface OpsCardData {
  id: string; tone: WorkTone; eyebrow: string; title: string; desc: string;
  when: string; progress: number; steps: OpsStep[]; agentIds: string[];
  workingIds: string[]; dueIn: number; urgent?: boolean;
}

export type CoworkKind = "analysis" | "report" | "late" | "clients" | "text";
export interface CoworkMessage { id: string; role: "user" | "os"; kind: CoworkKind; text: string; at: string; }
