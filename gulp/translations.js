import path from "path/posix";
import fs from "fs/promises";
import YAML from "yaml";
import gulp from "gulp";

import gulpPlumber from "gulp-plumber";
import gulpYaml from "gulp-yaml";

const translationsSourceDir = path.join("..", "translations");
const translationsJsonDir = path.join("..", "src", "js", "built-temp");

export function convertToJson() {
    return gulp
        .src(path.join(translationsSourceDir, "*.yaml"))
        .pipe(gulpPlumber())
        .pipe(gulpYaml({ space: 2, safe: true }))
        .pipe(gulp.dest(translationsJsonDir));
}

export const fullBuild = convertToJson;
