import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { GlassButton, GlassInput, GlassSurface } from '../components/glass';
import { GoogleIcon, MicrosoftIcon, Wordmark } from '../components/icons';
import { ThemeTogglerButton } from '../components/theme-toggle';
import { toast } from '../components/toast';
import { EASE } from '../components/ui';
import { getOnboarded, useAuth } from '../lib/services';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('marie@maison-ekwata.com');
  const [password, setPassword] = useState('••••••••');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Connexion réussie', { description: 'Bienvenue sur votre DATA OS.' });
      navigate(getOnboarded() ? '/dashboard' : '/onboarding', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 grid min-h-screen place-items-center px-5 py-10">
      <ThemeTogglerButton
        variant="ghost"
        direction="counterclockwise"
        modes={['light', 'dark', 'comfort', 'system']}
        className="absolute right-4 top-4 sm:right-6 sm:top-6"
      />
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex justify-center">
          <Wordmark size={30} />
        </div>
        <GlassSurface className="p-7 sm:p-8">
          <h1 className="text-[22px] font-semibold tracking-tight">Connexion</h1>
          <p className="mt-1.5 font-serif text-[15px] italic text-cream/70">
            Votre entreprise, <em className="text-champagne-300">enfin connectée</em>.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <GlassInput
              label="Email professionnel"
              type="email"
              autoComplete="email"
              required
              icon={<Mail size={15} strokeWidth={1.6} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.com"
            />
            <GlassInput
              label="Mot de passe"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              required
              icon={<Lock size={15} strokeWidth={1.6} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              right={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="text-cream/40 transition-colors hover:text-cream"
                >
                  {showPw ? (
                    <EyeOff size={15} strokeWidth={1.6} />
                  ) : (
                    <Eye size={15} strokeWidth={1.6} />
                  )}
                </button>
              }
            />
            {error && (
              <p className="rounded-[9px] border border-ember/30 bg-ember/[0.08] px-3 py-2 text-xs text-[#e28d85]">
                {error}
              </p>
            )}
            <GlassButton variant="primary" size="lg" full loading={loading} type="submit">
              Continuer
            </GlassButton>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[10px] uppercase tracking-[0.14em] text-cream/35">ou</span>
            <span className="h-px flex-1 bg-white/[0.08]" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Google', icon: <GoogleIcon size={15} /> },
              { label: 'Microsoft', icon: <MicrosoftIcon size={15} /> },
              { label: 'SSO', icon: <span className="num text-[10px] font-semibold">SSO</span> },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() =>
                  toast.neutral('SSO simulé', {
                    description: `${p.label} — disponible en production.`,
                  })
                }
                className="flex h-10 items-center justify-center gap-2 rounded-[11px] border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-cream/75 transition-all duration-200 hover:border-white/[0.16] hover:text-cream"
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>

          <p className="num mt-5 text-center text-[10px] text-cream/35">
            Démo — compte pré-rempli · aucune donnée réelle
          </p>
        </GlassSurface>
      </motion.div>
    </div>
  );
}
