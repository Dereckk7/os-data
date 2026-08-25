import { Download, Eye, FileText, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { GlassBadge, GlassButton, GlassModal, GlassSurface } from '../components/glass';
import { toast } from '../components/toast';
import { EmptyState, Reveal, Skeleton } from '../components/ui';
import { cn, useDocuments } from '../lib/services';
import type { DocumentCategory, DocumentItem } from '../lib/types';

const CATEGORIES: ('Tous' | DocumentCategory)[] = [
  'Tous',
  'Contrats',
  'Factures',
  'Réservations',
  'Documents clients',
  'Rapports',
  'Procédures',
  'Autres',
];

export default function Documents() {
  const documentsQ = useDocuments(500);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Tous');
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<DocumentItem | null>(null);

  const filtered = useMemo(() => {
    let out =
      category === 'Tous'
        ? documentsQ.data
        : documentsQ.data.filter((d) => d.category === category);
    const q = query.trim().toLowerCase();
    if (q)
      out = out.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          d.source.toLowerCase().includes(q)
      );
    return out;
  }, [documentsQ.data, category, query]);

  return (
    <div className="space-y-5">
      <Reveal>
        <header>
          <p className="eyebrow">Ressources</p>
          <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Documents</h1>
          <p className="mt-1.5 text-[13.5px] text-cream/50">
            {documentsQ.data.length} documents classés automatiquement depuis vos sources.
          </p>
        </header>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filtrer par catégorie"
          >
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  'h-9 rounded-full border px-3.5 text-xs font-medium transition-all duration-200',
                  category === c
                    ? 'border-cream/30 bg-cream/[0.08] text-cream'
                    : 'border-white/[0.08] bg-white/[0.02] text-cream/55 hover:border-white/[0.15] hover:text-cream/85'
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72">
            <Search
              size={14}
              strokeWidth={1.6}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream/35"
            />
            <label htmlFor="doc-search" className="sr-only">
              Rechercher dans vos documents
            </label>
            <input
              id="doc-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher dans vos documents…"
              className="h-10 w-full rounded-[11px] border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 text-[13px] text-cream outline-none transition-all placeholder:text-cream/30 hover:border-white/[0.14] focus:border-cream/35"
            />
          </div>
        </div>
      </Reveal>

      {documentsQ.loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[58px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <GlassSurface>
          <EmptyState
            icon={<FileText size={18} strokeWidth={1.5} />}
            title="Aucun document trouvé."
            desc="Connectez la source Documents pour que DATA OS classe automatiquement contrats, factures et vouchers."
            action={
              <GlassButton
                variant="gold"
                size="sm"
                onClick={() =>
                  toast.gold('Import de documents', {
                    description: 'Glissez vos fichiers dans la source Documents (simulation).',
                  })
                }
              >
                Connecter la source Documents
              </GlassButton>
            }
          />
        </GlassSurface>
      ) : (
        <GlassSurface className="overflow-hidden p-0">
          <ul className="divide-y divide-white/[0.05]">
            {filtered.map((d, i) => (
              <li key={d.id} className="row-in" style={{ animationDelay: `${i * 20}ms` }}>
                <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02] sm:px-6">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-white/[0.08] bg-ink-950/55 text-cream/60">
                    <FileText size={15} strokeWidth={1.6} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{d.name}</p>
                    <p className="num mt-0.5 flex flex-wrap items-center gap-x-2 text-[9.5px] uppercase tracking-[0.1em] text-cream/30">
                      {d.category} · {d.size} · {d.updated} · source {d.source}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-1.5 md:flex">
                    {d.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/[0.07] px-2 py-0.5 text-[10px] text-cream/45"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      aria-label={`Aperçu de ${d.name}`}
                      onClick={() => setPreview(d)}
                      className="grid h-9 w-9 place-items-center rounded-[9px] border border-white/[0.08] text-cream/55 transition-all hover:border-white/[0.18] hover:text-cream"
                    >
                      <Eye size={14} strokeWidth={1.6} />
                    </button>
                    <button
                      aria-label={`Télécharger ${d.name}`}
                      onClick={() =>
                        toast.success('Téléchargement lancé', {
                          description: `${d.name} · ${d.size}`,
                        })
                      }
                      className="grid h-9 w-9 place-items-center rounded-[9px] border border-white/[0.08] text-cream/55 transition-all hover:border-white/[0.18] hover:text-cream"
                    >
                      <Download size={14} strokeWidth={1.6} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </GlassSurface>
      )}

      <GlassModal
        open={preview !== null}
        onClose={() => setPreview(null)}
        eyebrow={preview?.category}
        title={preview?.name}
        footer={
          preview && (
            <>
              <GlassButton variant="ghost" onClick={() => setPreview(null)}>
                Fermer
              </GlassButton>
              <GlassButton
                variant="primary"
                iconLeft={<Download size={14} strokeWidth={1.75} />}
                onClick={() =>
                  toast.success('Téléchargement lancé', {
                    description: `${preview.name} · ${preview.size}`,
                  })
                }
              >
                Télécharger
              </GlassButton>
            </>
          )
        }
      >
        {preview && (
          <div className="space-y-4">
            <div className="flex aspect-[4/3] items-center justify-center rounded-[12px] border border-dashed border-white/[0.1] bg-white/[0.015]">
              <div className="text-center">
                <FileText size={26} strokeWidth={1.25} className="mx-auto text-cream/25" />
                <p className="num mt-2 text-[10px] uppercase tracking-[0.14em] text-cream/30">
                  Aperçu — {preview.size}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <GlassBadge tone="neutral">{preview.category}</GlassBadge>
              {preview.tags.map((t) => (
                <GlassBadge key={t} tone="gold">
                  {t}
                </GlassBadge>
              ))}
              <span className="num ml-auto text-[9.5px] uppercase tracking-[0.1em] text-cream/30">
                Classé automatiquement · {preview.source}
              </span>
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  );
}
