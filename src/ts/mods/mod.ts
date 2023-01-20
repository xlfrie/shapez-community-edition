import type { ModInterface } from "c:/Dev Temp/ts/shapez-community-edition/src/ts/mods/mod_interface";
import type { Application } from "../application";
import type { ModLoader, ModMetadata } from "./modloader";

import { MOD_SIGNALS } from "./mod_signals";

export class Mod {
    public app: Application;
    public modLoader: ModLoader;
    public metadata: ModMetadata;
    public signals: typeof MOD_SIGNALS;
    public modInterface: ModInterface;
    public settings: any;
    public saveSettings: () => Promise<void>;

    constructor({
        app,
        modLoader,
        meta,
        settings,
        saveSettings,
    }: {
        app: Application;
        modLoader: ModLoader;
        meta: ModMetadata;
        settings: any;
        saveSettings: () => Promise<void>;
    }) {
        this.app = app;
        this.modLoader = modLoader;
        this.metadata = meta;

        this.signals = MOD_SIGNALS;
        this.modInterface = modLoader.modInterface;

        this.settings = settings;
        this.saveSettings = saveSettings;
    }

    init() {
        // to be overridden
    }

    get dialogs() {
        return this.modInterface.dialogs;
    }
}
