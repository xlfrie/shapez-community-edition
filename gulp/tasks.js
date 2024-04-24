import gulp from "gulp";
import path from "path/posix";
import pathNative from "path";
import delEmpty from "delete-empty";
import childProcess from "child_process";
import { promisify } from "util";
const exec = promisify(childProcess.exec);
import { BUILD_VARIANTS } from "./build_variants.js";
import {
    baseDir,
    buildFolder,
    buildOutputFolder,
    browserSync,
    rawImageResourcesGlobs,
    nonImageResourcesGlobs,
    imageResourcesGlobs,
} from "./config.js";

// Load other plugins
import gulpClean from "gulp-clean";
import gulpWebserver from "gulp-webserver";

import * as imgres from "./image-resources.js";
import * as css from "./css.js";
import * as sounds from "./sounds.js";
import * as localConfig from "./local-config.js";
import js from "./js.js";
import * as html from "./html.js";
import * as ftp from "./ftp.js";
import * as docs from "./docs.js";
import standalone from "./standalone.js";
import * as translations from "./translations.js";

export { imgres, css, sounds, localConfig, js, html, ftp, docs, standalone, translations };

/////////////////////  BUILD TASKS  /////////////////////

// Cleans up everything
function cleanBuildFolder() {
    return gulp.src(buildFolder, { read: false, allowEmpty: true }).pipe(gulpClean({ force: true }));
}
function cleanBuildOutputFolder() {
    return gulp.src(buildOutputFolder, { read: false, allowEmpty: true }).pipe(gulpClean({ force: true }));
}
function cleanBuildTempFolder() {
    return gulp
        .src(path.join("..", "src", "js", "built-temp"), { read: false, allowEmpty: true })
        .pipe(gulpClean({ force: true }));
}
function cleanImageBuildFolder() {
    return gulp
        .src(path.join("res_built"), { read: false, allowEmpty: true })
        .pipe(gulpClean({ force: true }));
}

const cleanup = gulp.series(cleanBuildFolder, cleanImageBuildFolder, cleanBuildTempFolder);

// Requires no uncomitted files
async function requireCleanWorkingTree() {
    let output = (await exec("git status -su", { encoding: "buffer" })).stdout
        .toString("ascii")
        .trim()
        .replace(/\r/gi, "")
        .split("\n");

    // Filter files which are OK to be untracked
    output = output
        .map(x => x.replace(/[\r\n]+/gi, ""))
        .filter(x => x.indexOf(".local.js") < 0)
        .filter(x => x.length > 0);
    if (output.length > 0) {
        console.error("\n\nYou have unstaged changes, please commit everything first!");
        console.error("Unstaged files:");
        console.error(output.map(x => "'" + x + "'").join("\n"));
        process.exit(1);
    }
}

function copyAdditionalBuildFiles() {
    const additionalFolder = path.join("additional_build_files");
    const additionalSrcGlobs = [
        path.join(additionalFolder, "**/*.*"),
        path.join(additionalFolder, "**/.*"),
        path.join(additionalFolder, "**/*"),
    ];

    return gulp.src(additionalSrcGlobs).pipe(gulp.dest(buildFolder));
}

export const utils = {
    cleanBuildFolder,
    cleanBuildOutputFolder,
    cleanBuildTempFolder,
    cleanImageBuildFolder,
    cleanup,
    requireCleanWorkingTree,
    copyAdditionalBuildFiles,
};

// Starts a webserver on the built directory (useful for testing prod build)
function webserver() {
    return gulp.src(buildFolder).pipe(
        gulpWebserver({
            livereload: {
                enable: true,
            },
            directoryListing: false,
            open: true,
            port: 3005,
        })
    );
}

/**
 *
 * @param {object} param0
 * @param {keyof typeof BUILD_VARIANTS} param0.version
 */
function serveHTML({ version = "web-dev" }) {
    browserSync.init({
        server: [buildFolder, path.join(baseDir, "mod_examples")],
        port: 3005,
        ghostMode: {
            clicks: false,
            scroll: false,
            location: false,
            forms: false,
        },
        logLevel: "info",
        logPrefix: "BS",
        online: false,
        xip: false,
        notify: false,
        reloadDebounce: 100,
        reloadOnRestart: true,
        watchEvents: ["add", "change"],
    });

    // Watch .scss files, those trigger a css rebuild
    gulp.watch(["../src/**/*.scss"], css.dev);

    // Watch .html files, those trigger a html rebuild
    gulp.watch("../src/**/*.html", html.dev);
    gulp.watch("./preloader/*.*", html.dev);

    // Watch translations
    gulp.watch("../translations/**/*.yaml", translations.convertToJson);

    gulp.watch(
        ["../res_raw/sounds/sfx/*.mp3", "../res_raw/sounds/sfx/*.wav"],
        gulp.series(sounds.sfx, sounds.copy)
    );
    gulp.watch(
        ["../res_raw/sounds/music/*.mp3", "../res_raw/sounds/music/*.wav"],
        gulp.series(sounds.music, sounds.copy)
    );

    // Watch resource files and copy them on change
    gulp.watch(rawImageResourcesGlobs, imgres.buildAtlas);
    gulp.watch(nonImageResourcesGlobs, imgres.copyNonImageResources);
    gulp.watch(imageResourcesGlobs, imgres.copyImageResources);

    // Watch .atlas files and recompile the atlas on change
    gulp.watch("../res_built/atlas/*.atlas", imgres.atlasToJson);
    gulp.watch("../res_built/atlas/*.json", imgres.atlas);

    // Watch the build folder and reload when anything changed
    const extensions = ["html", "js", "png", "gif", "jpg", "svg", "mp3", "ico", "woff2", "json"];
    gulp.watch(extensions.map(ext => path.join(buildFolder, "**", "*." + ext))).on("change", p =>
        gulp
            .src(pathNative.resolve(p).replaceAll(pathNative.sep, path.sep))
            .pipe(browserSync.reload({ stream: true }))
    );

    gulp.watch("../src/js/built-temp/*.json").on("change", p =>
        gulp
            .src(pathNative.resolve(p).replaceAll(pathNative.sep, path.sep))
            .pipe(browserSync.reload({ stream: true }))
    );

    gulp.series(js[version].dev.watch)(() => true);
}

// Pre and postbuild
const baseResources = imgres.allOptimized;
async function deleteEmpty() {
    await delEmpty(buildFolder);
}

const postbuild = gulp.series(imgres.cleanupUnusedCssInlineImages, deleteEmpty);

export const step = {
    baseResources,
    deleteEmpty,
    postbuild,
};

/////////////////////  RUNNABLE TASKS  /////////////////////

// Builds everything (dev)
const prepare = {
    dev: gulp.series(
        utils.cleanup,
        utils.copyAdditionalBuildFiles,
        localConfig.findOrCreate,
        gulp.parallel(
            gulp.series(imgres.buildAtlas, imgres.atlasToJson, imgres.atlas),
            sounds.dev,
            gulp.series(imgres.copyImageResources, css.dev),
            imgres.copyNonImageResources,
            translations.fullBuild
        )
    ),
};

/**
 * @typedef {import("gulp").TaskFunction} TaskFunction
 */

export const build =
    /**
     * @type {Record<string, {
     *  code: TaskFunction,
     *  resourcesAndCode: TaskFunction,
     *  all: TaskFunction,
     *  full: TaskFunction,
     * }> & { prepare: typeof prepare }}
     */
    ({
        prepare,
    });
/**
 * @type {Record<string, Record<string, TaskFunction>>}
 */
const pack = {};
export { pack as package };
/** @type {Record<string, TaskFunction>} */
export const serve = {};

// Builds everything for every variant
for (const variant in BUILD_VARIANTS) {
    const data = BUILD_VARIANTS[variant];

    // build
    const code = gulp.series(
        data.standalone ? sounds.fullbuildHQ : sounds.fullbuild,
        translations.fullBuild,
        js[variant].prod.build
    );

    const resourcesAndCode = gulp.parallel(step.baseResources, code);

    const all = gulp.series(resourcesAndCode, css.prod, html.prod);

    const full = gulp.series(utils.cleanup, all, step.postbuild);

    build[variant] = { code, resourcesAndCode, all, full };

    // Tasks for creating packages. These packages are already distributable, but usually can be further
    // wrapped in a different format (an installer for Windows, tarball for Linux, DMG for macOS).
    if (data.standalone) {
        const packageTasks = [
            "win32-x64",
            "win32-arm64",
            "linux-x64",
            "linux-arm64",
            "darwin-x64",
            "darwin-arm64",
            "all",
        ];

        pack[variant] = {};
        for (const task of packageTasks) {
            pack[variant][task] = gulp.series(
                localConfig.findOrCreate,
                full,
                utils.cleanBuildOutputFolder,
                standalone[variant].prepare.all,
                standalone[variant].package[task]
            );
        }
    }

    // serve
    serve[variant] = gulp.series(build.prepare.dev, html.dev, () => serveHTML({ version: variant }));
}

// Deploying!
export const deploy = {
    staging: gulp.series(
        utils.requireCleanWorkingTree,
        build["web-shapezio-beta"].full,
        ftp.upload.staging.all
    ),
    prod: gulp.series(utils.requireCleanWorkingTree, build["web-shapezio"].full, ftp.upload.prod.all),
};

export const main = {
    prepareDocs: docs.prepareDocs,
    webserver,
};

// Default task (dev, localhost)
export default gulp.series(serve["standalone-steam"]);
