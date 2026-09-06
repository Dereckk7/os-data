/**
 * CommandPalette — recherche globale ⌘K.
 * Recherche floue, pilule active en spring, panneau sur ressort,
 * navigation clavier complète, a11y combobox/listbox.
 */
import {
  useCallback, useEffect, useId, useMemo, useRef, useState,
  type KeyboardEvent as ReactKeyboardEvent, type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Search, type LucideIcon } from "lucide-react";
import { cn } from "../lib/services";

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export type CommandItem = {
  id: string;
  label: string;
  group?: string;
  hint?: string;
  keywords?: string[];
  icon?: LucideIcon;
  badge?: ReactNode;
  onSelect: () => void;
};

export interface CommandPaletteProps {
  items: CommandItem[];
  shortcut?: string;
  placeholder?: string;
  emptyMessage?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function fuzzyMatch(needle: string, hay: string) {
  if (!needle) return true;
  needle = needle.toLowerCase();
  hay = hay.toLowerCase();
  let i = 0;
  for (const ch of hay) {
    if (ch === needle[i]) i++;
    if (i === needle.length) return true;
  }
  return false;
}

const PANEL_SPRING = { type: "spring" as const, stiffness: 560, damping: 40, mass: 0.5 };

export function CommandPalette({
  items,
  shortcut = "k",
  placeholder = "Rechercher une commande…",
  emptyMessage = "Aucun résultat.",
  open: controlledOpen,
  onOpenChange,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : internalOpen;

  const setOpen = useCallback((value: boolean) => {
    if (!controlled) setInternalOpen(value);
    onOpenChange?.(value);
  }, [controlled, onOpenChange]);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const uid = useId();
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const updateQuery = useCallback((value: string) => { setQuery(value); setActive(0); }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === shortcut.toLowerCase()) {
        event.preventDefault();
        setOpen(!open);
        return;
      }
      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, shortcut, setOpen]);

  useEffect(() => {
    if (!open) return;
    updateQuery("");
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, updateQuery]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return items;
    return items.filter((item) => {
      const haystacks = [item.label, item.group ?? "", ...(item.keywords ?? [])];
      return haystacks.some((haystack) => fuzzyMatch(query, haystack));
    });
  }, [items, query]);

  const hasIcons = useMemo(() => items.some((item) => item.icon), [items]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((item) => {
      const group = item.group ?? "Résultats";
      const groupItems = map.get(group) ?? [];
      groupItems.push(item);
      map.set(group, groupItems);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((v) => Math.min(filtered.length - 1, v + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((v) => Math.max(0, v - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = filtered[active];
      if (item) { item.onSelect(); setOpen(false); }
    }
  };

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  let cursor = 0;
  if (!mounted) return null;

  return createPortal(
    <div aria-hidden={!open} className={cn("fixed inset-0 z-[100]", open ? "pointer-events-auto" : "pointer-events-none")}>
      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: open ? 0.18 : 0.12, ease: EASE_OUT }}
        onClick={() => setOpen(false)}
        className={cn(
          "absolute inset-0 bg-ink-950/40 [backdrop-filter:blur(12px)_saturate(140%)] [-webkit-backdrop-filter:blur(12px)_saturate(140%)]",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      />

      <div className="pointer-events-none absolute inset-0 flex items-start justify-center p-4 pt-[18vh]">
        <motion.div
          role="dialog" aria-modal="true" aria-label="Palette de commandes"
          initial={false}
          animate={{ opacity: open ? 1 : 0, y: open || reduce ? 0 : -8, scale: open || reduce ? 1 : 0.97 }}
          transition={reduce ? { duration: 0.1 } : open ? PANEL_SPRING : { duration: 0.12, ease: EASE_OUT }}
          onKeyDown={onKeyDown}
          className={cn(
            "glass-raised liquid w-full max-w-xl overflow-hidden rounded-2xl will-change-transform",
            open ? "pointer-events-auto" : "pointer-events-none"
          )}
        >
          <div className="flex items-center gap-3 border-b border-[var(--hairline)] px-4">
            <Search className="h-4 w-4 text-cream/60" strokeWidth={1.75} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => updateQuery(e.target.value)}
              placeholder={placeholder}
              tabIndex={open ? 0 : -1}
              role="combobox"
              aria-expanded={open}
              aria-controls={`${uid}-list`}
              aria-activedescendant={filtered.length > 0 ? `${uid}-opt-${active}` : undefined}
              aria-autocomplete="list"
              className="h-12 flex-1 bg-transparent text-sm text-cream placeholder:text-cream/56 outline-none"
            />
            <span className="kbd hidden sm:inline-block">ESC</span>
          </div>

          <div ref={listRef} id={`${uid}-list`} role="listbox" aria-label="Commandes" className="max-h-[60vh] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-cream/62">{emptyMessage}</div>
            ) : (
              grouped.map(([group, list]) => (
                <div key={group} className="mb-1 last:mb-0">
                  <div aria-hidden className="card-eyebrow px-2 py-1.5">{group}</div>
                  {list.map((item) => {
                    const idx = cursor++;
                    const isActive = idx === active;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        id={`${uid}-opt-${idx}`}
                        role="option"
                        aria-selected={isActive}
                        data-index={idx}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => { item.onSelect(); setOpen(false); }}
                        tabIndex={open ? 0 : -1}
                        className={cn(
                          "relative isolate flex w-full items-center gap-3 rounded-[8px] px-2 py-2 text-left text-sm transition-colors",
                          isActive ? "text-cream" : "text-cream/55"
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId={`${uid}-active`}
                            className="absolute inset-0 z-0 rounded-[8px] bg-champagne-500/[0.12]"
                            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 38 }}
                          />
                        )}
                        {Icon ? <Icon className="relative z-10 h-4 w-4" strokeWidth={1.6} /> : hasIcons ? <span className="relative z-10 h-4 w-4" /> : null}
                        <span className="relative z-10 flex-1 truncate">{item.label}</span>
                        {item.badge ? <span className="relative z-10 shrink-0">{item.badge}</span> : null}
                        {item.hint ? <span className="num relative z-10 hidden text-[10px] text-cream/56 sm:block">{item.hint}</span> : null}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>,
    document.body
  );
}
