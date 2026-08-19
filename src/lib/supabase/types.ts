/**
 * Types des futures tables Supabase (schéma cible, mapping 1:1).
 * Tables prévues : organizations, organization_members, profiles, roles,
 * requests, clients, agents, agent_actions, agent_runs, agent_tasks,
 * agent_events, agent_status, agent_metrics, insights, operations,
 * reports, data_sources, notifications, settings, approvals,
 * documents, cowork_conversations, cowork_messages.
 */

export interface DbOrganization { id: string; name: string; plan: string; city: string | null; created_at: string; }
export interface DbOrganizationMember { id: string; organization_id: string; user_id: string; role_id: string; status: "active" | "invited"; created_at: string; }
export interface DbProfile { id: string; full_name: string; email: string; initials: string; created_at: string; }
export interface DbRole { id: string; organization_id: string; name: string; permissions: string[]; }
export interface DbRequest { id: string; organization_id: string; client_id: string; ref: string; title: string; type: string; status: string; priority: string; agent_id: string; amount_label: string; vip: boolean; summary: string; created_at: string; updated_at: string; }
export interface DbClient { id: string; organization_id: string; name: string; segment: string; state: string; value: number; currency: string; owner_id: string; email: string; phone: string; city: string; since: number; created_at: string; }
export interface DbAgent { id: string; organization_id: string; name: string; role: string; status: string; accuracy: number; tint: string; }
export interface DbAgentRun { id: string; agent_id: string; started_at: string; finished_at: string | null; status: string; }
export interface DbAgentTask { id: string; agent_id: string; request_id: string | null; label: string; status: string; due: string | null; }
export interface DbAgentEvent { id: string; agent_id: string; label: string; created_at: string; }
export interface DbInsight { id: string; organization_id: string; type: string; title: string; body: string; metric: string | null; metric_label: string | null; impact: string; status: string; created_at: string; }
export interface DbOperation { id: string; organization_id: string; agent_id: string | null; title: string; description: string | null; kind: string; created_at: string; }
export interface DbReport { id: string; organization_id: string; title: string; period: string; category: string; status: string; summary: string; url: string | null; created_at: string; }
export interface DbDataSource { id: string; organization_id: string; key: string; name: string; status: "connected" | "syncing" | "error" | "off"; last_sync: string | null; records: number; method: string; }
export interface DbNotification { id: string; organization_id: string; user_id: string | null; title: string; body: string; tone: string; read: boolean; created_at: string; }
export interface DbApproval { id: string; organization_id: string; agent_id: string; title: string; why: string; data: string; impact: string; category: string; status: string; created_at: string; }
export interface DbSettings { id: string; organization_id: string; key: string; value: unknown; updated_at: string; }
