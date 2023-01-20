import type { Application } from "../application";

export class GameAnalyticsInterface {
    constructor(public app: Application) {}

    /**
     * Initializes the analytics
     * @abstract
     */
    initialize(): Promise<void> {
        abstract;
        return Promise.reject();
    }

    /** Handles a new game which was started */
    handleGameStarted() {}

    /** Handles a resumed game */
    handleGameResumed() {}

    /** Handles the given level completed */
    handleLevelCompleted(level: number) {}

    /** Handles the given upgrade completed */
    handleUpgradeUnlocked(id: string, level: number) {}

    /**
     * Activates a DLC
     * @abstract
     */
    activateDlc(dlc: string) {
        abstract;
        return Promise.resolve();
    }
}
