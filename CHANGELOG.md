# Changelog

## 0.3.0

- Scènes : 11 cartes de Petchatniki (Dungeon Alchemist, 8100×7500 et 5400×7500 px, grille 150 px) avec leurs murs, portes et lumières. Importées par la macro d'import dans un compendium de scènes « Métro 2033 — Scènes Aventures I » et dans l'onglet Scènes (dossier dédié, sans jamais toucher une scène déjà présente).
- Les exports (ancien format) sont convertis à l'import en scènes Foundry v14 : image de fond portée par un Level, murs 0/1 → 0/20, lumières `tintColor` → `config.color`. Convertisseur testé (`src/adventure/legacy-scene.mjs`).
- Ajouter une carte : déposer `scenes/data/<clé>.json`, `scenes/img/<clé>.webp`, `scenes/thumbs/<clé>.webp` et une ligne dans `src/adventure/scene-catalog.mjs`.
- Images de fond converties en WebP (qualité 85, mêmes dimensions) : 61 Mo → 53 Mo.
- Livré non validé sur une instance Foundry : la création d'une scène avec Level (v14) n'est vérifiée que par lecture de la documentation.

## 0.2.1

- Les PNJ génériques sont aussi créés dans l'onglet Acteurs du monde (dossier « Métro 2033 — PNJ Aventures I »), s'ils n'y sont pas déjà. Un acteur existant n'est jamais modifié ni remplacé.

## 0.2.0

- Compendium d'acteurs « Métro 2033 — PNJ Aventures I » : garde, stalker, criminel, travailleur, personnel administratif (valeurs du livre, armes, protection et talents embarqués), construits avec le builder de PNJ du système. Créés ou remplacés par la macro d'import (idempotent par seedKey).
- Les talents « au choix » (travailleur, personnel administratif) ne sont pas fixés : ils sont notés dans le champ « spécial » de la fiche.
- Armes à feu marquées « à distance » (le builder du système ne reconnaît que les noms contenant « portée » ou « TIR »).

## 0.1.1

- Annexe Personnages : nouvelle page « Profils de jeu » reproduisant les profils génériques du livre (garde p.146, stalker p.147, criminel p.146, travailleur p.148, personnel administratif p.147) avec leurs valeurs exactes ; les fiches des gardes, stalkers et gens de Kojoukhovskaya y renvoient.

## 0.1.0

- Premier jet : didacticiel « Un jour comme un autre » et scénarios 1 à 3 du livre de base (pp. 282-310) en journaux Foundry, un journal par chapitre, une page par scène.
- Encarts à lire, notes MJ, rappels de règles et feuilles de route mis en forme (charte du système).
- Annexes : personnages propres aux aventures, objets et lieux. Liens automatiques vers les PNJ et Stations du système.
- Macro d'import idempotente ; les pages modifiées par le MJ sont conservées lors d'une mise à jour.
- Livré non validé sur une instance Foundry : logique pure testée, code Foundry vérifié par `node --check` seulement.
