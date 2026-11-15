# Business Plan — FOOD SIGNAL

> **Note méthodologique.** Ce plan s’appuie exclusivement sur les sources fournies. Les volumes de lancement sont des objectifs de travail, non des résultats garantis. Les données financières, les tailles de marché et plusieurs paramètres commerciaux ne sont pas précisés ; ils sont signalés comme tels plutôt que supposés.

## 1. 📋 Résumé exécutif

### Vision et mission

**FOOD SIGNAL** ambitionne de devenir un marché alimentaire organisé à partir de la demande du consommateur. Au lieu de parcourir les catalogues de magasins, le client exprime ce qu’il souhaite acheter, ses quantités, son budget, son lieu et son échéance. La plateforme comprend ce besoin, le transmet aux commerçants et producteurs pertinents, compare leurs propositions et présente une combinaison que le client peut accepter.

La mission est ainsi de simplifier l’achat alimentaire tout en donnant aux commerçants locaux une nouvelle voie pour répondre aux besoins des clients et générer des ventes additionnelles. Le projet se positionne comme une **entreprise technologique de mise en relation et d’orchestration**, et non comme un simple service de livraison.

### Proposition de valeur unique

FOOD SIGNAL relie, dans un parcours intégré :

1. l’expression libre ou guidée d’un besoin alimentaire ;
2. son analyse par IA et sa structuration en données exploitables ;
3. l’interrogation ciblée de vendeurs selon leur spécialité et leur proximité ;
4. la réception et la comparaison de propositions commerciales ;
5. la composition éventuelle d’un panier issu de plusieurs vendeurs ;
6. le choix entre livraison et retrait, avec suivi de la commande.

La différenciation repose donc moins sur une fonction isolée d’intelligence artificielle que sur l’organisation complète d’un marché où **la demande déclenche la réponse de l’offre**.

### Objectifs

| Horizon | Objectifs issus des sources |
|---|---|
| Court terme — pilote | Lancer dans une zone géographique compacte avec une application web responsive, environ 15 commerçants actifs, 300 clients actifs et 300 commandes par mois. |
| Développement | Atteindre les objectifs de travail de 50 commerçants actifs, 2 000 clients actifs et 2 500 commandes mensuelles. |
| Expansion | Viser 150 commerçants actifs, 8 000 clients actifs et 10 000 commandes mensuelles, après validation du modèle dans une première zone. |

Les périodes correspondant à ces étapes ne sont pas précisées dans les sources.

---

## 2. 🎯 Problème & Solution

### Problème identifié

Le parcours commercial traditionnel commence par l’offre : le client consulte un catalogue, choisit les produits disponibles, puis passe commande. Cette logique suppose que le client sache où trouver les produits souhaités et accepte de parcourir les offres existantes.

FOOD SIGNAL propose de partir du besoin. Cette approche vise notamment à rendre plus simple une demande qui comporte plusieurs dimensions : produits, quantités, budget, lieu, date ou créneau de réception. Elle peut également concerner plusieurs catégories ou vendeurs — par exemple, réunir des légumes d’un primeur et de la viande d’un boucher.

Les sources décrivent ce problème fonctionnel, mais ne quantifient pas son ampleur : taux d’insatisfaction, temps passé à faire ses courses, demande non satisfaite ou pertes commerciales des vendeurs. **[Information non disponible dans les sources]**

### Solution proposée

Le parcours pilote est conçu comme une chaîne de traitement complète :

1. **Expression du besoin.** Le particulier saisit sa demande en langage naturel ou à l’aide de formulaires guidés. Il peut préciser un budget maximal, une date ou un créneau, et une adresse ou un point de retrait.
2. **Analyse par IA.** Le moteur identifie l’intention, les produits, les quantités et les contraintes. Il demande des précisions lorsque le besoin n’est pas suffisamment clair et convertit les données en format structuré, notamment en JSON.
3. **Diffusion ciblée.** La demande est transmise de manière anonymisée aux professionnels pertinents, sélectionnés selon leur spécialité et leur proximité avec le lieu souhaité.
4. **Réponse des vendeurs.** Les commerçants précisent les produits proposés, les quantités, les prix ainsi que les conditions de livraison ou de retrait.
5. **Comparaison et optimisation.** L’IA vérifie la conformité des offres et les évalue selon le prix, la qualité, la disponibilité et la logistique. Elle peut combiner les réponses de plusieurs vendeurs.
6. **Validation par le client.** Celui-ci examine les produits, vendeurs, prix total et modalités de réception, puis confirme ou non la proposition.
7. **Préparation et réception.** Les commerçants sont informés de la commande. Le client choisit la livraison par un partenaire local ou le retrait, et peut suivre l’état de la commande.

### Avantage concurrentiel

- **Parcours inversé :** la demande précède la constitution de l’offre.
- **Offres locales ciblées :** les commerçants sont sollicités en fonction de leur spécialité et de leur proximité.
- **Comparaison multicritère :** l’optimisation ne repose pas seulement sur le prix, mais aussi sur la qualité déclarée, la disponibilité et la logistique.
- **Paniers multi-vendeurs :** la plateforme peut assembler une réponse couvrant plusieurs besoins auprès de différents professionnels.
- **Contrôle commercial préservé :** les vendeurs déterminent leurs prix, leurs disponibilités et leurs conditions.
- **Architecture évolutive :** les sources recommandent une architecture modulaire et un MVP limité, afin de tester l’adoption avant d’étendre les fonctionnalités.

Ces avantages restent des propositions de valeur à valider sur le terrain ; aucun résultat comparatif avec des concurrents n’est documenté.

---

## 3. 📊 Modèle économique

### Sources de revenus

Le modèle envisagé comporte plusieurs niveaux :

1. **Commission sur les commandes.** Pendant le pilote, FOOD SIGNAL prélève une commission réduite sur les ventes réalisées par son intermédiaire. Aucun abonnement fixe ni frais de référencement n’est demandé aux commerçants.
2. **Frais de service.** Le concept mentionne des frais de service comme revenu complémentaire de la plateforme. Leur montant, leur mode de calcul et leur répartition entre client et vendeur ne sont pas précisés.
3. **Revenus professionnels ultérieurs.** Des revenus complémentaires destinés aux professionnels sont envisagés à développer ensuite, sans détail de produit ou de tarification disponible.
4. **Frais de livraison.** Ils sont facturés au client final, sauf accord spécifique, et reversés au prestataire selon le modèle décrit. Ils ne doivent donc pas être assimilés automatiquement à une marge de la plateforme.

### Pricing et marges

| Élément | Situation documentée |
|---|---|
| Commission vendeur | Commission réduite pendant le pilote ; taux exact non disponible. |
| Abonnement commerçant | Aucun frais fixe pendant le pilote. |
| Référencement | Pas de frais de référencement pendant le pilote. |
| Frais de service | Source de revenu envisagée ; montant et conditions non disponibles. |
| Livraison | À la charge du client, sauf accord spécifique ; intégrée au prix total présenté pour la proposition validée et reversée au prestataire selon le concept. |
| Marge nette | Non calculable sans taux de commission, coûts variables, coûts d’acquisition et coûts d’exploitation détaillés. |

Le concept fournit un exemple de **5 500 € de commissions** et **1 000 € de frais de service**, soit **6 500 € de chiffre d’affaires théorique de plateforme**. Il précise que ce montant est avant frais de paiement, personnel, technologie, acquisition, remboursements, fiscalité et autres charges. Les hypothèses à l’origine de cet exemple ne sont pas détaillées : il ne peut donc pas être associé de manière fiable à une phase ou à un volume de commandes.

### Structure de coûts

Les postes de coûts explicitement identifiables ou mentionnés dans les sources sont :

- développement et maintenance de la plateforme web et du backend ;
- utilisation de modèles d’IA et traitements de données ;
- infrastructure cloud, bases de données, recherche et monitoring ;
- frais de paiement ;
- acquisition et accompagnement des clients et commerçants ;
- personnel ;
- remboursements et coûts liés aux transactions ;
- fiscalité et autres charges ;
- coordination logistique, même si la livraison est destinée à être facturée au client et reversée au prestataire.

Les montants, effectifs et coûts unitaires sont **[Information non disponible dans les sources]**.

Les technologies recommandées comprennent notamment Next.js et TypeScript pour le web, NestJS pour le backend, PostgreSQL et PostGIS pour les données et la géolocalisation, Redis, une API de modèle de langage, Python et OR-Tools pour l’optimisation, un prestataire de paiement marketplace, ainsi qu’une infrastructure cloud européenne. Cette architecture constitue une recommandation technique, pas un budget validé.

### Projections de volume et rentabilité

Les objectifs de travail donnent lieu aux volumes d’affaires mensuels suivants, calculés à partir du nombre de commandes et du panier moyen hypothétique :

| Phase | Commandes/mois | Panier moyen hypothétique | Volume d’affaires mensuel estimé |
|---|---:|---:|---:|
| Pilote | 300 | 45 € | 13 500 € |
| Développement | 2 500 | 50 € | 125 000 € |
| Expansion | 10 000 | 55 € | 550 000 € |

Ces montants représentent le **volume d’affaires des vendeurs**, et non le chiffre d’affaires de FOOD SIGNAL. Les projections de revenus de la plateforme ne peuvent pas être calculées sans le taux de commission et les règles de frais de service. La rentabilité, le seuil de rentabilité et les besoins de financement sont donc **[Information non disponible dans les sources]**.

---

## 4. 👥 Marché cible

### Segments de clientèle

**Particuliers**

- personnes souhaitant décrire un besoin plutôt que parcourir une offre ;
- clients ayant des contraintes de budget, de quantité, de lieu ou de date ;
- clients souhaitant recevoir des produits de plusieurs catégories ;
- utilisateurs préférant la livraison à domicile ou le retrait chez le commerçant.

**Commerçants et producteurs**

- commerces alimentaires indépendants, dont bouchers, primeurs et boulangers ;
- producteurs locaux ;
- professionnels capables de répondre à des demandes ponctuelles avec des quantités, prix et disponibilités définis.

Les sources recommandent d’évaluer une zone pilote selon la densité de commerces alimentaires, la présence de producteurs et fournisseurs, le nombre de commerces indépendants et la densité de population.

### Taille de marché : TAM, SAM et SOM

Aucune donnée de population, de dépenses alimentaires, de nombre de clients potentiels, de nombre de commerçants par territoire ou de part de marché n’est fournie. Les valeurs de **TAM**, **SAM** et **SOM** ne peuvent donc pas être chiffrées sans introduire des données externes.

| Indicateur | Définition de travail pour FOOD SIGNAL | État |
|---|---|---|
| TAM | Ensemble des dépenses ou besoins alimentaires susceptibles d’être adressés par le modèle | [Information non disponible dans les sources] |
| SAM | Part du TAM accessible dans les zones desservies et avec les catégories prises en charge | [Information non disponible dans les sources] |
| SOM | Part atteignable à court terme dans la zone pilote compte tenu de l’offre et de la demande activées | Les objectifs pilotes sont de 300 clients actifs, 15 commerçants actifs et 300 commandes par mois ; ils ne constituent pas une estimation de part de marché. |

### Personas et besoins

Les personas suivants sont des profils fonctionnels déduits des parcours décrits ; ils ne représentent pas une étude qualitative documentée.

| Persona | Besoin principal | Réponse de FOOD SIGNAL |
|---|---|---|
| **Le foyer organisé** | Composer un panier selon un budget et une date précise, éventuellement auprès de plusieurs vendeurs. | Saisie guidée ou libre, structuration du besoin et proposition combinée. |
| **Le client contraint par le temps** | Exprimer rapidement ce qu’il souhaite et choisir entre livraison et retrait. | Analyse du besoin, offres centralisées et options de réception. |
| **Le commerçant de proximité** | Recevoir des demandes locales pertinentes sans payer d’abonnement fixe pendant le pilote. | Diffusion ciblée et anonymisée, réponse avec ses propres prix et disponibilités. |
| **Le producteur local** | Être proposé aux clients susceptibles de rechercher ses produits dans sa zone. | Matching par spécialité et proximité, puis comparaison avec d’autres offres. |

---

## 5. 🚀 Stratégie de mise en marché

### Principes de lancement

Le lancement doit commencer dans **une seule zone géographique compacte**. Cette concentration permet de tester simultanément l’adoption des clients, la participation des commerçants et la capacité à exécuter les commandes. Les sources déconseillent un lancement généralisé avant validation du fonctionnement local.

Le MVP recommandé est une **application web responsive**. Une application mobile native, les casiers réfrigérés, la livraison autonome, la reconnaissance photo du réfrigérateur, la prévision avancée et l’internationalisation sont explicitement différés.

### Canaux d’acquisition

Les sources ne définissent pas de plan média, de budget publicitaire ni de canaux précis tels que publicité, référencement ou réseaux sociaux. **[Information non disponible dans les sources]**

Les leviers commerciaux directement cohérents avec le fonctionnement documenté sont :

- recrutement de commerçants et producteurs dans la zone pilote ;
- mise en avant de l’absence d’abonnement et de frais de référencement durant le pilote ;
- démonstration de la visibilité locale et du potentiel de ventes additionnelles ;
- acquisition de clients autour de demandes concrètes auxquelles les vendeurs locaux peuvent répondre ;
- attention à la densité de l’offre locale afin que les demandes aient une probabilité suffisante de recevoir des propositions.

Ces leviers sont des orientations déduites des sources, et non des campagnes déjà éprouvées.

### Partenariats clés

- **Commerçants et producteurs locaux**, pour constituer l’offre et préparer les commandes.
- **Partenaires logistiques locaux**, pour la livraison à domicile.
- **Prestataire de paiement marketplace**, pour les paiements et reversements.
- **Points partenaires ou casiers réfrigérés**, évoqués comme options d’une réception élargie ; les casiers sont à traiter avec des partenaires et non à développer au départ.
- **Fournisseurs technologiques**, notamment hébergement cloud européen, cartographie, notifications et services d’IA.

Les partenaires nommés, contrats, conditions et niveaux de service ne sont pas disponibles.

### Roadmap de lancement

| Étape | Priorités |
|---|---|
| **1. Préparation du pilote** | Choisir une zone selon la densité commerciale, la présence de producteurs et la densité de population ; définir les catégories initiales et recruter les premiers professionnels. |
| **2. MVP** | Mettre en place l’interface web responsive, la saisie libre et guidée, l’analyse du besoin, la diffusion anonymisée, les réponses vendeurs et la validation client. |
| **3. Exécution locale** | Activer comparaison des offres, panier multi-vendeurs lorsque pertinent, paiement, retrait ou livraison partenaire et suivi de commande. |
| **4. Évaluation** | Mesurer l’adoption, la participation des vendeurs, les commandes et la qualité d’exécution ; corriger les points bloquants avant d’élargir. |
| **5. Développement et expansion** | Étendre progressivement le nombre de vendeurs et de clients. Les fonctions avancées — application native, prévision de la demande et autres dispositifs — restent conditionnées aux résultats et ne sont pas prioritaires au MVP. |

Les durées et critères précis de passage entre étapes ne sont pas définis.

---

## 6. ⚠️ Risques et mitigation

| Risque | Enjeu pour le modèle | Mitigation ou validation cohérente avec les sources |
|---|---|---|
| **Densité insuffisante de vendeurs** | Une demande peut ne recevoir aucune réponse pertinente. | Choisir une zone compacte selon la densité de commerces, producteurs et population ; suivre le nombre de demandes recevant des offres. |
| **Adoption insuffisante des clients** | Sans demandes, les vendeurs ne perçoivent pas de valeur ; sans offres, les clients ne reviennent pas. | Tester l’adoption pendant le pilote avant toute expansion et mesurer séparément activité client et activité commerçant. |
| **Demandes ambiguës ou mal structurées** | Le matching peut solliciter les mauvais vendeurs ou générer des propositions inadéquates. | Faire vérifier la clarté du besoin par l’IA et demander des précisions lorsque nécessaire. |
| **Offres incomplètes ou non conformes** | Les prix, quantités ou modalités peuvent ne pas répondre aux contraintes exprimées. | Centraliser les réponses et vérifier leur conformité au budget et aux produits demandés avant comparaison. |
| **Qualité ou disponibilité difficile à vérifier** | L’optimisation s’appuie notamment sur la réputation et la fraîcheur déclarée. | Suivre la conformité des propositions et des commandes ; les sources ne décrivent toutefois pas de mécanisme de contrôle indépendant. |
| **Complexité du panier multi-vendeurs** | Plusieurs préparations et disponibilités peuvent compliquer la réception. | Intégrer la logistique dans l’évaluation et présenter les vendeurs, les prix et les options avant validation. |
| **Dépendance aux partenaires logistiques** | Retards ou capacités limitées peuvent affecter l’expérience client. | Conserver le retrait chez le commerçant comme option alternative ; la livraison repose sur des partenaires locaux. |
| **Économie unitaire non démontrée** | Commission réduite, frais de paiement, technologie et acquisition peuvent réduire la marge. | Mesurer les coûts par commande et valider commission et frais de service avant l’expansion. |
| **Dépendance technologique à l’IA et aux prestataires** | L’analyse, le matching et la coordination reposent sur plusieurs briques techniques. | Concevoir une architecture modulaire et limiter le MVP aux fonctions essentielles ; les sources ne détaillent pas de plan de continuité technique. |
| **Protection des données** | Les demandes peuvent contenir lieu et contraintes personnelles. | Diffuser aux vendeurs des demandes anonymisées ; ne transmettre les informations nécessaires à la livraison qu’aux acteurs concernés. |

### Hypothèses à valider

1. Les clients sont prêts à exprimer leur besoin avant de consulter une offre.
2. Les commerçants répondent aux demandes locales malgré l’absence de frais fixes, en contrepartie d’une commission sur les ventes.
3. Le volume et la qualité des offres suffisent à rendre la comparaison utile.
4. Les clients acceptent une proposition issue de plusieurs vendeurs lorsque cela répond mieux à leur demande.
5. Les frais de service et commissions permettent de couvrir les coûts de paiement, de technologie, d’acquisition et d’exploitation.
6. Les partenaires peuvent respecter les créneaux et modalités affichés.
7. L’IA interprète correctement les produits, quantités, budgets, lieux et échéances avec un niveau de précision satisfaisant.

Les seuils d’acceptation correspondant à ces hypothèses ne sont pas fournis.

---

## 7. 📈 Métriques de succès

Les indicateurs ci-dessous combinent les objectifs chiffrés fournis et des mesures opérationnelles nécessaires pour vérifier le fonctionnement des étapes décrites. Pour les indicateurs sans cible dans les sources, la cible devra être définie pendant le pilote.

### KPIs de suivi

**Adoption et liquidité du marché**
- commerçants actifs ;
- clients actifs ;
- commandes mensuelles ;
- part des demandes recevant au moins une offre ;
- nombre moyen d’offres reçues par demande.

**Performance du parcours**
- proportion de demandes nécessitant une clarification ;
- délai entre expression du besoin et réception des offres ;
- proportion de propositions validées ;
- taux d’annulation ou de commande non exécutée ;
- respect des dates et créneaux de réception.

**Qualité de l’offre**
- conformité des offres au budget et aux produits demandés ;
- disponibilité réelle des produits annoncés ;
- satisfaction client et commerçant, à mesurer.

**Performance économique**
- panier moyen ;
- volume d’affaires mensuel ;
- commissions et frais de service ;
- coût de paiement, de technologie, d’acquisition et d’exploitation par commande ;
- marge contributive et coût d’acquisition client.

Les sources ne définissent pas de cible pour les taux de conversion, les délais, la satisfaction ou la rentabilité.

### Jalons chiffrés

| Indicateur | Phase pilote | Développement | Expansion |
|---|---:|---:|---:|
| Commerçants actifs | 15 | 50 | 150 |
| Clients actifs | 300 | 2 000 | 8 000 |
| Commandes/mois | 300 | 2 500 | 10 000 |
| Panier moyen hypothétique | 45 € | 50 € | 55 € |
| Volume d’affaires mensuel calculé | 13 500 € | 125 000 € | 550 000 € |

Ces objectifs sont expressément présentés dans les sources comme des **objectifs de travail à valider, et non des résultats garantis**. Ils forment une progression cohérente : d’abord vérifier l’existence d’une activité locale suffisante, puis augmenter le nombre de vendeurs, de clients et de commandes. Le passage à l’expansion devrait dépendre non seulement de ces volumes, mais aussi de la capacité à exécuter les commandes et à démontrer une économie viable — deux éléments que les sources ne chiffrent pas encore.

### Conclusion

FOOD SIGNAL présente une proposition structurée autour d’un renversement du parcours d’achat : le consommateur formule son besoin, puis les commerçants proposent des réponses. La cohérence du projet tient à l’enchaînement de l’analyse IA, du matching local, de la comparaison, de la validation et de la réception. La priorité stratégique est de tester cette chaîne dans une zone compacte, avec un MVP volontairement limité. Les principaux points restant à démontrer sont la densité d’offres, l’adoption des deux côtés de la marketplace, la qualité d’exécution logistique et la rentabilité par commande.