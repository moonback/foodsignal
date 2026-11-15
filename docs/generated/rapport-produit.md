# Rapport produit — FOOD SIGNAL

> **Périmètre et méthode** — Ce rapport synthétise exclusivement les éléments des sources fournies. Les fonctions décrites comme relevant de la phase pilote sont distinguées des évolutions envisagées ultérieurement. Lorsqu’une mesure, une échéance ou une règle produit n’est pas documentée, elle est signalée comme telle. Les indicateurs et critères de succès proposés ci-dessous sont des cadres de pilotage à définir et valider, non des objectifs déjà établis.

---

## 1. 📋 Vision produit

### Vision à long terme

FOOD SIGNAL ambitionne de transformer le parcours d’achat alimentaire : plutôt que de parcourir le catalogue d’un magasin, le consommateur exprime ce qu’il souhaite acheter et les commerçants ou producteurs lui soumettent des offres adaptées.

La plateforme organise ainsi le marché à partir de la demande. Elle s’appuie sur une chaîne de fonctions complémentaires : compréhension du besoin par IA, mise en relation avec les vendeurs, collecte et comparaison des offres, composition éventuelle d’un panier multi-vendeurs et coordination de sa réception. À terme, le concept envisage aussi une anticipation des demandes afin d’aider les commerçants à prévoir les quantités nécessaires. Cette ambition de marché prédictif est distincte du périmètre de la phase pilote, qui porte d’abord sur la mise en relation et la transaction.

La recommandation de lancement est progressive : commencer dans une zone géographique compacte afin d’évaluer l’adoption par les clients et les commerçants, puis développer la couverture et les capacités de la plateforme.

### Problèmes résolus

| Problème ou besoin | Réponse de FOOD SIGNAL |
|---|---|
| Le client doit habituellement rechercher lui-même les produits dans des catalogues ou magasins. | Il décrit son besoin en langage naturel ou au moyen d’un formulaire guidé. |
| Une demande peut comprendre plusieurs critères difficiles à concilier. | L’IA identifie produits, quantités, budget, lieu et contraintes temporelles, puis structure les données. |
| Le client ne sait pas nécessairement quels vendeurs locaux peuvent répondre à sa demande. | La plateforme diffuse la demande anonymisée aux professionnels pertinents, sélectionnés selon leur spécialité et leur proximité. |
| Les propositions de vendeurs peuvent différer par leur prix, leurs disponibilités et leurs modalités de réception. | Les offres sont centralisées, vérifiées et comparées selon plusieurs critères. |
| Un besoin peut nécessiter plusieurs types de produits et donc plusieurs vendeurs. | L’IA peut combiner des offres de plusieurs professionnels pour constituer une proposition couvrant le besoin. |
| Les commerçants peuvent chercher des débouchés locaux supplémentaires. | La plateforme leur donne accès aux demandes de clients de leur zone, sans frais fixes d’abonnement ou de référencement pendant le pilote. |

### Proposition de valeur

- **Pour le consommateur :** exprimer un besoin alimentaire plutôt que chercher chaque produit ; recevoir une proposition adaptée à ses contraintes ; consulter les produits, vendeurs, prix et options de réception avant de confirmer.
- **Pour les commerçants et producteurs :** répondre aux demandes locales correspondant à leur spécialité ; choisir les produits, quantités, prix et conditions qu’ils proposent ; conserver le contrôle de leurs prix et disponibilités.
- **Pour le marché local :** rapprocher les demandes des clients et les offres des professionnels, avec une possibilité de composition multi-vendeurs et de coordination de la réception.

La valeur produit ne repose donc pas uniquement sur l’IA. Elle résulte de l’enchaînement entre compréhension de la demande, accès à des offres locales, arbitrage entre propositions et exécution de la commande.

---

## 2. 🎯 Fonctionnalités

### Fonctionnalités core identifiées

1. **Expression du besoin**
   - Saisie libre ou formulaire guidé.
   - Catégories et quantités, avec possibilité de préciser un budget maximal, une date ou un créneau et un lieu de livraison ou de retrait.
   - Transmission du besoin au moteur d’IA.

2. **Analyse et structuration par l’IA**
   - Compréhension de l’intention.
   - Extraction des produits, quantités et contraintes — notamment budget, date et lieu.
   - Conversion en données structurées, notamment au format JSON.
   - Demande de précisions lorsque le besoin est insuffisamment clair.
   - Enrichissement contextuel facultatif, par exemple avec des suggestions de produits complémentaires de saison.

3. **Ciblage et interrogation des vendeurs**
   - Diffusion d’une demande anonymisée.
   - Sélection des commerçants selon leur spécialité et leur proximité.
   - Consultation de la demande par les professionnels depuis une interface web ou une application.
   - Notification de la demande aux vendeurs concernés.

4. **Réception et conformité des offres**
   - Dépôt d’offres comprenant produits, quantités, prix et modalités de livraison ou de retrait.
   - Centralisation des réponses associées à une demande.
   - Vérification par l’IA de leur conformité aux contraintes initiales.
   - Regroupement des propositions pour faciliter leur comparaison.

5. **Comparaison et optimisation**
   - Évaluation selon le prix, la qualité, la disponibilité et la logistique.
   - Prise en compte de la réputation du vendeur et de la fraîcheur déclarée.
   - Recherche d’une combinaison d’offres, éventuellement multi-vendeurs, qui couvre le besoin.
   - Présentation d’une proposition au client.

6. **Validation et réception**
   - Présentation des produits, vendeurs, prix total et options de réception.
   - Choix entre livraison à domicile par un partenaire local et retrait chez le commerçant dans le périmètre pilote.
   - Confirmation de la commande, déclenchant la préparation par les vendeurs concernés.
   - Suivi de l’état de la commande : préparation, en cours de livraison ou disponible.
   - Intégration des frais de livraison au prix total de la proposition validée.

### Priorisation — MoSCoW

Cette priorisation est une lecture produit des sources et non une priorisation formellement fournie par celles-ci.

| Priorité | Fonctionnalités | Justification |
|---|---|---|
| **Must have — pilote** | Expression du besoin ; extraction des critères ; interrogation de vendeurs ciblés ; dépôt et centralisation des offres ; vérification de conformité ; proposition optimisée ; validation ; choix de réception ; transmission de la commande aux vendeurs. | Ces fonctions forment le parcours de transaction décrit de bout en bout dans les documents de phase pilote. |
| **Should have — pilote ou consolidation** | Demande de précisions par l’IA ; suivi de commande ; affichage lisible des vendeurs, produits, prix et modalités ; notifications aux clients et commerçants. | Ces éléments sont explicitement décrits et renforcent la clarté ou l’exécution du parcours. Leur niveau de sophistication n’est pas précisé. |
| **Could have — enrichissements** | Suggestions contextuelles de produits ; combinaison plus élaborée de vendeurs ; réception via point partenaire ou casier réfrigéré lorsque des partenaires sont disponibles. | Le concept mentionne ces possibilités, mais elles ne font pas partie du périmètre pilote initial décrit pour la réception. |
| **Won’t have au lancement** | Application mobile native, reconnaissance photo du réfrigérateur, prévision des achats, livraison autonome, IA prédictive avancée et marketplace internationale. | Le document concept recommande de ne pas développer ces fonctions au départ. Une application web responsive est jugée suffisante pour tester le concept. |

### MVP vs versions futures

**MVP — phase pilote**

Le MVP doit permettre de vérifier le parcours central dans une zone limitée : un client exprime son besoin, l’IA le structure, les vendeurs pertinents répondent, la plateforme compare les offres et le client valide une proposition puis sa réception. Le périmètre de réception explicitement décrit pour le pilote comprend la livraison à domicile par un partenaire local ou le retrait chez le commerçant.

Le document concept recommande une architecture modulaire et une application web responsive au lancement. Les technologies proposées dans les sources incluent notamment Next.js et TypeScript pour le web, NestJS pour le backend, PostgreSQL et PostGIS pour les données et la géolocalisation, ainsi qu’un prestataire de paiement marketplace. Il s’agit de recommandations d’architecture, pas d’exigences fonctionnelles validées.

**Versions futures**

Les évolutions citées comprennent l’application mobile native, les points partenaires et casiers réfrigérés, l’anticipation des demandes, l’IA prédictive avancée et, à plus long terme, le développement d’une marketplace internationale. Le modèle économique mentionne aussi des revenus professionnels complémentaires à développer ensuite, sans en préciser la forme.

---

## 3. 👥 Utilisateurs

### Personas fonctionnels

Les sources ne fournissent pas de recherches utilisateurs ni de profils sociodémographiques. Les personas suivants sont donc des **personas fonctionnels**, dérivés des rôles décrits.

| Persona | Besoin et comportement | Enjeu principal |
|---|---|---|
| **Particulier demandeur** | Décrit les produits souhaités, les quantités, le budget, le moment et le lieu de réception ; compare puis valide une proposition. | Obtenir une réponse claire et compatible avec ses contraintes, sans avoir à rechercher les produits vendeur par vendeur. |
| **Commerçant ou producteur répondant** | Consulte une demande locale anonymisée et indique les produits disponibles, quantités, prix et conditions de réception. | Recevoir des demandes pertinentes et garder la maîtrise de son offre, de ses prix et de ses disponibilités. |
| **Partenaire logistique** | Intervient pour la livraison à domicile et reçoit les informations nécessaires à la collecte. | Coordonner la collecte et la livraison dans le créneau prévu. Les fonctionnalités de son interface ne sont pas détaillées dans les sources. |

### Jobs-to-be-done

- **Particulier :** « Quand j’ai un besoin alimentaire avec des contraintes de budget, de temps ou de lieu, je veux le formuler simplement et recevoir une proposition que je peux vérifier et confirmer. »
- **Particulier :** « Quand plusieurs vendeurs répondent, je veux comprendre les produits, les prix et les modalités de réception avant de décider. »
- **Commerçant ou producteur :** « Quand une demande correspondant à ma spécialité est émise dans ma zone, je veux pouvoir proposer mes produits et mes conditions sans perdre le contrôle de mon offre. »
- **Partenaire logistique :** « Quand une commande est confirmée pour livraison, je veux disposer des informations permettant d’organiser sa collecte et sa remise au client. »

Ces formulations synthétisent les tâches documentées ; elles ne proviennent pas d’entretiens utilisateurs.

### Parcours utilisateur clés

**Parcours client**

1. Le client saisit son besoin en texte libre ou via un formulaire guidé.
2. Il précise, le cas échéant, budget maximal, date ou créneau et adresse ou point de retrait.
3. L’IA extrait les critères et structure la demande.
4. Si le besoin est trop ambigu, l’IA peut solliciter des précisions.
5. La plateforme anonymise et diffuse la demande aux vendeurs pertinents.
6. Les vendeurs soumettent leurs offres.
7. L’IA vérifie leur conformité, les compare et construit une proposition, éventuellement multi-vendeurs.
8. Le client consulte les produits, vendeurs, prix total et options de réception.
9. Il choisit livraison ou retrait, puis confirme.
10. Les vendeurs sont informés pour préparer la commande ; le client peut suivre son état.

**Parcours commerçant**

1. Le professionnel reçoit une notification concernant une demande pertinente.
2. Il consulte la demande anonymisée dans son interface.
3. Il indique les produits qu’il peut fournir, les quantités, les prix et les modalités de réception.
4. La plateforme centralise et vérifie sa réponse.
5. Si la proposition est retenue et confirmée, le commerçant reçoit l’information nécessaire à la préparation.

**Parcours de réception**

Après validation, le client choisit une livraison à domicile assurée par un partenaire local ou un retrait chez le commerçant dans le périmètre pilote documenté. L’IA transmet les informations logistiques aux commerçants et, pour la livraison, aux livreurs. La commande passe ensuite par des états visibles par le client.

---

## 4. 🗺️ Roadmap

> **Calendrier :** aucune durée, date de lancement ni échéance par phase n’est fournie. Les phases ci-dessous constituent donc une séquence produit sans dates chiffrées.

| Phase | Scope | Temporalité |
|---|---|---|
| **Phase 1 — MVP / pilote** | Application web responsive ; expression libre ou guidée ; analyse du besoin ; demandes de précision si nécessaire ; diffusion anonymisée à des vendeurs locaux ciblés ; dépôt, centralisation et vérification des offres ; comparaison et combinaison ; validation client ; livraison par partenaire local ou retrait chez le commerçant ; coordination et suivi de commande. Lancement dans une zone compacte. | **[Information non disponible dans les sources]** |
| **Phase 2 — Enrichissements** | Consolidation des fonctions ayant démontré leur utilité ; enrichissement contextuel des propositions ; extension possible des modes de réception par partenaires ; développement ultérieur de revenus professionnels complémentaires. Les sources mentionnent aussi l’application mobile native comme une fonction à développer « plus tard ». | **[Information non disponible dans les sources]** |
| **Phase 3 — Scale** | Extension progressive de la couverture géographique ; montée en capacité du réseau de vendeurs et de clients ; développement éventuel du marché prédictif, de la prévision des quantités et de capacités IA avancées. L’expansion internationale est explicitement exclue du lancement, sans calendrier ultérieur fourni. | **[Information non disponible dans les sources]** |

### Indications de pilotage commercial disponibles

Le concept fournit des objectifs de travail hypothétiques, qui ne doivent pas être interprétés comme des résultats acquis :

| Indicateur | Phase pilote | Développement | Expansion |
|---|---:|---:|---:|
| Commerçants actifs | 15 | 50 | 150 |
| Clients actifs | 300 | 2 000 | 8 000 |
| Commandes par mois | 300 | 2 500 | 10 000 |
| Panier moyen hypothétique | 45 € | 50 € | 55 € |

Le document précise que ces valeurs sont des objectifs à valider, et non des résultats garantis. La méthode de validation, les seuils de passage entre phases et la durée de chaque étape ne sont pas fournis.

---

## 5. 📐 Spécifications UX

### Principes d’expérience

1. **Permettre une expression simple du besoin.** Proposer deux voies complémentaires : texte libre et saisie guidée.
2. **Rendre les contraintes explicites.** L’utilisateur peut renseigner budget, moment et lieu ; ces éléments doivent rester compréhensibles dans le parcours.
3. **Gérer l’ambiguïté avant transmission.** L’IA vérifie si le besoin est assez clair et peut demander des précisions.
4. **Protéger les données personnelles lors de l’interrogation du marché.** La demande transmise aux vendeurs est anonymisée.
5. **Rendre les propositions vérifiables.** La proposition client détaille produits, vendeurs, prix total et options de réception.
6. **Laisser le choix final au client.** L’IA formule ou optimise une proposition, mais le client la consulte et la confirme.
7. **Donner de la visibilité sur l’exécution.** Le suivi expose les états de préparation, livraison ou disponibilité.
8. **Soutenir le fonctionnement des vendeurs.** Leur interface doit permettre de consulter les demandes et de préciser produits, quantités, prix et conditions.

### Flows critiques

- **Saisie → clarification → structuration :** éviter qu’un besoin incomplet soit transmis comme s’il était exploitable. Les règles de validation et les formulations de clarification ne sont pas précisées.
- **Diffusion → réponse vendeur :** assurer que les professionnels interrogés correspondent à la spécialité et à la proximité requises, tout en ne partageant pas les données personnelles du client.
- **Offres → comparaison :** rendre intelligibles les critères de prix, qualité, disponibilité et logistique. Les pondérations et la façon de présenter un éventuel compromis ne sont pas documentées.
- **Proposition → confirmation :** permettre au client de comprendre le prix total, les vendeurs impliqués et les modalités avant sa décision.
- **Confirmation → préparation → réception :** transmettre les informations aux professionnels et permettre au client de suivre l’état de la commande.

### Contraintes d’accessibilité et informations manquantes

Les sources ne précisent aucune norme d’accessibilité, exigence de conformité, règle de contraste, navigation au clavier, prise en charge de lecteurs d’écran, taille minimale des textes ou politique linguistique. Ces éléments doivent être spécifiés avant de pouvoir évaluer l’accessibilité du produit.

Les sources indiquent toutefois une application web ou mobile pour les parcours, et recommandent un web responsive pour le lancement. La prise en charge effective de différents appareils, les navigateurs ciblés et les exigences d’accessibilité associées sont **[Information non disponible dans les sources]**.

---

## 6. 📊 Métriques produit

Les sources ne définissent pas de North Star metric ni de tableau de bord produit. Les indicateurs ci-dessous sont donc des **propositions de pilotage dérivées du parcours documenté** ; aucune cible de performance n’est disponible, hormis les objectifs commerciaux hypothétiques présentés dans la roadmap.

### North Star metric proposée

**Nombre de commandes confirmées et exécutées par mois dans la zone pilote.**

Cette métrique relie les deux côtés de la marketplace et le parcours de réception : elle suppose qu’un besoin a été compris, qu’une offre a été trouvée, que le client l’a acceptée et que la commande a été préparée puis reçue. La définition exacte d’une commande « exécutée » — par exemple le statut qui fait foi — reste à préciser.

### KPIs de suivi proposés

| Étape | KPI proposé | Ce qu’il permet d’observer |
|---|---|---|
| Acquisition et activité | Clients actifs ; commerçants actifs | Adoption de la plateforme par les deux catégories d’utilisateurs. |
| Expression du besoin | Nombre de demandes soumises ; proportion de demandes nécessitant une clarification | Usage du formulaire et clarté initiale des demandes. |
| Analyse IA | Proportion de demandes structurées puis diffusées | Capacité du moteur à produire des demandes exploitables. |
| Mise en relation | Proportion de demandes recevant au moins une offre valide | Capacité du réseau de vendeurs à répondre aux besoins. |
| Réponse commerciale | Nombre et diversité des offres par demande | Profondeur de réponse de la marketplace. |
| Qualité de proposition | Proportion d’offres conformes aux contraintes ; proportion de propositions couvrant le besoin | Performance du contrôle de conformité et de la combinaison des offres. |
| Conversion | Proportion de propositions présentées qui sont confirmées | Utilité et acceptabilité des propositions selon les clients. |
| Exécution | Commandes préparées et reçues ; commandes suivies par statut | Fonctionnement de la coordination entre vendeurs, livraison ou retrait et client. |
| Économie | Volume d’affaires des vendeurs, commissions et frais de service | Évolution des revenus mentionnés dans le concept. Les règles détaillées de calcul ne sont pas entièrement définies. |

### Critères de succès par fonctionnalité

| Fonctionnalité | Critère de succès à mesurer |
|---|---|
| Expression du besoin | Des demandes comportant les informations nécessaires peuvent être soumises, en saisie libre comme guidée. Le seuil de complétude attendu est à définir. |
| Analyse IA | Les informations structurées couvrent les critères pertinents de la demande ; les besoins insuffisamment clairs sont repérés et donnent lieu à une demande de précision. |
| Ciblage vendeur | Les demandes sont adressées à des professionnels correspondant à la spécialité et à la proximité recherchées. |
| Réception des offres | Les offres contiennent les produits, quantités, prix et modalités nécessaires à leur évaluation. |
| Optimisation | Les propositions tiennent compte du budget, de la qualité, de la disponibilité et de la logistique, et peuvent couvrir un besoin multi-produits. |
| Validation | Le client peut consulter les informations essentielles et confirmer une proposition ainsi qu’un mode de réception. |
| Logistique et suivi | Les informations sont transmises aux intervenants ; le client peut voir les états documentés de sa commande. |
| Modèle commercial pilote | Le modèle de commission réduite, sans frais fixes pour les commerçants, permet d’observer l’adoption et la génération de ventes additionnelles. La valeur du taux de commission n’est pas fournie. |

### Synthèse analytique

Le risque produit central est la dépendance entre les étapes : une analyse imprécise dégrade le ciblage des vendeurs ; une couverture insuffisante de commerçants réduit les chances d’obtenir des offres ; des offres difficiles à comparer fragilisent la décision ; une coordination logistique défaillante compromet l’expérience après validation. Le pilotage doit donc suivre le parcours de bout en bout, et pas seulement la qualité apparente du moteur d’IA.

La phase pilote sert à valider simultanément l’adoption des deux côtés du marché, la capacité à générer des offres pertinentes et l’exécution des commandes dans une zone limitée. Les sources fournissent des objectifs de volume hypothétiques, mais ne fixent ni seuil de qualité, ni taux de conversion attendu, ni délai de réponse des vendeurs. Ces critères restent à définir avant l’évaluation formelle du MVP.