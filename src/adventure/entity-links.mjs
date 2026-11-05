/**
 * Règles de liaison automatique des noms de PNJ et de Stations vers
 * les documents du système « Métro 2033 — Year Zero Engine ».
 *
 * Les clés sont les `flags["metro-2033-yze"].seedKey` posés par
 * l'initialisation du système ; les compendiums sont ceux du monde
 * (world.pnj-des-stations, world.stations).
 *
 * Module pur.
 */

export const SYSTEM_FLAG_SCOPE = "metro-2033-yze";
export const SYSTEM_SEED_FLAG = "seedKey";

export const NPC_PACK = "world.pnj-des-stations";
export const STATION_PACK = "world.stations";


export const ENTITY_LINK_RULES = Object.freeze([
    { id: "vedernikov", pack: NPC_PACK, seedKey: "station-npc-samuel-vedernikov", pattern: /Vedernikov/ },
    { id: "khamzat", pack: NPC_PACK, seedKey: "station-npc-khamzat-gouriev", pattern: /Khamzat/ },
    { id: "lyuba", pack: NPC_PACK, seedKey: "station-npc-la-lyuba", pattern: /(?:la )?Lyuba/ },
    { id: "ekaterina", pack: NPC_PACK, seedKey: "station-npc-ekaterina-boutourlina", pattern: /Ekaterina/ },
    { id: "mamouchka", pack: NPC_PACK, seedKey: "station-npc-galina-mamouchka-botcharova", pattern: /Mamouchka/ },
    { id: "stanislav", pack: NPC_PACK, seedKey: "station-npc-stanislav-vorobiov", pattern: /Stanislav/ },
    { id: "oleg", pack: NPC_PACK, seedKey: "station-npc-oleg-dmitriev", pattern: /Oleg/ },
    { id: "mikhail", pack: NPC_PACK, seedKey: "station-npc-mikhail-aksakov", pattern: /Mikhaïl/ },
    { id: "averine", pack: NPC_PACK, seedKey: "station-npc-revaz-averine", pattern: /Averine/ },
    { id: "fedora", pack: NPC_PACK, seedKey: "station-npc-fedora-aksakova", pattern: /Fedora/ },
    { id: "mujahid", pack: NPC_PACK, seedKey: "station-npc-mujahid", pattern: /Mujāhid/ },
    { id: "matvei", pack: NPC_PACK, seedKey: "station-npc-matvei", pattern: /Matveï/ },
    { id: "rate", pack: NPC_PACK, seedKey: "station-npc-rate", pattern: /\bRate\b/ },
    { id: "petchatniki", pack: STATION_PACK, seedKey: "station-petchatniki", pattern: /Petchatniki/ },
    { id: "kojoukhovskaya", pack: STATION_PACK, seedKey: "station-kojoukhovskaya", pattern: /Kojoukhovskaya/ },
    { id: "doubrovka", pack: STATION_PACK, seedKey: "station-doubrovka", pattern: /Doubrovka/ }
]);


/**
 * Crée un « lieur » à usage d'UNE page : chaque règle ne lie que sa
 * première occurrence.
 *
 * @param {(rule: object) => (string|null)} resolveUuid
 *        renvoie l'UUID du document ou null s'il est introuvable.
 * @returns {(text: string) => string}
 */
export function createEntityLinker(resolveUuid) {

    const done = new Set();
    const uuidCache = new Map();

    const uuidFor = (rule) => {
        if (!uuidCache.has(rule.id)) {
            uuidCache.set(rule.id, resolveUuid(rule) ?? null);
        }
        return uuidCache.get(rule.id);
    };

    return function link(text) {

        const tokens = [];
        let result = text;

        for (const rule of ENTITY_LINK_RULES) {

            if (done.has(rule.id)) {
                continue;
            }

            const match = rule.pattern.exec(result);

            if (!match) {
                continue;
            }

            const uuid = uuidFor(rule);

            if (!uuid) {
                continue;
            }

            done.add(rule.id);

            const token = `\u0000${tokens.length}\u0000`;
            tokens.push(`@UUID[${uuid}]{${match[0]}}`);

            result =
                result.slice(0, match.index)
                + token
                + result.slice(match.index + match[0].length);
        }

        return result.replace(
            /\u0000(\d+)\u0000/g,
            (_, index) => tokens[Number(index)]
        );
    };
}
