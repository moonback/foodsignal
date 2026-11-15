# Configuration Stripe pour FOOD SIGNAL

## Variables serveur

Configurer uniquement des secrets de test pendant le développement :

- `STRIPE_SECRET_KEY` : clé secrète du compte plateforme.
- `STRIPE_WEBHOOK_SECRET` : secret `whsec_...` associé à l'endpoint webhook.
- `FOOD_SIGNAL_PLATFORM_FEE_BPS` : taux de commission en points de base. Exemple : `500` représente 5 %. La valeur est volontairement obligatoire ; aucun taux commercial n'est présumé.
- `NEXT_PUBLIC_APP_URL` : URL publique de l'application utilisée pour les retours Checkout et Connect.

Ne jamais exposer les secrets Stripe dans une variable `NEXT_PUBLIC_*`, dans le navigateur, dans un dépôt Git ou dans les journaux.

## Configuration du compte plateforme

1. Activer Stripe Connect et vérifier que la plateforme peut créer des comptes connectés en France.
2. Utiliser les clés de test Stripe.
3. Vérifier le modèle de responsabilité, les frais de traitement, les remboursements et les litiges avant de décider du passage en production.
4. Vérifier auprès de Stripe la compatibilité de l'intégration Express actuelle avec le compte plateforme et la migration Accounts v2 recommandée pour les nouvelles intégrations.

L'intégration actuelle utilise les endpoints Express `/v1/accounts` et `/v1/account_links`. La création d'un compte connecté peut être refusée tant que le compte plateforme n'est pas activé pour Connect ou si les capacités demandées ne sont pas disponibles.

## Webhook local

Endpoint : `POST /api/stripe/webhook`

Avec Stripe CLI, lancer le transfert local :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copier le secret `whsec_...` affiché dans `STRIPE_WEBHOOK_SECRET`.

Événements traités :

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

La signature est vérifiée sur le corps HTTP brut et l'horodatage est limité à cinq minutes. Les événements répétés ne font pas repasser une commande déjà payée à un autre état.

## Parcours

1. Un vendeur actif démarre l'onboarding Connect depuis `/vendeur`.
2. Stripe collecte les informations de vérification et de versement du vendeur.
3. Le serveur relit les capacités `transfers` et `payouts` auprès de Stripe.
4. Le client ouvre Checkout depuis la page de commande.
5. Checkout crée un paiement sur la plateforme avec transfert de destination vers le vendeur et commission plateforme si elle est configurée.
6. Le webhook signé confirme le paiement ; le vendeur peut alors démarrer la préparation.

## Modèle financier et limites

Le modèle utilisé est celui des destination charges. Stripe indique que les frais de traitement des paiements indirects sont prélevés sur le solde de la plateforme. La plateforme porte également les responsabilités associées aux paiements, remboursements et litiges selon la configuration Connect retenue. Ne pas activer le mode réel sans examen juridique, comptable et contractuel.

Le taux configuré est plafonné techniquement à 30 % (3 000 points de base), mais aucun taux n'est défini par défaut. Les montants sont en euros et en centimes.

Pas encore implémentés : remboursements, transferts inversés, litiges, rapprochement des frais, notifications, gestion des événements de compte connecté et réconciliation périodique. La préparation vendeur est bloquée jusqu'au webhook de paiement confirmé.

## Vérifications requises avant production

- Exécuter les migrations et `prisma generate`.
- Effectuer un cycle complet avec cartes de test et Stripe CLI.
- Tester les paiements asynchrones, les événements dupliqués, l'expiration et les erreurs réseau.
- Valider la configuration Connect pour la France et la stratégie Accounts v2.
- Configurer les URL de retour en HTTPS.
- Vérifier les conditions commerciales, les mentions client, les factures, la TVA, les remboursements, les litiges et les obligations RGPD.
