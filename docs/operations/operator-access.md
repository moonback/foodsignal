# Accès opérateur FOOD SIGNAL

Le rôle `OPERATOR` ne peut jamais être choisi depuis l'inscription publique. Le premier opérateur doit être promu manuellement par une personne disposant déjà d'un accès administrateur à PostgreSQL.

## Procédure initiale

1. Démarrer l'application avec les migrations appliquées.
2. Créer un compte personnel via `/compte` avec une adresse e-mail contrôlée par l'équipe.
3. Se connecter à PostgreSQL avec un compte administrateur via un canal sécurisé.
4. Vérifier l'adresse et promouvoir exactement ce compte :

```sql
UPDATE "User"
SET "role" = 'OPERATOR', "updatedAt" = CURRENT_TIMESTAMP
WHERE lower("email") = lower('operator@example.com')
RETURNING "id", "email", "role";
```

5. Vérifier qu'une seule ligne a été retournée et que l'adresse correspond bien à l'opérateur désigné.
6. Se déconnecter puis se reconnecter : les rôles sont relus depuis la base à chaque requête authentifiée.
7. Ouvrir `/operateur`.

## Bonnes pratiques

- Remplacer l'adresse d'exemple par l'adresse vérifiée ; ne jamais exécuter le SQL sans contrôle.
- Ne pas exposer de console SQL sur Internet.
- Limiter le nombre d'opérateurs et utiliser des comptes individuels.
- Révoquer immédiatement le rôle en cas de départ : `UPDATE "User" SET "role" = 'CUSTOMER' WHERE "id" = '…';`
- Prévoir MFA / SSO pour les comptes opérateurs avant un lancement public.
- Conserver une trace des validations et suspensions dans un journal d'audit : ce journal reste à implémenter.

La console actuelle permet l'activation et la suspension. Elle ne réalise pas encore la vérification documentaire ou juridique des établissements.


## Journal de traçabilité

Les actions d'activation / suspension d'un vendeur et de diffusion d'une demande créent un enregistrement dans OperatorAuditLog au sein de la même transaction que l'action métier. Les demandes de remboursement Stripe sont également journalisées après l'appel Stripe. La console affiche les 12 événements les plus récents.

Ce journal applicatif est utile au suivi opérationnel, mais un opérateur disposant d'un accès direct à la base pourrait le modifier. Avant la production, prévoir un export externe à accès restreint, une politique de rétention, des alertes et une authentification renforcée (MFA / SSO).
