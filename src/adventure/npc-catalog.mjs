/**
 * Profils génériques de PNJ utilisés par les scénarios 1 à 3
 * (livre de base, chapitre « Antagonistes », pp. 146-148).
 *
 * Même structure que les catalogues du système (station-npc-catalog.mjs) :
 * ces entrées sont passées à `buildNpcActorData()` du système au moment
 * de l'import (voir foundry/import-npcs.mjs).
 *
 * Valeurs reprises du livre. Les compétences non citées valent 0.
 * Correspondance : Bricolage = repair, Soins = medicine.
 * Un « talent au choix » n'est pas fixé : il est noté dans `special`.
 */

export const NPC_PACK_NAME = "pnj-aventures-i";
export const NPC_PACK_LABEL = "Métro 2033 — PNJ Aventures I";

function attribute(value) {
    return { value, max: value };
}

function attack(name, { bonus = 0, damage = 0 } = {}) {
    return { name, bonus, damage, special: "" };
}

function talentRef(name, { weaponType = "" } = {}) {
    return { name, advanced: false, weaponType };
}

const KNIFE = () => attack("Couteau", { bonus: 1, damage: 2 });

export const ADVENTURE_NPCS = Object.freeze([
    {
        key: "adventure1-npc-garde",
        name: "Garde",
        role: "Profil générique — Garde",
        page: 146,
        attributes: { vigor: attribute(3), agility: attribute(3), spirit: attribute(3), empathy: attribute(3) },
        skills: { closeCombat: 2, reaction: 2, shooting: 2, comprehension: 1, observation: 2, analysis: 1 },
        armor: { name: "Veste renforcée", protection: 3 },
        weapons: [KNIFE(), attack("Fusil", { bonus: 2, damage: 2 })],
        talents: [talentRef("Arme de prédilection"), talentRef("Courage")],
        special: "<p><em>Arme de prédilection : fusil.</em></p><p>Dans les stations modestes, le livre invite à utiliser le profil du travailleur pour les factionnaires.</p>"
    },
    {
        key: "adventure1-npc-stalker",
        name: "Stalker",
        role: "Profil générique — Stalker",
        page: 147,
        attributes: { vigor: attribute(4), agility: attribute(4), spirit: attribute(4), empathy: attribute(3) },
        skills: { closeCombat: 2, endurance: 1, stealth: 2, reaction: 2, shooting: 3, observation: 2, survival: 2, medicine: 1 },
        armor: { name: "Gilet pare-balles et casque léger", protection: 6, resilience: true },
        weapons: [
            KNIFE(),
            attack("Pistolet lourd", { bonus: 2, damage: 2 }),
            attack("Fusil d’assaut", { bonus: 2, damage: 2 })
        ],
        talents: [
            talentRef("Nerfs d'acier"),
            talentRef("Spécialiste en armement", { weaponType: "ranged" }),
            talentRef("Tenace"),
            talentRef("Tireur instinctif")
        ],
        special: ""
    },
    {
        key: "adventure1-npc-criminel",
        name: "Criminel",
        role: "Profil générique — Criminel",
        page: 146,
        attributes: { vigor: attribute(4), agility: attribute(3), spirit: attribute(3), empathy: attribute(3) },
        skills: { closeCombat: 2, endurance: 1, stealth: 1, reaction: 1, shooting: 1, observation: 1, analysis: 1, manipulation: 2 },
        weapons: [KNIFE(), attack("Revolver", { bonus: 1, damage: 2 })],
        talents: [talentRef("Brute"), talentRef("Menaçant")],
        special: ""
    },
    {
        key: "adventure1-npc-travailleur",
        name: "Travailleur",
        role: "Profil générique — Travailleur",
        page: 148,
        attributes: { vigor: attribute(4), agility: attribute(3), spirit: attribute(3), empathy: attribute(3) },
        skills: { repair: 2, closeCombat: 1, endurance: 3, stealth: 1, observation: 1 },
        weapons: [attack("Objet contondant", { bonus: 1, damage: 1 })],
        talents: [],
        special: "<p><strong>Talent au choix :</strong> As de la bricole, Résistance ou Tenace.</p><p><em>Arme : un objet contondant (clé à molette, pelle, bâton, etc.).</em></p>"
    },
    {
        key: "adventure1-npc-personnel-administratif",
        name: "Personnel administratif",
        role: "Profil générique — Personnel administratif",
        page: 147,
        attributes: { vigor: attribute(3), agility: attribute(2), spirit: attribute(4), empathy: attribute(4) },
        skills: { stealth: 1, comprehension: 3, observation: 2, analysis: 2, manipulation: 1 },
        weapons: [],
        talents: [],
        special: "<p><strong>Talent au choix :</strong> Chanceux ou Temporisation.</p>"
    }
]);


const RANGED_WEAPON_NAME = /revolver|fusil|pistolet/i;

/**
 * Ajuste les données produites par `buildNpcActorData()` du système :
 * - description « livre de base » (le builder du système cite le livre
 *   des Monstres) ;
 * - armes à feu marquées « à distance » (le builder ne reconnaît que
 *   les noms contenant « portée » ou « TIR »).
 * Fonction pure, ne modifie pas ses arguments.
 */
export function finalizeNpcActorData(data, entry) {

    return {
        ...data,
        system: {
            ...data.system,
            identity: {
                ...data.system.identity,
                description: `<p>Source : livre de base, profil générique, p.${entry.page}.</p>`
            }
        },
        items: data.items.map(item =>
            item.type === "weapon" && RANGED_WEAPON_NAME.test(item.name)
                ? { ...item, system: { ...item.system, category: "ranged", range: "short" } }
                : item
        )
    };
}
