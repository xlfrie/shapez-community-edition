import packager from "electron-packager";
import pj from "../electron/package.json" with { type: "json" };
import path from "path/posix";
import { getVersion } from "./buildutils.js";
import fs from "fs/promises";
import childProcess from "child_process";
import { promisify } from "util";
const exec = promisify(childProcess.exec);
import gulp from "gulp";
import { BUILD_VARIANTS } from "./build_variants.js";

import gulpClean from "gulp-clean";

const platforms = /** @type {const} */ (["win32", "linux", "darwin"]);
const architectures = /** @type {const} */ (["x64", "arm64"]);

export default Object.fromEntries(
    Object.entries(BUILD_VARIANTS)
        .filter(([variant, variantData]) => variantData.standalone)
        .map(([variant, variantData]) => {
            const tempDestDir = path.join("..", "build_output", variant);
            const electronBaseDir = path.join("..", "electron");
            const tempDestBuildDir = path.join(tempDestDir, "built");

            function cleanup() {
                return gulp
                    .src(tempDestDir, { read: false, allowEmpty: true })
                    .pipe(gulpClean({ force: true }));
            }

            function copyPrefab() {
                const requiredFiles = [
                    path.join(electronBaseDir, "node_modules", "**", "*.*"),
                    path.join(electronBaseDir, "node_modules", "**", ".*"),
                    path.join(electronBaseDir, "favicon*"),
                ];
                return gulp.src(requiredFiles, { base: electronBaseDir }).pipe(gulp.dest(tempDestBuildDir));
            }

            async function writePackageJson() {
                const packageJsonString = JSON.stringify(
                    {
                        scripts: {
                            start: pj.scripts.start,
                        },
                        devDependencies: pj.devDependencies,
                        dependencies: pj.dependencies,
                        optionalDependencies: pj.optionalDependencies,
                    },
                    null,
                    4
                );

                await fs.writeFile(path.join(tempDestBuildDir, "package.json"), packageJsonString);
            }

            function minifyCode() {
                return gulp.src(path.join(electronBaseDir, "*.js")).pipe(gulp.dest(tempDestBuildDir));
            }

            function copyGamefiles() {
                return gulp.src("../build/**/*.*", { base: "../build" }).pipe(gulp.dest(tempDestBuildDir));
            }

            async function killRunningInstances() {
                try {
                    await exec("taskkill /F /IM shapezio.exe");
                } catch (ex) {
                    console.warn("Failed to kill running instances, maybe none are up.");
                }
            }

            const prepare = {
                cleanup,
                copyPrefab,
                writePackageJson,
                minifyCode,
                copyGamefiles,
                all: gulp.series(
                    killRunningInstances,
                    cleanup,
                    copyPrefab,
                    writePackageJson,
                    minifyCode,
                    copyGamefiles
                ),
            };

            /**
             *
             * @param {typeof platforms[number] | (typeof platforms[number])[]} platform
             * @param {typeof architectures[number] | (typeof architectures[number])[]} arch
             */
            async function packageStandalone(platform, arch) {
                const appPaths = await packager({
                    dir: tempDestBuildDir,
                    appCopyright: "tobspr Games",
                    appVersion: getVersion(),
                    buildVersion: "1.0.0",
                    arch,
                    platform,
                    asar: true,
                    executableName: "shapezio",
                    icon: path.join(electronBaseDir, "favicon"),
                    name: "shapez",
                    out: tempDestDir,
                    overwrite: true,
                    appBundleId: "tobspr.shapezio." + variant,
                    appCategoryType: "public.app-category.games",
                });

                console.log("Packages created:", appPaths);
                await Promise.all(
                    appPaths.map(async appPath => {
                        await fs.writeFile(
                            path.join(appPath, "LICENSE"),
                            await fs.readFile(path.join("..", "LICENSE"))
                        );
                    })
                );
            }

            const pack = {
                ...Object.fromEntries(
                    platforms.flatMap(platform =>
                        architectures.map(arch => [
                            `${platform}-${arch}`,
                            () => packageStandalone(platform, arch),
                        ])
                    )
                ),
                // TODO: Review this hack forced by readonly types
                all: () => packageStandalone([...platforms], [...architectures]),
            };

            return [
                variant,
                {
                    killRunningInstances,
                    prepare,
                    package: pack,
                },
            ];
        })
);
