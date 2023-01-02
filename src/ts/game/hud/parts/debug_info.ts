import { BaseHUDPart } from "../base_hud_part";
import { makeDiv, round3Digits, round2Digits } from "../../../core/utils";
import { DynamicDomAttach } from "../dynamic_dom_attach";
import { KEYMAPPINGS } from "../../key_action_mapper";
import { Vector } from "../../../core/vector";
import { TrackedState } from "../../../core/tracked_state";

/**
 @enum
*/
const enumDebugOverlayMode = { disabled: "disabled", regular: "regular", detailed: "detailed" };
type enumDebugOverlayMode = keyof typeof enumDebugOverlayMode;

/**
 * Specifies which mode follows after which mode
 * @enum
 */
const enumDebugOverlayModeNext = {
    [enumDebugOverlayMode.disabled]: enumDebugOverlayMode.regular,
    [enumDebugOverlayMode.regular]: enumDebugOverlayMode.detailed,
    [enumDebugOverlayMode.detailed]: enumDebugOverlayMode.disabled,
};

const UPDATE_INTERVAL_SECONDS = 0.25;

export class HUDDebugInfo extends BaseHUDPart {
    public element: HTMLDivElement;
    public trackedTickRate: TrackedState;
    public trackedTickDuration: TrackedState;
    public trackedFPS: TrackedState;
    public trackedMousePosition: TrackedState;
    public trackedCameraPosition: TrackedState;
    public versionElement: HTMLDivElement;
    public lastTick: number;
    public trackedMode: TrackedState;
    public domAttach: DynamicDomAttach;

    createElements(parent) {
        this.element = makeDiv(parent, "ingame_HUD_DebugInfo", []);

        const tickRateElement = makeDiv(this.element, null, ["tickRate"]);
        this.trackedTickRate = new TrackedState(str => (tickRateElement.innerText = str));

        const tickDurationElement = makeDiv(this.element, null, ["tickDuration"]);
        this.trackedTickDuration = new TrackedState(str => (tickDurationElement.innerText = str));

        const fpsElement = makeDiv(this.element, null, ["fps"]);
        this.trackedFPS = new TrackedState(str => (fpsElement.innerText = str));

        const mousePositionElement = makeDiv(this.element, null, ["mousePosition"]);
        this.trackedMousePosition = new TrackedState(str => (mousePositionElement.innerHTML = str));

        const cameraPositionElement = makeDiv(this.element, null, ["cameraPosition"]);
        this.trackedCameraPosition = new TrackedState(str => (cameraPositionElement.innerHTML = str));

        this.versionElement = makeDiv(this.element, null, ["version"], "version unknown");
    }

    initialize() {
        this.lastTick = 0;

        this.trackedMode = new TrackedState(this.onModeChanged, this);
        this.domAttach = new DynamicDomAttach(this.root, this.element);

        this.root.keyMapper.getBinding(KEYMAPPINGS.ingame.toggleFPSInfo).add(() => this.cycleModes());

        // Set initial mode
        this.trackedMode.set(enumDebugOverlayMode.disabled);
    }

    /** Called when the mode changed */
    onModeChanged(mode: enumDebugOverlayMode) {
        this.element.setAttribute("data-mode", mode);
        this.versionElement.innerText = `${G_BUILD_VERSION} @ ${G_APP_ENVIRONMENT} @ ${G_BUILD_COMMIT_HASH}`;
    }

    /** Updates the labels */
    updateLabels() {
        this.trackedTickRate.set("Tickrate: " + this.root.dynamicTickrate.currentTickRate);
        this.trackedFPS.set(
            "FPS: " +
            Math.round(this.root.dynamicTickrate.averageFps) +
            " (" +
            round2Digits(1000 / this.root.dynamicTickrate.averageFps) +
            " ms)"
        );
        this.trackedTickDuration.set(
            "Tick: " + round3Digits(this.root.dynamicTickrate.averageTickDuration) + "ms"
        );
    }

    /** Updates the detailed information */
    updateDetailedInformation() {
        const mousePos = this.root.app.mousePosition || new Vector(0, 0);
        const mouseTile = this.root.camera.screenToWorld(mousePos).toTileSpace();
        const cameraTile = this.root.camera.center.toTileSpace();

        this.trackedMousePosition.set(`Mouse: <code>${mouseTile.x}</code> / <code>${mouseTile.y}</code>`);
        this.trackedCameraPosition.set(`Camera: <code>${cameraTile.x}</code> / <code>${cameraTile.y}</code>`);
    }

    /** Cycles through the different modes */
    cycleModes() {
        this.trackedMode.set(enumDebugOverlayModeNext[this.trackedMode.get()]);
    }

    update() {
        const visible = this.trackedMode.get() !== enumDebugOverlayMode.disabled;
        this.domAttach.update(visible);

        if (!visible) {
            return;
        }

        // Periodically update the text
        const now = this.root.time.realtimeNow();
        if (now - this.lastTick > UPDATE_INTERVAL_SECONDS) {
            this.lastTick = now;
            this.updateLabels();
        }

        // Also update detailed information if required
        if (this.trackedMode.get() === enumDebugOverlayMode.detailed) {
            this.updateDetailedInformation();
        }
    }
}