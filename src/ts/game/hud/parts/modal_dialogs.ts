/* typehints:start */
import type { Application } from "../../../application";
/* typehints:end */

import { SOUNDS } from "../../../platform/sound";
import { DynamicDomAttach } from "../dynamic_dom_attach";
import { BaseHUDPart } from "../base_hud_part";
import { Dialog, DialogButtonStr, DialogLoading, DialogOptionChooser } from "../../../core/modal_dialog_elements";
import { makeDiv } from "../../../core/utils";
import { T } from "../../../translations";
import { openStandaloneLink } from "../../../core/config";
import type { GameRoot } from "../../root";

export class HUDModalDialogs extends BaseHUDPart {
    public app: Application;
    public dialogParent: HTMLElement = null;
    public dialogStack = [];
    public domWatcher: DynamicDomAttach;

    constructor(root: GameRoot | undefined, app: Application) {
        // Important: Root is not always available here! Its also used in the main menu
        super(root);

        this.app = root ? root.app : app;
    }

    // For use inside of the game, implementation of base hud part
    initialize() {
        this.dialogParent = document.getElementById("ingame_HUD_ModalDialogs");
        this.domWatcher = new DynamicDomAttach(this.root, this.dialogParent);
    }

    shouldPauseRendering() {
        // return this.dialogStack.length > 0;
        // @todo: Check if change this affects anything
        return false;
    }

    shouldPauseGame() {
        // @todo: Check if this change affects anything
        return false;
    }

    createElements(parent) {
        return makeDiv(parent, "ingame_HUD_ModalDialogs");
    }

    // For use outside of the game
    initializeToElement(element) {
        assert(element, "No element for dialogs given");
        this.dialogParent = element;
    }

    isBlockingOverlay() {
        return this.dialogStack.length > 0;
    }

    // Methods

    showInfo<T extends string>(title: string, text: string, buttons: DialogButtonStr<T>[] = ["ok:good" as DialogButtonStr<T>]) {
        const dialog = new Dialog({
            app: this.app,
            title: title,
            contentHTML: text,
            buttons: buttons,
            type: "info",
        });
        this.internalShowDialog(dialog);

        if (this.app) {
            this.app.sound.playUiSound(SOUNDS.dialogOk);
        }

        return dialog.buttonSignals;
    }

    showWarning<T extends string>(title: string, text: string, buttons: Array<DialogButtonStr<T>> = ["ok:good" as DialogButtonStr<T>]) {
        const dialog = new Dialog({
            app: this.app,
            title: title,
            contentHTML: text,
            buttons: buttons,
            type: "warning",
        });
        this.internalShowDialog(dialog);

        if (this.app) {
            this.app.sound.playUiSound(SOUNDS.dialogError);
        }

        return dialog.buttonSignals;
    }

    showFeatureRestrictionInfo(feature: string, textPrefab: string = T.dialogs.featureRestriction.desc) {
        const dialog = new Dialog({
            app: this.app,
            title: T.dialogs.featureRestriction.title,
            contentHTML: textPrefab.replace("<feature>", feature),
            buttons: ["cancel:bad", "getStandalone:good"],
            type: "warning",
        });
        this.internalShowDialog(dialog);

        if (this.app) {
            this.app.sound.playUiSound(SOUNDS.dialogOk);
        }

        dialog.buttonSignals.getStandalone.add(() => {
            openStandaloneLink(this.app, "shapez_demo_dialog");
        });

        return dialog.buttonSignals;
    }

    showOptionChooser(title, options) {
        const dialog = new DialogOptionChooser({
            app: this.app,
            title,
            options,
        });
        this.internalShowDialog(dialog);
        return dialog.buttonSignals;
    }

    // Returns method to be called when laoding finishd
    showLoadingDialog(text = "") {
        const dialog = new DialogLoading(this.app, text);
        this.internalShowDialog(dialog);
        return this.closeDialog.bind(this, dialog);
    }

    internalShowDialog(dialog) {
        const elem = dialog.createElement();
        dialog.setIndex(1000 + this.dialogStack.length);

        // Hide last dialog in queue
        if (this.dialogStack.length > 0) {
            this.dialogStack[this.dialogStack.length - 1].hide();
        }

        this.dialogStack.push(dialog);

        // Append dialog
        dialog.show();
        dialog.closeRequested.add(this.closeDialog.bind(this, dialog));

        // Append to HTML
        this.dialogParent.appendChild(elem);

        document.body.classList.toggle("modalDialogActive", this.dialogStack.length > 0);

        // IMPORTANT: Attach element directly, otherwise double submit is possible
        this.update();
    }

    update() {
        if (this.domWatcher) {
            this.domWatcher.update(this.dialogStack.length > 0);
        }
    }

    closeDialog(dialog: Dialog<string>) {
        dialog.destroy();

        let index = -1;
        for (let i = 0; i < this.dialogStack.length; ++i) {
            if (this.dialogStack[i] === dialog) {
                index = i;
                break;
            }
        }
        assert(index >= 0, "Dialog not in dialog stack");
        this.dialogStack.splice(index, 1);

        if (this.dialogStack.length > 0) {
            // Show the dialog which was previously open
            this.dialogStack[this.dialogStack.length - 1].show();
        }

        document.body.classList.toggle("modalDialogActive", this.dialogStack.length > 0);
    }

    close() {
        for (let i = 0; i < this.dialogStack.length; ++i) {
            const dialog = this.dialogStack[i];
            dialog.destroy();
        }
        this.dialogStack = [];
    }

    cleanup() {
        super.cleanup();
        for (let i = 0; i < this.dialogStack.length; ++i) {
            this.dialogStack[i].destroy();
        }
        this.dialogStack = [];
        this.dialogParent = null;
    }
}
