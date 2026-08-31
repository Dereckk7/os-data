/**
 * Coquille applicative DATA OS — sidebar riche (rail repliable,
 * switcher d'organisation, groupes dépliables, agents), header inset,
 * bottom nav mobile, command palette ⌘K, aide, thème.
 */
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity, Bell, Building2, CalendarDays, CheckSquare, ChevronRight, ChevronsUpDown,
  Database, Feather, FileText, HelpCircle, Inbox, LayoutDashboard, LogOut, Menu,
  Monitor, Moon, MoreHorizontal, Pause, Play, Plug, Radar, ScrollText, Search, Settings,
  ShieldCheck, Sparkles, Sun, Users, Workflow,
} from "lucide-react";
import { cn, useAgents, useAuth, useClients, useNotifications, useRequests, useSourcesState } from "../lib/services";
import { useTheme, type ThemeMode } from "../lib/theme";
import { emitWave } from "../lib/background";
import { ConceptGlyph, LogoMark } from "./icons";
import { ThemeTogglerButton } from "./theme-toggle";
import { Avatar, EASE, StatusBadge } from "./ui";
import { Separator } from "./ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton,
  SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider,
  SidebarTrigger, useIsMobile, useSidebar,
} from "./sidebar";
import { CommandPalette, type CommandItem } from "./command-palette";
import { PageErrorBoundary } from "./page-error-boundary";

/* ————— Données de navigation ————— */
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Vue d'ensemble", "/requests": "Demandes", "/clients": "Clients",
  "/operations": "Opérations", "/agents": "Agents", "/insights": "Insights",
  "/reports": "Rapports", "/sources": "Sources", "/integrations": "Intégrations",
  "/documents": "Documents", "/activity": "Activité", "/cowork": "Cowork",
  "/tasks": "Tâches", "/planning": "Planning", "/validation": "Actions critiques",
  "/settings": "Paramètres",
};

function pageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const root = "/" + pathname.split("/")[1];
  return PAGE_TITLES[root] ?? "DATA OS";
}

interface NavItemDef { to: string; label: string; icon: LucideIcon; end?: boolean; }
interface NavGroupDef { title: string; icon: LucideIcon; defaultOpen?: boolean; items: NavItemDef[]; }

const GROUPS: NavGroupDef[] = [
  {
    title: "Pilotage", icon: LayoutDashboard, defaultOpen: true,
    items: [
      { to: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard, end: true },
      { to: "/requests", label: "Demandes", icon: Inbox },
      { to: "/clients", label: "Clients", icon: Users },
      { to: "/operations", label: "Opérations", icon: Activity },
      { to: "/validation", label: "Actions critiques", icon: ShieldCheck },
      { to: "/planning", label: "Planning", icon: CalendarDays },
      { to: "/tasks", label: "Tâches", icon: CheckSquare },
    ],
  },
  {
    title: "Intelligence", icon: Sparkles, defaultOpen: true,
    items: [
      { to: "/cowork", label: "Cowork", icon: Sparkles },
      { to: "/agents", label: "Agents", icon: Workflow },
      { to: "/insights", label: "Insights", icon: Radar },
      { to: "/reports", label: "Rapports", icon: FileText },
      { to: "/activity", label: "Activité", icon: ScrollText },
    ],
  },
  {
    title: "Système", icon: Settings,
    items: [
      { to: "/sources", label: "Sources", icon: Database },
      { to: "/integrations", label: "Intégrations", icon: Plug },
      { to: "/documents", label: "Documents", icon: FileText },
      { to: "/settings", label: "Paramètres", icon: Settings },
    ],
  },
];

const MOBILE_NAV = [
  { to: "/dashboard", label: "Accueil", icon: LayoutDashboard, end: true },
  { to: "/requests", label: "Demandes", icon: Inbox },
  { to: "/operations", label: "Activité", icon: Activity },
  { to: "/agents", label: "Agents", icon: Workflow },
];

/* ————— Header de sidebar : switcher d'organisation ————— */
const TEAMS = [
  { name: "Maison Ekwata", plan: "Enterprise", icon: Building2 },
  { name: "Ekwata Voyages", plan: "Business", icon: Sparkles },
  { name: "Fondation Ekwata", plan: "Association", icon: Feather },
];

function OrgSwitcher() {
  const [team, setTeam] = useState(TEAMS[0]);
  const { isMobile } = useSidebar();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={team.name} className="data-[state=open]:bg-[var(--surface-2)]">
              <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-champagne-500/15 text-champagne-300">
                <team.icon size={15} strokeWidth={1.6} />
              </span>
              <span className="grid flex-1 text-left leading-tight group-data-[state=collapsed]/sidebar:hidden">
                <span className="truncate text-[13px] font-semibold">{team.name}</span>
                <span className="truncate text-[10.5px] text-cream/60">{team.plan}</span>
              </span>
              <ChevronsUpDown size={14} className="ml-auto shrink-0 text-cream/60 group-data-[state=collapsed]/sidebar:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60" align="start" side={isMobile ? "bottom" : "right"} sideOffset={6}>
            <DropdownMenuLabel>Organisations</DropdownMenuLabel>
            {TEAMS.map((t, i) => (
              <DropdownMenuItem key={t.name} onClick={() => setTeam(t)}>
                <span className="grid size-6 place-items-center rounded-[7px] border border-[var(--hairline)] bg-[var(--surface-2)]">
                  <t.icon size={12} strokeWidth={1.6} />
                </span>
                <span className="flex-1">{t.name}</span>
                <DropdownMenuShortcut>⌘{i + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/* ————— Lien de sous-menu actif ————— */
function NavSubLink({ to, label, icon, end }: NavItemDef) {
  const location = useLocation();
  const active = end ? location.pathname === to : location.pathname.startsWith(to);
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton href={`#${to}`} isActive={active}>
        <ConceptGlyph icon={icon} active={active} size={15} />
        <span className="flex-1 truncate">{label}</span>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

/* ————— Footer : menu utilisateur ————— */
function UserMenu({ onHelp }: { onHelp: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useSidebar();
  if (!user) return null;
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={user.name} className="data-[state=open]:bg-[var(--surface-2)]">
              <Avatar initials={user.initials} name={user.name} size={30} />
              <span className="grid flex-1 text-left leading-tight group-data-[state=collapsed]/sidebar:hidden">
                <span className="truncate text-[13px] font-semibold">{user.name}</span>
                <span className="truncate text-[10.5px] text-cream/60">{user.role}</span>
              </span>
              <ChevronsUpDown size={14} className="ml-auto shrink-0 text-cream/60 group-data-[state=collapsed]/sidebar:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60" align="end" side={isMobile ? "bottom" : "right"} sideOffset={6}>
            <DropdownMenuLabel>
              <span className="block truncate normal-case tracking-normal text-[13px] font-semibold text-cream">{user.name}</span>
              <span className="num block truncate text-[10px] font-normal text-cream/60">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings size={14} strokeWidth={1.6} /> Paramètres
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onHelp}>
              <HelpCircle size={14} strokeWidth={1.6} /> Aide <DropdownMenuShortcut>⌘/</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { signOut(); navigate("/login"); }} className="text-ember focus:text-ember">
              <LogOut size={14} strokeWidth={1.6} /> Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/* ————— Corps de la sidebar ————— */
function SidebarBody({ onHelp }: { onHelp: () => void }) {
  const { sources } = useSourcesState();
  const requestsQ = useRequests(200);
  const agentsQ = useAgents(200);
  const navigate = useNavigate();
  const hasError = sources.some((s) => s.status === "error");
  const topAgents = agentsQ.data.filter((a) => a.status === "Opérationnel").slice(0, 3);

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-1 pt-1 group-data-[state=collapsed]/sidebar:hidden">
          <span className="text-cream"><LogoMark size={22} /></span>
          <span className="text-[13px] font-semibold tracking-[0.22em] text-cream">DATA&nbsp;OS</span>
        </div>
        <OrgSwitcher />
      </SidebarHeader>

      <SidebarContent>
        {GROUPS.map((g) => (
          <SidebarGroup key={g.title}>
            <SidebarGroupLabel>{g.title}</SidebarGroupLabel>
            <SidebarMenu>
              <Collapsible defaultOpen={g.defaultOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={g.title}>
                      <g.icon size={16.5} strokeWidth={1.6} className="shrink-0" />
                      <span className="flex-1 truncate group-data-[state=collapsed]/sidebar:hidden">{g.title}</span>
                      <ChevronRight
                        size={14}
                        className="ml-auto shrink-0 text-cream/56 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90 group-data-[state=collapsed]/sidebar:hidden"
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {g.items.map((n) => <NavSubLink key={n.to} {...n} />)}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroup>
        ))}

        <SidebarGroup>
          <SidebarGroupLabel>Agents actifs</SidebarGroupLabel>
          <SidebarMenu>
            {topAgents.map((a) => {
              const running = a.status === "Opérationnel";
              return (
                <SidebarMenuItem key={a.id}>
                  <SidebarMenuButton tooltip={a.name} onClick={() => navigate(`/agents/${a.id}`)}>
                    <span className="agent-tile grid size-7 shrink-0 place-items-center rounded-[8px] border" style={{ "--tint": a.tint } as React.CSSProperties}>
                      {running ? <Play size={12} strokeWidth={1.75} /> : <Pause size={12} strokeWidth={1.75} />}
                    </span>
                    <span className="flex-1 truncate group-data-[state=collapsed]/sidebar:hidden">{a.name.replace("Agent ", "")}</span>
                    <SidebarMenuBadge>{a.actionsToday}</SidebarMenuBadge>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    showOnHover
                    label={`Détails de ${a.name}`}
                    onClick={() => navigate(`/agents/${a.id}`)}
                  >
                    <MoreHorizontal size={14} strokeWidth={1.6} />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {hasError && (
          <p className="px-2.5 pb-2 text-[10.5px] leading-relaxed text-saffron/90 group-data-[state=collapsed]/sidebar:hidden">
            1 source en erreur — voir Sources.
          </p>
        )}
      </SidebarContent>

      <SidebarFooter>
        <UserMenu onHelp={onHelp} />
      </SidebarFooter>
    </>
  );
}

/* ————— Notifications ————— */
function useClickOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [onClose]);
  return ref;
}

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const notificationsQ = useNotifications(250);
  const [items, setItems] = useState(notificationsQ.data);
  useEffect(() => setItems(notificationsQ.data), [notificationsQ.data]);
  const ref = useClickOutside(useCallback(() => setOpen(false), []));
  const unread = items.filter((n) => !n.read).length;

  const toneDot: Record<string, string> = {
    gold: "bg-champagne-400", success: "bg-jade", warning: "bg-saffron",
    danger: "bg-ember", neutral: "bg-cream/40",
  };

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label={`Notifications${unread ? ` — ${unread} non lues` : ""}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative grid h-9 w-9 place-items-center rounded-[10px] border transition-all duration-200",
          open ? "border-[var(--hairline-strong)] bg-[var(--surface-3)] text-cream" : "border-[var(--hairline)] bg-[var(--surface-2)] text-cream/60 hover:border-[var(--hairline-strong)] hover:text-cream"
        )}
      >
        <Bell size={16} strokeWidth={1.6} />
        {unread > 0 && (
          <span className="num absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-champagne-500 px-1 text-[9px] font-bold text-ink-950">
            {unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="glass-raised liquid absolute right-0 top-11 z-50 w-[min(88vw,340px)] overflow-hidden rounded-[16px] p-1.5"
            role="region" aria-label="Notifications"
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-xs font-semibold">Notifications</span>
              <button
                onClick={() => setItems((prev) => prev.map((n) => ({ ...n, read: true })))}
                className="text-[11px] font-medium text-champagne-300 transition-opacity hover:opacity-75"
              >
                Tout marquer lu
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.map((n) => (
                <div key={n.id} className={cn("flex gap-2.5 rounded-[11px] px-3 py-2.5 transition-colors hover:bg-[var(--row-hover)]", !n.read && "bg-[var(--surface-2)]")}>
                  <span className={cn("mt-1.5 h-[6px] w-[6px] shrink-0 rounded-full", toneDot[n.tone], !n.read && "pulse-dot")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium leading-snug">{n.title}</p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-cream/62">{n.desc}</p>
                  </div>
                  <span className="num shrink-0 text-[9.5px] text-cream/56">{n.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ————— Header inset ————— */
function InsetHeader({ onSearch }: { onSearch: () => void }) {
  const location = useLocation();
  const title = pageTitle(location.pathname);
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--hairline)] bg-[var(--surface-1)]">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:h-16">
        <span className="flex items-center gap-2.5 lg:hidden">
          <span className="text-cream"><LogoMark size={20} /></span>
        </span>
        <div className="hidden items-center gap-2 lg:flex">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-1 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <Link to="/dashboard" className="text-cream/62 transition-colors hover:text-cream">Maison Ekwata</Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onSearch} aria-label="Rechercher (Ctrl K)"
            className="hidden h-9 w-60 items-center gap-2 rounded-[11px] border border-[var(--hairline)] bg-[var(--surface-2)] px-3 text-[12.5px] text-cream/60 transition-all duration-200 hover:border-[var(--hairline-strong)] hover:bg-[var(--row-hover)] hover:text-cream/60 md:flex"
          >
            <Search size={14} strokeWidth={1.6} />
            Rechercher…
            <span className="kbd ml-auto">⌘K</span>
          </button>
          <button
            onClick={onSearch} aria-label="Rechercher"
            className="grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--hairline)] bg-[var(--surface-2)] text-cream/60 transition-colors hover:text-cream md:hidden"
          >
            <Search size={16} strokeWidth={1.6} />
          </button>
          <ThemeTogglerButton variant="outline" modes={["light", "dark", "comfort", "system"]} />
          <NotificationsBell />
        </div>
      </div>
    </header>
  );
}

/* ————— Bottom nav mobile ————— */
function MobileNav({ onMenu }: { onMenu: () => void }) {
  return (
    <nav
      aria-label="Navigation principale mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--hairline)] bg-[var(--surface-1)] pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="grid h-[60px] grid-cols-5">
        {MOBILE_NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            {({ isActive }) => (
              <span className={cn("relative flex h-full flex-col items-center justify-center gap-1 text-[9.5px] font-medium tracking-wide transition-colors", isActive ? "text-cream" : "text-cream/60")}>
                <n.icon size={19} strokeWidth={1.6} />
                {n.label}
                <span className={cn("absolute top-0 h-[2px] w-8 rounded-b bg-cream transition-opacity", isActive ? "opacity-100" : "opacity-0")} />
              </span>
            )}
          </NavLink>
        ))}
        <button
          onClick={onMenu} aria-label="Ouvrir le menu"
          className="relative flex h-full flex-col items-center justify-center gap-1 text-[9.5px] font-medium tracking-wide text-cream/60 transition-colors hover:text-cream/80"
        >
          <Menu size={19} strokeWidth={1.6} />
          Menu
        </button>
      </div>
    </nav>
  );
}

/* ————— Command palette ⌘K (données vivantes) ————— */
function CommandPaletteShell({ open, onOpenChange, onHelp }: {
  open: boolean; onOpenChange: (v: boolean) => void; onHelp: () => void;
}) {
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();
  const requestsQ = useRequests(150);
  const clientsQ = useClients(150);
  const agentsQ = useAgents(150);

  const items = useMemo<CommandItem[]>(() => {
    const pages: CommandItem[] = [
      ...GROUPS.flatMap((g) => g.items.map((n) => ({
        id: `p-${n.to}`, group: "Pages", label: n.label, icon: n.icon,
        keywords: [g.title], onSelect: () => navigate(n.to),
      }))),
      { id: "p-settings", group: "Pages", label: "Paramètres", icon: Settings, onSelect: () => navigate("/settings") },
    ];
    const reqs: CommandItem[] = requestsQ.data.filter((r) => r.status !== "Traitée").slice(0, 5).map((r) => ({
      id: r.id, group: "Demandes", label: r.title, icon: Inbox, hint: r.ref,
      keywords: [r.client, r.ref, r.type, r.status],
      badge: <StatusBadge status={r.status} />,
      onSelect: () => navigate(`/requests/${r.id}`),
    }));
    const cls: CommandItem[] = clientsQ.data.slice(0, 4).map((c) => ({
      id: c.id, group: "Clients", label: c.name, icon: Users, hint: c.segment,
      keywords: [c.city, c.segment],
      onSelect: () => navigate(`/clients/${c.id}`),
    }));
    const ags: CommandItem[] = agentsQ.data.slice(0, 4).map((a) => ({
      id: a.id, group: "Agents", label: a.name, icon: Workflow, hint: a.status,
      keywords: [a.role, a.current],
      onSelect: () => navigate(`/agents/${a.id}`),
    }));
    const nextMode: ThemeMode = mode === "light" ? "dark" : mode === "dark" ? "comfort" : mode === "comfort" ? "system" : "light";
    const modeIcon = mode === "light" ? Sun : mode === "dark" ? Moon : mode === "comfort" ? Feather : Monitor;
    const actions: CommandItem[] = [
      {
        id: "a-theme", group: "Actions", label: `Passer en thème ${nextMode === "light" ? "clair" : nextMode === "dark" ? "sombre" : nextMode === "comfort" ? "confort" : "système"}`,
        icon: modeIcon, keywords: ["thème", "theme", "mode"],
        onSelect: () => setMode(nextMode),
      },
      { id: "a-help", group: "Actions", label: "Ouvrir l'aide", icon: HelpCircle, keywords: ["aide", "raccourcis"], onSelect: () => { onOpenChange(false); onHelp(); } },
    ];
    return [...pages, ...reqs, ...cls, ...ags, ...actions];
  }, [requestsQ.data, clientsQ.data, agentsQ.data, navigate, mode, setMode, onOpenChange, onHelp]);

  return (
    <CommandPalette
      open={open}
      onOpenChange={onOpenChange}
      items={items}
      placeholder="Demandes, clients, agents, rapports…"
      emptyMessage="Aucun résultat pour cette recherche."
    />
  );
}

/* ————— Aide ⌘/ ————— */
function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[95]" role="dialog" aria-modal="true" aria-label="Aide">
          <motion.button
            aria-label="Fermer l'aide"
            className="absolute inset-0 cursor-default bg-ink-950/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="glass-raised liquid relative mx-auto mt-[16vh] w-[min(92vw,440px)] overflow-hidden rounded-[18px] p-5"
          >
            <p className="card-eyebrow mb-1">Assistance</p>
            <h2 className="text-[15px] font-semibold tracking-tight">Aide & raccourcis</h2>
            <div className="mt-4 space-y-2">
              {[
                { k: "⌘K", d: "Recherche globale — demandes, clients, agents, rapports" },
                { k: "⌘/", d: "Ouvrir ce panneau d'aide" },
                { k: "Esc", d: "Fermer fenêtres et panneaux" },
              ].map((s) => (
                <div key={s.k} className="flex items-center gap-3 rounded-[11px] border border-[var(--card-divider)] bg-[var(--surface-2)] px-3 py-2.5">
                  <span className="kbd">{s.k}</span>
                  <span className="text-xs text-cream/65">{s.d}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[12px] border border-champagne-500/15 bg-champagne-500/[0.05] p-4">
              <p className="text-xs font-semibold text-champagne-300">Support dédié Enterprise</p>
              <p className="mt-1 text-xs leading-relaxed text-cream/55">support@dataos.app · réponse garantie sous 2 h ouvrées.</p>
            </div>
            <p className="num mt-4 text-center text-[10px] text-cream/50">DATA OS v2.4.1 — build 8f3k2</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ————— Repli de contenu pendant le chargement d'un chunk de page ————— */
function ContentFallback() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="skeleton h-8 w-52" />
      <div className="skeleton h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="skeleton h-40" />
        <div className="skeleton h-40" />
      </div>
    </div>
  );
}

/* ————— Coquille applicative ————— */
export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();

  /* Transition de page : transform + opacity uniquement (GPU-friendly,
     pas de blur/repaint). Coupée si prefers-reduced-motion. */
  const pageAnim = reduce
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.08 } }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: { duration: 0.22, ease: EASE },
      };

  const clickRef = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const onDown = (e: PointerEvent) => { clickRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  /* ⌘/ ouvre l'aide (⌘K est géré par la palette) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setHelpOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setPaletteOpen(false);
    window.scrollTo({ top: 0 });
    document.title = `${pageTitle(location.pathname)} — DATA OS`;
    emitWave(clickRef.current?.x, clickRef.current?.y);
  }, [location.pathname]);

  const openMobileMenu = useCallback(() => {
    window.dispatchEvent(new CustomEvent("dataos:open-mobile-nav"));
  }, []);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarBody onHelp={() => setHelpOpen(true)} />
      </Sidebar>

      <SidebarInset>
        <InsetHeader onSearch={() => setPaletteOpen(true)} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={pageAnim.initial}
            animate={pageAnim.animate}
            exit={pageAnim.exit}
            transition={pageAnim.transition}
            className="mx-auto w-full max-w-[1160px] flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-16"
          >
            <PageErrorBoundary key={location.pathname}>
              <Suspense fallback={<ContentFallback />}>
                <Outlet />
              </Suspense>
            </PageErrorBoundary>
          </motion.main>
        </AnimatePresence>
      </SidebarInset>

      {isMobile && <MobileNav onMenu={openMobileMenu} />}

      <CommandPaletteShell open={paletteOpen} onOpenChange={setPaletteOpen} onHelp={() => setHelpOpen(true)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <MobileNavBridge />
    </SidebarProvider>
  );
}

/** Relie le bouton « Menu » de la bottom nav à la sheet de la sidebar. */
function MobileNavBridge() {
  const { setOpenMobile } = useSidebar();
  useEffect(() => {
    const onOpen = () => setOpenMobile(true);
    window.addEventListener("dataos:open-mobile-nav", onOpen);
    return () => window.removeEventListener("dataos:open-mobile-nav", onOpen);
  }, [setOpenMobile]);
  return null;
}
