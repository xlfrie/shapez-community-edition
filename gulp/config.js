import path from "path/posix";
import BrowserSync from "browser-sync";

export const baseDir = path.resolve("..");
export const buildFolder = path.join(baseDir, "build");
export const buildOutputFolder = path.join(baseDir, "build_output");

// Globs for atlas resources
export const rawImageResourcesGlobs = ["../res_raw/atlas.json", "../res_raw/**/*.png"];

// Globs for non-ui resources
export const nonImageResourcesGlobs = ["../res/**/*.woff2", "../res/*.ico", "../res/**/*.webm"];

// Globs for ui resources
export const imageResourcesGlobs = [
    "../res/**/*.png",
    "../res/**/*.svg",
    "../res/**/*.jpg",
    "../res/**/*.gif",
];

export const browserSync = BrowserSync.create({});

// Check environment variables

const envVars = [
    "SHAPEZ_CLI_SERVER_HOST",
    "SHAPEZ_CLI_ALPHA_FTP_USER",
    "SHAPEZ_CLI_ALPHA_FTP_PW",
    "SHAPEZ_CLI_STAGING_FTP_USER",
    "SHAPEZ_CLI_STAGING_FTP_PW",
    "SHAPEZ_CLI_LIVE_FTP_USER",
    "SHAPEZ_CLI_LIVE_FTP_PW",
    "SHAPEZ_CLI_APPLE_ID",
    "SHAPEZ_CLI_APPLE_CERT_NAME",
    "SHAPEZ_CLI_GITHUB_USER",
    "SHAPEZ_CLI_GITHUB_TOKEN",
];

for (let i = 0; i < envVars.length; ++i) {
    if (!process.env[envVars[i]]) {
        console.warn("Unset environment variable, might cause issues:", envVars[i]);
    }
}
