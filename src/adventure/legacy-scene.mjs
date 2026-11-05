/**
 * Conversion d'un export de scène « ancien format » (Dungeon Alchemist /
 * Foundry ≤ v9 : `grid` entier, `img`, `globalLight`, murs à valeurs 0/1,
 * lumières avec `tintColor`) en données de Scene Foundry v14.
 *
 * Le fond d'écran est porté par un Level (v14 ignore `Scene#background`).
 * Fonction pure : ne modifie pas la source.
 */

// Anciennes valeurs de restriction → CONST.WALL_SENSE_TYPES (0 / 10 / 20).
const RESTRICTION = Object.freeze({ 0: 0, 1: 20, 2: 10, 10: 10, 20: 20 });

const LEVEL_ELEVATION = Object.freeze({ bottom: 0, top: 10 });


function convertRestriction(value, wallIndex) {

    // Champ absent : comportement par défaut d'un mur (bloquant).
    if (value === undefined) {
        return 20;
    }

    if (!Object.hasOwn(RESTRICTION, value)) {
        throw new Error(
            `Export de scène : mur n°${wallIndex} avec une restriction inconnue (${value}).`
        );
    }

    return RESTRICTION[value];
}


function convertWall(wall, index) {

    if (!Array.isArray(wall?.c) || wall.c.length !== 4) {
        throw new Error(
            `Export de scène : mur n°${index} sans coordonnées valides.`
        );
    }

    return {
        c: [...wall.c],
        move: convertRestriction(wall.move, index),
        sense: convertRestriction(wall.sense, index),
        sound: convertRestriction(wall.sound, index),
        door: wall.door ?? 0
    };
}


function convertLight(light) {

    return {
        x: light.x,
        y: light.y,
        config: {
            dim: light.dim ?? 0,
            bright: light.bright ?? 0,
            color: light.tintColor ?? null,
            alpha: light.tintAlpha ?? 0.5
        }
    };
}


/**
 * @param {object} raw export de scène (JSON)
 * @param {{name: string, key: string, adventureId: string,
 *          imageUrl: string, thumbUrl?: string}} options
 */
export function legacySceneToV14(raw, options) {

    if (!Number.isFinite(raw?.width) || !Number.isFinite(raw?.height)) {
        throw new Error("Export de scène : dimensions absentes ou invalides.");
    }

    const scene = {
        name: options.name,
        width: raw.width,
        height: raw.height,
        padding: raw.padding ?? 0,
        grid: {
            type: 1,
            size: raw.grid,
            distance: raw.gridDistance ?? 5,
            units: raw.gridUnits ?? "ft",
            color: raw.gridColor ?? "#000000",
            alpha: raw.gridAlpha ?? 0.2
        },
        environment: {
            darknessLevel: raw.darkness ?? 0,
            globalLight: { enabled: raw.globalLight ?? false }
        },
        levels: [
            {
                name: options.name,
                elevation: { ...LEVEL_ELEVATION },
                background: { src: options.imageUrl }
            }
        ],
        walls: (raw.walls ?? []).map(convertWall),
        lights: (raw.lights ?? []).map(convertLight),
        flags: {
            [options.adventureId]: { sceneKey: options.key }
        }
    };

    if (options.thumbUrl) {
        scene.thumb = options.thumbUrl;
    }

    return scene;
}
