import { BaseHUDPart } from "../base_hud_part";
import { makeDiv } from "../../../core/utils";

export class HUDVignetteOverlay extends BaseHUDPart {
    public element: HTMLDivElement;

    createElements(parent) {
        this.element = makeDiv(parent, "ingame_VignetteOverlay");
    }

    initialize() {}
}
