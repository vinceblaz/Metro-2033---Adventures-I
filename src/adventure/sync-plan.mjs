/**
 * Plan de synchronisation des pages d'un journal importé.
 *
 * Règle : une page déjà importée n'est mise à jour que si le MJ ne l'a
 * pas modifiée depuis l'import (son contenu actuel a toujours l'empreinte
 * enregistrée). Sinon elle est conservée telle quelle.
 *
 * Module pur.
 */

import { hashContent } from "./content-hash.mjs";

/**
 * @param {Array<{id: string, pageKey: string, content: string, importedHash: string}>} existing
 * @param {Array<{pageKey: string, name: string, content: string}>} desired
 * @returns {{ create: object[], update: object[], keep: object[], unchanged: object[] }}
 */
export function planPageSync(existing, desired) {

    const byKey = new Map(
        existing
            .filter(page => page.pageKey)
            .map(page => [page.pageKey, page])
    );

    const plan = { create: [], update: [], keep: [], unchanged: [] };

    for (const wanted of desired) {

        const current = byKey.get(wanted.pageKey);

        if (!current) {
            plan.create.push(wanted);
            continue;
        }

        const wantedHash = hashContent(wanted.content);

        if (hashContent(current.content) !== current.importedHash) {
            plan.keep.push({ ...wanted, id: current.id });
            continue;
        }

        if (current.importedHash === wantedHash) {
            plan.unchanged.push({ ...wanted, id: current.id });
            continue;
        }

        plan.update.push({ ...wanted, id: current.id });
    }

    return plan;
}
