import { getRevision, cachebust as cachebustUtil } from "./buildutils.js";
import fs from "fs";
import path from "path/posix";
import crypto from "crypto";
import { BUILD_VARIANTS } from "./build_variants.js";

import gulpDom from "gulp-dom";
import gulpHtmlmin from "gulp-htmlmin";
import gulpHtmlBeautify from "gulp-html-beautify";
import gulpRename from "gulp-rename";

function computeIntegrityHash(fullPath, algorithm = "sha256") {
    const file = fs.readFileSync(fullPath);
    const hash = crypto.createHash(algorithm).update(file).digest("base64");
    return algorithm + "-" + hash;
}

/**
 * PROVIDES (per <variant>)
 *
 * html.<variant>.dev
 * html.<variant>.prod
 */
export default function gulptasksHTML(gulp, buildFolder) {
    async function buildHtml({ integrity = true }) {
        return (
            gulp
                .src("../src/index.html")
                .pipe(
                    gulpDom(
                        /** @this {Document} **/ function () {
                            const document = this;

                            // Append css
                            const css = document.createElement("link");
                            css.rel = "stylesheet";
                            css.type = "text/css";
                            css.media = "none";
                            css.setAttribute("onload", "this.media='all'");
                            css.href = "main.css";
                            if (integrity) {
                                css.setAttribute(
                                    "integrity",
                                    computeIntegrityHash(path.join(buildFolder, "main.css"))
                                );
                            }
                            document.head.appendChild(css);

                            let fontCss = `
                            @font-face {
                                font-family: "GameFont";
                                font-style: normal;
                                font-weight: normal;
                                font-display: swap;
                                src: url('res/fonts/GameFont.woff2') format("woff2");
                            }
                            `;
                            let loadingCss =
                                fontCss + fs.readFileSync(path.join("preloader", "preloader.css")).toString();

                            const style = document.createElement("style");
                            style.setAttribute("type", "text/css");
                            style.textContent = loadingCss;
                            document.head.appendChild(style);

                            let bodyContent = fs
                                .readFileSync(path.join("preloader", "preloader.html"))
                                .toString();

                            // Append loader, but not in standalone (directly include bundle there)
                            const bundleScript = document.createElement("script");
                            bundleScript.type = "text/javascript";
                            bundleScript.src = "bundle.js";
                            if (integrity) {
                                bundleScript.setAttribute(
                                    "integrity",
                                    computeIntegrityHash(path.join(buildFolder, "bundle.js"))
                                );
                            }
                            document.head.appendChild(bundleScript);

                            document.body.innerHTML = bodyContent;
                        }
                    )
                )
                .pipe(
                    gulpHtmlmin({
                        caseSensitive: true,
                        collapseBooleanAttributes: true,
                        collapseInlineTagWhitespace: true,
                        collapseWhitespace: true,
                        preserveLineBreaks: true,
                        minifyJS: true,
                        minifyCSS: true,
                        quoteCharacter: '"',
                        useShortDoctype: true,
                    })
                )
                .pipe(gulpHtmlBeautify())
                //.pipe(gulpRename("index.html"))
                .pipe(gulp.dest(buildFolder))
        );
    }

    for (const variant in BUILD_VARIANTS) {
        gulp.task("html." + variant + ".dev", () => {
            return buildHtml({
                integrity: false,
            });
        });
        gulp.task("html." + variant + ".prod", () => {
            return buildHtml({
                integrity: true,
            });
        });
    }
}
