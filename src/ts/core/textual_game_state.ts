import { HUDModalDialogs } from "../game/hud/parts/modal_dialogs";
import { GameState } from "./game_state";
import { T } from "../translations";

/**
 * Baseclass for all game states which are structured similary: A header with back button + some
 * scrollable content.
 */
export class TextualGameState extends GameState {
    ///// INTERFACE ////

    /**
     * Should return the states inner html. If not overriden, will create a scrollable container
     * with the content of getMainContentHTML()
     */
    getInnerHTML(): string {
        return `
            <div class="content mainContent">
                ${this.getMainContentHTML()}
            </div>
        `;
    }

    /** Should return the states HTML content. */
    getMainContentHTML() {
        return "";
    }

    /**
     * Should return the title of the game state. If null, no title and back button will
     * get created
     */
    getStateHeaderTitle(): string | null {
        return null;
    }

    /////////////

    /**
     * Back button handler, can be overridden. Per default it goes back to the main menu,
     * or if coming from the game it moves back to the game again.
     */
    onBackButton() {
        if (this.backToStateId) {
            this.moveToState(this.backToStateId, this.backToStatePayload);
        } else {
            this.moveToState(this.getDefaultPreviousState());
        }
    }

    /** Returns the default state to go back to */
    getDefaultPreviousState() {
        return "MainMenuState";
    }

    /** Goes to a new state, telling him to go back to this state later */
    moveToStateAddGoBack(stateId: string) {
        this.moveToState(stateId, {
            backToStateId: this.key,
            backToStatePayload: {
                backToStateId: this.backToStateId,
                backToStatePayload: this.backToStatePayload,
            },
        });
    }

    /**
     * Removes all click detectors, except the one on the back button. Useful when regenerating
     * content.
     */
    clearClickDetectorsExceptHeader() {
        for (let i = 0; i < this.clickDetectors.length; ++i) {
            const detector = this.clickDetectors[i];
            if (detector.element === this.headerElement) {
                continue;
            }
            detector.cleanup();
            this.clickDetectors.splice(i, 1);
            i -= 1;
        }
    }

    /** Overrides the GameState implementation to provide our own html */
    internalGetFullHtml() {
        let headerHtml = "";
        if (this.getStateHeaderTitle()) {
            headerHtml = `
            <div class="headerBar">
            
                <h1><button class="backButton"></button> ${this.getStateHeaderTitle()}</h1>
            </div>`;
        }

        return `
            ${headerHtml}
            <div class="container">
                    ${this.getInnerHTML()}

            </div>
        `;
    }

    //// INTERNALS /////

    /** Overrides the GameState leave callback to cleanup stuff */
    internalLeaveCallback() {
        super.internalLeaveCallback();
        this.dialogs.cleanup();
    }

    /** Overrides the GameState enter callback to setup required stuff */
    internalEnterCallback(payload: any) {
        super.internalEnterCallback(payload, false);
        if (payload.backToStateId) {
            this.backToStateId = payload.backToStateId;
            this.backToStatePayload = payload.backToStatePayload;
        }

        this.htmlElement.classList.add("textualState");
        if (this.getStateHeaderTitle()) {
            this.htmlElement.classList.add("hasTitle");
        }

        this.containerElement = this.htmlElement.querySelector(".widthKeeper .container");
        this.headerElement = this.htmlElement.querySelector(".headerBar > h1");

        if (this.headerElement) {
            this.trackClicks(this.headerElement, this.onBackButton);
        }

        this.dialogs = new HUDModalDialogs(null, this.app);
        const dialogsElement = document.body.querySelector(".modalDialogParent");
        this.dialogs.initializeToElement(dialogsElement);

        this.onEnter(payload);
    }
}
