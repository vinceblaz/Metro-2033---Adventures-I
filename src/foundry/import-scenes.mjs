/**
 * Import des scènes de l'aventure (cartes Dungeon Alchemist convertis
 * en scènes Foundry v14, avec murs, portes et lumières).
 *
 * - Compendium Scene du monde (« Métro 2033 — Scènes Aventures I ») :
 *   idempotent par flags["metro-2033-aventures-1"].sceneKey, remplacement
 *   par suppression puis recréation (comme les PNJ).
 * - Onglet Scènes du monde : seules les scènes absentes sont créées (dossier
 *   dédié). Une scène déjà présente n'est jamais touchée : le MJ peut y
 *   avoir placé des jetons, des notes, réglé la vision.
 *
 * Dépend de l'API Foundry (Scene Levels, v14) : non testé unitairement ;
 * la conversion est dans src/adventure/legacy-scene.mjs (testée).
 */

import { ADVENTURE_ID } from "../adventure/catalog.mjs";
import { legacySceneToV14 } from "../adventure/legacy-scene.mjs";
import {
    ADVENTURE_SCENES,
    SCENE_FOLDER_KEY,
    SCENE_PACK_LABEL,
    SCENE_PACK_NAME
} from "../adventure/scene-catalog.mjs";

const FLAG_PATH = `flags.${ADVENTURE_ID}.sceneKey`;


function moduleUrl(path) {
    return `modules/${ADVENTURE_ID}/${path}`;
}


async function loadSceneData(entry) {

    const url = moduleUrl(entry.dataFile);
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Impossible de lire ${url} (${response.status}).`);
    }

    return legacySceneToV14(await response.json(), {
        name: entry.name,
        key: entry.key,
        adventureId: ADVENTURE_ID,
        imageUrl: moduleUrl(entry.imageFile),
        thumbUrl: moduleUrl(entry.thumbFile)
    });
}


async function getOrCreatePack() {

    const existing = game.packs.get(`world.${SCENE_PACK_NAME}`);

    if (existing) {
        return existing;
    }

    return foundry.documents.collections.CompendiumCollection.createCompendium({
        type: "Scene",
        label: SCENE_PACK_LABEL,
        name: SCENE_PACK_NAME,
        package: "world"
    });
}


async function ensureSceneFolder() {

    const existing = game.folders.find(
        folder =>
            folder.type === "Scene"
            && folder.getFlag(ADVENTURE_ID, "seedKey") === SCENE_FOLDER_KEY
    );

    if (existing) {
        return existing;
    }

    return Folder.create({
        name: SCENE_PACK_LABEL,
        type: "Scene",
        flags: { [ADVENTURE_ID]: { seedKey: SCENE_FOLDER_KEY } }
    });
}


/**
 * Si le Level n'a pas été créé avec la scène, le crée avec l'image de fond.
 * Dans le monde seulement (un compendium ne se modifie pas ainsi).
 */
async function ensureLevel(scene, data) {

    if (!scene || scene.levels?.size > 0) {
        return;
    }

    await scene.createEmbeddedDocuments("Level", data.levels);
}


async function createWorldScenes(dataList) {

    const present = new Set(
        game.scenes.map(scene => foundry.utils.getProperty(scene, FLAG_PATH))
    );

    const missing = dataList.filter(
        data => !present.has(data.flags[ADVENTURE_ID].sceneKey)
    );

    if (missing.length === 0) {
        return 0;
    }

    const folder = await ensureSceneFolder();

    const created = await Scene.createDocuments(
        missing.map(data => ({ ...data, folder: folder.id }))
    );

    for (const [index, scene] of created.entries()) {
        await ensureLevel(scene, missing[index]);
    }

    return missing.length;
}


/**
 * @returns {Promise<{created: number, replaced: number, worldScenes: number}>}
 */
export async function importAdventureScenes() {

    if (!game.user?.isGM) {
        throw new Error(
            "Métro 2033 — Aventures | Seul le MJ peut importer les scènes."
        );
    }

    const dataList = await Promise.all(ADVENTURE_SCENES.map(loadSceneData));
    const pack = await getOrCreatePack();

    const index = await pack.getIndex({ fields: [FLAG_PATH] });

    const existingByKey = new Map();

    for (const entry of index) {

        const key = foundry.utils.getProperty(entry, FLAG_PATH);

        if (key) {
            existingByKey.set(key, entry._id);
        }
    }

    const toReplace = dataList.filter(
        data => existingByKey.has(data.flags[ADVENTURE_ID].sceneKey)
    );

    if (toReplace.length > 0) {

        await Scene.deleteDocuments(
            toReplace.map(data =>
                existingByKey.get(data.flags[ADVENTURE_ID].sceneKey)
            ),
            { pack: pack.collection }
        );
    }

    await Scene.createDocuments(dataList, { pack: pack.collection });

    const worldScenes = await createWorldScenes(dataList);

    return {
        created: dataList.length - toReplace.length,
        replaced: toReplace.length,
        worldScenes
    };
}
