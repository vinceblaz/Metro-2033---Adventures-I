/**
 * Construit les définitions de journaux (pages HTML) à partir des
 * fichiers de contenu. Module pur.
 */

import { ADVENTURE_JOURNALS } from "./catalog.mjs";
import { parseMarkup } from "./markup.mjs";
import { renderBlocksToHtml } from "./render-html.mjs";
import { slugify } from "./slug.mjs";

/**
 * @param {Record<string, string>} fileTexts contenu des fichiers par nom
 * @param {{ resolveUuid?: (rule: object) => (string|null) }} [options]
 * @returns {Array<{key: string, name: string, sort: number, pages: Array<{pageKey: string, name: string, content: string, sort: number}>}>}
 */
export function buildJournalDefinitions(fileTexts, options = {}) {

    return ADVENTURE_JOURNALS.map((journal, journalIndex) => {

        const pages = [];

        for (const source of journal.sources) {

            const text = fileTexts[source.file];

            if (typeof text !== "string") {
                throw new Error(`Fichier de contenu manquant : ${source.file}`);
            }

            const parsed = parseMarkup(text);

            if (parsed.intro.length > 0) {
                pages.push({
                    name: source.introTitle ?? journal.name,
                    blocks: parsed.intro
                });
            }

            for (const page of parsed.pages) {
                pages.push({ name: page.title, blocks: page.blocks });
            }
        }

        const seen = new Set();

        return {
            key: journal.key,
            name: journal.name,
            sort: (journalIndex + 1) * 100000,
            pages: pages.map((page, pageIndex) => {

                const pageKey = `${journal.key}/${slugify(page.name)}`;

                if (seen.has(pageKey)) {
                    throw new Error(
                        `Titre de page en double dans « ${journal.name} » : ${page.name}`
                    );
                }

                seen.add(pageKey);

                return {
                    pageKey,
                    name: page.name,
                    content: renderBlocksToHtml(page.blocks, options),
                    sort: (pageIndex + 1) * 100000
                };
            })
        };
    });
}
