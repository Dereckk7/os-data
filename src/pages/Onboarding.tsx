import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, FolderUp, Link2 } from "lucide-react";
import { cn, connectors, fmtInt, setOnboarded, useSourcesState } from "../lib/services";
import type { SourceKey } from "../lib/types";
import { GlassBadge, GlassButton, GlassSurface } from "../components/glass";
import { SourceIcon } from "../components/icons";
import { AnimatedIcon, EASE, Reveal } from "../components/ui";
import { toast } from "../components/toast";

export default function Onboarding() {
  const { sources, patchSource } = useSourcesState();
  const [connecting, setConnecting] = useState<SourceKey | null>(null);
  const navigate = useNavigate();

  const connectorMap: Record<SourceKey, () => Promise<{ records: number }>> = {
    crm: connectors.connectCRM,
    email: connectors.connectEmail,
    calendar: connectors.connectCalendar,
    whatsapp: connectors.connectWhatsApp,
    payments: connectors.connectPayments,
    documents: connectors.importDocuments,
  };

  const connect = async (key: SourceKey, name: string) => {
    setConnecting(key);
    const res = await connectorMap[key]();
    patchSource(key, {
      status: "connected", lastSync: "à l'instant", records: res.records,
      lastActivity: "Première synchronisation réussie", error: undefined,
    });
    setConnecting(null);
    toast.success(`${name} connecté`, { description: `${fmtInt(res.records)} données seront organisées automatiquement.` });
  };

  const connectedCount = sources.filter((s) => s.status === "connected").length;

  const finish = (skipped: boolean) => {
    setOnboarded(true);
    if (skipped) {
      toast.neutral("Configuration reportée", { description: "Vous pourrez connecter vos sources à tout moment." });
    } else {
      toast.gold("DATA OS synchronise vos données", { description: "Première organisation automatique en cours." });
    }
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="relative z-10 mx-auto min-h-screen w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <Reveal>
        <p className="eyebrow">Configuration · Étape 1 sur 1</p>
        <h1 className="mt-3 font-serif text-[34px] leading-tight tracking-tight sm:text-[42px]">
          Connectez vos <em className="text-champagne-300">sources</em>
        </h1>
        <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-cream/55">
          Les données seront organisées automatiquement dans DATA OS. Aucune
          configuration technique requise — nos agents s'occupent du reste.
        </p>
      </Reveal>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {sources.map((s, i) => {
          const isConnecting = connecting === s.key;
          const isConnected = s.status === "connected";
          const isDocs = s.key === "documents";
          return (
            <Reveal key={s.key} delay={0.05 + i * 0.05}>
              <GlassSurface sweep className={cn("group flex h-full flex-col gap-3 p-5 transition-colors duration-300", isConnected && "border-jade/25")}>
                <div className="flex items-start justify-between gap-3">
                  <AnimatedIcon trigger="hover" className="grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--hairline)] bg-ink-950/55 text-cream/75">
                    <SourceIcon sourceKey={s.key} size={16} strokeWidth={1.6} />
                  </AnimatedIcon>
                  {isConnected ? <GlassBadge tone="success" dot>Connecté</GlassBadge>
                    : isConnecting ? <GlassBadge tone="gold" dot pulse>Connexion…</GlassBadge>
                    : s.status === "error" ? <GlassBadge tone="danger" dot>Erreur</GlassBadge>
                    : <GlassBadge tone="neutral">Non connecté</GlassBadge>}
                </div>
                <div className="min-h-[52px]">
                  <p className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
                    {s.name}
                    <span className="num rounded-[5px] border border-[var(--hairline)] bg-[var(--surface-2)] px-1.5 py-px text-[8.5px] uppercase tracking-[0.12em] text-cream/40">{s.method}</span>
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-cream/50">{s.description}</p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--card-divider)] pt-3">
                  {isConnected ? (
                    <>
                      <span className="num text-[10.5px] text-jade">{fmtInt(s.records)} données</span>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-cream/45">
                        <Check size={13} strokeWidth={1.75} className="text-jade" /> Connecté
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="num text-[10px] uppercase tracking-[0.1em] text-cream/30">{isDocs ? "Import local" : "OAuth sécurisé"}</span>
                      <GlassButton
                        size="sm"
                        variant={isDocs ? "soft" : "gold"}
                        loading={isConnecting}
                        iconLeft={isDocs ? <FolderUp size={13} strokeWidth={1.75} /> : <Link2 size={13} strokeWidth={1.75} />}
                        onClick={() => connect(s.key, s.name)}
                        disabled={connecting !== null}
                      >
                        {isDocs ? "Importer" : "Connecter"}
                      </GlassButton>
                    </>
                  )}
                </div>
              </GlassSurface>
            </Reveal>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35, ease: EASE }}
        className="mt-8 flex flex-col-reverse items-stretch gap-2.5 border-t border-[var(--card-divider)] pt-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <GlassButton variant="ghost" onClick={() => finish(true)}>Passer pour l'instant</GlassButton>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="num text-[10.5px] text-cream/35">
            {connectedCount} source{connectedCount > 1 ? "s" : ""} connectée{connectedCount > 1 ? "s" : ""}
          </span>
          <GlassButton variant="primary" size="lg" disabled={connectedCount === 0} onClick={() => finish(false)}>
            Continuer
          </GlassButton>
        </div>
      </motion.div>
    </div>
  );
}
