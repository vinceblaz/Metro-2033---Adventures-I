/**
 * Catalogue des journaux du module « Aventures I ».
 * Chaque journal est composé d'un ou plusieurs fichiers de content/.
 */

export const ADVENTURE_ID = "metro-2033-aventures-1";

export const ADVENTURE_FOLDER_NAME = "Métro 2033 — Aventures I";

export const ADVENTURE_JOURNALS = Object.freeze([
    {
        key: "bienvenue",
        name: "Aventures I — Bienvenue",
        sources: [
            { file: "00-bienvenue.md" },
            { file: "00-presentation.md" }
        ]
    },
    {
        key: "chapitre-0",
        name: "Chapitre 0 — Didacticiel : Un jour comme un autre",
        sources: [{ file: "01-didacticiel.md", introTitle: "Feuille de route" }]
    },
    {
        key: "chapitre-1",
        name: "Chapitre 1 — Scénario 1 : Dans la gueule du loup",
        sources: [{ file: "02-scenario-1-dans-la-gueule-du-loup.md", introTitle: "Feuille de route" }]
    },
    {
        key: "chapitre-2",
        name: "Chapitre 2 — Scénario 2 : Un rythme familier",
        sources: [{ file: "03-scenario-2-un-rythme-familier.md", introTitle: "Feuille de route" }]
    },
    {
        key: "chapitre-3",
        name: "Chapitre 3 — Scénario 3 : L’Heure de compter ses amis",
        sources: [{ file: "04-scenario-3-l-heure-de-compter-ses-amis.md", introTitle: "Feuille de route" }]
    },
    {
        key: "annexe-personnages",
        name: "Annexe A — Personnages",
        sources: [{ file: "10-personnages.md" }]
    },
    {
        key: "annexe-objets-lieux",
        name: "Annexe B — Objets et lieux",
        sources: [{ file: "11-objets-et-lieux.md" }]
    }
]);

export const ADVENTURE_CONTENT_FILES = Object.freeze(
    [...new Set(ADVENTURE_JOURNALS.flatMap(j => j.sources.map(s => s.file)))]
);
