# Remboursements et litiges Stripe

## Remboursement intégral (opérateur)

Endpoint : `POST /api/operator/orders/:id/refund`

Corps JSON : `{"reason":"Motif opérationnel détaillé"}`.

- Réservé au rôle `OPERATOR`, vérifié côté serveur.
- Uniquement les commandes dont le paiement est confirmé (`PAID`).
- Remboursement intégral uniquement : aucun remboursement partiel n'est exposé.
- La demande est enregistrée avant l'appel Stripe avec une clé d'idempotence stable par commande.
- Le remboursement Stripe inclut `reverse_transfer=true` et `refund_application_fee=true` : le transfert vendeur et la commission plateforme sont ajustés avec le remboursement du client.
- L'état local est confirmé par la réponse Stripe et/ou les webhooks de remboursement. Vérifier le Dashboard Stripe en cas d'erreur ambiguë avant toute intervention manuelle.

Une tentative marquée `FAILED` bloque une nouvelle tentative automatique : l'opérateur doit rapprocher l'état Stripe avant d'agir. La route ne décide pas de l'éligibilité juridique du client et ne remplace pas la politique commerciale / CGV.

## Litiges / chargebacks

Le webhook signé enregistre ou actualise les événements `charge.dispute.created`, `charge.dispute.updated` et `charge.dispute.closed` dans `StripeDispute`, associés à la commande via le PaymentIntent.

Cette version assure la traçabilité en base, pas le traitement du dossier : aucune réponse automatique à Stripe, collecte de preuves, soumission d'évidence, notification opérateur ou reversal automatique de transfert n'est déclenché. Un litige doit être examiné dans le Dashboard Stripe sans délai. Le reversement des fonds au titre d'un litige n'est volontairement pas automatisé : il dépend de la stratégie de responsabilité, du solde du compte connecté et des conditions Connect.

## Tests avant activation

- Utiliser exclusivement des clés et comptes Stripe de test.
- Vérifier remboursement intégral, double clic / requête concurrente, webhooks rejoués et échec réseau après création Stripe.
- Vérifier que le vendeur reçoit bien la reversal et que la commission est remboursée.
- Simuler les événements dispute et vérifier l'association au PaymentIntent.
- Faire valider les procédures, CGV, délais et responsabilités par les personnes compétentes.
