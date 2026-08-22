/**
 * ⚠️ Sécurité — Aucune clé service_role ne doit exister côté navigateur.
 * Les opérations privilégiées passent EXCLUSIVEMENT par les Edge Functions
 * Supabase (déjà déployées), qui détiennent la clé service côté serveur.
 * Ce module est volontairement vide pour empêcher toute fuite dans le bundle.
 */
export const serverClient = null;
