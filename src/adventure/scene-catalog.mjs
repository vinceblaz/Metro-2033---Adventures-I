/**
 * Catalogue des scènes du module « Aventures I ».
 *
 * Chaque scène = un export JSON (scenes/data), son image de fond
 * (scenes/img) et sa vignette (scenes/thumbs), tous trois nommés d'après
 * la clé. Pour en ajouter une : déposer les trois fichiers et ajouter une
 * ligne ci-dessous.
 */

export const SCENE_PACK_NAME = "scenes-aventures-i";

export const SCENE_PACK_LABEL = "Métro 2033 — Scènes Aventures I";

export const SCENE_FOLDER_KEY = "scene-folder";


function scene(key, name) {

    return Object.freeze({
        key,
        name,
        dataFile: `scenes/data/${key}.json`,
        imageFile: `scenes/img/${key}.webp`,
        thumbFile: `scenes/thumbs/${key}.webp`
    });
}


export const ADVENTURE_SCENES = Object.freeze([
    scene("petchatniki-01-00", "Petchatniki — Plan 1 · carte 0"),
    scene("petchatniki-01-01", "Petchatniki — Plan 1 · carte 1"),
    scene("petchatniki-01-02", "Petchatniki — Plan 1 · carte 2"),
    scene("petchatniki-01-03", "Petchatniki — Plan 1 · carte 3"),
    scene("petchatniki-01-04", "Petchatniki — Plan 1 · carte 4"),
    scene("petchatniki-01-05", "Petchatniki — Plan 1 · carte 5"),
    scene("petchatniki-02-00", "Petchatniki — Plan 2 · carte 0"),
    scene("petchatniki-02-01", "Petchatniki — Plan 2 · carte 1"),
    scene("petchatniki-02-02", "Petchatniki — Plan 2 · carte 2"),
    scene("petchatniki-02-03", "Petchatniki — Plan 2 · carte 3"),
    scene("petchatniki-02-04", "Petchatniki — Plan 2 · carte 4")
]);
