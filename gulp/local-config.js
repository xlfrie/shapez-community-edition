import fs from "fs/promises";

const configTemplatePath = "../src/js/core/config.local.template.js";
const configPath = "../src/js/core/config.local.js";

export async function findOrCreate() {
    try {
        await fs.copyFile(configTemplatePath, configPath, fs.constants.COPYFILE_EXCL);
    } catch {}
}
