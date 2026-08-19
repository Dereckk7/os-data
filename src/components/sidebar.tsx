/**
 * Système de sidebar DATA OS — rail repliable en icônes (desktop),
 * sheet mobile, groupes, menus, tooltips. État persisté.
 */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, PanelLeft, X } from "lucide-react";
import { cn } from "../lib/services";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

const COLLAPSED_KEY = "dataos.sidebar.collapsed.v1";

interface SidebarContextValue {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar doit être utilisé dans <SidebarProvider>");
  return ctx;
}

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [breakpoint]);
  return isMobile;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) !== "1"; } catch { return true; }
  });
  const [openMobile, setOpenMobile] = useState(false);
  const isMobile = useIsMobile();

  const setOpen = useCallback((value: boolean) => {
    setOpenState(value);
    try { localStorage.setItem(COLLAPSED_KEY, value ? "0" : "1"); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (!openMobile) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenMobile(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openMobile]);

  const value = useMemo(
    () => ({
      state: open ? ("expanded" as const) : ("collapsed" as const),
      open, setOpen, isMobile, openMobile, setOpenMobile,
    }),
    [open, setOpen, isMobile, openMobile]
  );

  return (
    <SidebarContext.Provider value={value}>
      <TooltipProvider delayDuration={200}>
        <div data-state={value.state} className="group/sidebar-wrapper flex min-h-screen w-full">
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ children, collapsible = "icon" }: { children: ReactNode; collapsible?: "icon" | "none" }) {
  const { state, open, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar();

  if (isMobile) {
    return (
      <AnimatePresence>
        {openMobile && (
          <>
            <motion.div
              key="sheet-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-ink-950/70 backdrop-blur-sm"
              onClick={() => setOpenMobile(false)}
              aria-hidden="true"
            />
            <motion.div
              key="sheet"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-[75] flex w-[17.5rem] max-w-[85vw] flex-col border-r border-[color-mix(in_srgb,var(--color-cream)_10%,transparent)] bg-ink-900/95 backdrop-blur-2xl"
              role="dialog" aria-modal="true" aria-label="Menu"
            >
              <button
                onClick={() => setOpenMobile(false)} aria-label="Fermer le menu"
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-[9px] text-cream/50 hover:bg-white/[0.06] hover:text-cream"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <aside
      data-state={state}
      data-collapsible={collapsible}
      className={cn(
        "group/sidebar sticky top-0 z-40 hidden h-screen flex-col border-r border-[color-mix(in_srgb,var(--color-cream)_9%,transparent)] bg-ink-950/60 backdrop-blur-2xl transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex",
        state === "expanded" ? "w-[248px]" : "w-[68px]"
      )}
    >
      {children}
      <SidebarRail onToggle={() => setOpen(!open)} collapsed={state === "collapsed"} />
    </aside>
  );
}

function SidebarRail({ onToggle, collapsed }: { onToggle: () => void; collapsed: boolean }) {
  return (
    <button
      onClick={onToggle}
      aria-label={collapsed ? "Déplier la barre latérale" : "Replier la barre latérale"}
      className="absolute -right-3 top-16 z-50 grid h-6 w-6 place-items-center rounded-full border border-white/[0.1] bg-ink-800 text-cream/55 shadow-md transition-all duration-200 hover:border-white/[0.2] hover:text-cream"
    >
      {collapsed ? <ChevronsRight size={12} strokeWidth={1.75} /> : <ChevronsLeft size={12} strokeWidth={1.75} />}
    </button>
  );
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { isMobile, setOpenMobile, open, setOpen } = useSidebar();
  return (
    <button
      onClick={() => (isMobile ? setOpenMobile(true) : setOpen(!open))}
      aria-label="Basculer la barre latérale"
      className={cn(
        "grid h-9 w-9 place-items-center rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-cream/60 transition-all duration-200 hover:border-white/[0.16] hover:text-cream active:scale-95",
        className
      )}
    >
      <PanelLeft size={16} strokeWidth={1.6} />
    </button>
  );
}

export function SidebarInset({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-1 flex-col">{children}</div>;
}

export function SidebarHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-2 p-3", className)}>{children}</div>;
}

export function SidebarContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex-1 overflow-y-auto overflow-x-hidden px-3", className)}>{children}</div>;
}

export function SidebarFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mt-auto flex flex-col gap-2 border-t border-[color-mix(in_srgb,var(--color-cream)_8%,transparent)] p-3", className)}>
      {children}
    </div>
  );
}

export function SidebarGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-2", className)}>{children}</div>;
}

export function SidebarGroupLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("card-eyebrow mb-1 px-2.5 pt-2 group-data-[state=collapsed]/sidebar:hidden", className)}>
      {children}
    </p>
  );
}

export function SidebarMenu({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn("flex flex-col gap-0.5", className)}>{children}</ul>;
}

export function SidebarMenuItem({ children, className }: { children: ReactNode; className?: string }) {
  return <li className={cn("group/menu-item relative", className)}>{children}</li>;
}

interface MenuButtonProps {
  children: ReactNode;
  className?: string;
  tooltip?: string;
  isActive?: boolean;
  onClick?: () => void;
  href?: string;
  size?: "default" | "lg";
  [key: string]: unknown;
}

export function SidebarMenuButton({ children, className, tooltip, isActive, onClick, href, size = "default", ...rest }: MenuButtonProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const showTooltip = !isMobile && state === "collapsed" && !!tooltip;
  const Comp = href ? "a" : "button";

  const inner = (
    <Comp
      href={href}
      onClick={() => { onClick?.(); if (isMobile) setOpenMobile(false); }}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "peer flex w-full items-center gap-2.5 overflow-hidden rounded-[10px] text-left font-medium transition-all duration-200",
        size === "default" ? "h-9 px-2.5 text-[13px]" : "h-11 px-2.5 text-sm",
        isActive
          ? "bg-champagne-500/[0.1] text-cream shadow-[inset_0_0_0_1px_rgba(201,178,124,0.18)]"
          : "text-cream/55 hover:bg-white/[0.045] hover:text-cream",
        className
      )}
      {...rest}
    >
      {children}
    </Comp>
  );

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right">{tooltip}</TooltipContent>
      </Tooltip>
    );
  }
  return inner;
}

export function SidebarMenuAction({ children, className, showOnHover, onClick, label }: {
  children: ReactNode; className?: string; showOnHover?: boolean; onClick?: () => void; label?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label ?? "Actions"}
      className={cn(
        "absolute right-1.5 top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[8px] text-cream/45 transition-all hover:bg-white/[0.07] hover:text-cream",
        showOnHover && "opacity-0 focus:opacity-100 group-hover/menu-item:opacity-100",
        className
      )}
    >
      {children}
    </button>
  );
}

export function SidebarMenuBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "num ml-auto shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-px text-[9px] font-semibold text-cream/55 group-data-[state=collapsed]/sidebar:hidden",
        className
      )}
    >
      {children}
    </span>
  );
}

export function SidebarMenuSub({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul className={cn("ml-[1.15rem] flex flex-col gap-0.5 border-l border-white/[0.07] pl-2.5 group-data-[state=collapsed]/sidebar:hidden", className)}>
      {children}
    </ul>
  );
}

export function SidebarMenuSubItem({ children, className }: { children: ReactNode; className?: string }) {
  return <li className={cn("relative", className)}>{children}</li>;
}

export function SidebarMenuSubButton({ children, className, isActive, onClick, href }: {
  children: ReactNode; className?: string; isActive?: boolean; onClick?: () => void; href?: string;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const Comp = href ? "a" : "button";
  return (
    <Comp
      href={href}
      onClick={() => { onClick?.(); if (isMobile) setOpenMobile(false); }}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded-[8px] px-2 text-[12.5px] transition-all duration-200",
        isActive ? "bg-white/[0.05] font-semibold text-cream" : "text-cream/50 hover:bg-white/[0.035] hover:text-cream/85",
        className
      )}
    >
      {children}
    </Comp>
  );
}
