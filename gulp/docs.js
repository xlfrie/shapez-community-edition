import path from "path/posix";
import fs from "fs/promises";
import gulp from "gulp";

import gulpRename from "gulp-rename";
import stripJsonComments from "strip-json-comments";

export function convertJsToTs() {
    return gulp
        .src(path.join("..", "src", "js", "**", "*.js"))
        .pipe(
            gulpRename(path => {
                path.extname = ".ts";
            })
        )
        .pipe(gulp.dest(path.join("..", "tsc_temp")));
}

export async function copyTsconfigForHints() {
    const src = (await fs.readFile(path.join("..", "src", "js", "tsconfig.json"))).toString();
    const baseConfig = JSON.parse(stripJsonComments(src));

    baseConfig.allowJs = false;
    baseConfig.checkJs = false;
    baseConfig.declaration = true;
    baseConfig.noEmit = false;
    baseConfig.strict = false;
    baseConfig.strictFunctionTypes = false;
    baseConfig.strictBindCallApply = false;
    baseConfig.alwaysStrict = false;
    baseConfig.composite = true;
    baseConfig.outFile = "bundled-ts.js";
    await fs.writeFile(path.join("..", "tsc_temp", "tsconfig.json"), JSON.stringify(baseConfig));
}

export const prepareDocs = gulp.series(convertJsToTs, copyTsconfigForHints);
