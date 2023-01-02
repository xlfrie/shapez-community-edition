import { globalConfig } from "../../core/config";
import { DrawParameters } from "../../core/draw_parameters";
import { Signal } from "../../core/signal";
import { MOD_SIGNALS } from "../../mods/mod_signals";
import { KEYMAPPINGS } from "../key_action_mapper";
import { MetaBuilding } from "../meta_building";
import { GameRoot } from "../root";
import { ShapeDefinition } from "../shape_definition";
import { BaseHUDPart } from "./base_hud_part";
import { HUDBetaOverlay } from "./parts/beta_overlay";
import { HUDBlueprintPlacer } from "./parts/blueprint_placer";
import { HUDBuildingsToolbar } from "./parts/buildings_toolbar";
import { HUDBuildingPlacer } from "./parts/building_placer";
import { HUDColorBlindHelper } from "./parts/color_blind_helper";
import { HUDChangesDebugger } from "./parts/debug_changes";
import { HUDDebugInfo } from "./parts/debug_info";
import { HUDEntityDebugger } from "./parts/entity_debugger";
import { HUDModalDialogs } from "./parts/modal_dialogs";
import { enumNotificationType } from "./parts/notifications";
import { HUDSettingsMenu } from "./parts/settings_menu";
import { HUDShapeTooltip } from "./parts/shape_tooltip";
import { HUDVignetteOverlay } from "./parts/vignette_overlay";
import { TrailerMaker } from "./trailer_maker";

export class GameHUD {
    public parts: Record<string, BaseHUDPart> & any;
    public signals: {
        buildingSelectedForPlacement: Signal<[MetaBuilding | null]>,
        selectedPlacementBuildingChanged: Signal<[MetaBuilding | null]>,
        shapePinRequested: Signal<[ShapeDefinition]>,
        shapeUnpinRequested: Signal<[string]>,
        notification: Signal<[string, enumNotificationType]>,
        buildingsSelectedForCopy: Signal<[Array<number>]>,
        pasteBlueprintRequested: Signal<[]>,
        viewShapeDetailsRequested: Signal<[ShapeDefinition]>,
        unlockNotificationFinished: Signal<[]>,
    };
    public trailerMaker: TrailerMaker;
    ;

    constructor(public root: GameRoot) { }

    /** Initializes the hud parts */
    initialize() {
        this.signals = {
            buildingSelectedForPlacement: new Signal<[MetaBuilding | null]>(),
            selectedPlacementBuildingChanged: new Signal<[MetaBuilding | null]>(),
            shapePinRequested: new Signal<[ShapeDefinition]>(),
            shapeUnpinRequested: new Signal<[string]>(),
            notification: new Signal<[string, enumNotificationType]>(),
            buildingsSelectedForCopy: new Signal<[Array<number>]>(),
            pasteBlueprintRequested: new Signal<[]>(),
            viewShapeDetailsRequested: new Signal<[ShapeDefinition]>(),
            unlockNotificationFinished: new Signal<[]>(),
        };

        this.parts = {
            buildingsToolbar: new HUDBuildingsToolbar(this.root),

            blueprintPlacer: new HUDBlueprintPlacer(this.root),
            buildingPlacer: new HUDBuildingPlacer(this.root),

            shapeTooltip: new HUDShapeTooltip(this.root),

            // Must always exist
            settingsMenu: new HUDSettingsMenu(this.root),
            debugInfo: new HUDDebugInfo(this.root),
            dialogs: new HUDModalDialogs(this.root),

            // Typing hints
            /* typehints:start */

            changesDebugger: null,
            /* typehints:end */
        };

        if (G_IS_DEV) {
            this.parts.entityDebugger = new HUDEntityDebugger(this.root);
        }

        if (G_IS_DEV && globalConfig.debug.renderChanges) {
            this.parts.changesDebugger = new HUDChangesDebugger(this.root);
        }

        if (this.root.app.settings.getAllSettings().vignette) {
            this.parts.vignetteOverlay = new HUDVignetteOverlay(this.root);
        }

        if (this.root.app.settings.getAllSettings().enableColorBlindHelper) {
            this.parts.colorBlindHelper = new HUDColorBlindHelper(this.root);
        }

        if (!G_IS_RELEASE && !G_IS_DEV) {
            this.parts.betaOverlay = new HUDBetaOverlay(this.root);
        }

        const additionalParts = this.root.gameMode.additionalHudParts;
        for (const [partId, part] of Object.entries(additionalParts)) {
            this.parts[partId] = new part(this.root);
        }

        MOD_SIGNALS.hudInitializer.dispatch(this.root);

        const frag = document.createDocumentFragment();
        for (const key in this.parts) {
            MOD_SIGNALS.hudElementInitialized.dispatch(this.parts[key]);
            this.parts[key].createElements(frag);
        }

        document.body.appendChild(frag);

        for (const key in this.parts) {
            this.parts[key].initialize();
            MOD_SIGNALS.hudElementFinalized.dispatch(this.parts[key]);
        }

        this.root.keyMapper.getBinding(KEYMAPPINGS.ingame.toggleHud).add(this.toggleUi, this);

        /* dev:start */
        if (G_IS_DEV && globalConfig.debug.renderForTrailer) {
            this.trailerMaker = new TrailerMaker(this.root);
        }
        /* dev:end*/
    }

    /** Attempts to close all overlays */
    closeAllOverlays() {
        for (const key in this.parts) {
            this.parts[key].close();
        }
    }

    /** Returns true if the game logic should be paused */
    shouldPauseGame() {
        for (const key in this.parts) {
            if (this.parts[key].shouldPauseGame()) {
                return true;
            }
        }
        return false;
    }

    /** Returns true if the rendering can be paused */
    shouldPauseRendering() {
        for (const key in this.parts) {
            if (this.parts[key].shouldPauseRendering()) {
                return true;
            }
        }
        return false;
    }

    /** Returns true if the rendering can be paused */
    hasBlockingOverlayOpen() {
        for (const key in this.parts) {
            if (this.parts[key].isBlockingOverlay()) {
                return true;
            }
        }
        return false;
    }

    /** Toggles the ui */
    toggleUi() {
        document.body.classList.toggle("uiHidden");
    }

    /** Updates all parts */
    update() {
        if (!this.root.gameInitialized) {
            return;
        }

        for (const key in this.parts) {
            this.parts[key].update();
        }

        /* dev:start */
        if (this.trailerMaker) {
            this.trailerMaker.update();
        }
        /* dev:end*/
    }

    /** Draws all parts */
    draw(parameters: DrawParameters) {
        const partsOrder = [
            "massSelector",
            "buildingPlacer",
            "blueprintPlacer",
            "colorBlindHelper",
            "changesDebugger",
            "minerHighlight",
            "shapeTooltip",
            "interactiveTutorial",
        ];

        for (let i = 0; i < partsOrder.length; ++i) {
            if (this.parts[partsOrder[i]]) {
                this.parts[partsOrder[i]].draw(parameters);
            }
        }
    }

    /** Draws all part overlays */
    drawOverlays(parameters: DrawParameters) {
        const partsOrder = ["waypoints", "watermark", "wireInfo"];

        for (let i = 0; i < partsOrder.length; ++i) {
            if (this.parts[partsOrder[i]]) {
                this.parts[partsOrder[i]].drawOverlays(parameters);
            }
        }
    }

    /** Cleans up everything */
    cleanup() {
        for (const key in this.parts) {
            this.parts[key].cleanup();
        }

        for (const key in this.signals) {
            this.signals[key].removeAll();
        }
    }
}