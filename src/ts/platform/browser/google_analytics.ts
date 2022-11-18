import { AnalyticsInterface } from "../analytics";
import { createLogger } from "../../core/logging";
const logger: any = createLogger("ga");
export class GoogleAnalyticsImpl extends AnalyticsInterface {
    initialize(): any {
        this.lastUiClickTracked = -1000;
        setInterval((): any => this.internalTrackAfkEvent(), 120 * 1000);
        // Analytics is already loaded in the html
        return Promise.resolve();
    }
    setUserContext(userName: any): any {
        try {
            if (window.gtag) {
                logger.log("📊 Setting user context:", userName);
                window.gtag("set", {
                    player: userName,
                });
            }
        }
        catch (ex: any) {
            logger.warn("📊 Failed to set user context:", ex);
        }
    }
    trackStateEnter(stateId: any): any {
        const nonInteractionStates: any = [
            "LoginState",
            "MainMenuState",
            "PreloadState",
            "RegisterState",
            "WatchAdState",
        ];
        try {
            if (window.gtag) {
                logger.log("📊 Tracking state enter:", stateId);
                window.gtag("event", "enter_state", {
                    event_category: "ui",
                    event_label: stateId,
                    non_interaction: nonInteractionStates.indexOf(stateId) >= 0,
                });
            }
        }
        catch (ex: any) {
            logger.warn("📊 Failed to track state analytcis:", ex);
        }
    }
    trackDecision(decisionName: any): any {
        try {
            if (window.gtag) {
                logger.log("📊 Tracking decision:", decisionName);
                window.gtag("event", "decision", {
                    event_category: "ui",
                    event_label: decisionName,
                    non_interaction: true,
                });
            }
        }
        catch (ex: any) {
            logger.warn("📊 Failed to track state analytcis:", ex);
        }
    }
    /**
     * Tracks an event so GA keeps track of the user
     */
    internalTrackAfkEvent(): any {
        if (window.gtag) {
            window.gtag("event", "afk", {
                event_category: "ping",
                event_label: "timed",
            });
        }
    }
}
