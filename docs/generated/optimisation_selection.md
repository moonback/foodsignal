# Optimisation et Sélection des Offres - Phase Pilote

Cette étape est le cœur algorithmique de FOOD SIGNAL. L'IA analyse les offres reçues pour construire la proposition la plus avantageuse pour le client.

## Processus d'Optimisation

1. **Agrégation des Offres**
   L'IA rassemble toutes les propositions valides pour une demande donnée.

2. **Évaluation Multicritère**
   Chaque offre est notée selon plusieurs critères :
   - **Prix :** Respect du budget initial.
   - **Qualité :** Réputation du vendeur, fraîcheur déclarée des produits.
   - **Disponibilité :** Adéquation avec les quantités demandées.
   - **Logistique :** Proximité géographique, respect des délais de livraison ou de retrait.

3. **Combinaison Optimale**
   L'IA cherche à combiner les offres de différents vendeurs pour répondre parfaitement à l'ensemble du besoin (ex: légumes du primeur + viande du boucher).

4. **Proposition Finale**
   L'IA génère la meilleure combinaison possible et la présente au client.
