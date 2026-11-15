# FOOD SIGNAL

FOOD SIGNAL est une marketplace alimentaire inversée : le particulier exprime son besoin, les commerçants et producteurs locaux répondent, puis la plateforme compare les offres et prépare une proposition que le client peut valider.

## État du dépôt

Cette branche contient une fondation web MVP et un premier parcours sécurisé de comptes / professionnels. **Ce n'est pas encore une marketplace opérationnelle** : la validation opérateur, le catalogue, le matching, l'analyse IA, la diffusion des demandes, les offres, la commande, le paiement et le suivi restent à construire.

## Stack

- Next.js App Router, React 19 et TypeScript strict
- Tailwind CSS 4
- PostgreSQL et Prisma 6
- Zod pour la validation des entrées
- bcryptjs pour le hachage des mots de passe
- jose pour les sessions signées

## Démarrage local

1. Installer Node.js LTS et PostgreSQL.
2. Copier `.env.example` vers `.env`.
3. Renseigner `DATABASE_URL`.
4. Générer un secret aléatoire d'au moins 32 caractères pour `AUTH_SECRET`. Exemple : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
5. Installer les dépendances : `npm install`.
6. Générer Prisma : `npm run db:generate`.
7. Créer la base : `npm run db:migrate`.
8. Démarrer : `npm run dev`.

Ouvrir `http://localhost:3000`.

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL requise |
| `AUTH_SECRET` | Secret serveur de signature des sessions, 32 caractères minimum ; ne jamais le publier |
| `OPENAI_API_KEY` | Réservée à l'intégration IA à venir ; aucune analyse IA n'est active |
| `OPENAI_MODEL` | Modèle envisagé pour l'analyse du besoin |
| `PILOT_CITY` | Ville du pilote, à choisir avant le lancement |
| `PILOT_COUNTRY` | Pays du pilote, `FR` par défaut |
| `NEXT_PUBLIC_APP_URL` | URL de l'application |

## Parcours actuellement implémentés

### Particulier
- Création de compte et connexion.
- Mot de passe haché avec bcrypt.
- Session signée 7 jours dans un cookie HttpOnly, SameSite Strict et Secure en production.
- Dépôt d'une demande réservé au rôle CUSTOMER ; les coordonnées sont lues depuis le compte, pas depuis le navigateur.
- Description originale et résumé anonymisé stockés séparément.

### Professionnel
- Inscription depuis un compte connecté.
- Profil de commerce, adresse, ville et spécialités.
- Profil créé inactif : aucune demande n'est envoyée au professionnel avant validation.
- Tableau de bord affichant le statut de validation.

### Sécurité : limites à traiter avant un pilote public

- Les rôles sont relus depuis PostgreSQL à chaque requête authentifiée afin qu'une modification de rôle ou suppression de compte prenne effet sans attendre l'expiration du jeton.
- L'auto-inscription ne permet pas de choisir le rôle OPERATOR.
- La session ne peut pas être lue par JavaScript côté navigateur (cookie HttpOnly).
- **Il manque encore** la vérification d'e-mail, la récupération de mot de passe, le rate limiting distribué, les tests CSRF / origine, les procédures RGPD, les tests automatisés et l'audit sécurité.
- Le masquage des coordonnées dans le résumé reste heuristique et ne garantit pas une anonymisation parfaite.
- Ne pas déployer publiquement ni traiter de données personnelles réelles avant d'avoir achevé les contrôles manquants et vérifié le build.

## Périmètre MVP cible

1. Expression libre ou guidée du besoin et de ses contraintes.
2. Analyse, structuration JSON et clarification si nécessaire.
3. Anonymisation puis ciblage de vendeurs par spécialité et proximité.
4. Dépôt, centralisation et vérification des offres.
5. Comparaison et combinaison d'offres multi-vendeurs.
6. Validation client, choix retrait/livraison, commande et suivi.

L'application mobile native, la reconnaissance photo du réfrigérateur, la prévision des achats, les casiers réfrigérés, la livraison autonome, l'IA prédictive avancée et l'expansion internationale sont hors MVP.

Consulter [ROADMAP.md](./ROADMAP.md) pour le détail des lots. Les objectifs commerciaux présents dans les documents sont des hypothèses de travail, pas des résultats garantis.
