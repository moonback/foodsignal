# ADR-001 — Fondation web du MVP FOOD SIGNAL

- **Statut :** accepté pour la première fondation, à confirmer après installation locale.
- **Date :** 2026-11-15.

## Contexte

Le dépôt contenait les documents produit et business, mais aucune application web ni stack existante à préserver. Les documents recommandent une application web responsive, une architecture modulaire et citent Next.js / TypeScript ainsi que PostgreSQL comme options.

## Décision

- Next.js App Router pour réunir interface web et endpoints HTTP dans une première application modulaire.
- TypeScript strict pour le typage.
- Prisma comme couche d'accès PostgreSQL.
- Zod pour valider les entrées.
- Une seule application déployable pour le pilote, sans microservices prématurés.

## Conséquences

- Démarrage local simple, sous réserve de disposer de Node.js et PostgreSQL.
- Les données géographiques sont représentées initialement par ville, code postal et coordonnées vendeur optionnelles. PostGIS n'est pas activé.
- L'authentification et les autorisations ne sont pas encore implémentées : cette branche ne doit pas être déployée publiquement ni utilisée pour traiter des données personnelles réelles.
- Les intégrations IA, paiement, cartographie et notifications restent désactivées tant que les fournisseurs et leurs paramètres ne sont pas configurés.
- Les choix pourront évoluer après validation des besoins du pilote et vérification des performances réelles.
