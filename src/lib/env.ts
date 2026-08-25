/**
 * Validation utilitaire pour les variables d'environnement
 * Affiche des warnings en développement si des variables requises sont manquantes
 */

const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;

export function validateEnvVars(): void {
  if (import.meta.env.DEV) {
    requiredEnvVars.forEach((envVar) => {
      const value = import.meta.env[envVar as string];
      if (!value) {
        console.warn(
          `⚠️ Variable d'environnement manquante : ${envVar}\n` +
            `Copiez .env.example en .env et configurez vos clés Supabase.`
        );
      }
    });
  }
}

export function getEnvVar(name: string): string | undefined {
  return import.meta.env[name];
}

export function isSupabaseConfigured(): boolean {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

// Exécution automatique au chargement du module
validateEnvVars();
