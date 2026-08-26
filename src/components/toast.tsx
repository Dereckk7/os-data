/**
 * Notifications DATA OS — API impérative type Sonner.
 * toast("Titre", { description, action, tone }) · toast.success(...)
 * Pause au survol · auto-dismiss · empilement propre.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, Sparkles, X } from "lucide-react";
import { cn } from "../lib/services";
import type { Tone } from "../lib/types";

export interface ToastOptions {
  description?: string; tone?: Tone; duration?: number;
  action?: { label: string; onClick: () => void };
}
interface ToastItem extends ToastOptions { id: string; title: string; remaining: number; }

let pushExternal: ((title: string, opts?: ToastOptions) => string) | null = null;
let dismissExternal: ((id: string) => void) | null = null;

function createToast(title: string, opts: ToastOptions = {}): string {
  if (pushExternal) return pushExternal(title, opts);
  return "";
}

export const toast = Object.assign(createToast, {
  success: (title: string, opts?: ToastOptions) => createToast(title, { ...opts, tone: "success" }),
  danger: (title: string, opts?: ToastOptions) => createToast(title, { ...opts, tone: "danger" }),
  warning: (title: string, opts?: ToastOptions) => createToast(title, { ...opts, tone: "warning" }),
  gold: (title: string, opts?: ToastOptions) => createToast(title, { ...opts, tone: "gold" }),
  neutral: (title: string, opts?: ToastOptions) => createToast(title, { ...opts, tone: "neutral" }),
  dismiss: (id: string) => dismissExternal?.(id),
});

/** Compatibilité ancien usage `const toast = useToast()`. */
export function useToast() {
  return { push: (tone: Tone, title: string, desc?: string) => createToast(title, { tone, description: desc }) };
}

const toneStyles: Record<Tone, { cls: string; icon: ReactNode }> = {
  success: { cls: "text-jade", icon: <CheckCircle2 size={16} strokeWidth={1.75} /> },
  danger: { cls: "text-ember", icon: <AlertTriangle size={16} strokeWidth={1.75} /> },
  warning: { cls: "text-saffron", icon: <AlertTriangle size={16} strokeWidth={1.75} /> },
  gold: { cls: "text-champagne-300", icon: <Sparkles size={16} strokeWidth={1.75} /> },
  neutral: { cls: "text-cream/60", icon: <Info size={16} strokeWidth={1.75} /> },
};

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const tone = item.tone ?? "neutral";
  const timer = useRef<number | null>(null);
  const startedAt = useRef(Date.now());

  const startTimer = useCallback(() => {
    startedAt.current = Date.now();
    timer.current = window.setTimeout(onClose, item.remaining);
  }, [item.remaining, onClose]);

  const stopTimer = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    item.remaining -= Date.now() - startedAt.current;
  }, [item]);

  useEffect(() => {
    startTimer();
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [startTimer]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={stopTimer}
      onMouseLeave={startTimer}
      className="glass-raised liquid pointer-events-auto w-full max-w-sm overflow-hidden rounded-[14px]"
      role="status"
    >
      <div className="flex items-start gap-3 p-3.5">
        <span className={cn("mt-[1px] shrink-0", toneStyles[tone].cls)}>{toneStyles[tone].icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium leading-snug">{item.title}</p>
          {item.description && <p className="mt-0.5 text-xs leading-relaxed text-cream/50">{item.description}</p>}
          {item.action && (
            <button
              onClick={() => { item.action?.onClick(); onClose(); }}
              className="mt-2.5 inline-flex h-7 items-center rounded-[8px] border border-white/[0.1] bg-white/[0.04] px-2.5 text-[11px] font-semibold text-cream/85 transition-all duration-150 hover:border-white/20 hover:bg-white/[0.08]"
            >
              {item.action.label}
            </button>
          )}
        </div>
        <button
          onClick={onClose} aria-label="Fermer la notification"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] text-cream/40 transition-colors hover:bg-white/[0.06] hover:text-cream"
        >
          <X size={13} strokeWidth={1.75} />
        </button>
      </div>
    </motion.div>
  );
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  pushExternal = (title, opts = {}) => {
    const id = `t${++idRef.current}`;
    setItems((prev) => [...prev.slice(-3), { id, title, remaining: opts.duration ?? 4600, ...opts }]);
    return id;
  };
  dismissExternal = remove;

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-[calc(72px+env(safe-area-inset-bottom))] z-[110] flex flex-col items-end gap-2 sm:inset-x-auto sm:bottom-5 sm:right-5"
    >
      <AnimatePresence>
        {items.map((t) => <ToastCard key={t.id} item={t} onClose={() => remove(t.id)} />)}
      </AnimatePresence>
    </div>,
    document.body
  );
}
