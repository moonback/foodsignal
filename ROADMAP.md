# FOOD SIGNAL — Roadmap technique

> Statuts basés sur le code présent dans cette branche. Une fonctionnalité n'est déclarée TERMINÉE que si elle est implémentée et vérifiée par des tests exécutés.

## Lot 0 — Fondation web

- [x] Structure Next.js App Router + React + TypeScript strict.
- [x] Styles responsive de la première page client.
- [x] Schéma de données initial : utilisateurs, vendeurs, produits, demandes, offres et commandes.
- [x] Client Prisma singleton.
- [x] API de création de demande avec validation Zod.
- [x] Stockage séparé du texte original et du résumé anonymisé.
- [x] Limitation à la ville configurée via `PILOT_CITY` lorsque cette variable est renseignée.
- [ ] Installation des dépendances, génération Prisma, migrations et build — non exécutés depuis le connecteur GitHub.
- [ ] Tests automatisés — non créés / non exécutés.

## Lot 1 — Sécurité et comptes

- [ ] Authentification et récupération de compte.
- [ ] Sessions sécurisées, cookies HttpOnly et protection CSRF adaptée.
- [ ] Autorisations strictes par rôle : particulier, vendeur, opérateur.
- [ ] Validation RGPD : base légale, information, durée de conservation, export et suppression.
- [ ] Rate limiting, anti-abus, journalisation et politique de rétention.
- [ ] Ne jamais exposer `rawDescription`, e-mail, téléphone ou adresse privée aux vendeurs.

## Lot 2 — Espace professionnel

- [ ] Inscription et validation des commerçants / producteurs.
- [ ] Profil, spécialités, zone desservie et horaires.
- [ ] Catalogue, unités, prix et disponibilités.
- [ ] Tableau des demandes ciblées et réponses commerciales.

## Lot 3 — Compréhension et diffusion

- [ ] Moteur AI Intent avec sortie JSON validée par schéma.
- [ ] Détection des informations manquantes et questions de clarification.
- [ ] Anonymisation renforcée et tests de non-divulgation.
- [ ] Matching par spécialité et proximité dans la seule zone pilote.
- [ ] Notifications et diffusion contrôlée aux vendeurs éligibles.

## Lot 4 — Offres et optimisation

- [ ] Soumission d'offres détaillées et validation des données.
- [ ] Contrôle de conformité avec les contraintes du client.
- [ ] Comparaison prix / qualité déclarée / disponibilité / logistique.
- [ ] Combinaison multi-vendeurs avec coût complet et frais.
- [ ] Présentation transparente des compromis au client.

## Lot 5 — Commande et réception

- [ ] Confirmation explicite par le client.
- [ ] Gestion transactionnelle des commandes et statuts.
- [ ] Retrait chez le commerçant.
- [ ] Livraison par partenaires locaux, après contractualisation.
- [ ] Notifications et suivi des états.
- [ ] Paiement marketplace et reversements, après choix et configuration du prestataire.

## Lot 6 — Qualité et pilote terrain

- [ ] Tests unitaires, intégration et E2E.
- [ ] Audit sécurité, accessibilité et responsive.
- [ ] Monitoring, sauvegardes et procédure de restauration.
- [ ] Choix documenté de la ville pilote et recrutement des premiers vendeurs.
- [ ] Mesure des demandes, taux de réponse, propositions conformes, confirmations et commandes exécutées.

## Hors périmètre du MVP

Application mobile native, reconnaissance photo du réfrigérateur, prévision des achats, casiers réfrigérés, livraison autonome, IA prédictive avancée et marketplace internationale.
