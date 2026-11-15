# FOOD SIGNAL

FOOD SIGNAL est une marketplace alimentaire inversée : le particulier exprime son besoin, les commerçants et producteurs locaux répondent, puis la plateforme compare les offres et prépare une proposition que le client peut valider.

## État du dépôt

Le dépôt contient un parcours MVP partiel : comptes, espaces opérateur et commerçant, catalogue, diffusion opérateur des demandes avec classement explicable des vendeurs, propositions commerciales, confirmation de commande et suivi de retrait / livraison. **Ce n'est pas encore prêt pour un lancement public** : le paiement est intégré en mode configurable mais non validé en conditions Stripe, les notifications e-mail / push, l'analyse IA, le matching géographique avancé, les contrôles de sécurité complémentaires et les tests restent à traiter.

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
| `NEXT_PUBLIC_APP_URL` | URL publique de l'application, utilisée pour les retours Stripe |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (commencer par une clé de test) |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature de l'endpoint webhook Stripe |
| `FOOD_SIGNAL_PLATFORM_FEE_BPS` | Commission explicite en points de base (ex. 500 = 5 %) ; obligatoire pour ouvrir Checkout |

## Parcours actuellement implémentés

### Particulier
- Création de compte et connexion.
- Mot de passe haché avec bcrypt.
- Session signée 7 jours dans un cookie HttpOnly, SameSite Strict et Secure en production.
- Dépôt d'une demande réservé au rôle CUSTOMER ; les coordonnées sont lues depuis le compte, pas depuis le navigateur.
- Description originale et résumé anonymisé stockés séparément.
- Historique personnel des demandes et comparaison des propositions reçues.
- Confirmation d'une proposition et suivi de commande sur `/commandes/[id]`.
- Paiement via Stripe Checkout, redirection hébergée et statut confirmé uniquement par webhook signé.
- Centre de notifications intégré (inbox persistante, compteur de non-lues, lecture individuelle / globale) pour les confirmations, paiements, étapes de commande, remboursements et litiges.

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
- Connexion du compte Stripe Express du commerçant et vérification des capacités de transfert / versement.
- Le commerçant ne peut démarrer la préparation qu'après confirmation du paiement par webhook Stripe.
- Centre de notifications intégré dans son espace professionnel.

### Opérateur
- Console de revue des professionnels inscrits.
- Activation et suspension des comptes vendeurs.
- Compteurs de profils en attente et actifs.
- Les routes d'administration exigent le rôle OPERATOR côté serveur.
- Classement déterministe des vendeurs actifs de la même ville : adéquation des spécialités (50 points), présence de produits du catalogue (35 points) et indice budgétaire (15 points).
- Diffusion opérateur aux 10 meilleurs candidats dépassant le seuil de 25/100 ; les motifs et scores sont visibles avant l'envoi.
- Le budget est un signal indicatif fondé sur le prix d'au moins un produit pertinent, pas une estimation du panier complet. Le score ne prouve ni disponibilité réelle, ni capacité de livraison, ni prix final.
- Notifications opérateur pour les remboursements et les litiges Stripe.
- Les vendeurs ne reçoivent que le résumé anonymisé, la ville, le budget et les modalités, sans les coordonnées client ni la description brute.

Pour attribuer le premier rôle opérateur, créer un compte par le parcours normal puis exécuter manuellement la procédure SQL documentée dans [docs/operations/operator-access.md](./docs/operations/operator-access.md). Aucun endpoint public ne permet l'auto-attribution du rôle opérateur.

### Sécurité : limites à traiter avant un pilote public

- Les rôles sont relus depuis PostgreSQL à chaque requête authentifiée afin qu'une modification de rôle ou suppression de compte prenne effet sans attendre l'expiration du jeton.
- L'auto-inscription ne permet pas de choisir le rôle OPERATOR.
- La session ne peut pas être lue par JavaScript côté navigateur (cookie HttpOnly).
- **Il manque encore** la vérification d'e-mail, la récupération de mot de passe, le rate limiting distribué, les tests CSRF / origine, les procédures RGPD, les tests automatisés, l'audit sécurité et les scénarios de remboursement / litige.
- Le masquage des coordonnées dans le résumé reste heuristique et ne garantit pas une anonymisation parfaite.
- Ne pas déployer publiquement ni traiter de données personnelles réelles avant d'avoir achevé les contrôles manquants et vérifié le build.

## Périmètre MVP cible

1. Expression libre ou guidée du besoin et de ses contraintes.
2. Analyse, structuration JSON et clarification si nécessaire.
3. Anonymisation puis ciblage de vendeurs par spécialité et proximité.
4. Dépôt, centralisation et vérification des offres.
5. Comparaison des offres reçues.
6. Validation d'une offre, commande unique et suivi des étapes de préparation / remise.
7. Paiement marketplace via Stripe Checkout et Connect (intégration technique présente, validation réelle et remboursements encore à traiter).

L'application mobile native, la reconnaissance photo du réfrigérateur, la prévision des achats, les casiers réfrigérés, la livraison autonome, l'IA prédictive avancée et l'expansion internationale sont hors MVP.

Consulter [ROADMAP.md](./ROADMAP.md) pour le détail des lots. Les objectifs commerciaux présents dans les documents sont des hypothèses de travail, pas des résultats garantis.


## Cycle de commande actuellement implémenté

- Le client peut confirmer une proposition encore disponible pour l'une de ses demandes.
- Une demande ne peut recevoir qu'une seule commande ; la confirmation et le rejet des autres propositions sont exécutés dans une transaction.
- Pour une livraison, l'adresse est obligatoire ; pour un retrait, aucune adresse de livraison n'est enregistrée.
- Le montant est recalculé côté serveur à partir de la proposition : produits + préparation, et frais de livraison uniquement si le client choisit la livraison.
- Le commerçant ne peut faire évoluer que les commandes associées à sa proposition acceptée.
- Les transitions autorisées sont : confirmée → préparation → prête au retrait → terminée, ou confirmée → préparation → en livraison → terminée.
- Le paiement Stripe est activable uniquement avec des clés, un webhook et un taux de commission explicitement configurés. Les paiements de test doivent être utilisés avant toute activation réelle.
- Les remboursements intégraux sont réservés à l'opérateur et demandent la reversal du transfert vendeur ainsi que le remboursement de la commission ; les litiges sont enregistrés pour suivi, sans traitement automatique.
- Le vendeur connecte son compte Stripe Express depuis son tableau de bord ; l'état des capacités de transfert et de versement est relu auprès de Stripe.
- Le client est redirigé vers Stripe Checkout. Le retour navigateur ne valide jamais un paiement : seul le webhook signé met la commande à l'état payé.
- Les commandes non payées ne peuvent pas passer en préparation. Les sessions expirées ou échouées peuvent être retentées.
- Le modèle Checkout utilise des destination charges avec commission explicite. FOOD SIGNAL supporte les frais de traitement Stripe et assume la responsabilité financière de la plateforme associée à ce modèle ; vérifier les obligations contractuelles et le modèle de risque avant production.

## Vérification technique

Les fichiers ont été ajoutés via l'API GitHub. Un script `npm test` et une suite de tests unitaires du matching (`tests/matching.test.cjs`) sont maintenant présents. Ils n'ont toutefois pas été exécutés dans cet environnement. Les dépendances, Prisma Client, migrations, lint, typecheck et build n'ont pas non plus été exécutés. Ne pas considérer le lot comme validé pour la production avant exécution locale de ces contrôles.


## Remboursements et litiges Stripe

- L'endpoint opérateur `POST /api/operator/orders/:id/refund` permet un remboursement intégral des commandes payées, avec motif obligatoire et clé d'idempotence.
- Le remboursement Stripe demande également la reversal du transfert vendeur et le remboursement de la commission plateforme.
- Les événements de litige Stripe sont persistés dans `StripeDispute` pour suivi ; aucune réponse ou reversal de litige n'est automatisée.
- Ce lot ne couvre pas les remboursements partiels, l'interface opérateur, les notifications ni le rapprochement comptable. Consulter [la procédure Stripe](./docs/operations/stripe-refunds-disputes.md).


## Console opérateur — paiements

La console `/operateur` présente les 100 commandes les plus récentes, les paiements confirmés, remboursements et litiges Stripe. Les opérateurs peuvent déclencher un remboursement intégral depuis la fiche de commande après saisie d'un motif. Les événements de litige restent à traiter dans le Dashboard Stripe ; la console sert au suivi et n'envoie aucune preuve ni réponse automatiquement.


## Notifications intégrées

Le centre de notifications persistant est accessible depuis les espaces client, vendeur et opérateur. Les événements de confirmation de commande, paiement confirmé par webhook, changement de statut vendeur, remboursement et litige créent des notifications ciblées. Le compteur de non-lues est actualisé périodiquement et les utilisateurs peuvent marquer une notification ou toute leur inbox comme lue. Les notifications sont dédupliquées par utilisateur et événement.

Ce lot fournit des notifications dans l’application uniquement. Aucun e-mail, SMS, notification push mobile ou service externe n’est envoyé ; ces canaux nécessitent un fournisseur, une configuration et les préférences / consentements appropriés.


## Matching vendeur — première version explicable

Le moteur actuel reste déterministe et sans appel à un fournisseur IA. Il détecte des catégories à partir du résumé anonymisé, élimine les vendeurs inactifs ou situés dans une autre ville, puis classe les candidats selon trois signaux vérifiables : spécialités déclarées (50 points), produits disponibles du catalogue (35 points) et indice budgétaire indicatif (15 points). Seuls les dix meilleurs candidats ayant au moins 25/100 sont proposés à la diffusion opérateur.

La console affiche le nombre de candidats, les meilleurs scores et les raisons principales. La diffusion reste une action explicite de l'opérateur. Les coordonnées personnelles et la description originale ne sont jamais utilisées par ce moteur ni transmises aux vendeurs. Les contraintes de quantité, la disponibilité à une date précise, la zone de livraison, le rayon géographique, la conformité détaillée des lignes et l'optimisation multi-vendeurs ne sont pas encore modélisés par ce score.
