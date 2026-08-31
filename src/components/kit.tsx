/**
 * ════════════════════════════════════════════════════════════════════════
 *  DATA OS — LIBRAIRIE LUMINOUS DEPTH (kit)
 *  Composants réutilisables bâtis exclusivement sur les tokens du Lot 1
 *  (surfaces, champagne, sémantiques désaturées, rayons 6/10/14, motion).
 *  Aucune valeur arbitraire : tout passe par les variables/utilitaires.
 *  Tous partagent rayons, espacements, material, typo et comportements.
 *
 *  Cette librairie est ADDITIVE : elle ne remplace pas les composants
 *  existants (glass/ui/insight/…), elle fournit le système canonique que
 *  les pages adopteront dans les lots suivants. Rien ici n'importe ni ne
 *  modifie la couche données.
 * ════════════════════════════════════════════════════════════════════════
 */
import {
  useEffect, useId, useState,
  type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactElement, type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as RTooltip from "@radix-ui/react-tooltip";
import * as RDropdown from "@radix-ui/react-dropdown-menu";
import {
  AlertTriangle, Check, CheckCircle2, ChevronDown, Info, Loader2, Search as SearchIcon, X,
} from "lucide-react";
import { cn } from "../lib/services";
import type { Tone } from "../lib/types";

/* ————————————————————————————————————————————————————————————————
   Tonalités partagées — sobres, désaturées, champagne comme seul accent.
   ———————————————————————————————————————————————————————————————— */
const toneText: Record<Tone, string> = {
  neutral: "text-cream/62",
  gold: "text-champagne-300",
  success: "text-jade",
  warning: "text-saffron",
  danger: "text-ember",
};
const toneWash: Record<Tone, string> = {
  neutral: "bg-[color-mix(in_srgb,var(--color-cream)_5%,transparent)]",
  gold: "bg-[color-mix(in_srgb,var(--color-champagne-500)_10%,transparent)]",
  success: "bg-[color-mix(in_srgb,var(--color-jade)_11%,transparent)]",
  warning: "bg-[color-mix(in_srgb,var(--color-saffron)_11%,transparent)]",
  danger: "bg-[color-mix(in_srgb,var(--color-ember)_11%,transparent)]",
};
const toneBar: Record<Tone, string> = {
  neutral: "bg-cream/35",
  gold: "bg-champagne-500/75",
  success: "bg-jade/75",
  warning: "bg-saffron/75",
  danger: "bg-ember/75",
};

/* ════════════════════════════ BUTTON ════════════════════════════ */
type ButtonVariant = "primary" | "secondary" | "ghost" | "gold" | "danger";
type ControlSize = "sm" | "md" | "lg";

const buttonVariant: Record<ButtonVariant, string> = {
  /* 80% — neutre haute lisibilité (l'action « par défaut » du produit). */
  primary: "bg-cream text-ink-950 hover:brightness-105 shadow-[var(--shadow-1)]",
  secondary: "bg-[var(--surface-2)] text-cream/85 hover:text-cream shadow-[var(--shadow-1),var(--highlight-top)]",
  ghost: "text-cream/80 hover:text-cream hover:bg-[var(--row-hover)]",
  /* 5% — champagne, réservé aux actions critiques/validées (parcimonie). */
  gold: "text-champagne-300 bg-[color-mix(in_srgb,var(--color-champagne-500)_12%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-champagne-500)_18%,transparent)]",
  danger: "text-ember bg-[color-mix(in_srgb,var(--color-ember)_12%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-ember)_18%,transparent)]",
};
const controlSize: Record<ControlSize, string> = {
  sm: "h-8 px-3 text-xs rounded-xs gap-1.5",
  md: "h-10 px-4 text-[13px] rounded-sm gap-2",
  lg: "h-11 px-5 text-sm rounded-sm gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ControlSize;
  loading?: boolean;
  icon?: ReactNode;
  full?: boolean;
}
export function Button({
  variant = "secondary", size = "md", loading = false, icon, full, className, children, disabled, ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-[510] transition-[background-color,color,transform,filter] duration-200 ease-[var(--ease-standard)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
        buttonVariant[variant], controlSize[size], full && "w-full", className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={15} strokeWidth={1.75} className="animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

/* ════════════════════════════ ICON BUTTON ════════════════════════════ */
const iconButtonSize: Record<ControlSize, string> = {
  sm: "h-8 w-8 rounded-xs [&_svg]:size-4",
  md: "h-9 w-9 rounded-sm [&_svg]:size-[18px]",
  lg: "h-11 w-11 rounded-sm [&_svg]:size-5",
};
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ControlSize;
  variant?: "ghost" | "secondary";
  label: string;
}
export function IconButton({ size = "md", variant = "ghost", label, className, children, ...rest }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        "grid shrink-0 place-items-center text-cream/65 transition-[background-color,color] duration-200 ease-[var(--ease-standard)] hover:text-cream active:scale-95 disabled:pointer-events-none disabled:opacity-45",
        variant === "secondary" ? "bg-[var(--surface-2)] shadow-[var(--shadow-1),var(--highlight-top)]" : "hover:bg-[var(--row-hover)]",
        iconButtonSize[size], className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ════════════════════════════ INPUT / SEARCH ════════════════════════════ */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  right?: ReactNode;
  error?: string;
  hint?: string;
}
export function Input({ label, icon, right, error, hint, className, id, ...rest }: InputProps) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="mb-1.5 block text-xs font-[510] text-cream/65">{label}</label>}
      <div
        className={cn(
          "flex h-10 items-center gap-2 rounded-sm bg-[var(--surface-2)] px-3 shadow-[var(--highlight-top)] ring-1 transition-[box-shadow] duration-200 ease-[var(--ease-standard)] focus-within:ring-2",
          error
            ? "ring-[color-mix(in_srgb,var(--color-ember)_55%,transparent)]"
            : "ring-[var(--hairline)] focus-within:ring-[color-mix(in_srgb,var(--color-champagne-500)_50%,transparent)]",
        )}
      >
        {icon && <span className="shrink-0 text-cream/56">{icon}</span>}
        <input id={inputId} className="h-full w-full bg-transparent text-[13px] text-cream outline-none placeholder:text-cream/52" {...rest} />
        {right}
      </div>
      {error
        ? <p className="mt-1.5 text-[11px] text-ember">{error}</p>
        : hint ? <p className="mt-1.5 text-[11px] text-cream/60">{hint}</p> : null}
    </div>
  );
}

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onValueChange: (v: string) => void;
  onClear?: () => void;
}
export function SearchInput({ value, onValueChange, onClear, placeholder = "Rechercher…", className, ...rest }: SearchInputProps) {
  return (
    <div className={cn("flex h-9 items-center gap-2 rounded-sm bg-[var(--surface-2)] px-3 shadow-[var(--highlight-top)] ring-1 ring-[var(--hairline)] transition-[box-shadow] duration-200 ease-[var(--ease-standard)] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--color-champagne-500)_45%,transparent)]", className)}>
      <SearchIcon size={15} strokeWidth={1.75} className="shrink-0 text-cream/56" />
      <input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className="h-full w-full bg-transparent text-[13px] text-cream outline-none placeholder:text-cream/52"
        {...rest}
      />
      {value && (
        <button
          type="button" aria-label="Effacer"
          onClick={() => { onValueChange(""); onClear?.(); }}
          className="grid h-5 w-5 shrink-0 place-items-center rounded-xs text-cream/60 transition-colors hover:bg-[var(--row-hover)] hover:text-cream"
        >
          <X size={13} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════ SELECT ════════════════════════════ */
export interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  id?: string;
}
export function Select({ label, value, onChange, options, className, id }: SelectProps) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <div className={className}>
      {label && <label htmlFor={selectId} className="mb-1.5 block text-xs font-[510] text-cream/65">{label}</label>}
      <div className="relative">
        <select
          id={selectId} value={value} onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full cursor-pointer appearance-none rounded-sm bg-[var(--surface-2)] px-3 pr-9 text-[13px] text-cream shadow-[var(--highlight-top)] outline-none ring-1 ring-[var(--hairline)] transition-[box-shadow] duration-200 focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-champagne-500)_45%,transparent)]"
        >
          {options.map((o) => <option key={o.value} value={o.value} style={{ background: "var(--surface-3)" }}>{o.label}</option>)}
        </select>
        <ChevronDown size={15} strokeWidth={1.75} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cream/60" />
      </div>
    </div>
  );
}

/* ════════════════════════════ CHECKBOX / SWITCH ════════════════════════════ */
export function Checkbox({ checked, onChange, label, className }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string; className?: string;
}) {
  return (
    <button
      type="button" role="checkbox" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] ring-1 transition-[background-color,box-shadow] duration-200 ease-[var(--ease-standard)]",
        checked
          ? "bg-champagne-500 text-ink-950 ring-[color-mix(in_srgb,var(--color-champagne-500)_60%,transparent)]"
          : "bg-[var(--surface-2)] ring-[var(--hairline-strong)] hover:ring-[var(--hairline-strong)]",
        className,
      )}
    >
      {checked && <Check size={12} strokeWidth={3} />}
    </button>
  );
}

export function Switch({ checked, onChange, label, className }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string; className?: string;
}) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[22px] w-10 shrink-0 rounded-full ring-1 transition-colors duration-300 ease-[var(--ease-standard)]",
        checked
          ? "bg-[color-mix(in_srgb,var(--color-champagne-500)_38%,transparent)] ring-[color-mix(in_srgb,var(--color-champagne-500)_45%,transparent)]"
          : "bg-[var(--surface-3)] ring-[var(--hairline-strong)]",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-[16px] w-[16px] -translate-y-1/2 rounded-full transition-transform duration-300 ease-[var(--ease-standard)]",
          checked ? "translate-x-[21px] bg-champagne-300" : "translate-x-[3px] bg-cream/50",
        )}
      />
    </button>
  );
}

/* ════════════════════════════ BADGE / STATUS PILL ════════════════════════════ */
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[10.5px] font-[510] tracking-wide whitespace-nowrap", toneWash[tone], toneText[tone], className)}>
      {children}
    </span>
  );
}

export function StatusPill({ tone = "neutral", pulse, children, className }: {
  tone?: Tone; pulse?: boolean; children: ReactNode; className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[10.5px] font-[510] tracking-wide whitespace-nowrap", toneWash[tone], toneText[tone], className)}>
      <span className={cn("h-[5px] w-[5px] rounded-full bg-current", pulse && "pulse-dot")} aria-hidden />
      {children}
    </span>
  );
}

/* ════════════════════════════ TOOLTIP ════════════════════════════ */
export function Tooltip({ label, side = "top", children }: {
  label: ReactNode; side?: "top" | "right" | "bottom" | "left"; children: ReactElement;
}) {
  return (
    <RTooltip.Provider delayDuration={200} skipDelayDuration={300}>
      <RTooltip.Root>
        <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
        <RTooltip.Portal>
          <RTooltip.Content
            side={side} sideOffset={6}
            className="z-[120] max-w-xs rounded-xs bg-[var(--surface-4)] px-2.5 py-1.5 text-[11.5px] font-[510] text-cream shadow-[var(--shadow-3)] ring-1 ring-[var(--hairline)] data-[state=delayed-open]:animate-menu-in"
          >
            {label}
            <RTooltip.Arrow className="fill-[var(--surface-4)]" />
          </RTooltip.Content>
        </RTooltip.Portal>
      </RTooltip.Root>
    </RTooltip.Provider>
  );
}

/* ════════════════════════════ DROPDOWN ════════════════════════════ */
export function Dropdown({ trigger, children, align = "end" }: {
  trigger: ReactElement; children: ReactNode; align?: "start" | "center" | "end";
}) {
  return (
    <RDropdown.Root>
      <RDropdown.Trigger asChild>{trigger}</RDropdown.Trigger>
      <RDropdown.Portal>
        <RDropdown.Content
          align={align} sideOffset={6}
          className="z-[120] min-w-[180px] origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-sm bg-[var(--surface-3)] p-1.5 shadow-[var(--shadow-3),var(--highlight-top)] ring-1 ring-[var(--hairline)] data-[state=open]:animate-menu-in"
        >
          {children}
        </RDropdown.Content>
      </RDropdown.Portal>
    </RDropdown.Root>
  );
}
export function DropdownItem({ children, onSelect, icon, danger, disabled }: {
  children: ReactNode; onSelect?: () => void; icon?: ReactNode; danger?: boolean; disabled?: boolean;
}) {
  return (
    <RDropdown.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-xs px-2.5 py-2 text-[13px] outline-none transition-colors data-[highlighted]:bg-[var(--row-hover)] data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        danger ? "text-ember" : "text-cream/80 data-[highlighted]:text-cream",
      )}
    >
      {icon && <span className="shrink-0 opacity-80">{icon}</span>}
      {children}
    </RDropdown.Item>
  );
}
export function DropdownSeparator() {
  return <RDropdown.Separator className="my-1 h-px bg-[var(--hairline)]" />;
}

/* ════════════════════════════ DIALOG (focus critique) ════════════════════════════ */
export function Dialog({ open, onClose, title, eyebrow, children, footer, wide }: {
  open: boolean; onClose: () => void; title?: ReactNode; eyebrow?: string;
  children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6" role="dialog" aria-modal="true">
          <motion.button
            aria-label="Fermer" className="absolute inset-0 cursor-default bg-ink-950/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          />
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={cn("surface-4 relative flex max-h-[86vh] w-full flex-col overflow-hidden", wide ? "max-w-2xl" : "max-w-md")}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4 sm:px-6">
              <div>
                {eyebrow && <p className="t-label mb-1">{eyebrow}</p>}
                {title && <h2 className="t-section">{title}</h2>}
              </div>
              <IconButton label="Fermer" size="sm" onClick={onClose}><X size={15} strokeWidth={1.75} /></IconButton>
            </div>
            <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">{children}</div>
            {footer && <div className="flex items-center justify-end gap-2 border-t border-[var(--hairline)] px-5 py-3.5 sm:px-6">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ════════════════════════════ SHEET (panneau latéral) ════════════════════════════
   Le détail se lit dans un panneau latéral léger, jamais une modale lourde. */
export function Sheet({ open, onClose, title, eyebrow, children, footer, width = 440 }: {
  open: boolean; onClose: () => void; title?: ReactNode; eyebrow?: string;
  children: ReactNode; footer?: ReactNode; width?: number;
}) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
          <motion.button
            aria-label="Fermer" className="absolute inset-0 cursor-default bg-ink-950/60"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          />
          <motion.aside
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: `min(${width}px, 100%)` }}
            className="absolute inset-y-0 right-0 flex flex-col bg-[var(--surface-2)] shadow-[var(--shadow-4)] ring-1 ring-[var(--hairline)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
              <div>
                {eyebrow && <p className="t-label mb-1">{eyebrow}</p>}
                {title && <h2 className="t-section">{title}</h2>}
              </div>
              <IconButton label="Fermer" size="sm" onClick={onClose}><X size={15} strokeWidth={1.75} /></IconButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="flex items-center justify-end gap-2 border-t border-[var(--hairline)] px-5 py-3.5">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ════════════════════════════ TABS ════════════════════════════ */
export function Tabs<T extends string>({ options, value, onChange, className }: {
  options: { value: T; label: string; icon?: ReactNode; count?: number }[];
  value: T; onChange: (v: T) => void; className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex items-center gap-1 border-b border-[var(--hairline)]", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value} role="tab" aria-selected={active} onClick={() => onChange(o.value)}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-3 pb-2.5 pt-1 text-[13px] font-[510] transition-colors duration-200",
              active ? "text-cream" : "text-cream/62 hover:text-cream/75",
            )}
          >
            {o.icon}
            {o.label}
            {typeof o.count === "number" && <span className="num text-[11px] text-cream/56">{o.count}</span>}
            {active && (
              <motion.span layoutId="tabs-underline" className="absolute inset-x-1.5 -bottom-px h-[2px] rounded-full bg-champagne-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════ METRIC ════════════════════════════
   Quiet par défaut ; `moment` = les 5% (KPI/découverte majeure). */
export function Metric({ label, value, delta, deltaTone = "neutral", spark, moment, className }: {
  label: string; value: ReactNode; delta?: string; deltaTone?: "up" | "down" | "neutral";
  spark?: ReactNode; moment?: boolean; className?: string;
}) {
  const deltaCls = deltaTone === "up" ? "delta-up" : deltaTone === "down" ? "delta-down" : "delta-neutral";
  return (
    <div
      className={cn(
        moment
          ? "surface-2 relative overflow-hidden p-5 ring-1 ring-[color-mix(in_srgb,var(--color-champagne-500)_22%,transparent)]"
          : "lcard p-4",
        className,
      )}
    >
      {moment && <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-champagne-500)_18%,transparent),transparent_70%)]" aria-hidden />}
      <p className="t-label">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className={cn("num leading-none", moment ? "text-[34px] font-[590] tracking-[-0.022em]" : "text-[22px] font-[590] tracking-[-0.02em]")}>{value}</span>
        {delta && <span className={cn("delta-badge", deltaCls)}>{delta}</span>}
      </div>
      {spark && <div className="mt-3">{spark}</div>}
    </div>
  );
}

/* ════════════════════════════ PROGRESS (barres fines uniquement) ════════════════════════════
   INTERDIT pie/donut. Barre linéaire mince, tonalité champagne par défaut. */
export function Progress({ value, tone = "gold", className, ariaLabel }: {
  value: number; tone?: Tone; className?: string; ariaLabel?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const fill: Record<Tone, string> = {
    neutral: "bg-cream/45", gold: "bg-champagne-500", success: "bg-jade", warning: "bg-saffron", danger: "bg-ember",
  };
  return (
    <div
      role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={ariaLabel}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-[var(--ease-standard)]", fill[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ════════════════════════════ SKELETON (primitives) ════════════════════════════ */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-3" style={{ width: `${100 - i * 12}%` }} />
      ))}
    </div>
  );
}

/* ════════════════════════════ ALERT ════════════════════════════ */
const alertIcon: Record<Tone, ReactNode> = {
  neutral: <Info size={16} strokeWidth={1.75} />,
  gold: <Info size={16} strokeWidth={1.75} />,
  success: <CheckCircle2 size={16} strokeWidth={1.75} />,
  warning: <AlertTriangle size={16} strokeWidth={1.75} />,
  danger: <AlertTriangle size={16} strokeWidth={1.75} />,
};
export function Alert({ tone = "neutral", title, children, className }: {
  tone?: Tone; title?: ReactNode; children?: ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3 rounded-sm p-3.5", toneWash[tone], className)}>
      <span className={cn("mt-px shrink-0", toneText[tone])}>{alertIcon[tone]}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="text-[13px] font-[510] leading-snug">{title}</p>}
        {children && <p className="mt-0.5 text-xs leading-relaxed text-cream/55">{children}</p>}
      </div>
    </div>
  );
}

/* ════════════════════════════ SYSTÈME DE CARTES — 3 FAMILLES ════════════════════════════ */

/* Quiet — métriques/listes/data secondaire : neutre, calme, élévation subtile. */
export function QuietCard({ eyebrow, title, action, children, className, interactive }: {
  eyebrow?: string; title?: ReactNode; action?: ReactNode; children?: ReactNode;
  className?: string; interactive?: boolean;
}) {
  return (
    <section
      className={cn(
        "lcard p-5",
        interactive && "transition-[transform,box-shadow] duration-200 ease-[var(--ease-standard)] hover:-translate-y-px hover:shadow-[var(--shadow-2),var(--highlight-top)]",
        className,
      )}
    >
      {(eyebrow || title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {eyebrow && <p className="t-label mb-1">{eyebrow}</p>}
            {title && <h3 className="t-section">{title}</h3>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/* Insight — anomalies/recos/opportunités : plus expressive, wash subtil, chiffres forts. */
export function InsightCard({ tone = "gold", eyebrow, title, body, metric, metricLabel, action, className }: {
  tone?: Tone; eyebrow?: string; title: ReactNode; body?: ReactNode;
  metric?: ReactNode; metricLabel?: string; action?: ReactNode; className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden rounded-md p-5 shadow-[var(--shadow-1),var(--highlight-top)]", toneWash[tone], className)} role="article">
      <span className={cn("absolute inset-y-4 left-0 w-[2px] rounded-r", toneBar[tone])} aria-hidden />
      <div className="pl-2.5">
        {eyebrow && <p className={cn("mb-2 text-[9.5px] font-[590] uppercase tracking-[0.14em]", toneText[tone])}>{eyebrow}</p>}
        <h3 className="t-section leading-snug">{title}</h3>
        {body && <p className="mt-1.5 text-[13px] leading-relaxed text-cream/55">{body}</p>}
        {metric && (
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="num text-[24px] font-[590] tracking-[-0.02em] text-cream">{metric}</span>
            {metricLabel && <span className="t-label">{metricLabel}</span>}
          </div>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </section>
  );
}

/* Moment — les 5% : le moment visuel fort, réservé aux découvertes majeures. */
export function MomentCard({ eyebrow, title, value, caption, action, className }: {
  eyebrow?: string; title?: ReactNode; value: ReactNode; caption?: ReactNode; action?: ReactNode; className?: string;
}) {
  return (
    <section
      className={cn(
        "surface-2 relative overflow-hidden p-6 ring-1 ring-[color-mix(in_srgb,var(--color-champagne-500)_24%,transparent)]",
        className,
      )}
    >
      <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-champagne-500)_20%,transparent),transparent_68%)]" aria-hidden />
      <div className="relative">
        {eyebrow && <p className="t-label mb-2 text-champagne-300">{eyebrow}</p>}
        {title && <p className="text-[13px] text-cream/60">{title}</p>}
        <p className="num mt-1 text-[40px] font-[590] leading-none tracking-[-0.024em]">{value}</p>
        {caption && <p className="mt-2 text-[13px] leading-relaxed text-cream/55">{caption}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </section>
  );
}

/* ════════════════════════════ TABLE PREMIUM ════════════════════════════
   Header sticky · séparation de lignes subtile (pas de grille tableur) ·
   hover à élévation très subtile · actions contextuelles au hover ·
   sélection élégante · alignement numérique impeccable · détail via Sheet. */
export interface Column<T> {
  key: string;
  header: ReactNode;
  numeric?: boolean;
  width?: string;
  render?: (row: T) => ReactNode;
}
export function DataTable<T extends { id: string }>({
  columns, rows, selectable, selected, onSelectedChange, rowActions, detail, empty, className,
}: {
  columns: Column<T>[];
  rows: T[];
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  rowActions?: (row: T) => ReactNode;
  detail?: (row: T) => { title?: ReactNode; eyebrow?: string; content: ReactNode };
  empty?: ReactNode;
  className?: string;
}) {
  const [openRow, setOpenRow] = useState<T | null>(null);
  const sel = new Set(selected ?? []);
  const allChecked = rows.length > 0 && rows.every((r) => sel.has(r.id));

  const toggleAll = () => onSelectedChange?.(allChecked ? [] : rows.map((r) => r.id));
  const toggleOne = (id: string) => {
    const next = new Set(sel);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectedChange?.([...next]);
  };

  const active = detail && openRow ? detail(openRow) : null;

  return (
    <>
      <div className={cn("overflow-x-auto", className)}>
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[var(--surface-1)]">
              {selectable && (
                <th className="w-10 border-b border-[var(--hairline)] px-3 py-2.5">
                  <Checkbox checked={allChecked} onChange={toggleAll} label="Tout sélectionner" />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.key} style={{ width: c.width }}
                  className={cn("border-b border-[var(--hairline)] px-3 py-2.5 text-[10.5px] font-[590] uppercase tracking-[0.06em] text-[var(--card-title)]", c.numeric && "text-right")}
                >
                  {c.header}
                </th>
              ))}
              {rowActions && <th className="w-12 border-b border-[var(--hairline)] px-3 py-2.5" aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="px-3 py-10 text-center text-[13px] text-cream/62">
                  {empty ?? "Aucune donnée."}
                </td>
              </tr>
            ) : rows.map((row) => {
              const checked = sel.has(row.id);
              return (
                <tr
                  key={row.id}
                  onClick={detail ? () => setOpenRow(row) : undefined}
                  className={cn(
                    "group border-b border-[var(--card-divider)] transition-colors duration-150",
                    checked ? "bg-[color-mix(in_srgb,var(--color-champagne-500)_7%,transparent)]" : "hover:bg-[var(--row-hover)]",
                    detail && "cursor-pointer",
                  )}
                >
                  {selectable && (
                    <td className="px-3 py-2.5 align-middle" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={checked} onChange={() => toggleOne(row.id)} label={`Sélectionner ${row.id}`} />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-3 py-2.5 align-middle text-[13px] text-cream/85", c.numeric && "num text-right tabular-nums")}>
                      {c.render ? c.render(row) : (row as Record<string, unknown>)[c.key] as ReactNode}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-3 py-2.5 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                      <span className="inline-flex opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                        {rowActions(row)}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {detail && (
        <Sheet
          open={openRow !== null}
          onClose={() => setOpenRow(null)}
          title={active?.title}
          eyebrow={active?.eyebrow}
        >
          {active?.content}
        </Sheet>
      )}
    </>
  );
}
