import gulp from "gulp";
import { BUILD_VARIANTS } from "./build_variants.js";
import { buildFolder, browserSync } from "./config.js";

import webpackConfig from "./webpack.config.js";
import webpackProductionConfig from "./webpack.production.config.js";

import webpackStream from "webpack-stream";
import gulpRename from "gulp-rename";

/**
 * PROVIDES (per <variant>)
 *
 * js.<variant>.dev.watch
 * js.<variant>.dev
 * js.<variant>.prod
 *
 */

//// DEV

export default Object.fromEntries(
    Object.entries(BUILD_VARIANTS).map(([variant, data]) => {
        function watch() {
            return gulp
                .src("../src/js/main.js")
                .pipe(webpackStream(webpackConfig))
                .pipe(gulp.dest(buildFolder))
                .pipe(browserSync.stream());
        }

        function build() {
            return gulp
                .src("../src/js/main.js")
                .pipe(webpackStream(webpackConfig))
                .pipe(gulp.dest(buildFolder));
        }

        const dev = {
            watch,
            build,
        };

        let prod;
        if (!data.standalone) {
            // WEB

            function transpiled() {
                return gulp
                    .src("../src/js/main.js")
                    .pipe(webpackStream(webpackProductionConfig))
                    .pipe(gulpRename("bundle-transpiled.js"))
                    .pipe(gulp.dest(buildFolder));
            }

            function es6() {
                return gulp
                    .src("../src/js/main.js")
                    .pipe(webpackStream(webpackProductionConfig))
                    .pipe(gulp.dest(buildFolder));
            }

            prod = {
                transpiled,
                es6,
                build:
                    // transpiled currently not used
                    // gulp.parallel("js." + variant + ".prod.transpiled", "js." + variant + ".prod.es6")
                    es6,
            };
        } else {
            // STANDALONE
            function build() {
                return gulp
                    .src("../src/js/main.js")
                    .pipe(webpackStream(webpackProductionConfig))
                    .pipe(gulp.dest(buildFolder));
            }

            prod = { build };
        }

        return [variant, { dev, prod }];
    })
);
