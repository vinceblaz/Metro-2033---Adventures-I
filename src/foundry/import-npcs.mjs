/**
 * Import (ou remplacement) des PNJ génériques de l'aventure dans un
 * compendium Actor du monde (« Métro 2033 — PNJ Aventures I »).
 *
 * Réutilise `buildNpcActorData()` du système, pour que les Actors aient
 * exactement la forme des PNJ du système (Items d'arme, d'armure, de
 * Talent embarqués). Même schéma que le seed des PNJ de Stations :
 * idempotent par flags["metro-2033-yze"].seedKey, remplacement par
 * suppression puis recréation.
 *
 * Crée aussi les PNJ dans l'onglet Acteurs du monde (dossier dédié),
 * seulement s'ils n'y sont pas déjà.
 *
 * Dépend de l'API Foundry : non testé unitairement.
 */

import {
    ADVENTURE_NPCS,
    NPC_PACK_LABEL,
    NPC_PACK_NAME,
    finalizeNpcActorData
} from "../adventure/npc-catalog.mjs";
import { ADVENTURE_ID } from "../adventure/catalog.mjs";
import { SYSTEM_FLAG_SCOPE, SYSTEM_SEED_FLAG } from "../adventure/entity-links.mjs";

const ACTOR_FOLDER_KEY = "npc-folder";

const BUILDER_URL =
    "/systems/metro-2033-yze/src/data/seed/bestiary-actor-builder.mjs";


async function getOrCreatePack() {

    const existing = game.packs.get(`world.${NPC_PACK_NAME}`);

    if (existing) {
        return existing;
    }

    return foundry.documents.collections.CompendiumCollection.createCompendium({
        type: "Actor",
        label: NPC_PACK_LABEL,
        name: NPC_PACK_NAME,
        package: "world"
    });
}


async function ensureActorFolder() {

    const existing = game.folders.find(
        folder =>
            folder.type === "Actor"
            && folder.getFlag(ADVENTURE_ID, "seedKey") === ACTOR_FOLDER_KEY
    );

    if (existing) {
        return existing;
    }

    return Folder.create({
        name: NPC_PACK_LABEL,
        type: "Actor",
        flags: { [ADVENTURE_ID]: { seedKey: ACTOR_FOLDER_KEY } }
    });
}


/**
 * Crée dans l'onglet Acteurs du monde les PNJ qui n'y existent pas encore
 * (retrouvés par seedKey). Un acteur déjà présent n'est jamais touché :
 * le MJ peut le modifier sans risque.
 */
async function createWorldActors(dataList) {

    const present = new Set(
        game.actors.map(actor =>
            foundry.utils.getProperty(
                actor,
                `flags.${SYSTEM_FLAG_SCOPE}.${SYSTEM_SEED_FLAG}`
            )
        )
    );

    const missing = dataList.filter(
        data => !present.has(data.flags[SYSTEM_FLAG_SCOPE][SYSTEM_SEED_FLAG])
    );

    if (missing.length === 0) {
        return 0;
    }

    const folder = await ensureActorFolder();

    await Actor.createDocuments(
        missing.map(data => ({ ...data, folder: folder.id }))
    );

    return missing.length;
}


/**
 * @returns {Promise<{created: number, replaced: number, worldActors: number}>}
 */
export async function importAdventureNpcs() {

    if (!game.user?.isGM) {
        throw new Error(
            "Métro 2033 — Aventures | Seul le MJ peut importer les PNJ."
        );
    }

    const { buildNpcActorData } = await import(BUILDER_URL);
    const pack = await getOrCreatePack();

    const index = await pack.getIndex({
        fields: [`flags.${SYSTEM_FLAG_SCOPE}.${SYSTEM_SEED_FLAG}`]
    });

    const existingBySeedKey = new Map();

    for (const entry of index) {

        const seedKey = foundry.utils.getProperty(
            entry,
            `flags.${SYSTEM_FLAG_SCOPE}.${SYSTEM_SEED_FLAG}`
        );

        if (seedKey) {
            existingBySeedKey.set(seedKey, entry._id);
        }
    }

    const toCreate = [];
    const toReplace = [];

    for (const entry of ADVENTURE_NPCS) {

        const data = finalizeNpcActorData(buildNpcActorData(entry), entry);
        const existingId = existingBySeedKey.get(entry.key);

        if (existingId) {
            toReplace.push({ id: existingId, data });
        } else {
            toCreate.push(data);
        }
    }

    if (toReplace.length > 0) {

        await Actor.deleteDocuments(
            toReplace.map(item => item.id),
            { pack: pack.collection }
        );
    }

    const all = [...toCreate, ...toReplace.map(item => item.data)];

    if (all.length > 0) {
        await Actor.createDocuments(all, { pack: pack.collection });
    }

    const worldActors = await createWorldActors(all);

    return {
        created: toCreate.length,
        replaced: toReplace.length,
        worldActors
    };
}
