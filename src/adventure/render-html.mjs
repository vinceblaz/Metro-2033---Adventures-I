/**
 * Rendu HTML des blocs de contenu (voir markup.mjs).
 *
 * Les encadrés utilisent des <div> (et non <aside>/<section>) : ce sont
 * les éléments que l'éditeur ProseMirror de Foundry conserve avec leur
 * classe lorsqu'un MJ édite ensuite la page.
 *
 * Module pur.
 */

import { createEntityLinker } from "./entity-links.mjs";

const SKILL_TERMS = [
    "CORPS À CORPS", "ACTION LENTE", "ACTION RAPIDE",
    "COMPRÉHENSION", "MANIPULATION", "OBSERVATION", "ENDURANCE",
    "FURTIVITÉ", "BRICOLAGE", "TERREUR", "INTENSITÉ", "EMPATHIE",
    "VIGUEUR", "AGILITÉ", "RÉACTION", "ANALYSE", "CONFIANCE", "DÉFIANCE",
    "ESPRIT", "SOINS", "BRISÉ", "DOUTE", "TIR"
];

const SKILL_PATTERN = new RegExp(
    `(?<![\\wÀ-ÿ])(?:${SKILL_TERMS.join("|")})(?![\\wÀ-ÿ])`,
    "g"
);

const BOX_CLASS = Object.freeze({
    lire: "metro-read-aloud",
    note: "metro-gm-note",
    regle: "metro-rule-box",
    route: "metro-route-sheet",
    cite: "metro-epigraph"
});


export function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


function renderInline(text, link) {

    const escaped = escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    return escaped
        .split(/(<[^>]+>)/)
        .map((segment) => {

            if (segment.startsWith("<")) {
                return segment;
            }

            const highlighted = segment.replace(
                SKILL_PATTERN,
                (term) => `<span class="metro-skill">${term}</span>`
            );

            // Le lieur travaille sur le texte : on le passe sur les parties
            // hors balises uniquement.
            return highlighted
                .split(/(<[^>]+>)/)
                .map(part => part.startsWith("<") ? part : link(part))
                .join("");
        })
        .join("");
}


function renderBlock(block, link) {

    switch (block.type) {

        case "p":
            return `<p>${renderInline(block.text, link)}</p>`;

        case "list":
            return "<ul>"
                + block.items
                    .map(item => `<li>${renderInline(item, link)}</li>`)
                    .join("")
                + "</ul>";

        case "heading": {
            const tag = `h${block.level}`;
            return `<${tag}>${escapeHtml(block.text)}</${tag}>`;
        }

        case "box": {
            const title = block.title
                ? `<h4 class="metro-box-title">${escapeHtml(block.title)}</h4>`
                : "";
            const inner = block.blocks
                .map(child => renderBlock(child, link))
                .join("");
            return `<div class="${BOX_CLASS[block.kind]}">${title}${inner}</div>`;
        }

        default:
            throw new Error(`Bloc inconnu : ${block.type}`);
    }
}


/**
 * @param {object[]} blocks
 * @param {{ resolveUuid?: (rule: object) => (string|null) }} [options]
 * @returns {string}
 */
export function renderBlocksToHtml(blocks, options = {}) {

    const link = createEntityLinker(options.resolveUuid ?? (() => null));

    return blocks
        .map(block => renderBlock(block, link))
        .join("\n");
}
