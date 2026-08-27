import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { cn, fmtMoney, useClients } from "../lib/services";
import type { Client, Risk, Segment, Tone } from "../lib/types";
import { GlassBadge, GlassInput, GlassSurface } from "../components/glass";
import { Avatar, EmptyState, Reveal, Skeleton } from "../components/ui";

type Tab = "Tous" | "VIP" | "Actifs" | "Inactifs" | "À risque";
const TABS: Tab[] = ["Tous", "VIP", "Actifs", "Inactifs", "À risque"];

const segmentTone: Record<Segment, Tone> = { VIP: "gold", "Fidèle": "neutral", Nouveau: "success", "À risque": "danger" };
export const riskTone: Record<Risk, Tone> = { Faible: "success", "Modéré": "warning", "Élevé": "danger" };

export default function Clients() {
  const clientsQ = useClients(600);
  const [tab, setTab] = useState<Tab>("Tous");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    let out = clientsQ.data;
    if (tab === "VIP") out = out.filter((c) => c.segment === "VIP");
    if (tab === "Actifs") out = out.filter((c) => c.state === "Actif");
    if (tab === "Inactifs") out = out.filter((c) => c.state === "Inactif");
    if (tab === "À risque") out = out.filter((c) => c.state === "À risque" || c.risk === "Élevé");
    const q = query.trim().toLowerCase();
    if (q) out = out.filter((c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));
    return out;
  }, [clientsQ.data, tab, query]);

  const totalValue = clientsQ.data.reduce((acc, c) => acc + c.value, 0);

  return (
    <div className="space-y-5">
      <Reveal>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Portefeuille client</p>
            <h1 className="mt-2 t-title">Clients</h1>
            <p className="num mt-1.5 text-[11.5px] text-cream/45">
              {clientsQ.data.length} clients · {fmtMoney(totalValue)} de valeur cumulée
            </p>
          </div>
          <GlassInput
            placeholder="Rechercher un client…" aria-label="Rechercher un client"
            icon={<Search size={14} strokeWidth={1.6} />}
            value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-64"
          />
        </header>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrer les clients">
          {TABS.map((t) => (
            <button
              key={t} onClick={() => setTab(t)}
              className={cn(
                "h-9 rounded-full border px-4 text-xs font-medium transition-all duration-200",
                tab === t ? "border-transparent bg-[color-mix(in_srgb,var(--color-cream)_10%,transparent)] text-cream" : "border-transparent bg-[var(--surface-2)] text-cream/55 shadow-[var(--highlight-top)] hover:text-cream/85"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </Reveal>

      {clientsQ.loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[64px]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <GlassSurface>
          <EmptyState
            title="Aucun client dans ce segment."
            desc="Connectez une source CRM pour alimenter automatiquement DATA OS, ou élargissez vos filtres."
            action={
              <button
                onClick={() => { setTab("Tous"); setQuery(""); }}
                className="rounded-[9px] border border-[var(--hairline-strong)] px-3.5 py-2 text-xs font-medium text-cream/70 transition-colors hover:bg-[var(--row-hover)]"
              >
                Afficher tous les clients
              </button>
            }
          />
        </GlassSurface>
      ) : (
        <>
          <Reveal delay={0.08}>
            <GlassSurface className="hidden overflow-hidden p-0 lg:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--hairline)]">
                    {["Client", "Segment", "Dernier contact", "Valeur", "Activité", "Risque", "Responsable"].map((h) => (
                      <th key={h} className="card-eyebrow px-4 py-3 first:pl-5 last:pr-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <ClientRow key={c.id} client={c} onOpen={() => navigate(`/clients/${c.id}`)} />
                  ))}
                </tbody>
              </table>
            </GlassSurface>
          </Reveal>

          <div className="space-y-2.5 lg:hidden">
            {filtered.map((c, i) => (
              <Reveal key={c.id} delay={0.03 * i}>
                <button onClick={() => navigate(`/clients/${c.id}`)} className="glass glass-sweep w-full p-4 text-left">
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2.5">
                      <Avatar initials={c.initials} name={c.name} size={32} />
                      <span>
                        <span className="block text-[13.5px] font-semibold">{c.name}</span>
                        <span className="block text-[11px] text-cream/40">{c.city} · {c.lastContact}</span>
                      </span>
                    </span>
                    <GlassBadge tone={segmentTone[c.segment]}>{c.segment}</GlassBadge>
                  </span>
                  <span className="mt-3 flex items-end justify-between border-t border-[var(--card-divider)] pt-3">
                    <span>
                      <span className="num block text-[16px] font-semibold">{fmtMoney(c.value)}</span>
                      <span className="text-[9.5px] uppercase tracking-[0.1em] text-cream/30">valeur client</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <GlassBadge tone={riskTone[c.risk]}>Risque {c.risk.toLowerCase()}</GlassBadge>
                      <ChevronRight size={15} strokeWidth={1.6} className="text-cream/25" />
                    </span>
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ClientRow({ client: c, onOpen }: { client: Client; onOpen: () => void }) {
  return (
    <tr onClick={onOpen} className="group cursor-pointer border-b border-[var(--card-divider)] transition-colors duration-150 last:border-0 hover:bg-[var(--row-hover)]">
      <td className="py-3 pl-5 pr-4">
        <span className="flex items-center gap-2.5">
          <Avatar initials={c.initials} name={c.name} size={30} />
          <span>
            <span className="block text-[13px] font-medium">{c.name}</span>
            <span className="block text-[10.5px] text-cream/35">{c.city}</span>
          </span>
        </span>
      </td>
      <td className="px-4 py-3"><GlassBadge tone={segmentTone[c.segment]}>{c.segment}</GlassBadge></td>
      <td className="num px-4 py-3 text-[10.5px] text-cream/50">{c.lastContact}</td>
      <td className="num px-4 py-3 text-[12px] font-semibold">{fmtMoney(c.value)}</td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-2">
          <span className="h-[3px] w-16 overflow-hidden rounded-full bg-[var(--surface-3)]">
            <span
              className={cn("block h-full rounded-full transition-all duration-700", c.activity > 60 ? "bg-jade/80" : c.activity > 30 ? "bg-saffron/80" : "bg-ember/80")}
              style={{ width: `${c.activity}%` }}
            />
          </span>
          <span className="num text-[10px] text-cream/40">{c.activity}%</span>
        </span>
      </td>
      <td className="px-4 py-3"><GlassBadge tone={riskTone[c.risk]}>{c.risk}</GlassBadge></td>
      <td className="px-4 py-3 text-[11.5px] text-cream/55">{c.owner}</td>
      <td className="py-3 pl-2 pr-5">
        <ChevronRight size={15} strokeWidth={1.6} className="text-cream/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-cream" />
      </td>
    </tr>
  );
}
