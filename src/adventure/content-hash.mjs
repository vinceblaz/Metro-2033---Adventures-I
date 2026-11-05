/**
 * Empreinte FNV-1a 32 bits d'une chaîne (suffisante pour détecter une
 * modification manuelle d'une page importée ; pas un usage de sécurité).
 */
export function hashContent(value) {

    let hash = 0x811c9dc5;

    for (const char of String(value)) {
        hash ^= char.codePointAt(0);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }

    return hash.toString(16).padStart(8, "0");
}
