import path from "path/posix";
import fs from "fs/promises";
import gulp from "gulp";
import { buildFolder } from "./config.js";

import { getRevision, getVersion } from "./buildutils.js";

import gulpRename from "gulp-rename";
import gulpSftp from "gulp-sftp";

const commitHash = getRevision();

const additionalFolder = path.join("additional_build_files");

const additionalGlobs = [
    path.join(additionalFolder, "*"),
    path.join(additionalFolder, "*.*"),
    path.join(additionalFolder, ".*"),
];

const credentials = {
    alpha: {
        host: process.env.SHAPEZ_CLI_SERVER_HOST,
        user: process.env.SHAPEZ_CLI_ALPHA_FTP_USER,
        pass: process.env.SHAPEZ_CLI_ALPHA_FTP_PW,
    },
    staging: {
        host: process.env.SHAPEZ_CLI_SERVER_HOST,
        user: process.env.SHAPEZ_CLI_STAGING_FTP_USER,
        pass: process.env.SHAPEZ_CLI_STAGING_FTP_PW,
    },
    prod: {
        host: process.env.SHAPEZ_CLI_SERVER_HOST,
        user: process.env.SHAPEZ_CLI_LIVE_FTP_USER,
        pass: process.env.SHAPEZ_CLI_LIVE_FTP_PW,
    },
};

// Write the "commit.txt" file
export async function writeVersion() {
    await fs.writeFile(
        path.join(buildFolder, "version.json"),
        JSON.stringify(
            {
                commit: getRevision(),
                appVersion: getVersion(),
                buildTime: new Date().getTime(),
            },
            null,
            4
        )
    );
}

const gameSrcGlobs = [
    path.join(buildFolder, "**/*.*"),
    path.join(buildFolder, "**/.*"),
    path.join(buildFolder, "**/*"),
    path.join(buildFolder, "!**/index.html"),
];

export const upload = Object.fromEntries(
    ["alpha", "prod", "staging"].map(deployEnv => {
        const deployCredentials = credentials[deployEnv];

        function game() {
            return gulp
                .src(gameSrcGlobs, { base: buildFolder })
                .pipe(
                    gulpRename(pth => {
                        pth.dirname = path.join("v", commitHash, pth.dirname);
                    })
                )
                .pipe(gulpSftp(deployCredentials));
        }

        function indexHtml() {
            return gulp
                .src([path.join(buildFolder, "index.html"), path.join(buildFolder, "version.json")], {
                    base: buildFolder,
                })
                .pipe(gulpSftp(deployCredentials));
        }

        function additionalFiles() {
            return gulp.src(additionalGlobs, { base: additionalFolder }).pipe(gulpSftp(deployCredentials));
        }

        return [
            deployEnv,
            {
                game,
                indexHtml,
                additionalFiles,
                all: gulp.series(writeVersion, game, indexHtml, additionalFiles),
            },
        ];
    })
);
