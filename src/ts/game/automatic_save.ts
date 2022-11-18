import { globalConfig } from "../core/config";
import { createLogger } from "../core/logging";
import { GameRoot } from "./root";
// How important it is that a savegame is created
/**
 * @enum {number}
 */
export const enumSavePriority: any = {
    regular: 2,
    asap: 100,
};
const logger: any = createLogger("autosave");
export class AutomaticSave {
    public root: GameRoot = root;
    public saveImportance = enumSavePriority.regular;
    public lastSaveAttempt = -1000;

    constructor(root) {
    }
    setSaveImportance(importance: any): any {
        this.saveImportance = Math.max(this.saveImportance, importance);
    }
    doSave(): any {
        if (G_IS_DEV && globalConfig.debug.disableSavegameWrite) {
            return;
        }
        this.root.gameState.doSave();
        this.saveImportance = enumSavePriority.regular;
    }
    update(): any {
        if (!this.root.gameInitialized) {
            // Bad idea
            return;
        }
        const saveInterval: any = this.root.app.settings.getAutosaveIntervalSeconds();
        if (!saveInterval) {
            // Disabled
            return;
        }
        // Check when the last save was, but make sure that if it fails, we don't spam
        const lastSaveTime: any = Math.max(this.lastSaveAttempt, this.root.savegame.getRealLastUpdate());
        const secondsSinceLastSave: any = (Date.now() - lastSaveTime) / 1000.0;
        let shouldSave: any = false;
        switch (this.saveImportance) {
            case enumSavePriority.asap:
                // High always should save
                shouldSave = true;
                break;
            case enumSavePriority.regular:
                // Could determine if there is a good / bad point here
                shouldSave = secondsSinceLastSave > saveInterval;
                break;
            default:
                assert(false, "Unknown save prio: " + this.saveImportance);
                break;
        }
        if (shouldSave) {
            logger.log("Saving automatically");
            this.lastSaveAttempt = Date.now();
            this.doSave();
        }
    }
}
