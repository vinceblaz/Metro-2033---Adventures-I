/**
 * Point d'entrée du module « Métro 2033 — Aventures I ».
 *
 * Expose game.metro2033Adventures.importAdventure() et crée, pour le MJ,
 * la macro « Métro 2033 — Importer l'aventure I ».
 */

import { ADVENTURE_ID } from "./adventure/catalog.mjs";
import {
    importAdventure,
    summarizeImportReport
} from "./foundry/import-adventure.mjs";
import { importAdventureNpcs } from "./foundry/import-npcs.mjs";
import { importAdventureScenes } from "./foundry/import-scenes.mjs";

const VERSION_SETTING = "importedVersion";
const MACRO_NAME = "Métro 2033 — Importer l’aventure I";
const MACRO_COMMAND = "game.metro2033Adventures.importAdventure();";


async function runImport() {

    ui.notifications?.info(
        "Métro 2033 — Aventures I : import en cours…"
    );

    try {

        const npcs = await importAdventureNpcs();
        const scenes = await importAdventureScenes();
        const report = await importAdventure();

        await game.settings.set(
            ADVENTURE_ID,
            VERSION_SETTING,
            game.modules.get(ADVENTURE_ID)?.version ?? ""
        );

        const summary =
            `${npcs.created} PNJ créé(s) et ${npcs.replaced} remplacé(s) dans le compendium, ${npcs.worldActors} acteur(s) ajouté(s) à l’onglet Acteurs. `
            + `${scenes.created} scène(s) créée(s) et ${scenes.replaced} remplacée(s) dans le compendium, ${scenes.worldScenes} scène(s) ajoutée(s) à l’onglet Scènes. `
            + summarizeImportReport(report);

        console.log(`Métro 2033 — Aventures I | ${summary}`);

        ui.notifications?.info(
            `Métro 2033 — Aventures I : import terminé. ${summary}`
        );

        return report;
    }
    catch (error) {

        console.error("Métro 2033 — Aventures I | Échec de l'import", error);

        ui.notifications?.error(
            `Métro 2033 — Aventures I : échec de l'import (${error.message}).`
        );

        throw error;
    }
}


async function ensureImportMacro() {

    if (!game.user?.isGM) {
        return;
    }

    try {

        const exists = game.macros?.some(
            macro =>
                macro.name === MACRO_NAME
                && macro.command === MACRO_COMMAND
        );

        if (!exists) {

            await Macro.create({
                name: MACRO_NAME,
                type: "script",
                img: "icons/svg/book.svg",
                command: MACRO_COMMAND,
                scope: "global"
            });
        }
    }
    catch (error) {

        console.warn(
            "Métro 2033 — Aventures I | Macro d'import non créée.",
            error
        );
    }
}


Hooks.once("init", () => {

    game.settings.register(ADVENTURE_ID, VERSION_SETTING, {
        scope: "world",
        config: false,
        type: String,
        default: ""
    });

    game.metro2033Adventures = {
        importAdventure: runImport,
        importNpcs: importAdventureNpcs,
        importScenes: importAdventureScenes
    };
});


Hooks.once("ready", async () => {

    if (!game.user?.isGM) {
        return;
    }

    await ensureImportMacro();

    const installed = game.modules.get(ADVENTURE_ID)?.version ?? "";
    const imported = game.settings.get(ADVENTURE_ID, VERSION_SETTING);

    if (imported !== installed) {

        ui.notifications?.info(
            "Métro 2033 — Aventures I : lancez la macro « "
            + MACRO_NAME
            + " » pour créer ou mettre à jour les journaux."
        );
    }
});
