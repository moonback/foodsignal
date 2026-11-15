# FOOD SIGNAL

FOOD SIGNAL est une marketplace alimentaire inversée : le particulier exprime son besoin, les commerçants et producteurs locaux répondent, puis la plateforme compare les offres et prépare une proposition que le client peut valider.

## État du dépôt

Le dépôt contenait les documents de concept et de cadrage, mais aucune application web existante. Cette branche introduit la fondation technique du MVP. **Elle ne constitue pas encore une marketplace opérationnelle** : authentification, espace vendeur, matching géographique, analyse IA, comparaison, commande, paiement et suivi restent à construire et vérifier.

## Stack retenue pour cette première fondation

- Next.js App Router, React et TypeScript strict
- Tailwind CSS 4
- PostgreSQL et Prisma
- Zod pour la validation des entrées

Ce choix reprend les recommandations web du concept, sans introduire NestJS, Redis, PostGIS ou un fournisseur de paiement tant que les besoins opérationnels ne sont pas validés.

## Démarrage local

1. Installer Node.js LTS et PostgreSQL.
2. Copier `.env.example` vers `.env` et renseigner `DATABASE_URL`.
3. Installer les dépendances : `npm install`.
4. Générer Prisma : `npm run db:generate`.
5. Créer la base : `npm run db:migrate`.
6. Démarrer : `npm run dev`.

Ouvrir `http://localhost:3000`.

## Variables d’environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL requise |
| `OPENAI_API_KEY` | Réservée à l’intégration IA à venir ; aucune analyse IA n’est activée par cette fondation |
| `OPENAI_MODEL` | Modèle envisagé pour l’analyse du besoin |
| `PILOT_CITY` | Ville du pilote, à choisir avant le lancement |
| `PILOT_COUNTRY` | Pays du pilote, `FR` par défaut dans le modèle de configuration |
| `NEXT_PUBLIC_APP_URL` | URL de l’application |

## Périmètre MVP issu des documents

1. Expression libre ou guidée du besoin et de ses contraintes.
2. Analyse, structuration JSON et clarification si nécessaire.
3. Anonymisation puis ciblage de vendeurs par spécialité et proximité.
4. Dépôt, centralisation et vérification des offres.
5. Comparaison et combinaison d’offres multi-vendeurs.
6. Validation client, choix retrait/livraison, commande et suivi.

L’application mobile native, la reconnaissance photo du réfrigérateur, la prévision des achats, les casiers réfrigérés, la livraison autonome, l’IA prédictive avancée et l’expansion internationale sont hors MVP.

## Sécurité et limites actuelles

- Le résumé anonymisé est stocké séparément de la description originale.
- L’API valide les champs entrants et masque certains motifs de coordonnées dans le résumé.
- **Ne pas déployer publiquement en l’état** : l’authentification et les autorisations ne sont pas encore implémentées. Le formulaire de démonstration ne doit pas être utilisé avec des données personnelles réelles avant sécurisation.
- La demande créée reste en brouillon : aucun vendeur n’est contacté et aucune offre réelle n’est inventée.
- Les paiements et la livraison ne sont pas intégrés.

## Prochain lot de développement

1. Authentification sécurisée et gestion des rôles client / vendeur / opérateur.
2. Onboarding professionnel, profil, spécialités et catalogue.
3. Analyse de l’intention avec schéma strict et clarification.
4. Matching local et diffusion contrôlée des demandes anonymisées.
5. Espace vendeur et soumission d’offres.
6. Comparateur multicritère, proposition et commande.
7. Choix retrait/livraison, suivi, notifications et intégration de paiement après validation des partenaires.
8. Tests unitaires, intégration, E2E, sécurité et responsive.

Les objectifs commerciaux présents dans les documents sont des hypothèses de travail, pas des résultats garantis.
