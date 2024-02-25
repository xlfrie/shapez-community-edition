import { BUILD_VARIANTS } from "./build_variants.js";

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

export default function gulptasksJS(gulp, buildFolder, browserSync) {
    //// DEV

    for (const variant in BUILD_VARIANTS) {
        gulp.task("js." + variant + ".dev.watch", () => {
            gulp.src("../src/js/main.js")
                .pipe(webpackStream(webpackConfig))
                .pipe(gulp.dest(buildFolder))
                .pipe(browserSync.stream());
        });

        // STANDALONE
        gulp.task("js." + variant + ".dev", () => {
            return gulp
                .src("../src/js/main.js")
                .pipe(webpackStream(webpackConfig))
                .pipe(gulp.dest(buildFolder));
        });
        gulp.task("js." + variant + ".prod", () => {
            return gulp
                .src("../src/js/main.js")
                .pipe(webpackStream(webpackProductionConfig))
                .pipe(gulp.dest(buildFolder));
        });
    }
}
