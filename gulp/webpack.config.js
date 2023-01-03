import CircularDependencyPlugin from "circular-dependency-plugin";
// import { resolve } from "path/posix";
import { resolve } from "path";
import webpack from "webpack";
import { getAllResourceImages, getRevision, getVersion } from "./buildutils.js";

const globalDefs = {
    assert: "window.assert",
    assertAlways: "window.assert",
    abstract:
        "window.assert(false, 'abstract method called of: ' + " +
        "(this.name || (this.constructor && this.constructor.name)));",
    G_IS_DEV: "true",
    G_APP_ENVIRONMENT: JSON.stringify("development"),
    G_BUILD_TIME: new Date().getTime().toString(),
    G_BUILD_COMMIT_HASH: JSON.stringify(getRevision()),
    G_BUILD_VERSION: JSON.stringify(getVersion()),
    G_ALL_UI_IMAGES: JSON.stringify(getAllResourceImages()),

    G_CHINA_VERSION: "false",
    G_WEGAME_VERSION: "false",
    G_GOG_VERSION: "false",
    G_IS_RELEASE: "false",
    G_IS_STANDALONE: "false",
    G_IS_STEAM_DEMO: "false",
    G_IS_BROWSER: "true",
    G_HAVE_ASSERT: "true",
};

/** @type {import("webpack").RuleSetRule[]} */
const moduleRules = [
    {
        test: /\.json$/,
        enforce: "pre",
        use: resolve("./loader.compressjson.cjs"),
        type: "javascript/auto",
    },
    {
        test: /\.js$/,
        enforce: "pre",
        exclude: /node_modules/,
        use: [
            {
                loader: "webpack-strip-block",
                options: {
                    start: "typehints:start",
                    end: "typehints:end",
                },
            },
        ],
    },
    {
        test: /\.ts$/,
        use: [
            {
                loader: "ts-loader",

                options: {
                    configFile: "C:/Dev Temp/ts/shapez-community-edition/src/ts/tsconfig.json",
                    onlyCompileBundledFiles: true,
                },
            },
        ],
    },
    // {
    //     test: /\.worker\.ts$/,
    //     use: [
    //         {
    //             loader: "worker-loader",
    //             options: {
    //                 filename: "[fullhash].worker.ts",
    //                 inline: "fallback",
    //             },
    //         },
    //     ],
    // },
];

// /** @type {import("webpack").RuleSetRule[]} */
// const moduleRules = [
//     {
//         test: /\.json$/,
//         enforce: "pre",
//         use: resolve("./loader.compressjson.cjs"),
//         type: "javascript/auto",
//     },
//     {
//         test: /\.js$/,
//         enforce: "pre",
//         exclude: /node_modules/,
//         use: [
//             {
//                 loader: "webpack-strip-block",
//                 options: {
//                     start: "typehints:start",
//                     end: "typehints:end",
//                 },
//             },
//         ],
//     },
//     {
//         test: /\.worker\.js$/,
//         use: [
//             {
//                 loader: "worker-loader",
//                 options: {
//                     filename: "[fullhash].worker.js",
//                     inline: "fallback",
//                 },
//             },
//         ],
//     },
//     {
//         test: /\.js$/,
//         resolve: {
//             fullySpecified: false,
//         },
//     },
// ];

/** @type {import("webpack").Configuration} */
export default {
    mode: "development",
    entry: resolve("../src/ts/main.ts"),
    context: resolve(".."),
    output: {
        path: resolve("../build"),
        filename: "bundle.js",
    },
    resolve: {
        // fallback: { fs: false },
        alias: {
            "global-compression": resolve("../src/ts/core/lzstring.ts"),
        },
        extensions: [".ts", ".js"],
    },
    devtool: "cheap-source-map",
    watch: true,
    plugins: [
        new webpack.DefinePlugin(globalDefs),
        new webpack.IgnorePlugin({ resourceRegExp: /\.(png|jpe?g|svg)$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /\.nobuild/ }),
        new CircularDependencyPlugin({
            exclude: /node_modules/,
            failOnError: true,
            allowAsyncCycles: false,
            cwd: resolve("../src/ts"),
        }),
    ],
    module: { rules: moduleRules },
    experiments: {
        topLevelAwait: true,
    },
};
