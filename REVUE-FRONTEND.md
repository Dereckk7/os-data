# DATA OS — Revue complète du front-end

**Branche :** `review/frontend` (partie de `main` @ `a57aaa6`)
**Périmètre :** durcissement et correction — **pas** de refonte, pas de nouvelle dépendance, pas de changement d'architecture/routes, pas de modification de la logique data (`services.tsx` / `supabase/*` / `types.ts` / `mock.ts`).
**Validation :** chaque commit passe `npx tsc --noEmit` (0 erreur) + `npx vite build` (réussi).

## Méthode & limite de test à l'exécution
- Revue statique systématique (grep ciblés) de toutes les pages + coquille applicative, plus lecture approfondie du chemin Cowork.
- `npx vite build` (prod) et `vite build --mode development` : **OK**.
- **Limite importante :** le brief mentionne un « compte fourni » pour se connecter, mais **aucun identifiant n'a été transmis dans la demande**. Je n'ai donc **pas** pu faire le parcours authentifié réel (desktop/mobile × clair/sombre) contre Supabase. Les constats ci-dessous sont établis par analyse du code et reproduction logique du bug Cowork ; les points marqués **« à confirmer au runtime »** nécessitent une session connectée pour être validés visuellement. Je préfère le signaler que prétendre l'avoir testé.

---

## PRIORITÉ 1 — Cowork : le panneau central ne s'affiche pas de façon fiable → **CORRIGÉ**

### Cause racine identifiée (bloquant)
**`src/components/navigation.tsx:621`** — La coquille rend la page ainsi :
```
<AnimatePresence mode="wait" initial={false}>
  <motion.main key={pathname} initial={{opacity:0,y:10}} …>
    <PageErrorBoundary key={pathname}>
      <Suspense fallback={<ContentFallback/>}>   ← Suspense À L'INTÉRIEUR
        <Outlet/>                                 ← page en React.lazy()
      </Suspense>
    </PageErrorBoundary>
  </motion.main>
</AnimatePresence>
```
Le `<Suspense>` d'une page **lazy** est un enfant de la `motion.main` **suivie par `AnimatePresence mode="wait"`**. Quand le chunk n'est pas encore en cache (cold-load), l'enfant *suspend* pendant le chargement ; la coordination *exit → enter* de `mode="wait"` peut alors se bloquer et **ne jamais révéler la page entrante**. Résultat : zone centrale vide alors que l'entête et le composer (hors de cette frontière) restent visibles — exactement le symptôme décrit. C'est **intermittent** parce que cela dépend de l'état du cache du chunk (« parfois vide, parfois OK »).

**Correctif appliqué** (`fix(cowork)` — commit `1594da3`) : le `<Suspense>` est **hissé au-dessus** de l'`AnimatePresence`. Le fallback de chargement (`ContentFallback`, un skeleton visible) couvre alors toute la zone pendant le chargement du chunk, puis la page s'anime normalement. Plus de deadlock exit/enter. Routes, lazy-loading et barrière d'erreur inchangés.

### Durcissement du chemin d'envoi (moyen) — `src/pages/Cowork.tsx`
Constats sur `send()` :
- `coworkAsk` (services.tsx) **n'échoue jamais par exception** (elle `try/catch` en interne et renvoie `null`) — donc pas de « thinking » figé par rejet non capté **de ce côté**. En revanche `supabase.functions.invoke` **n'a pas de timeout** : une Edge Function **lente/hung** (cold start, latence Anthropic, `ANTHROPIC_API_KEY` absente côté fonction) laissait l'`await` pendre → **indicateur « réflexion » figé indéfiniment**, sans issue.
- Le `setTimeout` de repli (l.375) **n'était pas nettoyé** au démontage, et pouvait `setState` après démontage si l'on quittait la page pendant la requête.

**Correctif appliqué** (commit `1594da3`) :
- `Promise.race` entre `coworkAsk` et un timeout de **12 s** (`COWORK_TIMEOUT_MS`) → au-delà, bascule sur la synthèse locale ; l'indicateur ne reste plus jamais figé.
- `mountedRef` pour ne plus `setState` après démontage ; `fallbackTimer` nettoyé dans le cleanup d'effet.
- `coworkAsk` **non modifié** (logique data intacte).

> À confirmer au runtime (session connectée) : je n'ai pas pu reproduire visuellement le vide en clair, mais le mécanisme AnimatePresence+Suspense est la cause la plus solide et le correctif est strictement plus sûr. Si un cas de vide persistait après ce correctif, prochaine piste : contraste du contenu central en thème clair (voir §C — écarté par lecture, `--color-cream` = `#1c1a16` en clair, donc lisible).

---

## PRIORITÉ 2 — Revue systématique

### A. Robustesse d'exécution — **déjà largement couverte** (phases de durcissement antérieures)
| Point | Fichier:ligne | Constat | Statut |
|---|---|---|---|
| `.reduce` sur données vides | AgentDetail.tsx:120, Clients.tsx:32 | Gardés `(x ?? []).reduce` + `Number.isFinite` | ✅ déjà sûr |
| `.localeCompare` sur `undefined` | Planning.tsx:25 | `(a.time ?? "").localeCompare(b.time ?? "")` | ✅ déjà sûr |
| Initiales `.split(" ")` | Settings:212, Requests:179/217, RequestDetail:65 | `(x ?? "").split(" ")…` gardé | ✅ déjà sûr |
| `user.name.split` | Dashboard.tsx:29 | `user?.name?.split(" ")[0] ?? ""` | ✅ déjà sûr |
| `new Date(...)` / `Intl.*` | Planning, Requests, Cowork | Uniquement `new Date()` ou constructeurs numériques (année/mois/jour) — jamais de parse de chaîne → pas d'« Invalid Date » ; `Intl.NumberFormat` gardé par `typeof v === "number"` | ✅ déjà sûr |
| Nettoyage timers/listeners | Sources.tsx:32-62, Login.tsx:31-38 | `clearTimeout/clearInterval/removeEventListener` présents | ✅ déjà sûr |
| **Timer non nettoyé** | **Cowork.tsx (repli)** | setTimeout de repli sans cleanup + setState post-démontage | ✅ **corrigé** (P1) |
| Boutons « morts » | (recherche `onClick={()=>{}}`) | Aucun trouvé | ✅ RAS |

### B. Cohérence données réelles
| Élément | Fichier:ligne | Constat | Statut |
|---|---|---|---|
| Nom/localisation organisation | Settings.tsx:156-157 | `defaultValue={mockOrganization.name / .city}` dans des `GlassInput` **éditables** | ⚠️ **à décider** — c'est déjà l'option « laisser en champ éditable ». Brancher sur `core.tenants` nécessiterait un nouveau hook data (hors périmètre : ne pas modifier la logique data). Laissé tel quel volontairement. |
| Blocs démo Cowork | Cowork.tsx:37-60 (`AnalysisBlock`), 112-146 (`ReportBlock`) | Chiffres en dur (« 126 », « 74,2 M XAF ») **uniquement en repli local** quand l'Edge Function ne renvoie pas de données | ⚠️ **à décider** — contenu de démonstration assumé. Le remplacer = inventer une source / feature (hors périmètre « ne PAS inventer de source »). Signalé, non modifié. |
| Autres pages | Requests/Dashboard/Operations/Clients/… | Déjà branchées sur les hooks réels (patches `fix(demo)`/`feat(demo)` mergés) | ✅ RAS |

### C. Thème clair ET sombre
- `--color-cream` = `#f7f8f8` (sombre) / `#1c1a16` (clair) : le texte s'inverse correctement → contenu central lisible dans les deux thèmes. ✅
- `bg-white` / `hover:bg-white` (ex. Tasks.tsx:56) mappent sur le token `--color-white` qui **flippe par thème** (`#fff` sombre / `#17130d` clair) → CTA cohérent, **pas** une couleur fixe. ✅
- Canvas + hairlines du thème clair renforcés récemment (`index.css`). ✅
- **À confirmer au runtime :** contraste des badges/tableaux/champs page par page dans les deux thèmes, et visibilité `:focus-visible` au clavier — non vérifiable sans session connectée.

### D. Responsive / mobile
- Tables potentiellement larges encapsulées dans `overflow-x-auto` (ex. Cowork `DataBlock`, vues semaine Planning/Requests). Navigation mobile dédiée (`MobileNav`). Aside/ContextPanel `hidden lg:*`. ✅ (lecture)
- **À confirmer au runtime :** atteignabilité tactile réelle, sheets/drawers, aucun élément coupé — non vérifiable sans device/preview connecté.

### E. États loading / empty / error
- `loading` : skeletons intégrés sur toutes les pages listées (grep confirmé). ✅
- `empty` : `EmptyState` présent (Reports, Planning « Aucun rendez-vous planifié », Settings/journal « Aucun événement récent » — ajoutés précédemment, présents sur `main`). ✅
- `error` : `PageErrorBoundary` par page (keyed by pathname) + `ErrorState`. ✅

### F. Performance
- **Code-splitting déjà en place** : les 21 pages sont en `React.lazy` + `Suspense` (`App.tsx`). Le chunk > 500 kB restant est le bundle **vendor** (`index-*.js`, react/router/framer/supabase), pas les pages. Réduction possible via `manualChunks` (vendor split) — **proposé**, non appliqué (optimisation de build, hors « corriger/durcir » ; à valider séparément). ⚠️ à décider
- Animations : `useReducedMotion` respecté (transition de page, Login). Canvas de fond (`DotField`) : pause hors écran + allègement mobile (durci en phase 1). ✅
- Pas de `framer-motion` sur de très grandes listes (motion réservé aux entêtes/cartes/messages). ✅

### G. Qualité TypeScript / code mort
- `as any` : **uniquement** dans `services.tsx` (mappers de réponses RPC typés avec repli `?? []`) — couche data, hors périmètre. Aucun `as any`/`as never` masquant un risque dans les pages/composants. ✅
- `console.*` : seulement `console.error` dans `main.tsx:15` et `page-error-boundary.tsx:23` (journalisation de barrière d'erreur légitime, pas du debug). ✅
- `tsconfig` `strict: true`. Pas de `noUnusedLocals` → quelques imports inutilisés possibles mais non bloquants ; non balayés en masse (risque/valeur faible). Aucun relevé lors de la lecture des fichiers modifiés.

---

## Points laissés ouverts (avec raison)
1. **Settings — nom/localisation d'organisation** (Settings.tsx:156-157) : laissés en champs éditables avec valeur seed. Brancher sur `core.tenants` = nouveau hook data → **décision produit + couche data** (hors périmètre). 
2. **Blocs démo Cowork** (AnalysisBlock/ReportBlock) : contenu de démonstration en repli local. Les brancher au réel = inventer une source (interdit par le brief). 
3. **Vendor chunk > 500 kB** : `manualChunks` proposé mais non appliqué (optimisation build à valider à part). 
4. **Parcours authentifié réel** (desktop/mobile × clair/sombre, focus-visible, contraste fin) : **non exécuté faute d'identifiants**. À refaire avec le compte fourni pour valider §C/§D et confirmer visuellement la correction P1.

## Correctifs appliqués (par thème)
- `fix(cowork): affichage fiable du panneau central` — `1594da3` — navigation.tsx (Suspense hors AnimatePresence) + Cowork.tsx (timeout d'envoi, cleanup, mountedRef). `tsc` + `build` verts.

## Proposition
Ouvrir une PR **`review/frontend` → `main`** (sans merger) pour revue, puis valider la correction P1 au runtime avec le compte fourni avant merge.
