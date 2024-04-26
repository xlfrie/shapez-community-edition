import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import path from "path";
import { fileURLToPath } from "url";

const baseConfig = tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    // Enable type-aware linting
    {
        languageOptions: {
            parserOptions: {
                project: true,
                // FIXME: Node.js 21.2.0 introduced import.meta.dirname
                tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url)),
            },
        },
    },
    // Disable type-aware linting for JS files as it causes issues
    {
        files: ["*.js"],
        ...tseslint.configs.disableTypeChecked,
    }
);

const nodeConfig = tseslint.config(...baseConfig, {
    languageOptions: {
        sourceType: "module",
        globals: {
            ...globals.node,
        },
    },
});

const runtimeConfig = tseslint.config(...baseConfig, {
    languageOptions: {
        sourceType: "module",
        globals: {
            ...globals.browser,
        },
    },
    rules: {
        // Mostly caused by JSDoc imports, so don't annoy with errors but keep
        // a reminder!
        "@typescript-eslint/no-unused-vars": "warn",
        // FIXME: enforce when we're ready to
        "prefer-const": "warn",
    },
});

// I don't know what the ESLint devs were thinking about. This is just horrible
export default [
    {
        ignores: ["build/*"],
    },
    ...nodeConfig.map(config => ({
        ...config,
        files: ["*.ts", "*.js", "electron/**/*.ts", "electron/**/*.js", "gulp/**/*.ts", "gulp/**/*.js"],
        ignores: ["gulp/preloader/*.js"],
    })),
    ...runtimeConfig.map(config => ({
        ...config,
        files: ["js", "ts", "jsx", "tsx"].map(ext => `src/**/*.${ext}`),
    })),
];
