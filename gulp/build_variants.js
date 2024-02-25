/**
 * @type {Record<string, {
 *  environment?: 'dev' | 'staging' | 'prod',
 *  electronBaseDir?: string,
 *  steamAppId?: number,
 *  executableName?: string
 * }>}
 */
export const BUILD_VARIANTS = {
    "web-localhost": {
        environment: "dev",
    },
    "web-shapezio-beta": {
        environment: "staging",
    },
    "web-shapezio": {
        environment: "prod",
    },
    "standalone-steam": {
        executableName: "shapez",
        steamAppId: 1318690,
    },
};
