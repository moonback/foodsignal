# FOOD SIGNAL

FOOD SIGNAL est une marketplace alimentaire inversée : le particulier exprime son besoin, les commerçants et producteurs locaux répondent, puis la plateforme compare les offres et prépare une proposition que le client peut valider.

## État du dépôt

Le dépôt contient un parcours MVP partiel : comptes, espaces opérateur et commerçant, catalogue, diffusion manuelle des demandes, propositions commerciales, confirmation de commande et suivi de retrait / livraison. **Ce n'est pas encore prêt pour un lancement public** : le paiement, les notifications, l'analyse IA, le matching géographique avancé, les contrôles de sécurité complémentaires et les tests restent à traiter.

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
- Historique personnel des demandes et comparaison des propositions reçues.
- Confirmation d'une proposition et suivi de commande sur `/commandes/[id]`.

### Professionnel
- Inscription depuis un compte connecté.
- Profil de commerce, adresse, ville et spécialités.
- Profil créé inactif : aucune demande n'est envoyée au professionnel avant validation.
- Tableau de bord affichant le statut de validation.
- Catalogue produits : catégorie, unité, prix en centimes, description et disponibilité.
- Ajout, modification, suppression et bascule de disponibilité ; les opérations sont limitées au vendeur propriétaire.
- Boîte de réception des demandes qui lui sont attribuées.
- Dépôt d'offres détaillées avec sous-total calculé côté serveur.
- Gestion des commandes acceptées : préparation, prêt au retrait ou départ en livraison, puis confirmation de remise.

### Opérateur
- Console de revue des professionnels inscrits.
- Activation et suspension des comptes vendeurs.
- Compteurs de profils en attente et actifs.
- Les routes d'administration exigent le rôle OPERATOR côté serveur.
- Diffusion manuelle des demandes aux vendeurs actifs de la même ville dont les spécialités correspondent.
- Les vendeurs ne reçoivent que le résumé anonymisé, la ville, le budget et les modalités, sans les coordonnées client ni la description brute.

Pour attribuer le premier rôle opérateur, créer un compte par le parcours normal puis exécuter manuellement la procédure SQL documentée dans [docs/operations/operator-access.md](./docs/operations/operator-access.md). Aucun endpoint public ne permet l'auto-attribution du rôle opérateur.

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
5. Comparaison des offres reçues.
6. Validation d'une offre, commande unique et suivi des étapes de préparation / remise.
7. Paiement marketplace, reversements et notifications (non implémentés).

L'application mobile native, la reconnaissance photo du réfrigérateur, la prévision des achats, les casiers réfrigérés, la livraison autonome, l'IA prédictive avancée et l'expansion internationale sont hors MVP.

Consulter [ROADMAP.md](./ROADMAP.md) pour le détail des lots. Les objectifs commerciaux présents dans les documents sont des hypothèses de travail, pas des résultats garantis.


## Cycle de commande actuellement implémenté

- Le client peut confirmer une proposition encore disponible pour l'une de ses demandes.
- Une demande ne peut recevoir qu'une seule commande ; la confirmation et le rejet des autres propositions sont exécutés dans une transaction.
- Pour une livraison, l'adresse est obligatoire ; pour un retrait, aucune adresse de livraison n'est enregistrée.
- Le montant est recalculé côté serveur à partir de la proposition : produits + préparation, et frais de livraison uniquement si le client choisit la livraison.
- Le commerçant ne peut faire évoluer que les commandes associées à sa proposition acceptée.
- Les transitions autorisées sont : confirmée → préparation → prête au retrait → terminée, ou confirmée → préparation → en livraison → terminée.
- Aucun paiement n'est encaissé et aucune livraison n'est commandée auprès d'un partenaire.

## Vérification technique

Les fichiers ont été ajoutés via l'API GitHub. Les dépendances, Prisma Client, migrations, lint, typecheck, tests et build n'ont pas été exécutés dans cet environnement. Ne pas considérer le lot comme validé pour la production avant exécution locale de ces contrôles.
