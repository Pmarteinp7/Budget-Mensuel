# Budget Mensuel

Outil de gestion de budget personnel : suivi des entrées/sorties, catégorisation,
détection des dépenses réductibles (abonnements, anomalies), budgets par catégorie,
objectifs d'épargne, vues mensuelle et annuelle, export mensuel (PDF / CSV) et
sauvegarde/restauration JSON.

Toutes les données sont stockées uniquement dans le `localStorage` du navigateur —
pas de compte, pas de serveur, pas de connexion bancaire.

## Développement

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Stack

- React + TypeScript + Vite
- Tailwind CSS (v4)
- Zustand (état + persistance `localStorage`)
- Recharts (graphiques)
- jsPDF / jspdf-autotable (export PDF, chargé à la demande)
