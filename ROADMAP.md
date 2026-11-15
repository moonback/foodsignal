# FOOD SIGNAL — Roadmap technique

> Les cases cochées décrivent le code présent. Une fonctionnalité n'est déclarée terminée que lorsqu'elle a été exécutée et vérifiée par des tests.

## Lot 0 — Fondation web

- [x] Structure Next.js App Router + React + TypeScript strict.
- [x] Styles responsive de la première page client.
- [x] Schéma de données initial : utilisateurs, vendeurs, produits, demandes, offres et commandes.
- [x] Client Prisma singleton.
- [x] API de création de demande avec validation Zod et rattachement au compte connecté.
- [x] Stockage séparé du texte original et du résumé anonymisé.
- [x] Limitation à la ville configurée via `PILOT_CITY` lorsque cette variable est renseignée.
- [x] Migrations Prisma initiale et ajout des champs de tarification rédigées.
- [ ] Installation des dépendances, génération Prisma, application des migrations et build — non exécutés depuis le connecteur GitHub.
- [ ] Tests automatisés — non créés / non exécutés.

## Lot 1 — Sécurité et comptes

- [x] Création de compte particulier et connexion e-mail / mot de passe.
- [x] Hachage des mots de passe avec bcrypt (coût 12).
- [x] Session signée de 7 jours dans un cookie HttpOnly, SameSite Strict et Secure en production.
- [x] Vérification de l'existence du compte et relecture du rôle depuis PostgreSQL à chaque session.
- [x] Contrôle serveur : seuls les comptes CUSTOMER peuvent créer une demande.
- [ ] Vérification de l'adresse e-mail et récupération / réinitialisation de compte.
- [ ] Rate limiting distribué sur l'inscription et la connexion, protection anti-abus et journalisation.
- [ ] Revue CSRF / origine et tests de sécurité avant ouverture publique.
- [ ] Validation RGPD : base légale, information, durée de conservation, export et suppression.
- [ ] Politique de rétention et procédure de suppression des données personnelles.
- [ ] Tests prouvant qu'aucun e-mail, téléphone, adresse privée ou texte brut n'est exposé aux vendeurs.

## Lot 2 — Espace professionnel

- [x] Inscription professionnelle rattachée à un compte authentifié.
- [x] Profil avec nom, description, spécialités, adresse et ville.
- [x] Nouveau profil inactif par défaut ; validation opérateur requise avant activation.
- [x] Premier tableau de bord vendeur avec statut de validation.
- [x] Console opérateur pour consulter, valider et suspendre les professionnels.
- [x] Catalogue produits avec catégories, unités, prix et disponibilités.
- [x] API catalogue protégée par rôle et propriété du vendeur.
- [ ] Zone desservie, horaires et modalités de réception.
- [x] Correspondance déterministe ville + spécialités et diffusion opérateur contrôlée.
- [x] Boîte de réception vendeur limitée aux données anonymisées.
- [x] Dépôt d'offres structurées avec calcul du montant côté serveur.
- [ ] Audit du matching et amélioration de la couverture des mots-clés.

## Lot 3 — Compréhension et diffusion

- [ ] Moteur AI Intent avec sortie JSON validée par schéma.
- [ ] Détection des informations manquantes et questions de clarification.
- [ ] Anonymisation renforcée et tests de non-divulgation.
- [ ] Matching par spécialité et proximité dans la seule zone pilote.
- [ ] Notifications et diffusion contrôlée aux vendeurs éligibles.

## Lot 4 — Offres et optimisation

- [ ] Soumission d'offres détaillées et validation des données.
- [x] Espace particulier pour consulter ses demandes et comparer les propositions reçues.
- [ ] Contrôle de conformité avec les contraintes du client.
- [ ] Comparaison prix / qualité déclarée / disponibilité / logistique.
- [ ] Combinaison multi-vendeurs avec coût complet et frais.
- [ ] Présentation transparente des compromis au client.

## Lot 5 — Commande et réception

- [x] Confirmation explicite d'une proposition par le client, avec contrôle du propriétaire et du statut.
- [x] Création transactionnelle d'une commande unique et rejet des propositions concurrentes.
- [x] Espace client de suivi de commande.
- [x] Espace vendeur pour faire progresser les statuts de préparation et de remise.
- [x] Parcours de retrait et de livraison avec adresse obligatoire pour la livraison.
- [ ] Notifications et suivi des états.
- [ ] Livraison par partenaires locaux, après contractualisation.
- [ ] Notifications et suivi des états.
- [ ] Paiement marketplace et reversements, après choix et configuration du prestataire. Aucun paiement n'est déclenché dans le parcours actuel.

## Lot 6 — Qualité et pilote terrain

- [ ] Tests unitaires, intégration et E2E.
- [ ] Audit sécurité, accessibilité et responsive.
- [ ] Monitoring, sauvegardes et procédure de restauration.
- [ ] Choix documenté de la ville pilote et recrutement des premiers vendeurs.
- [ ] Mesure des demandes, taux de réponse, propositions conformes, confirmations et commandes exécutées.

## Hors périmètre du MVP

Application mobile native, reconnaissance photo du réfrigérateur, prévision des achats, casiers réfrigérés, livraison autonome, IA prédictive avancée et marketplace internationale.
