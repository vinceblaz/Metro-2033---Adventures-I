/**
 * Import (ou mise à jour) des journaux du module dans le monde courant.
 *
 * - Crée un dossier de journaux et un journal par chapitre.
 * - Idempotent : les journaux et pages sont retrouvés par drapeau
 *   (flags["metro-2033-aventures-1"]).
 * - Une page déjà importée n'est mise à jour que si le MJ ne l'a pas
 *   modifiée (voir adventure/sync-plan.mjs).
 * - Les liens vers les PNJ et Stations du système sont résolus d'après
 *   les compendiums du monde (world.pnj-des-stations, world.stations).
 *
 * Dépend de l'API Foundry : non testé unitairement (la logique est dans
 * src/adventure/, testée).
 */

import {
    ADVENTURE_CONTENT_FILES,
    ADVENTURE_FOLDER_NAME,
    ADVENTURE_ID
} from "../adventure/catalog.mjs";
import { buildJournalDefinitions } from "../adventure/build-journals.mjs";
import { hashContent } from "../adventure/content-hash.mjs";
import { planPageSync } from "../adventure/sync-plan.mjs";
import {
    NPC_PACK,
    STATION_PACK,
    SYSTEM_FLAG_SCOPE,
    SYSTEM_SEED_FLAG
} from "../adventure/entity-links.mjs";

const NONE = 0; // CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
const FOLDER_KEY = "adventure-folder";


async function loadContentFiles() {

    const entries = await Promise.all(
        ADVENTURE_CONTENT_FILES.map(async (file) => {

            const url = `modules/${ADVENTURE_ID}/content/${file}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Impossible de lire ${url} (${response.status}).`
                );
            }

            return [file, await response.text()];
        })
    );

    return Object.fromEntries(entries);
}


async function buildSeedKeyIndex() {

    const index = new Map();

    for (const packName of [NPC_PACK, STATION_PACK]) {

        const pack = game.packs.get(packName);
        const bySeedKey = new Map();

        if (pack) {

            const packIndex = await pack.getIndex({
                fields: [`flags.${SYSTEM_FLAG_SCOPE}.${SYSTEM_SEED_FLAG}`]
            });

            for (const entry of packIndex) {

                const seedKey = foundry.utils.getProperty(
                    entry,
                    `flags.${SYSTEM_FLAG_SCOPE}.${SYSTEM_SEED_FLAG}`
                );

                if (seedKey) {
                    bySeedKey.set(seedKey, entry.uuid);
                }
            }
        }

        index.set(packName, bySeedKey);
    }

    return index;
}


async function ensureFolder() {

    const existing = game.folders.find(
        folder =>
            folder.type === "JournalEntry"
            && folder.getFlag(ADVENTURE_ID, "seedKey") === FOLDER_KEY
    );

    if (existing) {
        return existing;
    }

    return Folder.create({
        name: ADVENTURE_FOLDER_NAME,
        type: "JournalEntry",
        flags: { [ADVENTURE_ID]: { seedKey: FOLDER_KEY } }
    });
}


function pageData(page) {

    return {
        name: page.name,
        type: "text",
        sort: page.sort,
        title: { show: true, level: 1 },
        text: { format: 1, content: page.content },
        flags: {
            [ADVENTURE_ID]: {
                pageKey: page.pageKey,
                importedHash: hashContent(page.content)
            }
        }
    };
}


/**
 * @returns {Promise<{created: number, updated: number, kept: string[], unchanged: number}>}
 */
export async function importAdventure() {

    if (!game.user?.isGM) {
        throw new Error(
            "Métro 2033 — Aventures | Seul le MJ peut importer l'aventure."
        );
    }

    const texts = await loadContentFiles();
    const seedKeys = await buildSeedKeyIndex();

    const journals = buildJournalDefinitions(
        texts,
        {
            resolveUuid: (rule) =>
                seedKeys.get(rule.pack)?.get(rule.seedKey) ?? null
        }
    );

    const folder = await ensureFolder();

    const report = { created: 0, updated: 0, kept: [], unchanged: 0 };

    for (const definition of journals) {

        let entry = game.journal.find(
            candidate =>
                candidate.getFlag(ADVENTURE_ID, "seedKey") === definition.key
        );

        if (!entry) {

            entry = await JournalEntry.create({
                name: definition.name,
                folder: folder.id,
                sort: definition.sort,
                ownership: { default: NONE },
                flags: { [ADVENTURE_ID]: { seedKey: definition.key } },
                pages: definition.pages.map(pageData)
            });

            report.created += definition.pages.length;
            continue;
        }

        const existingPages = entry.pages.contents.map(page => ({
            id: page.id,
            pageKey: page.getFlag(ADVENTURE_ID, "pageKey"),
            content: page.text?.content ?? "",
            importedHash: page.getFlag(ADVENTURE_ID, "importedHash") ?? ""
        }));

        const plan = planPageSync(existingPages, definition.pages);

        if (plan.create.length > 0) {
            await entry.createEmbeddedDocuments(
                "JournalEntryPage",
                plan.create.map(pageData)
            );
        }

        if (plan.update.length > 0) {
            await entry.updateEmbeddedDocuments(
                "JournalEntryPage",
                plan.update.map(page => ({ _id: page.id, ...pageData(page) }))
            );
        }

        report.created += plan.create.length;
        report.updated += plan.update.length;
        report.unchanged += plan.unchanged.length;
        report.kept.push(
            ...plan.keep.map(page => `${definition.name} — ${page.name}`)
        );
    }

    return report;
}


/** Message de synthèse affiché au MJ. */
export function summarizeImportReport(report) {

    const parts = [
        `${report.created} page(s) créée(s)`,
        `${report.updated} mise(s) à jour`,
        `${report.unchanged} inchangée(s)`
    ];

    if (report.kept.length > 0) {
        parts.push(
            `${report.kept.length} conservée(s) car modifiée(s) : `
            + report.kept.join(" ; ")
        );
    }

    return parts.join(", ") + ".";
}
