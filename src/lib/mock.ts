/**
 * Données de démonstration — conciergerie africaine premium.
 * Remplaçables par Supabase sans toucher aux composants.
 */
import type {
  ActivityEntry, Agent, AppNotification, Approval, AttentionItem, Client, DataRequest,
  DataSource, DocumentItem, Insight, Integration, Kpi, Operation, OpsCardData, Organization,
  Report, TaskItem, User, ActivityEvent,
} from "./types";

export const mockUser: User = { id: "u-01", name: "Marie Dupont", email: "marie@maison-ekwata.com", role: "Direction", initials: "MD" };

export const mockOrganization: Organization = {
  id: "org-01", name: "Maison Ekwata", plan: "Enterprise", city: "Douala · Paris",
  members: [
    { id: "m-01", name: "Marie Dupont", email: "marie@maison-ekwata.com", role: "Direction", status: "Actif" },
    { id: "m-02", name: "Jean-Marc Ekwata", email: "jm@maison-ekwata.com", role: "Manager", status: "Actif" },
    { id: "m-03", name: "Awa Ndiaye", email: "awa@maison-ekwata.com", role: "Opérations", status: "Actif" },
    { id: "m-04", name: "Paul Biya Jr", email: "paul@maison-ekwata.com", role: "Lecteur", status: "Invité" },
  ],
};

const act = (id: string, time: string, title: string, agent?: string, desc?: string, live?: boolean): ActivityEvent =>
  ({ id, time, title, agent, desc, live });

/* ————— 10 agents nommés ————— */
export const mockAgents: Agent[] = [
  {
    id: "ag-resa", name: "Agent Réservation", role: "Réservations & transferts",
    description: "Trouve, compare et présélectionne les meilleures options de réservation et de transfert pour chaque demande.",
    actionsToday: 13, status: "Opérationnel", current: "4 demandes en cours",
    week: [9, 11, 14, 12, 16, 13, 13], capabilities: ["Recherche multi-partenaires", "Présélection d'options", "Confirmation chauffeurs", "Suivi des disponibilités"],
    accuracy: 92, lastActivity: "il y a 2 min", avgTime: "4m", tint: "#7ea6d8",
    tasks: [
      { id: "t1", label: "Transfert Paris → Cannes", status: "En cours", due: "Aujourd'hui" },
      { id: "t2", label: "Opéra Garnier — 2 places", status: "En cours", due: "Aujourd'hui" },
      { id: "t3", label: "Villa Eden — check-in", status: "Planifié", due: "14:00" },
    ],
    sources: ["CRM", "Calendar", "Paiement"],
    events: [
      act("e1", "09:42", "4 options trouvées", "Agent Réservation", "Transfert VIP Paris → Cannes"),
      act("e2", "09:31", "Chauffeur confirmé", "Agent Réservation", "Riviera Prestige · 4,9/5"),
      act("e3", "09:18", "Présélection effectuée", "Agent Réservation", "Option A recommandée (fiabilité 92%)"),
    ],
  },
  {
    id: "ag-ci", name: "Agent Client Intelligence", role: "Analyse & profils clients",
    description: "Analyse les profils, détecte les opportunités et prépare des recommandations personnalisées.",
    actionsToday: 7, status: "Opérationnel", current: "Analyse 12 profils",
    week: [5, 6, 8, 7, 9, 8, 7], capabilities: ["Segmentation VIP", "Détection de churn", "Scoring de valeur", "Recommandations"],
    accuracy: 96, lastActivity: "il y a 6 min", avgTime: "2m", tint: "#a79bcc",
    tasks: [{ id: "t1", label: "Profils VIP inactifs 42 j", status: "En cours", due: "Aujourd'hui" }],
    sources: ["CRM", "Email", "WhatsApp"],
    events: [act("e1", "09:12", "3 VIP sans réservation détectés", "Agent Client Intelligence", "Potentiel 1 850 000 XAF")],
  },
  {
    id: "ag-rep", name: "Agent Reporting", role: "Rapports & synthèse",
    description: "Génère les rapports quotidiens, hebdomadaires et mensuels à partir de toutes les sources.",
    actionsToday: 1, status: "En veille", current: "Rapport quotidien prêt dans 18 min",
    week: [1, 1, 1, 2, 1, 1, 1], capabilities: ["Rapport quotidien 08:00", "Synthèse CA", "Détection d'anomalies"],
    accuracy: 99, lastActivity: "08:00", avgTime: "6m", tint: "#8ab291",
    tasks: [{ id: "t1", label: "Rapport quotidien", status: "Planifié", due: "08:00" }],
    sources: ["CRM", "Paiement", "Calendar"],
    events: [act("e1", "08:00", "Rapport quotidien généré", "Agent Reporting", "6 pages")],
  },
  {
    id: "ag-ops", name: "Agent Opérations", role: "Exécution terrain",
    description: "Coordonne les chauffeurs, partenaires et interventions sur le terrain en temps réel.",
    actionsToday: 18, status: "Opérationnel", current: "Réassignation de 2 chauffeurs",
    week: [14, 16, 15, 19, 21, 17, 18], capabilities: ["Réassignation chauffeurs", "Suivi terrain", "Escalades"],
    accuracy: 89, lastActivity: "à l'instant", avgTime: "3m", tint: "#d98e4a",
    tasks: [{ id: "t1", label: "Réassigner REQ-2477", status: "En cours", due: "Urgent" }],
    sources: ["Calendar", "WhatsApp"],
    events: [act("e1", "08:44", "Escalade REQ-2477", "Agent Opérations", "Chauffeur non assigné", true)],
  },
  {
    id: "ag-pros", name: "Agent Prospection", role: "Détection d'opportunités",
    description: "Identifie les prospects à forte valeur et prépare les premières approches.",
    actionsToday: 5, status: "Opérationnel", current: "Qualifie 8 leads",
    week: [4, 5, 6, 5, 7, 6, 5], capabilities: ["Qualification de leads", "Scoring", "Première approche"],
    accuracy: 87, lastActivity: "il y a 12 min", avgTime: "5m", tint: "#7ea6d8",
    tasks: [{ id: "t1", label: "Leads corporate Q3", status: "En cours", due: "Cette semaine" }],
    sources: ["CRM", "Email"],
    events: [act("e1", "09:02", "8 leads qualifiés", "Agent Prospection")],
  },
  {
    id: "ag-tres", name: "Agent Trésorerie", role: "Paiements & impayés",
    description: "Suit les encaissements, relance les impayés et alerte sur les risques financiers.",
    actionsToday: 4, status: "Opérationnel", current: "Relance 2 impayés",
    week: [3, 4, 3, 5, 4, 4, 4], capabilities: ["Relance impayés", "Rapprochement", "Alertes"],
    accuracy: 98, lastActivity: "il y a 20 min", avgTime: "2m", tint: "#c9635a",
    tasks: [{ id: "t1", label: "Impayés 2,94 M XAF", status: "En cours", due: "Aujourd'hui" }],
    sources: ["Paiement", "CRM"],
    events: [act("e1", "08:55", "2 comptes en impayé", "Agent Trésorerie", "2,94 M XAF")],
  },
  {
    id: "ag-com", name: "Agent Communication", role: "Messages & relation client",
    description: "Prépare et envoie (après validation) les messages clients sur tous les canaux.",
    actionsToday: 11, status: "Opérationnel", current: "2 brouillons en validation",
    week: [8, 10, 9, 12, 11, 10, 11], capabilities: ["Brouillons WhatsApp/Email", "Personnalisation", "Relances douces"],
    accuracy: 94, lastActivity: "il y a 4 min", avgTime: "1m", tint: "#a79bcc",
    tasks: [{ id: "t1", label: "Brouillons — file de validation", status: "En cours", due: "Aujourd'hui" }],
    sources: ["WhatsApp", "Email", "CRM"],
    events: [act("e1", "09:30", "Brouillon préparé", "Agent Communication", "Relance Groupe Meka")],
  },
  {
    id: "ag-plan", name: "Agent Planning", role: "Agenda & échéances",
    description: "Tient l'agenda, anticipe les conflits et prépare les briefings quotidiens.",
    actionsToday: 6, status: "Opérationnel", current: "Briefing de demain en préparation",
    week: [5, 6, 5, 7, 6, 6, 6], capabilities: ["Détection de conflits", "Briefings", "Rappels"],
    accuracy: 97, lastActivity: "il y a 30 min", avgTime: "2m", tint: "#8ab291",
    tasks: [{ id: "t1", label: "Briefing quotidien", status: "Planifié", due: "Demain 08:00" }],
    sources: ["Calendar", "CRM"],
    events: [act("e1", "09:00", "Aucun conflit détecté", "Agent Planning")],
  },
  {
    id: "ag-part", name: "Agent Partenaires", role: "Réseau de prestataires",
    description: "Évalue et suit les partenaires (chauffeurs, hôtels, restaurants) et leur fiabilité.",
    actionsToday: 3, status: "En attente", current: "En attente de 2 réponses partenaires",
    week: [2, 3, 3, 4, 3, 3, 3], capabilities: ["Notation partenaires", "Négociation", "Veille qualité"],
    accuracy: 91, lastActivity: "il y a 1 h", avgTime: "8m", tint: "#d98e4a",
    tasks: [{ id: "t1", label: "Notation Riviera Prestige", status: "Terminé", due: "Hier" }],
    sources: ["CRM", "WhatsApp"],
    events: [act("e1", "08:30", "Partenaire contacté", "Agent Partenaires")],
  },
  {
    id: "ag-veil", name: "Agent Veille", role: "Surveillance & anomalies",
    description: "Surveille en continu les indicateurs et remonte toute anomalie ou retard.",
    actionsToday: 9, status: "Erreur", current: "Source WhatsApp à resynchroniser",
    week: [7, 8, 9, 8, 10, 9, 9], capabilities: ["Détection d'anomalies", "Alertes retard", "SLA"],
    accuracy: 95, lastActivity: "il y a 8 min", avgTime: "1m", tint: "#c9635a",
    tasks: [{ id: "t1", label: "Resynchroniser WhatsApp", status: "En cours", due: "Urgent" }],
    sources: ["WhatsApp", "Paiement", "CRM"],
    events: [act("e1", "07:31", "Échec synchronisation WhatsApp", "Agent Veille", "Token expiré", true)],
  },
];

/* ————— Demandes ————— */
export const mockRequests: DataRequest[] = [
  {
    id: "req-2481", ref: "REQ-2481", clientId: "cl-01", client: "Alex Williams", title: "Transfert VIP — Paris → Cannes",
    type: "Transfert", status: "En recherche", priority: "Haute", agent: "Agent Réservation",
    amountLabel: "€850–€1 200", vip: true, day: 14, time: "09:42",
    summary: "Transfert privé · 14 août · 18:30 · 4 personnes",
    options: [
      { id: "a", label: "Option A", vehicle: "Mercedes Classe S", price: "850 €", reliability: 92, features: ["Chauffeur bilingue", "Eau & WiFi", "Annulation flexible"], recommended: true },
      { id: "b", label: "Option B", vehicle: "Van VIP", price: "1 200 €", reliability: 98, features: ["7 places", "Espace bagages", "Chauffeur dédié"] },
    ],
    activity: [
      act("a1", "09:42", "4 options trouvées", "Agent Réservation", "2 présélectionnées", true),
      act("a2", "09:31", "Chauffeur confirmé", "Agent Réservation", "Riviera Prestige · 4,9/5"),
      act("a3", "09:18", "Demande qualifiée", "Agent Client Intelligence", "Priorité haute"),
    ],
  },
  {
    id: "req-2479", ref: "REQ-2479", clientId: "cl-02", client: "Clarisse Nkoulou", title: "Séjour — Four Seasons George V",
    type: "Séjour", status: "À valider", priority: "Critique", agent: "Agent Réservation",
    amountLabel: "€2 400", vip: true, day: 13, time: "09:15",
    summary: "Suite Deluxe · 3 nuits · étage élevé demandé",
    options: [
      { id: "a", label: "Option A", vehicle: "Suite Deluxe", price: "2 400 €", reliability: 96, features: ["Étage élevé", "Vue Seine", "Petit-déjeuner inclus"], recommended: true },
    ],
    activity: [act("a1", "09:15", "Option présélectionnée", "Agent Réservation", "En attente de validation")],
  },
  {
    id: "req-2477", ref: "REQ-2477", clientId: "cl-03", client: "Groupe Meka", title: "Vol privé — Douala → Libreville",
    type: "Vol", status: "En retard", priority: "Critique", agent: "Agent Opérations",
    amountLabel: "12 500 000 XAF", vip: true, day: 16, time: "08:44",
    summary: "Jet 8 places · 16 août · 06:15",
    options: [],
    activity: [act("a1", "08:44", "Retard détecté", "Agent Veille", "Chauffeur non assigné", true)],
  },
  {
    id: "req-2474", ref: "REQ-2474", clientId: "cl-04", client: "Hôtel Laïco", title: "Conciergerie — dîner gastronomique",
    type: "Conciergerie", status: "Confirmée", priority: "Normale", agent: "Agent Réservation",
    amountLabel: "540 000 XAF", vip: false, day: 15, time: "08:20",
    summary: "Table 6 · 15 août · 20:00",
    options: [],
    activity: [act("a1", "08:20", "Table confirmée", "Agent Réservation")],
  },
  {
    id: "req-2468", ref: "REQ-2468", clientId: "cl-05", client: "Société KAM & Fils", title: "Événement corporate — 80 invités",
    type: "Événement", status: "En attente client", priority: "Haute", agent: "Agent Opérations",
    amountLabel: "8 900 000 XAF", vip: false, day: 22, time: "Hier",
    summary: "Salle plénière · 22 août · traiteur inclus",
    options: [],
    activity: [act("a1", "Hier", "Devis envoyé", "Agent Opérations", "En attente du client")],
  },
];

/* ————— Clients ————— */
export const mockClients: Client[] = [
  {
    id: "cl-01", name: "Alex Williams", initials: "AW", segment: "VIP", state: "Actif", lastContact: "Aujourd'hui",
    value: 18400000, currency: "XAF", requestsCount: 42, bookingsCount: 31, satisfaction: 96, activity: 88, risk: "Faible",
    owner: "Marie Dupont", email: "a.williams@williams-capital.com", phone: "+33 6 12 45 78 90", city: "Paris", since: 2021,
    history: [act("h1", "Aujourd'hui", "Demande de transfert", undefined, "Paris → Cannes"), act("h2", "Hier", "Transfert aéroport confirmé"), act("h3", "12 août", "Restaurant réservé", undefined, "Table pour 4")],
    comms: [{ id: "c1", channel: "WhatsApp", date: "Aujourd'hui", summary: "Confirmation du transfert envoyée." }, { id: "c2", channel: "Email", date: "Hier", summary: "Facture du séjour Four Seasons." }],
    aiInsights: ["Client le plus fidèle : 42 demandes, satisfaction 96%. Réserve toujours en avance — proposer les offres early-bird.", "Préfère les véhicules Classe S et les chauffeurs bilingues."],
    recommendedActions: [{ id: "ra1", label: "Proposer le package été VIP", agent: "Agent Client Intelligence" }, { id: "ra2", label: "Planifier un appel de courtoisie", agent: "Agent Communication" }],
  },
  {
    id: "cl-02", name: "Clarisse Nkoulou", initials: "CN", segment: "VIP", state: "Actif", lastContact: "Hier",
    value: 12750000, currency: "XAF", requestsCount: 28, bookingsCount: 22, satisfaction: 94, activity: 74, risk: "Faible",
    owner: "Jean-Marc Ekwata", email: "c.nkoulou@nkoulou-group.cm", phone: "+237 6 99 12 34 56", city: "Douala", since: 2022,
    history: [act("h1", "Hier", "Séjour Four Seasons en validation")],
    comms: [{ id: "c1", channel: "Appel", date: "Hier", summary: "Précisions sur la suite Deluxe." }],
    aiInsights: ["Sensible aux surclassements. Taux de conversion élevé sur les suites."],
    recommendedActions: [{ id: "ra1", label: "Valider la suite Deluxe", agent: "Agent Réservation" }],
  },
  {
    id: "cl-03", name: "Groupe Meka", initials: "GM", segment: "Fidèle", state: "Actif", lastContact: "Aujourd'hui",
    value: 9800000, currency: "XAF", requestsCount: 15, bookingsCount: 9, satisfaction: 88, activity: 62, risk: "Modéré",
    owner: "Awa Ndiaye", email: "contact@groupemeka.com", phone: "+237 6 77 88 99 00", city: "Yaoundé", since: 2023,
    history: [act("h1", "Aujourd'hui", "Vol privé en retard — escalade")],
    comms: [{ id: "c1", channel: "Email", date: "Aujourd'hui", summary: "Relance impayé envoyée." }],
    aiInsights: ["Impayé de 2,94 M XAF en cours. Risque modéré à surveiller."],
    recommendedActions: [{ id: "ra1", label: "Relancer l'impayé", agent: "Agent Trésorerie" }],
  },
  {
    id: "cl-04", name: "Hôtel Laïco", initials: "HL", segment: "Fidèle", state: "Actif", lastContact: "Il y a 3 j",
    value: 6400000, currency: "XAF", requestsCount: 19, bookingsCount: 14, satisfaction: 91, activity: 45, risk: "Faible",
    owner: "Awa Ndiaye", email: "resa@laico.cm", phone: "+237 6 55 44 33 22", city: "Douala", since: 2022,
    history: [act("h1", "Il y a 3 j", "Dîner gastronomique confirmé")],
    comms: [{ id: "c1", channel: "Réunion", date: "Il y a 3 j", summary: "Point trimestriel partenariat." }],
    aiInsights: ["Partenaire récurrent. Volume stable."],
    recommendedActions: [{ id: "ra1", label: "Renégocier les tarifs groupe", agent: "Agent Partenaires" }],
  },
  {
    id: "cl-05", name: "Société KAM & Fils", initials: "KF", segment: "Nouveau", state: "Actif", lastContact: "Aujourd'hui",
    value: 8900000, currency: "XAF", requestsCount: 3, bookingsCount: 1, satisfaction: 90, activity: 70, risk: "Faible",
    owner: "Marie Dupont", email: "kam@kametfils.com", phone: "+237 6 11 22 33 44", city: "Douala", since: 2025,
    history: [act("h1", "Aujourd'hui", "Devis événement corporate envoyé")],
    comms: [{ id: "c1", channel: "Email", date: "Aujourd'hui", summary: "Devis 8,9 M XAF transmis." }],
    aiInsights: ["Nouveau compte à fort potentiel (événement corporate)."],
    recommendedActions: [{ id: "ra1", label: "Relancer le devis sous 48 h", agent: "Agent Communication" }],
  },
  {
    id: "cl-06", name: "Fatou Bamba", initials: "FB", segment: "À risque", state: "À risque", lastContact: "Il y a 45 j",
    value: 4200000, currency: "XAF", requestsCount: 11, bookingsCount: 6, satisfaction: 78, activity: 12, risk: "Élevé",
    owner: "Jean-Marc Ekwata", email: "f.bamba@bamba.ci", phone: "+225 07 12 34 56 78", city: "Abidjan", since: 2022,
    history: [act("h1", "Il y a 45 j", "Dernière demande — sans suite")],
    comms: [{ id: "c1", channel: "Email", date: "Il y a 45 j", summary: "Réclamation sur un transfert." }],
    aiInsights: ["Aucune activité depuis 45 jours. Réclamation non résolue — risque de churn élevé."],
    recommendedActions: [{ id: "ra1", label: "Appel de reconquête prioritaire", agent: "Agent Client Intelligence" }],
  },
];

/* ————— Insights ————— */
export const mockInsights: Insight[] = [
  { id: "in-01", type: "opportunity", title: "3 clients VIP sans réservation depuis 42 jours", body: "Un ciblage personnalisé pourrait réactiver ces comptes à forte valeur.", metric: "1 850 000 XAF", metricLabel: "Potentiel estimé", cta: "Examiner", agent: "Agent Client Intelligence", time: "09:12", impact: "Élevé", status: "Nouveau" },
  { id: "in-02", type: "recommendation", title: "Taux de conversion des transferts VIP en baisse de 12%", body: "Les délais de première réponse se sont allongés cette semaine. Rétablir la file prioritaire.", cta: "Analyser", agent: "Agent Client Intelligence", time: "09:05", impact: "Moyen", status: "Nouveau" },
  { id: "in-03", type: "anomaly", title: "7 demandes dépassent le délai habituel", body: "Concentration sur les transferts. Cause probable : indisponibilité de 2 chauffeurs.", cta: "Voir", agent: "Agent Veille", time: "08:50", impact: "Élevé", status: "Vu" },
  { id: "in-04", type: "warning", title: "Impayés en hausse : 2,94 M XAF", body: "2 comptes concernés. L'Agent Trésorerie prépare les relances.", metric: "2 940 000 XAF", metricLabel: "Encours", cta: "Suivre", agent: "Agent Trésorerie", time: "08:55", impact: "Élevé", status: "Vu" },
  { id: "in-05", type: "decision", title: "Renouveler le contrat Riviera Prestige ?", body: "Partenaire le plus fiable (4,9/5). Le contrat arrive à échéance dans 30 jours.", cta: "Décider", agent: "Agent Partenaires", time: "08:30", impact: "Moyen", status: "Nouveau" },
  { id: "in-06", type: "opportunity", title: "Satisfaction VIP en hausse de 12% cette semaine", body: "Capitaliser sur la dynamique : solliciter des références et avis.", metric: "+12%", metricLabel: "Satisfaction", cta: "Voir", agent: "Agent Client Intelligence", time: "08:15", impact: "Faible", status: "Traité" },
];

/* ————— Opérations ————— */
export const mockOperations: Operation[] = [
  { id: "op-01", time: "à l'instant", agent: "Agent Réservation", title: "Synchronisation terminée", desc: "2 options présélectionnées", live: true, kind: "agent" },
  { id: "op-02", time: "à l'instant", title: "Nouvelle demande client VIP", desc: "Alex Williams · Transfert privé", live: true, kind: "info" },
  { id: "op-03", time: "09:42", agent: "Agent Réservation", title: "4 options trouvées", kind: "agent" },
  { id: "op-04", time: "09:31", title: "Chauffeur confirmé", desc: "Riviera Prestige · 4,9/5", kind: "success" },
  { id: "op-05", time: "09:18", agent: "Agent Reporting", title: "Rapport quotidien généré", kind: "agent" },
  { id: "op-06", time: "08:55", agent: "Agent Trésorerie", title: "2 impayés détectés", desc: "2,94 M XAF", kind: "warning" },
  { id: "op-07", time: "08:44", agent: "Agent Veille", title: "Retard REQ-2477", desc: "Chauffeur non assigné", kind: "warning" },
];

export const operationsPool: Operation[] = [
  { id: "pp-01", time: "à l'instant", agent: "Agent Opérations", title: "Chauffeur réassigné", desc: "REQ-2477 — Riviera Prestige", live: true, kind: "success" },
  { id: "pp-02", time: "à l'instant", agent: "Agent Veille", title: "WhatsApp resynchronisé", live: true, kind: "success" },
  { id: "pp-03", time: "à l'instant", agent: "Agent Communication", title: "Brouillon prêt", desc: "Relance Groupe Meka", live: true, kind: "agent" },
];

/* ————— Rapports ————— */
export const mockReports: Report[] = [
  { id: "rp-01", title: "Rapport quotidien", period: "Quotidien", category: "Opérations", status: "Prêt", date: "13 août · 08:00", summary: "25 demandes traitées, 8 réservations confirmées, 1 escalade en cours.", pages: 6, trend: [18, 22, 20, 25, 23, 27, 25], highlights: [{ label: "Demandes", value: "25", delta: "+12%" }, { label: "Réservations", value: "8", delta: "+8%" }, { label: "SLA", value: "94%" }] },
  { id: "rp-02", title: "Performance commerciale", period: "Hebdomadaire", category: "Ventes", status: "Prêt", date: "12 août", summary: "CA hebdo 18,4 M XAF, porté par les transferts VIP (+18%).", pages: 12, trend: [12, 14, 15, 14, 17, 16, 18], highlights: [{ label: "CA", value: "18,4 M", delta: "+11%" }, { label: "Panier moyen", value: "720 k", delta: "+4%" }, { label: "Conversion", value: "31%" }] },
  { id: "rp-03", title: "Clients VIP", period: "Mensuel", category: "Clients", status: "Prêt", date: "1er août", summary: "42 clients VIP actifs. Satisfaction moyenne 94%. 3 comptes à réactiver.", pages: 18, trend: [38, 39, 40, 41, 40, 42, 42], highlights: [{ label: "VIP actifs", value: "42" }, { label: "Satisfaction", value: "94%", delta: "+2 pts" }, { label: "À réactiver", value: "3" }] },
  { id: "rp-04", title: "Rapport financier", period: "Mensuel", category: "Finance", status: "Génération", date: "En cours", summary: "Consolidation des encaissements et impayés du mois.", pages: 0, trend: [10, 12, 11, 13, 14, 13, 15], highlights: [{ label: "Encaissé", value: "74 M" }, { label: "Impayés", value: "2,9 M" }, { label: "Marge", value: "22%" }] },
  { id: "rp-05", title: "Anomalies & risques", period: "Hebdomadaire", category: "Veille", status: "Prêt", date: "12 août", summary: "7 retards, 2 impayés, 1 source à resynchroniser. Aucun incident critique.", pages: 4, trend: [9, 7, 8, 7, 8, 7, 7], highlights: [{ label: "Retards", value: "7" }, { label: "Impayés", value: "2" }, { label: "Incidents", value: "0" }] },
];

/* ————— Sources ————— */
export const mockSources: DataSource[] = [
  { id: "src-01", key: "crm", name: "CRM", description: "Clients, opportunités et historique commercial", status: "connected", lastSync: "il y a 4 min", records: 12480, lastActivity: "2 contacts mis à jour", method: "OAuth" },
  { id: "src-02", key: "email", name: "Email", description: "Boîtes partagées et correspondance client", status: "connected", lastSync: "il y a 9 min", records: 48210, lastActivity: "14 emails indexés", method: "IMAP" },
  { id: "src-03", key: "calendar", name: "Calendar", description: "Agendas, rendez-vous et échéances", status: "connected", lastSync: "il y a 2 min", records: 3120, lastActivity: "3 événements ajoutés", method: "OAuth" },
  { id: "src-04", key: "whatsapp", name: "WhatsApp", description: "Conversations WhatsApp Business", status: "error", lastSync: "il y a 6 h", records: 86540, lastActivity: "Échec de synchronisation", error: "Le jeton d'accès a expiré. Une réautorisation est requise pour reprendre la synchronisation.", method: "API" },
  { id: "src-05", key: "payments", name: "Paiement", description: "Transactions, encaissements et impayés", status: "connected", lastSync: "il y a 1 min", records: 9875, lastActivity: "5 transactions", method: "API" },
  { id: "src-06", key: "documents", name: "Documents", description: "Contrats, factures et vouchers", status: "off", lastSync: "—", records: 0, lastActivity: "Jamais synchronisé", method: "Import" },
];

/* ————— Intégrations ————— */
export const mockIntegrations: Integration[] = [
  { id: "int-01", name: "Salesforce", monogram: "SF", category: "CRM", status: "Connecté", lastSync: "il y a 5 min", records: 12480, description: "Synchronisation bidirectionnelle des contacts et opportunités." },
  { id: "int-02", name: "Google Workspace", monogram: "G", category: "Suite", status: "Connecté", lastSync: "il y a 2 min", records: 51330, description: "Gmail, Calendar et Drive." },
  { id: "int-03", name: "Microsoft 365", monogram: "M", category: "Suite", status: "Déconnecté", lastSync: "—", records: 0, description: "Outlook, Teams et OneDrive." },
  { id: "int-04", name: "Stripe", monogram: "S", category: "Finance", status: "Connecté", lastSync: "il y a 1 min", records: 9875, description: "Paiements et encaissements." },
  { id: "int-05", name: "WhatsApp Business", monogram: "WA", category: "Messaging", status: "Erreur", lastSync: "il y a 6 h", records: 86540, description: "Conversations clients. Jeton expiré." },
  { id: "int-06", name: "SAP", monogram: "SAP", category: "ERP", status: "Configuration requise", lastSync: "—", records: 0, description: "Comptabilité et facturation." },
];

/* ————— Documents ————— */
export const mockDocuments: DocumentItem[] = [
  { id: "doc-01", name: "Contrat Riviera Prestige 2025.pdf", category: "Contrats", size: "1,2 Mo", updated: "12 août", source: "Documents", tags: ["partenaire", "transport"] },
  { id: "doc-02", name: "Facture #392 — Groupe Meka.pdf", category: "Factures", size: "340 Ko", updated: "11 août", source: "Paiement", tags: ["impayé"] },
  { id: "doc-03", name: "Voucher Four Seasons — C. Nkoulou.pdf", category: "Réservations", size: "210 Ko", updated: "13 août", source: "CRM", tags: ["VIP"] },
  { id: "doc-04", name: "Rapport mensuel — juillet.pdf", category: "Rapports", size: "2,8 Mo", updated: "1er août", source: "Reporting", tags: ["direction"] },
  { id: "doc-05", name: "Procédure escalade retards.pdf", category: "Procédures", size: "480 Ko", updated: "5 juil.", source: "Documents", tags: ["ops"] },
  { id: "doc-06", name: "Passeport — A. Williams.pdf", category: "Documents clients", size: "1,6 Mo", updated: "9 août", source: "Email", tags: ["VIP", "confidentiel"] },
];

/* ————— Activité ————— */
export const mockActivity: ActivityEntry[] = [
  { id: "ac-01", time: "09:42", actor: "Agent Réservation", kind: "agent", title: "4 options trouvées", desc: "REQ-2481" },
  { id: "ac-02", time: "09:40", actor: "Marie Dupont", kind: "utilisateur", title: "Validation du séjour Four Seasons", desc: "REQ-2479" },
  { id: "ac-03", time: "09:31", actor: "Système", kind: "systeme", title: "Source CRM synchronisée", desc: "2 contacts mis à jour" },
  { id: "ac-04", time: "09:20", actor: "Agent Communication", kind: "action", title: "Brouillon créé", desc: "Relance Groupe Meka" },
  { id: "ac-05", time: "08:55", actor: "Agent Veille", kind: "erreur", title: "Échec synchronisation WhatsApp", desc: "Token expiré" },
  { id: "ac-06", time: "08:44", actor: "Agent Opérations", kind: "action", title: "Escalade REQ-2477" },
  { id: "ac-07", time: "08:00", actor: "Agent Reporting", kind: "agent", title: "Rapport quotidien généré" },
];

/* ————— Tâches ————— */
export const mockTasks: TaskItem[] = [
  { id: "tk-01", title: "Valider le séjour Four Seasons", priority: "Critique", agent: "Agent Réservation", due: "Aujourd'hui", status: "À faire", ref: "REQ-2479" },
  { id: "tk-02", title: "Répondre aux demandes VIP en attente", priority: "Haute", agent: "Agent Opérations", due: "Aujourd'hui", status: "En cours", count: 12 },
  { id: "tk-03", title: "Relancer l'impayé Groupe Meka", priority: "Haute", agent: "Agent Trésorerie", due: "Demain", status: "En cours" },
  { id: "tk-04", title: "Resynchroniser la source WhatsApp", priority: "Critique", agent: "Agent Veille", due: "Urgent", status: "À faire" },
  { id: "tk-05", title: "Relire le rapport mensuel", priority: "Normale", agent: "Agent Reporting", due: "Vendredi", status: "En attente" },
  { id: "tk-06", title: "Appel de reconquête — Fatou Bamba", priority: "Haute", agent: "Agent Client Intelligence", due: "Cette semaine", status: "À faire" },
  { id: "tk-07", title: "Confirmer le van VIP — REQ-2481", priority: "Normale", agent: "Agent Réservation", due: "Aujourd'hui", status: "Terminé", ref: "REQ-2481" },
];

/* ————— Validations ————— */
export const mockApprovals: Approval[] = [
  { id: "apr-01", agent: "Agent Communication", title: "Envoyer la relance impayé au Groupe Meka", why: "Impayé de 2,94 M XAF depuis 15 jours. Ton ferme mais courtois.", data: "Facture #392 · historique de relances", impact: "Message WhatsApp au contact finance", category: "Messages", status: "pending", time: "09:20" },
  { id: "apr-02", agent: "Agent Reporting", title: "Envoyer le rapport mensuel à 24 clients", why: "Diffusion automatique du rapport de juillet.", data: "Rapport mensuel · liste de diffusion", impact: "24 emails sortants", category: "Rapports", status: "pending", time: "09:10" },
  { id: "apr-03", agent: "Agent Trésorerie", title: "Accorder un avoir de 150 000 XAF — Hôtel Laïco", why: "Geste commercial suite à un retard de transfert.", data: "Réclamation #88 · historique", impact: "Avoir sur prochaine facture", category: "Actions financières", status: "pending", time: "08:58" },
  { id: "apr-04", agent: "Agent Client Intelligence", title: "Passer Fatou Bamba en compte prioritaire", why: "Risque de churn élevé détecté (45 j d'inactivité).", data: "Score de churn · dernière réclamation", impact: "File de traitement prioritaire", category: "Modifications clients", status: "validee", time: "08:40" },
  { id: "apr-05", agent: "Agent Opérations", title: "Réassigner le chauffeur — REQ-2477", why: "Chauffeur initial indisponible.", data: "Planning chauffeurs", impact: "Transfert du 16 août", category: "Opérations", status: "validee", time: "08:44" },
  { id: "apr-06", agent: "Agent Communication", title: "Message de bienvenue — Société KAM & Fils", why: "Nouveau compte corporate.", data: "Profil client", impact: "1 email", category: "Messages", status: "rejetee", time: "Hier" },
];

/* ————— Notifications ————— */
export const mockNotifications: AppNotification[] = [
  { id: "nt-01", title: "Agent terminé", desc: "Agent Réservation a présélectionné 2 options pour REQ-2481.", time: "à l'instant", read: false, tone: "success" },
  { id: "nt-02", title: "Anomalie", desc: "7 demandes dépassent actuellement le délai habituel.", time: "08:50", read: false, tone: "warning" },
  { id: "nt-03", title: "Action requise", desc: "3 actions nécessitent votre validation.", time: "08:45", read: false, tone: "gold" },
  { id: "nt-04", title: "Insight", desc: "La satisfaction VIP a augmenté de 12% cette semaine.", time: "08:15", read: true, tone: "neutral" },
  { id: "nt-05", title: "Système", desc: "La source WhatsApp doit être resynchronisée.", time: "07:31", read: true, tone: "danger" },
];

/* ————— Dashboard ————— */
export const executiveKpis: Kpi[] = [
  { label: "Demandes", value: "25", deltaText: "+12%", deltaTone: "success", spark: [14, 16, 15, 19, 21, 20, 25] },
  { label: "Réservations", value: "8", deltaText: "+8%", deltaTone: "success", spark: [4, 5, 5, 6, 7, 6, 8] },
  { label: "À valider", value: "3", deltaText: "Attention", deltaTone: "warning", spark: [1, 2, 2, 3, 2, 4, 3] },
  { label: "Satisfaction", value: "94%", deltaText: "+2 pts", deltaTone: "success", spark: [88, 89, 90, 91, 92, 93, 94] },
];

export const attentionItems: AttentionItem[] = [
  { id: "at-01", title: "Remise commerciale — Hôtel Laïco", desc: "Avoir de 150 000 XAF à approuver", value: "150 000 XAF", agent: "Agent Trésorerie", priority: "Haute", requestId: "req-2474" },
  { id: "at-02", title: "Réservation VIP — Four Seasons", desc: "Suite Deluxe à valider", value: "€2 400", agent: "Agent Réservation", priority: "Critique", requestId: "req-2479" },
  { id: "at-03", title: "Relance impayé — Groupe Meka", desc: "Message à approuver avant envoi", value: "2,94 M XAF", agent: "Agent Communication", priority: "Haute", requestId: "req-2477" },
];

/* ————— Cartes opérationnelles ————— */
export const mockOpsCards: OpsCardData[] = [
  { id: "op-c1", tone: "violet", eyebrow: "CHECK-IN — VILLA EDEN", title: "Arrivée de M. Nguema", desc: "Préparation de l'arrivée : transfert, villa et accueil.", when: "Aujourd'hui · 14:00", progress: 80, steps: [{ id: "s1", label: "Chauffeur confirmé", state: "done" }, { id: "s2", label: "Villa préparée", state: "done" }, { id: "s3", label: "Welcome package", state: "active" }, { id: "s4", label: "Confirmation finale", state: "todo" }], agentIds: ["ag-ops", "ag-resa"], workingIds: ["ag-ops"], dueIn: 120 },
  { id: "op-c2", tone: "blue", eyebrow: "DEMANDE #2481", title: "Transfert aéroport → résidence", desc: "Client Alex Williams — présélection en cours.", when: "14 août · 18:30", progress: 65, steps: [{ id: "s1", label: "Demande qualifiée", state: "done" }, { id: "s2", label: "4 options trouvées", state: "done" }, { id: "s3", label: "Validation direction", state: "active" }], agentIds: ["ag-resa"], workingIds: ["ag-resa"], dueIn: 18 },
  { id: "op-c3", tone: "orange", eyebrow: "ACTION CRITIQUE", title: "Réassigner 2 chauffeurs", desc: "Indisponibilité détectée sur les courses du 16 août.", when: "En cours", progress: 30, steps: [{ id: "s1", label: "Partenaires contactés", state: "done" }, { id: "s2", label: "Riviera Prestige confirmé", state: "done" }, { id: "s3", label: "Second chauffeur", state: "active" }], agentIds: ["ag-ops", "ag-veil"], workingIds: ["ag-ops"], dueIn: 45, urgent: true },
  { id: "op-c4", tone: "gold", eyebrow: "RAPPORT", title: "Rapport mensuel — juillet", desc: "Génération terminée, relecture en cours.", when: "Prêt à 10:00", progress: 90, steps: [{ id: "s1", label: "Données consolidées", state: "done" }, { id: "s2", label: "Mise en page", state: "done" }, { id: "s3", label: "Relecture finale", state: "active" }], agentIds: ["ag-rep"], workingIds: ["ag-rep"], dueIn: 300 },
];
