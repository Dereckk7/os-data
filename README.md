# DATA OS — Système d'exploitation d'entreprise

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3-646cff.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38bdf8.svg)](https://tailwindcss.com/)

**DATA OS** est une plateforme de gestion d'entreprise premium qui centralise toutes vos opérations : clients, agents, demandes, documents, tâches et analytics.

## 🚀 Démarrage rapide

### Prérequis

- Node.js >= 20
- npm >= 10

### Installation

```bash
# Cloner le dépôt
git clone <repository-url>
cd data-os

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase

# Démarrer le serveur de développement
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

## 📁 Architecture du projet

```
src/
├── components/         # Composants UI réutilisables
│   ├── ui/            # Primitives (Button, Input, Dropdown...)
│   └── ...            # Composants métier (Navigation, Sidebar...)
├── pages/             # Pages de l'application
├── lib/               # Logique métier et utilitaires
│   ├── supabase/      # Client Supabase
│   ├── services.tsx   # Services & providers
│   ├── types.ts       # Types TypeScript
│   └── mock.ts        # Données mockées (développement)
├── hooks/             # Custom hooks (à venir)
└── utils/             # Fonctions utilitaires
```

### Connexion à Supabase

1. Créez un projet sur [Supabase](https://supabase.com)
2. Récupérez votre URL et clé anon dans **Settings > API**
3. Mettez à jour `.env` :

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Remplacez les mocks par des appels Supabase dans `lib/services.tsx`

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Mode watch pour le développement
npm run test:watch

# Vérifier le typage
npm run typecheck
```

## 🛠️ Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarre le serveur de développement |
| `npm run build` | Build de production avec TypeScript check |
| `npm run preview` | Prévisualise le build en local |
| `npm run lint` | Lance ESLint |
| `npm run lint:fix` | Corrige automatiquement les erreurs ESLint |
| `npm run format` | Formate le code avec Prettier |
| `npm run typecheck` | Vérifie le typage TypeScript |
| `npm test` | Lance la suite de tests Jest |

## 🎨 Design System

DATA OS utilise un design system premium avec :

- **Thème sombre/clair** avec persistance localStorage
- **Animations fluides** via Framer Motion
- **Composants Radix UI** pour l'accessibilité
- **TailwindCSS v4** pour le styling

## 🔐 Sécurité

- Authentification prête pour Supabase Auth
- Row Level Security (RLS) recommandée côté base de données
- Variables d'environnement pour les clés sensibles
- Dependencies régulièrement mises à jour

## 📦 Déploiement

### Build de production

```bash
npm run build
```

Les fichiers statiques sont générés dans `dist/`

### Hébergement recommandé

- **Vercel** : `vercel deploy`
- **Netlify** : Connecter le dépôt GitHub
- **Cloudflare Pages** : `wrangler pages deploy dist`

## 🤝 Contribuer

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amélioration`)
3. Committez (`git commit -m 'Ajoute fonctionnalité'`)
4. Pushez (`git push origin feature/amélioration`)
5. Ouvrez une Pull Request

### Guidelines

- Respectez ESLint et Prettier
- Ajoutez des tests pour les nouvelles fonctionnalités
- Documentez les changements majeurs

## 📄 Licence

MIT © 2024

---

**Développé avec ❤️ par l'équipe DATA OS**
