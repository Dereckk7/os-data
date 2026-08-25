/**
 * Système Liquid Glass DATA OS — matériau premium, utilisé avec retenue.
 * L'éclairage réactif au curseur est branché sur le tracker global
 * (lib/cursor) : un seul listener, zéro lecture de layout par frame.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';

import { registerGlass } from '../lib/cursor';
import { cn } from '../lib/services';
import type { Tone } from '../lib/types';

/** Branche une surface sur l'éclairage curseur global. */
export function useGlassLight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return registerGlass(el);
  }, []);
  return ref;
}

/* ————— Surfaces ————— */
export function GlassSurface({
  className,
  sweep,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { sweep?: boolean }) {
  const lightRef = useGlassLight<HTMLDivElement>();
  return (
    <div ref={lightRef} className={cn('glass', sweep && 'glass-sweep', className)} {...rest}>
      {children}
    </div>
  );
}

export function GlassCard({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const lightRef = useGlassLight<HTMLDivElement>();
  return (
    <div ref={lightRef} className={cn('glass glass-sweep', className)} {...rest}>
      {children}
    </div>
  );
}

/* ————— Boutons ————— */
type ButtonVariant = 'primary' | 'gold' | 'ghost' | 'soft' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const btnVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-cream text-ink-950 hover:bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_18px_rgba(0,0,0,0.18)]',
  gold: 'bg-champagne-500/10 text-champagne-300 border border-champagne-500/25 hover:bg-champagne-500/[0.17] hover:border-champagne-500/40',
  ghost:
    'border border-white/[0.08] text-cream/85 bg-transparent hover:bg-white/[0.045] hover:text-cream hover:border-white/[0.14]',
  soft: 'bg-white/[0.05] text-cream/85 hover:bg-white/[0.085] hover:text-cream',
  danger:
    'bg-ember/10 text-[#e28d85] border border-ember/25 hover:bg-ember/[0.17] hover:border-ember/40',
};
const btnSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-[9px] gap-1.5',
  md: 'h-10 px-4 text-[13px] rounded-[11px] gap-2',
  lg: 'h-11 px-5 text-sm rounded-[12px] gap-2',
};

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  full?: boolean;
}

export function GlassButton({
  variant = 'ghost',
  size = 'md',
  loading = false,
  iconLeft,
  full,
  className,
  children,
  disabled,
  ...rest
}: GlassButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
        btnVariants[variant],
        btnSizes[size],
        full && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Loader2 size={15} strokeWidth={1.75} className="animate-spin" aria-hidden />
      ) : (
        iconLeft
      )}
      {children}
    </button>
  );
}

/* ————— Panneau section ————— */
export function GlassPanel({
  eyebrow,
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  eyebrow?: string;
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <GlassSurface className={cn('p-5 sm:p-6', className)}>
      {(eyebrow || title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {eyebrow && <p className="card-eyebrow mb-1.5">{eyebrow}</p>}
            {title && <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </GlassSurface>
  );
}

/* ————— Champs ————— */
export function GlassInput({
  label,
  icon,
  right,
  error,
  className,
  id,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  icon?: ReactNode;
  right?: ReactNode;
  error?: string;
}) {
  const inputId = id ?? `in-${label?.replace(/\s+/g, '-').toLowerCase() ?? 'field'}`;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-cream/65">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex h-10 items-center gap-2 rounded-[11px] border bg-white/[0.03] px-3 transition-all duration-200 focus-within:border-cream/35 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-cream)_9%,transparent)]',
          error ? 'border-ember/45' : 'border-white/[0.08] hover:border-white/[0.14]'
        )}
      >
        {icon && <span className="text-cream/35">{icon}</span>}
        <input
          id={inputId}
          className="h-full w-full bg-transparent text-[13px] text-cream outline-none placeholder:text-cream/30"
          {...rest}
        />
        {right}
      </div>
      {error && <p className="mt-1.5 text-[11px] text-[#e28d85]">{error}</p>}
    </div>
  );
}

export function GlassSelect({
  label,
  value,
  onChange,
  options,
  className,
  id,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  id?: string;
}) {
  const selectId = id ?? `sel-${label?.replace(/\s+/g, '-').toLowerCase() ?? 'field'}`;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-xs font-medium text-cream/65">
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full cursor-pointer appearance-none rounded-[11px] border border-white/[0.08] bg-ink-800 px-3 text-[13px] text-cream outline-none transition-colors hover:border-white/[0.14] focus:border-cream/35"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-800">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ————— Badges ————— */
const badgeTones: Record<Tone, string> = {
  neutral: 'bg-white/[0.05] text-cream/60 border-white/[0.08]',
  gold: 'bg-champagne-500/[0.09] text-champagne-300 border-champagne-500/22',
  success: 'bg-jade/[0.09] text-jade border-jade/25',
  warning: 'bg-saffron/[0.09] text-saffron border-saffron/25',
  danger: 'bg-ember/[0.09] text-[#e28d85] border-ember/28',
};

export function GlassBadge({
  tone = 'neutral',
  dot,
  pulse,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[10.5px] font-medium tracking-wide whitespace-nowrap',
        badgeTones[tone],
        className
      )}
    >
      {dot && (
        <span
          className={cn('h-[5px] w-[5px] rounded-full bg-current', pulse && 'pulse-dot')}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}

/* ————— Conteneur d'icône ————— */
export function IconContainer({
  children,
  size = 'md',
  className,
}: {
  children: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-[10px] border border-white/[0.08] bg-ink-950/55 text-cream/70 transition-all duration-300 group-hover:border-white/20 group-hover:text-cream',
        size === 'md' ? 'h-9 w-9' : 'h-8 w-8',
        className
      )}
    >
      {children}
    </span>
  );
}

/* ————— Modale ————— */
export function GlassModal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const panelRef = useGlassLight<HTMLDivElement>();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : 'Fenêtre de dialogue'}
        >
          <motion.button
            aria-label="Fermer la fenêtre"
            className="absolute inset-0 cursor-default bg-ink-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 18, scale: 0.98, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 10, scale: 0.985, filter: 'blur(4px)' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'glass-raised liquid relative flex max-h-[86vh] w-full flex-col overflow-hidden',
              wide ? 'max-w-2xl' : 'max-w-md'
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
              <div>
                {eyebrow && <p className="card-eyebrow mb-1">{eyebrow}</p>}
                {title && <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>}
              </div>
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] text-cream/45 transition-colors hover:bg-white/[0.06] hover:text-cream"
              >
                <X size={15} strokeWidth={1.75} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-5 py-3.5 sm:px-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
