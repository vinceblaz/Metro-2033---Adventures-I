/**
 * Mini-langage de contenu des pages de journal (fichiers content/*.md).
 *
 *   ## Titre de page          -> une page de journal
 *   ### Titre / #### Titre    -> intertitres dans la page (h2 / h3)
 *   - élément                 -> liste à puces
 *   :::type Titre optionnel   -> encadré (lire | note | regle | route | cite)
 *   ...                          jusqu'à une ligne ":::"
 *
 * Les lignes avant le premier « ## » forment la page d'introduction
 * du fichier (feuille de route du scénario, par exemple).
 *
 * Module pur : aucune dépendance à Foundry.
 */

export const BOX_KINDS = Object.freeze(["lire", "note", "regle", "route", "cite"]);


function parseInnerBlocks(lines) {

    const blocks = [];
    let paragraph = [];
    let list = null;

    const flushParagraph = () => {
        if (paragraph.length > 0) {
            blocks.push({ type: "p", text: paragraph.join(" ") });
            paragraph = [];
        }
    };

    const flushList = () => {
        if (list) {
            blocks.push({ type: "list", items: list });
            list = null;
        }
    };

    for (const raw of lines) {

        const line = raw.trim();

        if (line === "") {
            flushParagraph();
            continue;
        }

        if (line.startsWith("- ")) {
            flushParagraph();
            list = list ?? [];
            list.push(line.slice(2).trim());
            continue;
        }

        flushList();
        paragraph.push(line);
    }

    flushParagraph();
    flushList();

    return blocks;
}


function parseBlocks(lines) {

    const blocks = [];
    let buffer = [];

    const flushBuffer = () => {
        if (buffer.length > 0) {
            blocks.push(...parseInnerBlocks(buffer));
            buffer = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {

        const line = lines[i];
        const trimmed = line.trim();

        const heading = /^(#{3,4}) (.+)$/.exec(trimmed);

        if (heading) {
            flushBuffer();
            blocks.push({
                type: "heading",
                level: heading[1].length - 1,
                text: heading[2].trim()
            });
            continue;
        }

        const boxStart = /^:::([a-z]+)(?: (.+))?$/.exec(trimmed);

        if (boxStart) {

            flushBuffer();

            const kind = boxStart[1];

            if (!BOX_KINDS.includes(kind)) {
                throw new Error(
                    `Encadré inconnu « ${kind} » (ligne ${i + 1}).`
                );
            }

            const inner = [];
            i++;

            while (i < lines.length && lines[i].trim() !== ":::") {
                inner.push(lines[i]);
                i++;
            }

            if (i >= lines.length) {
                throw new Error(
                    `Encadré « ${kind} » non refermé.`
                );
            }

            blocks.push({
                type: "box",
                kind,
                title: (boxStart[2] ?? "").trim(),
                blocks: parseInnerBlocks(inner)
            });
            continue;
        }

        buffer.push(line);
    }

    flushBuffer();

    return blocks;
}


/**
 * @param {string} source
 * @returns {{ intro: object[], pages: Array<{title: string, blocks: object[]}> }}
 */
export function parseMarkup(source) {

    const lines = String(source).replace(/\r\n/g, "\n").split("\n");

    const introLines = [];
    const pageChunks = [];
    let current = null;

    for (const line of lines) {

        const match = /^## (.+)$/.exec(line.trim());

        if (match) {
            current = { title: match[1].trim(), lines: [] };
            pageChunks.push(current);
            continue;
        }

        (current ? current.lines : introLines).push(line);
    }

    return {
        intro: parseBlocks(introLines),
        pages: pageChunks.map(chunk => ({
            title: chunk.title,
            blocks: parseBlocks(chunk.lines)
        }))
    };
}
