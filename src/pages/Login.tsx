import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { getOnboarded, useAuth } from "../lib/services";
import { GlassButton, GlassInput } from "../components/glass";
import { GoogleIcon, MicrosoftIcon, LogoMark, Wordmark } from "../components/icons";
import { EASE } from "../components/ui";
import { toast } from "../components/toast";
import { ThemeTogglerButton } from "../components/theme-toggle";

/* ————— Flux de données / réseaux d'intelligence (côté visuel desktop) —————
   Réseau convergent, très basse opacité, dérive lente. transform + opacity
   uniquement ; pause quand l'onglet est caché ; statique en reduced-motion. */
const PATHS = [
  "M-20 120 C 140 140, 180 300, 360 320 S 560 420, 520 620",
  "M-20 300 C 120 300, 200 360, 360 320",
  "M-20 520 C 160 520, 220 400, 360 320",
  "M-20 700 C 180 660, 240 420, 360 320",
  "M360 320 C 480 300, 520 180, 500 40",
  "M360 320 C 460 360, 470 520, 520 620",
];
const NODES: [number, number, number][] = [
  [360, 320, 4.5], [-8, 120, 2.4], [-8, 300, 2.4], [-8, 520, 2.4], [-8, 700, 2.4],
  [500, 40, 2.8], [520, 620, 2.8], [200, 360, 2], [220, 400, 2],
];

function DataPaths() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onVis = () => { el.dataset.paused = document.hidden ? "true" : "false"; };
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div ref={ref} className="auth-viz pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 520 820" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <g className={reduce ? undefined : "auth-drift"}>
          {PATHS.map((d, i) => (
            <path
              key={i} d={d} fill="none"
              stroke="var(--color-champagne-500)" strokeWidth="1" strokeLinecap="round"
              style={{ opacity: 0.12 }}
            />
          ))}
          {NODES.map(([cx, cy, r], i) => (
            <circle
              key={i}
              cx={Number.isFinite(cx) ? cx : 0}
              cy={Number.isFinite(cy) ? cy : 0}
              r={Number.isFinite(r) ? r : 2}
              fill={i === 0 ? "var(--color-champagne-500)" : "var(--color-cream)"}
              className={reduce ? undefined : "auth-node"}
              style={{ opacity: i === 0 ? 0.5 : 0.3, animationDelay: `${i * 0.7}s` }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("marie@maison-ekwata.com");
  const [password, setPassword] = useState("••••••••");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Connexion réussie", { description: "Bienvenue sur votre DATA OS." });
      navigate(getOnboarded() ? "/dashboard" : "/onboarding", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 min-h-screen lg:grid lg:grid-cols-[1.05fr_minmax(400px,0.9fr)]">
      {/* ————— Côté visuel (desktop) : on entre dans Data OS ————— */}
      <aside className="relative hidden overflow-hidden border-r border-[var(--hairline)] bg-[var(--surface-1)] lg:block">
        <DataPaths />
        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--surface-0)] via-transparent to-transparent" aria-hidden />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-14">
          <Wordmark size={26} />
          <div>
            <p className="t-label text-champagne-300">Intelligence opérationnelle</p>
            <h2 className="mt-3 max-w-md text-[30px] font-[590] leading-[1.12] tracking-[-0.022em] xl:text-[34px]">
              Vous entrez dans votre <span className="text-champagne-300">Data OS</span>.
            </h2>
            <p className="mt-3.5 max-w-sm text-[14px] leading-relaxed text-cream/55">
              Vos sources, vos agents et vos décisions — réunis dans un seul système, connecté en continu.
            </p>
          </div>
          <p className="num text-[10px] uppercase tracking-[0.14em] text-cream/30">Flux de données · réseaux d'intelligence</p>
        </div>
      </aside>

      {/* ————— Côté formulaire — focalisé, sobre sur mobile ————— */}
      <main className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <ThemeTogglerButton
          variant="ghost"
          direction="counterclockwise"
          modes={["light", "dark", "comfort", "system"]}
          className="absolute right-4 top-4 sm:right-6 sm:top-6"
        />
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex justify-center lg:hidden">
            <span className="grid h-12 w-12 place-items-center rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] text-cream shadow-[var(--highlight-top)]">
              <LogoMark size={24} />
            </span>
          </div>

          <h1 className="t-title">Connexion</h1>
          <p className="mt-1.5 font-serif text-[15px] italic text-cream/70">
            Votre entreprise, <em className="text-champagne-300">enfin connectée</em>.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <GlassInput
              label="Email professionnel" type="email" autoComplete="email" required
              icon={<Mail size={15} strokeWidth={1.6} />}
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.com"
            />
            <GlassInput
              label="Mot de passe" type={showPw ? "text" : "password"} autoComplete="current-password" required
              icon={<Lock size={15} strokeWidth={1.6} />}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              right={
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="text-cream/40 transition-colors hover:text-cream">
                  {showPw ? <EyeOff size={15} strokeWidth={1.6} /> : <Eye size={15} strokeWidth={1.6} />}
                </button>
              }
            />
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-[12px] text-cream/55">
                <input type="checkbox" className="accent-champagne-500" /> Rester connecté
              </label>
              <button type="button" onClick={() => toast.neutral("Lien de récupération envoyé", { description: "Consultez votre boîte email (simulation)." })} className="text-[12px] font-medium text-champagne-300 transition-opacity hover:opacity-75">
                Mot de passe oublié ?
              </button>
            </div>
            {error && <p className="rounded-xs border border-ember/30 bg-ember/[0.08] px-3 py-2 text-xs text-ember">{error}</p>}
            <GlassButton variant="primary" size="lg" full loading={loading} type="submit">
              Continuer
            </GlassButton>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--hairline)]" />
            <span className="text-[10px] uppercase tracking-[0.14em] text-cream/35">ou</span>
            <span className="h-px flex-1 bg-[var(--hairline)]" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Google", icon: <GoogleIcon size={15} /> },
              { label: "Microsoft", icon: <MicrosoftIcon size={15} /> },
              { label: "SSO", icon: <span className="num text-[10px] font-semibold">SSO</span> },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => toast.neutral("SSO simulé", { description: `${p.label} — disponible en production.` })}
                className="flex h-10 items-center justify-center gap-2 rounded-sm border border-[var(--hairline)] bg-[var(--surface-2)] text-xs font-medium text-cream/75 shadow-[var(--highlight-top)] transition-all duration-200 hover:border-[var(--hairline-strong)] hover:text-cream"
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-[12.5px] text-cream/50">
            Pas encore de compte ?{" "}
            <button type="button" onClick={() => toast.neutral("Création de compte", { description: "L'inscription se fait sur invitation de votre organisation." })} className="font-medium text-champagne-300 transition-opacity hover:opacity-75">
              Créer un accès
            </button>
          </p>
          <p className="num mt-4 text-center text-[10px] text-cream/35">
            Démo — compte pré-rempli · aucune donnée réelle
          </p>
        </motion.div>
      </main>
    </div>
  );
}
