/**
 * Iconographie DATA OS — Lucide (fines, monochromes, 1.5–1.75) +
 * symbole propriétaire + icônes métier centralisées.
 */
import type { LucideIcon } from "lucide-react";
import {
  Activity, AlertTriangle, BarChart3, BedDouble, Building2, CalendarDays, Car, Compass,
  ConciergeBell, CreditCard, Fingerprint, FolderOpen, Hotel, Mail, MessageCircle, Plane,
  Radar, Scale, ShieldCheck, Stamp, Ticket, Users, Wallet, Workflow,
} from "lucide-react";
import { cn } from "../lib/services";
import type { InsightType, RequestType, SourceKey } from "../lib/types";

/* ————— Symbole propriétaire : convergence de flux ————— */
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 5.5c5.6 0 6.2 6.5 10.6 6.5" stroke="currentColor" strokeOpacity="0.85" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 12h10.6" stroke="currentColor" strokeOpacity="0.85" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 18.5c5.6 0 6.2-6.5 10.6-6.5" stroke="currentColor" strokeOpacity="0.85" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15.4" cy="12" r="2.05" fill="#C4A882" />
      <path d="M18.6 12h2.6m0 0-1.9-1.9m1.9 1.9-1.9 1.9" stroke="#C4A882" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ size = 22, withTagline = false, className }: { size?: number; withTagline?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <span className="text-cream"><LogoMark size={size} /></span>
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-[0.24em] text-cream">DATA&nbsp;OS</span>
        {withTagline && <span className="mt-1 text-[10px] tracking-[0.08em] text-cream/40">Votre entreprise, enfin connectée</span>}
      </span>
    </span>
  );
}

/* ————— Marques SSO (monochromes) ————— */
export function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M21.6 12.23c0-.68-.06-1.36-.19-2.02H12v3.83h5.4a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.74 2.96-4.3 2.96-7.33Z" />
      <path fill="currentColor" opacity=".7" d="M12 21.75c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.75-5.58-4.1H3.06v2.58A10 10 0 0 0 12 21.75Z" />
      <path fill="currentColor" opacity=".45" d="M6.42 13.68a6 6 0 0 1 0-3.83V7.27H3.06a10 10 0 0 0 0 8.99l3.36-2.58Z" />
      <path fill="currentColor" opacity=".85" d="M12 6.23c1.47 0 2.78.5 3.82 1.5l2.86-2.86A9.97 9.97 0 0 0 12 2.25a10 10 0 0 0-8.94 5.02l3.36 2.58C7.2 7.98 9.4 6.23 12 6.23Z" />
    </svg>
  );
}

export function MicrosoftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3 3h8.5v8.5H3V3Z" opacity=".9" />
      <path fill="currentColor" d="M12.5 3H21v8.5h-8.5V3Z" opacity=".65" />
      <path fill="currentColor" d="M3 12.5h8.5V21H3v-8.5Z" opacity=".65" />
      <path fill="currentColor" d="M12.5 12.5H21V21h-8.5v-8.5Z" opacity=".45" />
    </svg>
  );
}

/* ————— Icônes métier ————— */
const requestTypes: Record<RequestType, LucideIcon> = {
  Transfert: Car, "Réservation": BedDouble, Vol: Plane, Conciergerie: ConciergeBell,
  "Séjour": Hotel, Visa: Stamp, "Événement": Ticket,
};
export function TypeIcon({ type, ...props }: { type: RequestType; size?: number; strokeWidth?: number; className?: string }) {
  const Cmp = requestTypes[type] ?? Ticket;
  return <Cmp {...props} />;
}

const sourceIcons: Record<SourceKey, LucideIcon> = {
  crm: Users, email: Mail, calendar: CalendarDays, whatsapp: MessageCircle, payments: CreditCard, documents: FolderOpen,
};
export function SourceIcon({ sourceKey, ...props }: { sourceKey: SourceKey; size?: number; strokeWidth?: number; className?: string }) {
  const Cmp = sourceIcons[sourceKey] ?? FolderOpen;
  return <Cmp {...props} />;
}

const agentIcons: Record<string, LucideIcon> = {
  "ag-resa": ConciergeBell, "ag-ci": Fingerprint, "ag-rep": BarChart3, "ag-ops": Workflow,
  "ag-pros": Radar, "ag-tres": Wallet, "ag-com": MessageCircle, "ag-plan": CalendarDays,
  "ag-part": Building2, "ag-veil": ShieldCheck,
};
export function AgentGlyph({ agentId, ...props }: { agentId: string; size?: number; strokeWidth?: number; className?: string }) {
  const Cmp = agentIcons[agentId] ?? Workflow;
  return <Cmp {...props} />;
}

export const insightIcons: Record<InsightType, LucideIcon> = {
  opportunity: Radar, recommendation: Compass, warning: AlertTriangle, anomaly: Activity, decision: Scale,
};

/* ————— Identité de navigation (approche mesurée) —————
   On garde Lucide pour l'utilitaire. Les concepts majeurs du Data OS
   partagent UN traitement : même grille, même graisse de trait (1.6),
   micro-animation d'accent champagne sur l'item actif. Simplicité. */
export function ConceptGlyph({ icon: Icon, active = false, size = 15, className }: {
  icon: LucideIcon; active?: boolean; size?: number; className?: string;
}) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center transition-colors duration-200",
        active ? "text-champagne-300" : "text-current",
        className,
      )}
      aria-hidden="true"
    >
      <Icon size={size} strokeWidth={1.6} />
      {active && <span className="pulse-dot absolute -right-[3px] -top-[3px] h-[3px] w-[3px] rounded-full bg-champagne-400" />}
    </span>
  );
}
