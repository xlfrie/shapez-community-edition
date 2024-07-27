import crc32 from "crc/crc32";

// Distinguish legacy crc prefixes
export const CRC_PREFIX = "crc32".padEnd(32, "-");

/**
 * Computes the crc for a given string
 * @param {string} str
 */
export function computeCrc(str) {
    return CRC_PREFIX + crc32(str).toString(16).padStart(8, "0");
}
