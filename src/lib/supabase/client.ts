/**
 * Client Supabase — prêt à brancher.
 * Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY, puis remplacez
 * l'implémentation mock de lib/services.tsx par des appels réels.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** `null` tant que les identifiants ne sont pas fournis (mode démo). */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
    : null;

export const isSupabaseConfigured = Boolean(url && anonKey);
