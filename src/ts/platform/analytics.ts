import type { Application } from "../application";

export class AnalyticsInterface {
    constructor(public app: Application) {}

    /**
     * Initializes the analytics
     * @abstract
     */
    initialize(): Promise<void> {
        abstract;
        return Promise.reject();
    }

    /** Sets the player name for analytics */
    setUserContext(userName: string) {}

    /** Tracks when a new state is entered */
    trackStateEnter(stateId: string) {}

    /** Tracks a new user decision */
    trackDecision(name: string) {}

    // LEGACY 1.5.3
    trackUiClick() {}
}
