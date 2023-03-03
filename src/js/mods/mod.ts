/* typehints:start */
import { Application } from "../application";
import { HUDModalDialogs } from "../game/hud/parts/modal_dialogs";
import { ModLoader, ModMetadata } from "./modloader";
import { ModInterface } from "./mod_interface";
/* typehints:end */

import { MOD_SIGNALS } from "./mod_signals";

export class Mod {
    public app: Application;
    public modLoader: ModLoader;
    public metadata: ModMetadata;
    public signals: typeof MOD_SIGNALS;
    public modInterface: ModInterface;
    public settings: any;
    public saveSettings: () => Promise<void>;
    public enabled: boolean;

    /**
     * @param {object} param0
     * @param {Application} param0.app
     * @param {ModLoader} param0.modLoader
     * @param {import("./modloader").ModMetadata} param0.meta
     * @param {Object} param0.settings
     * @param {() => Promise<void>} param0.saveSettings
     */
    constructor({ app, modLoader, meta, settings, saveSettings }) {
        this.app = app;
        this.modLoader = modLoader;
        this.metadata = meta;

        this.signals = MOD_SIGNALS;
        this.modInterface = new ModInterface(modLoader);

        this.settings = settings;
        this.saveSettings = saveSettings;
        this.enabled = false;
    }

    init() {
        // to be overridden
    }

    onStart() {
        const message = this.modInterface.tryInject();
        if (message.isBad()) {
            this.dialogs.showWarning(`Failed to load ${this.metadata.name}`, message.reason);
        }
        this.enabled = true;
    }

    onStop() {
        const message = this.modInterface.tryUninject();
        if (message.isBad()) {
            this.dialogs.showWarning(`Failed to unload ${this.metadata.name}`, message.reason);
        }
        this.enabled = false;
    }

    get dialogs(): HUDModalDialogs {
        return this.modInterface.dialogs;
    }
}
